import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { DASHBOARD_TABS } from "@/lib/dashboardTabs";

const ALL_TABS = DASHBOARD_TABS.map((t) => t.key);

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const userId = Number(params.id);
  const body = await req.json();
  const tabs = Array.isArray(body.allowed_tabs) ? body.allowed_tabs : [];
  const allowedPositions = new Set([
    "receptionist",
    "cleaner",
    "manager",
    "maintenance",
    "accountant",
    "other",
    "",
  ]);
  const allowedEmploymentStatus = new Set(["active", "inactive"]);
  const allowedSalaryType = new Set(["monthly", "hourly"]);

  // sanitize: lejo vetëm tabs që ekzistojnë
  const sanitized = [...new Set(tabs)].filter((t) => ALL_TABS.includes(t));
  const positionRaw = String(body.staff_position || "").trim().toLowerCase();
  const staffPosition = allowedPositions.has(positionRaw) ? positionRaw : "other";

  const employmentStatusRaw = String(body.employment_status || "active")
    .trim()
    .toLowerCase();
  const employmentStatus = allowedEmploymentStatus.has(employmentStatusRaw)
    ? employmentStatusRaw
    : "active";

  const salaryTypeRaw = String(body.salary_type || "monthly")
    .trim()
    .toLowerCase();
  const salaryType = allowedSalaryType.has(salaryTypeRaw)
    ? salaryTypeRaw
    : "monthly";

  let baseSalary = null;
  if (body.base_salary !== undefined && body.base_salary !== null && body.base_salary !== "") {
    const parsed = Number(body.base_salary);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return NextResponse.json(
        { error: "base_salary must be a non-negative number" },
        { status: 400 },
      );
    }
    baseSalary = parsed;
  }

  let employmentStartDate = null;
  if (body.employment_start_date) {
    const d = new Date(body.employment_start_date);
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json(
        { error: "employment_start_date is invalid" },
        { status: 400 },
      );
    }
    employmentStartDate = d;
  }

  const updated = await prisma.users.update({
    where: { id: userId },
    data: {
      allowed_tabs: sanitized,
      staff_position: staffPosition || null,
      employment_status: employmentStatus,
      salary_type: salaryType,
      base_salary: baseSalary,
      employment_start_date: employmentStartDate,
    },
    select: {
      id: true,
      allowed_tabs: true,
      staff_position: true,
      employment_status: true,
      salary_type: true,
      base_salary: true,
      employment_start_date: true,
    },
  });

  return NextResponse.json(updated);
}
