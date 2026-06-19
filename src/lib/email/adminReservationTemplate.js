function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function detailsRow(label, value) {
  return `
    <tr>
      <td style="padding:10px 0;color:#64748b;font-size:14px;">${escapeHtml(label)}</td>
      <td style="padding:10px 0;color:#0f172a;font-size:14px;font-weight:600;text-align:right;">${escapeHtml(value)}</td>
    </tr>
  `;
}

export function adminReservationSubject({ reservationStatus = "pending" } = {}) {
  return String(reservationStatus || "").toLowerCase() === "confirmed"
    ? "Reservation confirmed"
    : "New reservation request";
}

export function adminReservationTemplate({
  fullname,
  guestEmail,
  phone,
  roomType,
  roomName,
  startDate,
  endDate,
  totalPrice,
  reservationCode,
  reservationStatus = "pending",
  source = "Guest portal",
}) {
  const isConfirmed =
    String(reservationStatus || "").toLowerCase() === "confirmed";

  return `
    <div style="margin:0;padding:32px 16px;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
      <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden;">
        <div bgcolor="#eaf3ff" style="padding:28px 32px;background:#eaf3ff;color:#0f172a;border-bottom:1px solid #d6e6fb;">
          <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#315ea8;font-weight:700;">Dijari Premium</div>
          <h1 style="margin:12px 0 0;font-size:28px;line-height:1.2;color:#0f172a;font-weight:700;">${isConfirmed ? "Reservation confirmed" : "New reservation request"}</h1>
          <p style="margin:12px 0 0;font-size:15px;line-height:1.7;color:#334155;">
            ${isConfirmed ? "A reservation has been confirmed by staff." : "A new reservation has been created and is waiting for review."}
          </p>
        </div>

        <div style="padding:28px 32px;">
          <div style="padding:18px 20px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;">
            <div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;margin-bottom:10px;">
              Booking summary
            </div>
            <table style="width:100%;border-collapse:collapse;">
              ${detailsRow("Status", isConfirmed ? "Confirmed" : "Pending")}
              ${detailsRow("Source", source)}
              ${detailsRow("Guest", fullname)}
              ${detailsRow("Guest email", guestEmail || "-")}
              ${detailsRow("Phone", phone || "-")}
              ${detailsRow("Room type", roomType)}
              ${detailsRow("Assigned room", roomName)}
              ${detailsRow("Stay", `${startDate} - ${endDate}`)}
              ${detailsRow("Total", `EUR ${totalPrice}`)}
            </table>
          </div>

          <div style="margin-top:18px;padding:18px 20px;border-radius:16px;background:#eff6ff;border:1px solid #bfdbfe;">
            <div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#1d4ed8;margin-bottom:8px;">
              Reservation code
            </div>
            <div style="font-size:18px;font-weight:700;color:#0f172a;word-break:break-all;">
              ${escapeHtml(reservationCode || "-")}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
