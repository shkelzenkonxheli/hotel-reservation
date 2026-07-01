import prisma from "@/lib/prisma";

function parseDateOnlyToUTC(value) {
  const [y, m, d] = String(value).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function normalizeDateOnly(value) {
  if (!value) return "";
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return String(value).slice(0, 10);
}

export async function findApplicableSpecialRate({
  roomType,
  startDate,
}) {
  const normalizedStart = normalizeDateOnly(startDate);

  if (!roomType || !normalizedStart) {
    return null;
  }

  const start = parseDateOnlyToUTC(normalizedStart);

  return prisma.special_rates.findFirst({
    where: {
      room_type: roomType,
      active: true,
      start_date: { lte: start },
      end_date: { gte: start },
    },
    orderBy: [{ promo_price: "asc" }, { created_at: "desc" }],
  });
}

export async function enrichRoomTypeWithSpecialRate(roomTypeLike, startDate, endDate) {
  const specialRate = await findApplicableSpecialRate({
    roomType: roomTypeLike?.type,
    startDate,
  });

  if (!specialRate) {
    return {
      ...roomTypeLike,
      special_rate: null,
      original_price: roomTypeLike?.price ?? 0,
      effective_price: roomTypeLike?.price ?? 0,
      has_discount: false,
    };
  }

  return {
    ...roomTypeLike,
    special_rate: specialRate,
    original_price: roomTypeLike?.price ?? 0,
    effective_price: specialRate.promo_price,
    has_discount: true,
  };
}
