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
    title: "Your stay starts tomorrow",
    intro:
      "Hello {name}, this is a reminder that your confirmed reservation starts tomorrow.",
    details: "Stay reminder",
    room: "Room",
    checkIn: "Check-in",
    checkOut: "Check-out",
    reservationCode: "Reservation code",
    noteTitle: "Arrival information",
    note:
      "Check-in starts from 14:00 and check-out is until 11:00. If your arrival time changes, please contact the hotel in advance.",
    footer:
      "Please also check your spam or promotions folder if you do not see our emails in your inbox.",
  },
  sq: {
    eyebrow: "Dijari Premium",
    title: "Qendrimi juaj fillon neser",
    intro:
      "Pershendetje {name}, ky eshte nje kujtues qe rezervimi juaj i konfirmuar fillon neser.",
    details: "Kujtesa per qendrimin",
    room: "Dhoma",
    checkIn: "Check-in",
    checkOut: "Check-out",
    reservationCode: "Kodi i rezervimit",
    noteTitle: "Informacion per arritjen",
    note:
      "Check-in fillon nga ora 14:00, ndersa check-out eshte deri ne ora 11:00. Nese koha e arritjes ndryshon, ju lutem kontaktoni hotelin paraprakisht.",
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

export function reservationReminderSubject({ locale = "sq" } = {}) {
  return COPY[normalizeLocale(locale)].title;
}

export function reservationReminderTemplate({
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
        <div bgcolor="#eaf3ff" style="padding:32px;background:#eaf3ff;color:#0f172a;border-bottom:1px solid #d6e6fb;">
          <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#315ea8;font-weight:700;">${copy.eyebrow}</div>
          <h1 style="margin:14px 0 0;font-size:30px;line-height:1.2;font-weight:700;color:#0f172a;">${copy.title}</h1>
          <p style="margin:14px 0 0;font-size:15px;line-height:1.8;color:#334155;">${intro}</p>
        </div>

        <div style="padding:28px 32px 32px;">
          <div style="padding:20px;border-radius:18px;background:#f8fafc;border:1px solid #e2e8f0;">
            <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#64748b;margin-bottom:12px;">
              ${copy.details}
            </div>
            <table style="width:100%;border-collapse:collapse;">
              ${infoRow(copy.room, roomName)}
              ${infoRow(copy.checkIn, startDate)}
              ${infoRow(copy.checkOut, endDate)}
              ${infoRow(copy.reservationCode, reservationCode)}
            </table>
          </div>

          <div style="margin-top:18px;padding:18px 20px;border-radius:18px;background:#fff7ed;border:1px solid #fed7aa;">
            <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#c2410c;margin-bottom:8px;">
              ${copy.noteTitle}
            </div>
            <div style="font-size:14px;line-height:1.8;color:#7c2d12;">
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
