function detailsRow(label, value) {
  return `
    <tr>
      <td style="padding:10px 0;color:#64748b;font-size:14px;">${label}</td>
      <td style="padding:10px 0;color:#0f172a;font-size:14px;font-weight:600;text-align:right;">${value}</td>
    </tr>
  `;
}

export function reservationConfirmationTemplate({
  fullname,
  roomName,
  startDate,
  endDate,
  totalPrice,
  reservationCode,
}) {
  return `
    <div style="margin:0;padding:32px 16px;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
      <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden;">
        <div style="padding:28px 32px;background:linear-gradient(135deg,#0f172a,#1e293b);color:#ffffff;">
          <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;opacity:0.78;">Dijari Premium</div>
          <h1 style="margin:12px 0 0;font-size:28px;line-height:1.2;">Reservation confirmed</h1>
          <p style="margin:12px 0 0;font-size:15px;line-height:1.7;opacity:0.88;">
            Hello ${fullname}, your booking has been successfully confirmed.
          </p>
        </div>

        <div style="padding:28px 32px;">
          <div style="padding:18px 20px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;">
            <div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;margin-bottom:10px;">
              Reservation details
            </div>
            <table style="width:100%;border-collapse:collapse;">
              ${detailsRow("Room", roomName)}
              ${detailsRow("Check-in", startDate)}
              ${detailsRow("Check-out", endDate)}
              ${detailsRow("Total price", `EUR ${totalPrice}`)}
            </table>
          </div>

          <div style="margin-top:18px;padding:18px 20px;border-radius:16px;background:#eff6ff;border:1px solid #bfdbfe;">
            <div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#1d4ed8;margin-bottom:8px;">
              Reservation code
            </div>
            <div style="font-size:24px;font-weight:700;letter-spacing:0.08em;color:#0f172a;">
              ${reservationCode}
            </div>
          </div>

          <p style="margin:24px 0 0;color:#475569;font-size:14px;line-height:1.7;">
            Please keep this confirmation for your records. If you need any assistance before arrival,
            reply to this email and our team will help you.
          </p>
        </div>
      </div>
    </div>
  `;
}
