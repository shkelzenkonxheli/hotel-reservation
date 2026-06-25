import { HOTEL_INFO } from "@/lib/hotelInfo";

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
    pendingTitle: "Your reservation request has been received",
    confirmedTitle: "Your reservation is confirmed",
    pendingIntro:
      "Hello {name}, your booking has been created successfully. Payment will be completed at the hotel on arrival.",
    confirmedIntro:
      "Hello {name}, your booking has been confirmed successfully. We look forward to welcoming you.",
    reservationDetails: "Reservation details",
    reservationCode: "Reservation code",
    status: "Status",
    room: "Room",
    checkIn: "Check-in",
    checkOut: "Check-out",
    totalPrice: "Total price",
    paymentMethod: "Payment method",
    paymentStatus: "Payment status",
    nextStepTitle: "What happens next",
    pendingNextStep:
      "Please keep this email for your records. Our team can review your booking and payment will be completed directly at the hotel. For assistance, contact us at dijaripremium@gmail.com or +382 68 317 993. Address: Mujo Ulcinaku, Ulcinj, Montenegro.",
    confirmedNextStep:
      "Please keep this email for your records. For assistance before arrival, contact us at dijaripremium@gmail.com or +382 68 317 993. Address: Mujo Ulcinaku, Ulcinj, Montenegro.",
    stayInfoTitle: "Important stay information",
    stayInfo:
      "Check-in starts from 14:00 and check-out is until 11:00. Early check-in or late check-out depends on availability.",
    footer:
      "Thank you for choosing Dijari Premium. We are here if you need anything before your stay.",
    pendingLabel: "Pending",
    confirmedLabel: "Confirmed",
    paid: "Paid",
    unpaid: "Unpaid",
    cash: "Cash",
    card: "Card",
  },
  sq: {
    eyebrow: "Dijari Premium",
    pendingTitle: "Rezervimi juaj u pranua",
    confirmedTitle: "Rezervimi juaj u konfirmua",
    pendingIntro:
      "Pershendetje {name}, rezervimi juaj u krijua me sukses. Pagesa do te kryhet ne hotel gjate arritjes.",
    confirmedIntro:
      "Pershendetje {name}, rezervimi juaj u konfirmua me sukses. Ju mirepresim ne Dijari Premium.",
    reservationDetails: "Detajet e rezervimit",
    reservationCode: "Kodi i rezervimit",
    status: "Statusi",
    room: "Dhoma",
    checkIn: "Check-in",
    checkOut: "Check-out",
    totalPrice: "Cmimi total",
    paymentMethod: "Menyra e pageses",
    paymentStatus: "Statusi i pageses",
    nextStepTitle: "Hapi i radhes",
    pendingNextStep:
      "Ruajeni kete email per evidencen tuaj. Ekipi yne mund ta rishikoje rezervimin dhe pagesa do te kryhet direkt ne hotel. Per ndihme, na kontaktoni ne dijaripremium@gmail.com ose +382 68 317 993. Adresa: Mujo Ulcinaku, Ulqin, Mali i Zi.",
    confirmedNextStep:
      "Ruajeni kete email per evidencen tuaj. Nese ju duhet ndihme para arritjes, na kontaktoni ne dijaripremium@gmail.com ose +382 68 317 993. Adresa: Mujo Ulcinaku, Ulqin, Mali i Zi.",
    stayInfoTitle: "Informacion i rendesishem per qendrimin",
    stayInfo:
      "Check-in fillon nga ora 14:00, ndersa check-out eshte deri ne ora 11:00. Hyrja me heret ose dalja me vone varen nga disponueshmeria.",
    footer:
      "Faleminderit qe zgjodhet Dijari Premium. Jemi ne dispozicion per cdo ndihme para qendrimit tuaj.",
    pendingLabel: "Ne pritje",
    confirmedLabel: "E konfirmuar",
    paid: "E paguar",
    unpaid: "E papaguar",
    cash: "Cash",
    card: "Kartele",
  },
};

function resolvePaymentMethodLabel(copy, paymentMethod) {
  return String(paymentMethod || "").toLowerCase() === "card"
    ? copy.card
    : copy.cash;
}

function resolvePaymentStatusLabel(copy, paymentStatus) {
  return String(paymentStatus || "").toUpperCase() === "PAID"
    ? copy.paid
    : copy.unpaid;
}

function resolveReservationStatusLabel(copy, reservationStatus) {
  return String(reservationStatus || "").toLowerCase() === "confirmed"
    ? copy.confirmedLabel
    : copy.pendingLabel;
}

function infoRow(label, value) {
  return `
    <tr>
      <td style="padding:10px 0;color:#64748b;font-size:14px;">${escapeHtml(label)}</td>
      <td style="padding:10px 0;color:#0f172a;font-size:14px;font-weight:600;text-align:right;">${escapeHtml(value)}</td>
    </tr>
  `;
}

export function reservationConfirmationSubject({
  locale = "sq",
  reservationStatus = "pending",
}) {
  const copy = COPY[normalizeLocale(locale)];
  return String(reservationStatus || "").toLowerCase() === "confirmed"
    ? copy.confirmedTitle
    : copy.pendingTitle;
}

export function reservationConfirmationTemplate({
  locale = "sq",
  fullname,
  roomName,
  startDate,
  endDate,
  totalPrice,
  reservationCode,
  paymentMethod = "cash",
  paymentStatus = "UNPAID",
  reservationStatus = "pending",
}) {
  const copy = COPY[normalizeLocale(locale)];
  const hotelAddress =
    normalizeLocale(locale) === "en"
      ? HOTEL_INFO.address.en
      : HOTEL_INFO.address.sq;
  const isConfirmed =
    String(reservationStatus || "").toLowerCase() === "confirmed";
  const statusTone = isConfirmed
    ? {
        surface: "#ecfdf3",
        border: "#bbf7d0",
        text: "#166534",
      }
    : {
        surface: "#eff6ff",
        border: "#bfdbfe",
        text: "#1d4ed8",
      };

  const intro = (isConfirmed ? copy.confirmedIntro : copy.pendingIntro).replace(
    "{name}",
    escapeHtml(fullname),
  );

  return `
    <div style="margin:0;padding:32px 16px;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:24px;overflow:hidden;box-shadow:0 24px 60px rgba(15,23,42,0.08);">
        <div bgcolor="#eaf3ff" style="padding:32px;background:#eaf3ff;color:#0f172a;border-bottom:1px solid #d6e6fb;">
          <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#315ea8;font-weight:700;">${copy.eyebrow}</div>
          <h1 style="margin:14px 0 0;font-size:30px;line-height:1.2;font-weight:700;color:#0f172a;">${isConfirmed ? copy.confirmedTitle : copy.pendingTitle}</h1>
          <p style="margin:14px 0 0;font-size:15px;line-height:1.8;color:#334155;">${intro}</p>
        </div>

        <div style="padding:28px 32px 32px;">
          <div style="display:inline-flex;padding:8px 14px;border-radius:999px;background:${statusTone.surface};border:1px solid ${statusTone.border};color:${statusTone.text};font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">
            ${escapeHtml(copy.status)}: ${escapeHtml(resolveReservationStatusLabel(copy, reservationStatus))}
          </div>

          <div style="margin-top:18px;padding:20px;border-radius:18px;background:#f8fafc;border:1px solid #e2e8f0;">
            <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#64748b;margin-bottom:12px;">
              ${copy.reservationDetails}
            </div>

            <table style="width:100%;border-collapse:collapse;">
              ${infoRow(copy.room, roomName)}
              ${infoRow(copy.checkIn, startDate)}
              ${infoRow(copy.checkOut, endDate)}
              ${infoRow(copy.totalPrice, `EUR ${totalPrice}`)}
              ${infoRow(copy.paymentMethod, resolvePaymentMethodLabel(copy, paymentMethod))}
              ${infoRow(copy.paymentStatus, resolvePaymentStatusLabel(copy, paymentStatus))}
            </table>
          </div>

          <div style="margin-top:18px;padding:20px;border-radius:18px;background:#ffffff;border:1px solid #dbeafe;">
            <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#2563eb;margin-bottom:10px;">
              ${copy.reservationCode}
            </div>
            <div style="font-size:26px;font-weight:700;letter-spacing:0.08em;color:#0f172a;">
              ${escapeHtml(reservationCode)}
            </div>
          </div>

          <div style="margin-top:18px;padding:18px 20px;border-radius:18px;background:#f8fafc;border:1px solid #e2e8f0;">
            <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#64748b;margin-bottom:8px;">
              ${copy.nextStepTitle}
            </div>
            <div style="font-size:14px;line-height:1.8;color:#475569;">
              ${(isConfirmed ? copy.confirmedNextStep : copy.pendingNextStep)
                .replace("dijaripremium@gmail.com", HOTEL_INFO.email)
                .replace("+382 68 317 993", HOTEL_INFO.phone)
                .replace(
                  normalizeLocale(locale) === "en"
                    ? "Mujo Ulcinaku, Ulcinj, Montenegro"
                    : "Mujo Ulcinaku, Ulqin, Mali i Zi",
                  hotelAddress,
                )}
            </div>
          </div>

          <div style="margin-top:18px;padding:18px 20px;border-radius:18px;background:#fff7ed;border:1px solid #fed7aa;">
            <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#c2410c;margin-bottom:8px;">
              ${copy.stayInfoTitle}
            </div>
            <div style="font-size:14px;line-height:1.8;color:#7c2d12;">
              ${copy.stayInfo}
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
