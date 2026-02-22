import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { logActivity } from "../../../../lib/activityLogger";

function parseDateOnlyToUTC(dateStr) {
  const [y, m, d] = String(dateStr || "")
    .split("-")
    .map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;
    if (!session?.user || (role !== "admin" && role !== "worker")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // YYYY-MM
    const category = searchParams.get("category");

    const where = {};
    if (month) {
      const [year, mon] = month.split("-").map(Number);
      if (year && mon) {
        const start = new Date(Date.UTC(year, mon - 1, 1));
        const end = new Date(Date.UTC(year, mon, 1));
        where.expense_date = { gte: start, lt: end };
      }
    }
    if (category && category !== "all") {
      where.category = category;
    }

    const expenses = await prisma.expenses.findMany({
      where,
      orderBy: [{ expense_date: "desc" }, { id: "desc" }],
      select: {
        id: true,
        expense_date: true,
        category: true,
        amount: true,
        payment_method: true,
        note: true,
        created_by: true,
        created_by_id: true,
        created_at: true,
      },
    });

    return NextResponse.json(
      expenses.map((e) => ({
        ...e,
        amount: Number(e.amount || 0),
      })),
    );
  } catch (error) {
    console.error("GET /expenses error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;
    if (!session?.user || (role !== "admin" && role !== "worker")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const expenseDate = body.expense_date;
    const category = String(body.category || "").trim().toLowerCase();
    const amount = Number(body.amount);
    const paymentMethod = String(body.payment_method || "cash")
      .trim()
      .toLowerCase();
    const note = String(body.note || "").trim();

    const allowedCategories = new Set([
      "utilities",
      "maintenance",
      "supplies",
      "salary",
      "marketing",
      "other",
    ]);
    const allowedPaymentMethods = new Set(["cash", "card", "bank_transfer"]);

    if (!expenseDate || !category || !Number.isFinite(amount)) {
      return NextResponse.json(
        { error: "expense_date, category and amount are required" },
        { status: 400 },
      );
    }
    if (amount <= 0) {
      return NextResponse.json(
        { error: "amount must be greater than 0" },
        { status: 400 },
      );
    }
    if (!allowedCategories.has(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }
    if (!allowedPaymentMethods.has(paymentMethod)) {
      return NextResponse.json(
        { error: "Invalid payment method" },
        { status: 400 },
      );
    }

    const created = await prisma.expenses.create({
      data: {
        expense_date: parseDateOnlyToUTC(expenseDate),
        category,
        amount,
        payment_method: paymentMethod,
        note: note || null,
        created_by_id: Number(session.user.id) || null,
        created_by: session.user.email || session.user.name || "staff",
      },
      select: {
        id: true,
        expense_date: true,
        category: true,
        amount: true,
        payment_method: true,
        note: true,
        created_by: true,
        created_by_id: true,
        created_at: true,
      },
    });

    await logActivity({
      action: "CREATE",
      entity: "expense",
      entity_id: created.id,
      description: `Created expense #${created.id} (${category}, ${amount.toFixed(2)} EUR)`,
      performed_by: session.user.email || "system",
    });

    return NextResponse.json({
      ...created,
      amount: Number(created.amount || 0),
    });
  } catch (error) {
    console.error("POST /expenses error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
