export function normalizeEmail(email) {
  return String(email || "")
    .toLowerCase()
    .trim();
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ""));
}

export function isStrongPassword(password) {
  return /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(String(password || ""));
}

export function toSafeString(value, max = 255) {
  return String(value || "").trim().slice(0, max);
}
