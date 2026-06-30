function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function getRoomCapacityConfig(roomLike = {}) {
  const includedGuests = Math.max(1, toNumber(roomLike.included_guests, 2));
  const maxGuests = Math.max(includedGuests, toNumber(roomLike.max_guests, 2));
  const extraGuestPrice = Math.max(0, toNumber(roomLike.extra_guest_price, 0));

  return {
    includedGuests,
    maxGuests,
    extraGuestPrice,
  };
}

export function clampGuests(roomLike = {}, guests) {
  const { includedGuests, maxGuests } = getRoomCapacityConfig(roomLike);
  const normalizedGuests = Math.max(1, toNumber(guests, includedGuests));
  return Math.min(normalizedGuests, maxGuests);
}

export function calculateNightlyRate(roomLike = {}, guests) {
  const basePrice = Math.max(
    0,
    toNumber(roomLike.effective_price ?? roomLike.price, 0),
  );
  const normalizedGuests = clampGuests(roomLike, guests);
  const { includedGuests, extraGuestPrice } = getRoomCapacityConfig(roomLike);
  const extraGuests = Math.max(0, normalizedGuests - includedGuests);

  return basePrice + extraGuests * extraGuestPrice;
}

export function calculateStayNights(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const nights = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  return Number.isFinite(nights) && nights > 0 ? nights : 0;
}

export function calculateReservationTotal(roomLike = {}, guests, startDate, endDate) {
  const nightlyRate = calculateNightlyRate(roomLike, guests);
  const nights = calculateStayNights(startDate, endDate);
  return nightlyRate * nights;
}
