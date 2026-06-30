import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Resend } from "resend";
import { logActivity } from "../../../../../lib/activityLogger";
import { requireSameOrigin } from "@/lib/security";
import { requireRole } from "@/lib/authz";
import {
  reservationConfirmationSubject,
  reservationConfirmationTemplate,
} from "@/lib/email/reservationConfirmationTemplate";
import {
  reservationDeclinedSubject,
  reservationDeclinedTemplate,
} from "@/lib/email/reservationDeclinedTemplate";
import {
  calculateReservationTotal,
  clampGuests,
} from "@/lib/pricing";
import { findApplicableSpecialRate } from "@/lib/specialRates";

// Convert YYYY-MM-DD to a UTC midnight Date for day-precision comparisons.
function parseDateOnlyToUTC(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function isOverlapError(error) {
  return (
    error?.code === "23P01" ||
    error?.message?.includes("violates exclusion constraint") ||
    error?.meta?.cause?.includes?.("exclusion constraint")
  );
}

function normalizeEmailLocale(locale) {
  return String(locale || "").toLowerCase().startsWith("en") ? "en" : "sq";
}

function blocksRoom(status) {
  const s = String(status || "").toLowerCase();
  return s !== "cancelled" && s !== "completed";
}

function getTodayUtcDateOnly() {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

async function sendEmailOrThrow(sendPromise, label) {
  const result = await sendPromise;
  if (result?.error) {
    throw new Error(
      `${label} failed: ${result.error.message || JSON.stringify(result.error)}`,
    );
  }
  return result;
}

async function sendConfirmationEmailIfNeeded(previous, updated) {
  const wasConfirmed = String(previous?.status || "").toLowerCase() === "confirmed";
  const isConfirmed = String(updated?.status || "").toLowerCase() === "confirmed";
  const recipient = String(
    updated?.guest_email || updated?.users?.email || "",
  ).trim();

  if (
    wasConfirmed ||
    !isConfirmed ||
    !recipient ||
    !process.env.RESEND_API_KEY
  ) {
    return;
  }

  const locale = normalizeEmailLocale(updated?.guest_locale);
  const resend = new Resend(process.env.RESEND_API_KEY);

  await sendEmailOrThrow(
    resend.emails.send({
      from: "Dijari Premium <onboarding@dijaripremium.com>",
      to: recipient,
      subject: reservationConfirmationSubject({
        locale,
        reservationStatus: updated.status,
      }),
      html: reservationConfirmationTemplate({
        locale,
        fullname: updated.full_name || updated?.users?.name || "Guest",
        roomName: updated?.rooms?.name || `#${updated?.rooms?.room_number || ""}`,
        startDate: updated.start_date?.toISOString?.().slice(0, 10) || "",
        endDate: updated.end_date?.toISOString?.().slice(0, 10) || "",
        totalPrice: Number(updated.total_price || 0).toFixed(2),
        reservationCode: updated.reservation_code,
        paymentMethod: updated.payment_method || "cash",
        paymentStatus: updated.payment_status || "UNPAID",
        reservationStatus: updated.status || "pending",
      }),
    }),
    "Guest reservation confirmation email",
  );
}

async function sendDeclinedEmailIfNeeded(previous, updated) {
  const wasCancelled = String(previous?.status || "").toLowerCase() === "cancelled";
  const isCancelled = String(updated?.status || "").toLowerCase() === "cancelled";
  const recipient = String(
    updated?.guest_email || updated?.users?.email || "",
  ).trim();

  if (
    wasCancelled ||
    !isCancelled ||
    !recipient ||
    !process.env.RESEND_API_KEY
  ) {
    return;
  }

  const locale = normalizeEmailLocale(updated?.guest_locale);
  const resend = new Resend(process.env.RESEND_API_KEY);

  await sendEmailOrThrow(
    resend.emails.send({
      from: "Dijari Premium <onboarding@dijaripremium.com>",
      to: recipient,
      subject: reservationDeclinedSubject({ locale }),
      html: reservationDeclinedTemplate({
        locale,
        fullname: updated.full_name || updated?.users?.name || "Guest",
        roomName: updated?.rooms?.name || `#${updated?.rooms?.room_number || ""}`,
        startDate: updated.start_date?.toISOString?.().slice(0, 10) || "",
        endDate: updated.end_date?.toISOString?.().slice(0, 10) || "",
        reservationCode: updated.reservation_code,
      }),
    }),
    "Guest reservation declined email",
  );
}

// Handle PATCH requests for this route.
export async function PATCH(req, context) {
  try {
    const originError = requireSameOrigin(req);
    if (originError) return originError;

    const { session, error } = await requireRole(["admin", "worker"]);
    if (error) return error;

    const params = await context.params;
    const { id } = params;
    const performedBy = session?.user?.email ?? "system";

    const body = await req.json();
    const onlyPaymentFields = Object.keys(body).every((k) =>
      ["payment_status", "payment_method", "status"].includes(k),
    );

    if (body.payment_status && onlyPaymentFields) {
      const existing = await prisma.reservations.findUnique({
        where: { id: Number(id) },
        select: {
          id: true,
          total_price: true,
          status: true,
          guest_email: true,
          guest_locale: true,
          full_name: true,
          reservation_code: true,
        },
      });

      if (!existing) {
        return NextResponse.json(
          { error: "Reservation not found" },
          { status: 404 },
        );
      }

      const nextPaymentStatus = body.payment_status === "PAID" ? "PAID" : "UNPAID";
      const nextPaymentMethod =
        body.payment_method === "card" || body.payment_method === "cash"
          ? body.payment_method
          : undefined;
      const nextStatus = body.status ? String(body.status).toLowerCase() : null;
      const completedDate =
        nextStatus === "completed" ? getTodayUtcDateOnly() : null;

      const updateData = {
        payment_status: nextPaymentStatus,
        ...(nextPaymentMethod ? { payment_method: nextPaymentMethod } : {}),
        ...(body.status ? { status: body.status } : {}),
        ...(completedDate ? { end_date: completedDate } : {}),
        amount_paid: nextPaymentStatus === "PAID" ? existing.total_price : 0,
        paid_at: nextPaymentStatus === "PAID" ? new Date() : null,
      };

      const updated = await prisma.reservations.update({
        where: { id: Number(id) },
        data: updateData,
        include: {
          users: { select: { email: true, name: true } },
          rooms: true,
        },
      });

      try {
        await sendConfirmationEmailIfNeeded(existing, updated);
        await sendDeclinedEmailIfNeeded(existing, updated);
      } catch (emailError) {
        console.error("Reservation status email failed:", emailError);
      }

      await logActivity({
        action: "PAYMENT_UPDATE",
        entity: "reservation",
        entity_id: updated.id,
        description: `Reservation #${updated.id} payment -> ${nextPaymentStatus}${body.status ? `, status -> ${body.status}` : ""}`,
        performed_by: performedBy,
      });

      return NextResponse.json(updated);
    }

    if (body.status && Object.keys(body).length === 1) {
      const existing = await prisma.reservations.findUnique({
        where: { id: Number(id) },
        select: {
          id: true,
          status: true,
          guest_email: true,
          guest_locale: true,
          full_name: true,
          reservation_code: true,
        },
      });

      if (!existing) {
        return NextResponse.json(
          { error: "Reservation not found" },
          { status: 404 },
        );
      }

      const nextStatus = String(body.status).toLowerCase();
      const completedDate =
        nextStatus === "completed" ? getTodayUtcDateOnly() : null;
      const updated = await prisma.reservations.update({
        where: { id: Number(id) },
        data: {
          status: body.status,
          ...(completedDate ? { end_date: completedDate } : {}),
          ...(nextStatus === "cancelled" ? { cancelled_at: new Date() } : {}),
        },
        include: {
          users: { select: { email: true, name: true } },
          rooms: true,
        },
      });

      try {
        await sendConfirmationEmailIfNeeded(existing, updated);
        await sendDeclinedEmailIfNeeded(existing, updated);
      } catch (emailError) {
        console.error("Reservation status email failed:", emailError);
      }

      await logActivity({
        action: "STATUS_CHANGE",
        entity: "reservation",
        entity_id: updated.id,
        description: `Reservation #${updated.id} status -> ${body.status}`,
        performed_by: performedBy,
      });

      return NextResponse.json(updated);
    }

    const {
      fullname,
      email,
      phone,
      address,
      type,
      roomId,
      guests,
      startDate,
      endDate,
      total_price,
    } = body;

    if (!fullname || !phone || !type || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }
    const start = parseDateOnlyToUTC(startDate);
    const end = parseDateOnlyToUTC(endDate);
    const today = parseDateOnlyToUTC(new Date().toISOString().slice(0, 10));
    if (end <= start) {
      return NextResponse.json(
        { error: "Check-out must be after check-in" },
        { status: 400 },
      );
    }
    const existing = await prisma.reservations.findUnique({
      where: { id: Number(id) },
      include: { rooms: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 },
      );
    }

    if (start < today) {
      const existingStart = existing.start_date.toISOString().split("T")[0];
      if (startDate !== existingStart) {
        return NextResponse.json(
          { error: "Cannot move check-in date to the past" },
          { status: 400 },
        );
      }
    }

    // Detect whether room type or date range is being changed.
    const isTypeChanged = type !== existing.rooms.type;
    const isDatesChanged =
      startDate !== existing.start_date.toISOString().split("T")[0] ||
      endDate !== existing.end_date.toISOString().split("T")[0];

    let newRoomId = existing.room_id;

    const rooms = await prisma.rooms.findMany({
      where: { type },
      include: {
        reservations: {
          where: { cancelled_at: null, admin_hidden: false },
          select: {
            id: true,
            start_date: true,
            end_date: true,
            status: true,
          },
        },
      },
    });

    const availableRooms = rooms.filter((room) => {
      if (room.status === "out_of_order") return false;
      const conflict = room.reservations.some((reservation) => {
        if (reservation.id === existing.id) return false;
        if (!blocksRoom(reservation.status)) return false;
        const rStart = parseDateOnlyToUTC(
          reservation.start_date.toISOString().slice(0, 10),
        );
        const rEnd = parseDateOnlyToUTC(
          reservation.end_date.toISOString().slice(0, 10),
        );
        return start < rEnd && end > rStart;
      });
      return !conflict;
    });

    const hasSelectedRoom = roomId !== undefined && roomId !== null && roomId !== "";
    if (hasSelectedRoom) {
      const selected = availableRooms.find((room) => room.id === Number(roomId));
      if (!selected) {
        return NextResponse.json(
          { error: "Selected room is not available for these dates." },
          { status: 400 },
        );
      }
      newRoomId = selected.id;
    } else if (isTypeChanged || isDatesChanged) {
      const fallback = availableRooms[0];
      if (!fallback) {
        return NextResponse.json(
          { error: "No available rooms for the new type or dates." },
          { status: 400 },
        );
      }
      newRoomId = fallback.id;
    }

    const baseRoom =
      availableRooms.find((room) => room.id === Number(newRoomId)) ||
      rooms.find((room) => room.id === Number(newRoomId));
    const specialRate = baseRoom
      ? await findApplicableSpecialRate({
          roomType: baseRoom.type,
          startDate,
          endDate,
        })
      : null;
    const pricingRoom = specialRate
      ? { ...baseRoom, effective_price: specialRate.promo_price }
      : baseRoom;
    const normalizedGuests = pricingRoom
      ? clampGuests(pricingRoom, guests)
      : Number(guests);
    const computedTotal = pricingRoom
      ? calculateReservationTotal(pricingRoom, normalizedGuests, startDate, endDate)
      : parseFloat(total_price);

    const updated = await prisma.reservations.update({
      where: { id: Number(id) },
      data: {
        room_id: newRoomId,
        full_name: fullname,
        phone,
        guest_email: String(email || existing.guest_email || "").trim().toLowerCase() || null,
        address,
        // Coerce numeric and date fields before update.
        guests: normalizedGuests,
        start_date: start,
        end_date: end,
        total_price: computedTotal,
        base_nightly_rate: baseRoom ? Number(baseRoom.price) : null,
        applied_nightly_rate: pricingRoom
          ? Number(pricingRoom.effective_price ?? pricingRoom.price)
          : null,
        special_rate_label: specialRate?.label || null,
        special_rate_id: specialRate?.id || null,
      },
      include: {
        users: { select: { name: true, email: true } },
        rooms: true,
      },
    });
    await logActivity({
      action: "UPDATE",
      entity: "reservation",
      entity_id: updated.id,
      description: `Updated reservation #${updated.id}`,
      performed_by: performedBy,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating reservation:", error);
    if (isOverlapError(error)) {
      return NextResponse.json(
        { error: "No rooms available for the selected dates" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Failed to update reservation", details: error.message },
      { status: 500 },
    );
  }
}
// Handle DELETE requests for this route.
export async function DELETE(req, { params }) {
  const originError = requireSameOrigin(req);
  if (originError) return originError;
  const { id } = params;

  try {
    const { session, error } = await requireRole(["admin", "worker"]);
    if (error) return error;

    let body = null;
    try {
      body = await req.json();
    } catch {}

    const isNumericId = !Number.isNaN(Number(id));
    const ids =
      Array.isArray(body?.ids) && body.ids.length > 0
        ? body.ids.map(Number).filter((n) => Number.isFinite(n))
        : [];

    if (!id) {
      return NextResponse.json({ error: "It needs an id" }, { status: 400 });
    }

    if (!isNumericId && ids.length === 0) {
      return NextResponse.json(
        { error: "Invalid id or empty ids list" },
        { status: 400 },
      );
    }

    if (!isNumericId && ids.length > 0) {
      await prisma.reservations.updateMany({
        where: { id: { in: ids } },
        data: {
          admin_hidden: true,
          admin_hidden_at: new Date(),
        },
      });

      await logActivity({
        action: "ARCHIVE_BULK",
        entity: "reservation",
        entity_id: null,
        description: `Admin archived reservations: ${ids.join(", ")}`,
        performed_by: session.user.email,
      });

      return NextResponse.json({
        message: `Archived ${ids.length} reservations`,
      });
    }

    const reservationId = Number(id);

    const existing = await prisma.reservations.findUnique({
      where: { id: reservationId },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 },
      );
    }

    // Admin hide only, do not delete.
    await prisma.reservations.update({
      where: { id: reservationId },
      data: {
        admin_hidden: true,
        admin_hidden_at: new Date(),
      },
    });

    await logActivity({
      action: "ARCHIVE",
      entity: "reservation",
      entity_id: reservationId,
      description: `Admin archived reservation #${reservationId}`,
      performed_by: session.user.email,
    });

    return NextResponse.json({
      message: "Reservation archived successfully",
    });
  } catch (error) {
    console.error("Error archiving reservation:", error);
    return NextResponse.json(
      { error: "Failed to archive reservation" },
      { status: 500 },
    );
  }
}
