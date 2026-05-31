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
    eyebrow: "Dijari Premium",
    title: "Your reservation request was not confirmed",
    intro:
      "Hello {name}, after review, your reservation request could not be confirmed by our team.",
    details: "Reservation details",
    room: "Room",
    checkIn: "Check-in",
    checkOut: "Check-out",
    reservationCode: "Reservation code",
    noteTitle: "What this means",
    note:
      "This reservation is no longer active. If you would like, you can make a new request for other dates or contact the hotel directly for assistance.",
    footer:
      "Please also check your spam or promotions folder if you do not see our emails in your inbox.",
  },
  sq: {
    eyebrow: "Dijari Premium",
    title: "Rezervimi juaj nuk u konfirmua",
    intro:
      "Pershendetje {name}, pas shqyrtimit nga stafi yne, kerkesa juaj per rezervim nuk mund te konfirmohej.",
    details: "Detajet e rezervimit",
    room: "Dhoma",
    checkIn: "Check-in",
    checkOut: "Check-out",
    reservationCode: "Kodi i rezervimit",
    noteTitle: "Cfare do te thote kjo",
    note:
      "Ky rezervim nuk eshte me aktiv. Nese deshironi, mund te beni nje kerkese te re per data te tjera ose te kontaktoni hotelin direkt per ndihme.",
    footer:
      "Kontrolloni edhe spam ose promotions nese email-et tona nuk shfaqen ne inbox.",
  },
};

function infoRow(label, value) {
  return `
    <tr>
      <td style="padding:10px 0;color:#64748b;font-size:14px;">${escapeHtml(label)}</td>
      <td style="padding:10px 0;color:#0f172a;font-size:14px;font-weight:600;text-align:right;">${escapeHtml(value)}</td>
    </tr>
  `;
}

export function reservationDeclinedSubject({ locale = "sq" }) {
  return COPY[normalizeLocale(locale)].title;
}

export function reservationDeclinedTemplate({
  locale = "sq",
  fullname,
  roomName,
  startDate,
  endDate,
  reservationCode,
}) {
  const copy = COPY[normalizeLocale(locale)];
  const intro = copy.intro.replace("{name}", escapeHtml(fullname));

  return `
    <div style="margin:0;padding:32px 16px;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:24px;overflow:hidden;box-shadow:0 24px 60px rgba(15,23,42,0.08);">
        <div style="padding:32px;background:linear-gradient(135deg,#7f1d1d 0%,#b91c1c 55%,#ef4444 100%);color:#ffffff;">
          <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.78;">${copy.eyebrow}</div>
          <h1 style="margin:14px 0 0;font-size:30px;line-height:1.2;font-weight:700;">${copy.title}</h1>
          <p style="margin:14px 0 0;font-size:15px;line-height:1.8;opacity:0.92;">${intro}</p>
        </div>

        <div style="padding:28px 32px 32px;">
          <div style="margin-top:4px;padding:20px;border-radius:18px;background:#fff7ed;border:1px solid #fdba74;">
            <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#c2410c;margin-bottom:12px;">
              ${copy.details}
            </div>

            <table style="width:100%;border-collapse:collapse;">
              ${infoRow(copy.room, roomName)}
              ${infoRow(copy.checkIn, startDate)}
              ${infoRow(copy.checkOut, endDate)}
              ${infoRow(copy.reservationCode, reservationCode)}
            </table>
          </div>

          <div style="margin-top:18px;padding:18px 20px;border-radius:18px;background:#f8fafc;border:1px solid #e2e8f0;">
            <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#64748b;margin-bottom:8px;">
              ${copy.noteTitle}
            </div>
            <div style="font-size:14px;line-height:1.8;color:#475569;">
              ${copy.note}
            </div>
          </div>

          <p style="margin:24px 0 0;font-size:13px;line-height:1.8;color:#64748b;">
            ${copy.footer}
          </p>
        </div>
      </div>
    </div>
  `;
}
