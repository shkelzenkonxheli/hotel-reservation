import { NextResponse } from "next/server";
import { Resend } from "resend";
import prisma from "@/lib/prisma";
import { logActivity } from "../../../../../lib/activityLogger";
import {
  reservationReminderSubject,
  reservationReminderTemplate,
} from "@/lib/email/reservationReminderTemplate";

function normalizeLocale(locale) {
  return String(locale || "").toLowerCase().startsWith("en") ? "en" : "sq";
}

function getUtcDateOnly(date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function addUtcDays(date, days) {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function isAuthorized(request) {
  const authHeader = request.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;
  const url = new URL(request.url);
  const queryKey = url.searchParams.get("key");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && (bearer === cronSecret || queryKey === cronSecret)) {
    return true;
  }

  return request.headers.get("x-vercel-cron") === "1";
}

export async function GET(request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "RESEND_API_KEY is missing" },
        { status: 500 },
      );
    }

    const tomorrow = addUtcDays(getUtcDateOnly(new Date()), 1);
    const dayAfterTomorrow = addUtcDays(tomorrow, 1);

    const reservations = await prisma.reservations.findMany({
      where: {
        status: "confirmed",
        cancelled_at: null,
        admin_hidden: false,
        start_date: {
          gte: tomorrow,
          lt: dayAfterTomorrow,
        },
      },
      include: {
        rooms: true,
        users: {
          select: {
            email: true,
            name: true,
          },
        },
      },
      orderBy: {
        start_date: "asc",
      },
    });

    if (reservations.length === 0) {
      return NextResponse.json({
        ok: true,
        sent: 0,
        skipped: 0,
        message: "No confirmed reservations need reminders today.",
      });
    }

    const reminderLogs = await prisma.activity_logs.findMany({
      where: {
        action: "REMINDER_SENT",
        entity: "reservation",
        entity_id: {
          in: reservations.map((reservation) => reservation.id),
        },
      },
      select: {
        entity_id: true,
        description: true,
      },
    });

    const alreadySentKeys = new Set(
      reminderLogs.map((log) => `${log.entity_id}:${String(log.description || "")}`),
    );
    const resend = new Resend(process.env.RESEND_API_KEY);

    let sent = 0;
    let skipped = 0;
    const failed = [];

    for (const reservation of reservations) {
      const recipient = String(
        reservation.guest_email || reservation.users?.email || "",
      ).trim();
      const stayStart = reservation.start_date?.toISOString?.().slice(0, 10) || "";
      const reminderKey = `${reservation.id}:stay:${stayStart}`;

      if (!recipient || alreadySentKeys.has(reminderKey)) {
        skipped += 1;
        continue;
      }

      const locale = normalizeLocale(reservation.guest_locale);

      try {
        const result = await resend.emails.send({
          from: "Dijari Premium <onboarding@dijaripremium.com>",
          to: recipient,
          subject: reservationReminderSubject({ locale }),
          html: reservationReminderTemplate({
            locale,
            fullname:
              reservation.full_name || reservation.users?.name || "Guest",
            roomName:
              reservation.rooms?.name ||
              `#${reservation.rooms?.room_number || reservation.room_id || ""}`,
            startDate: stayStart,
            endDate: reservation.end_date?.toISOString?.().slice(0, 10) || "",
            reservationCode: reservation.reservation_code || "-",
          }),
        });

        if (result?.error) {
          throw new Error(result.error.message || "Reminder email failed");
        }

        await logActivity({
          action: "REMINDER_SENT",
          entity: "reservation",
          entity_id: reservation.id,
          description: `stay:${stayStart}`,
          performed_by: "cron",
        });

        sent += 1;
      } catch (error) {
        console.error(
          `Reminder email failed for reservation #${reservation.id}:`,
          error,
        );
        failed.push({
          reservationId: reservation.id,
          email: recipient,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      sent,
      skipped,
      failed,
    });
  } catch (error) {
    console.error("GET /api/cron/send-reservation-reminders error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
