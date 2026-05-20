function normalizeLocale(locale) {
  return String(locale || "").toLowerCase().startsWith("en") ? "en" : "sq";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const COPY = {
  en: {
    subject: "Reset your password",
    eyebrow: "Dijari Premium",
    title: "Reset your password",
    intro:
      "Hello {name}, we received a request to reset your password. Use the button below to choose a new one.",
    button: "Create new password",
    expires: "This link expires in 1 hour.",
    ignore:
      "If you did not request a password reset, you can safely ignore this email.",
    footer:
      "For security, this link can only be used once.",
  },
  sq: {
    subject: "Rivendos fjalekalimin",
    eyebrow: "Dijari Premium",
    title: "Rivendos fjalekalimin",
    intro:
      "Pershendetje {name}, morëm nje kerkese per rivendosjen e fjalekalimit. Perdore butonin me poshte per te zgjedhur nje te ri.",
    button: "Vendos fjalekalim te ri",
    expires: "Ky link skadon per 1 ore.",
    ignore:
      "Nese nuk e ke kerkuar rivendosjen e fjalekalimit, mund ta injorosh kete email.",
    footer:
      "Per arsye sigurie, ky link mund te perdoret vetem nje here.",
  },
};

export function passwordResetSubject(locale = "sq") {
  return COPY[normalizeLocale(locale)].subject;
}

export function passwordResetTemplate({ locale = "sq", name, resetUrl }) {
  const copy = COPY[normalizeLocale(locale)];
  const intro = copy.intro.replace("{name}", escapeHtml(name || "Guest"));

  return `
    <div style="margin:0;padding:32px 16px;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
      <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:22px;overflow:hidden;box-shadow:0 24px 60px rgba(15,23,42,0.08);">
        <div style="padding:30px 32px;background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 55%,#2563eb 100%);color:#ffffff;">
          <div style="font-size:12px;letter-spacing:0.16em;text-transform:uppercase;opacity:0.78;">${copy.eyebrow}</div>
          <h1 style="margin:12px 0 0;font-size:30px;line-height:1.2;font-weight:700;">${copy.title}</h1>
          <p style="margin:14px 0 0;font-size:15px;line-height:1.8;opacity:0.92;">${intro}</p>
        </div>

        <div style="padding:30px 32px;">
          <div style="padding:20px;border-radius:18px;background:#f8fafc;border:1px solid #e2e8f0;">
            <a
              href="${escapeHtml(resetUrl)}"
              style="display:inline-block;padding:14px 22px;border-radius:999px;background:#0284c7;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;"
            >
              ${copy.button}
            </a>
            <p style="margin:16px 0 0;font-size:14px;line-height:1.7;color:#475569;">
              ${copy.expires}
            </p>
            <p style="margin:8px 0 0;font-size:14px;line-height:1.7;color:#475569;">
              ${copy.ignore}
            </p>
          </div>

          <p style="margin:20px 0 0;font-size:13px;line-height:1.7;color:#64748b;">
            ${copy.footer}
          </p>
        </div>
      </div>
    </div>
  `;
}
