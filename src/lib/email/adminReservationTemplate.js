function detailsRow(label, value) {
  return `
    <tr>
      <td style="padding:10px 0;color:#64748b;font-size:14px;">${label}</td>
      <td style="padding:10px 0;color:#0f172a;font-size:14px;font-weight:600;text-align:right;">${value}</td>
    </tr>
  `;
}

export function adminReservationTemplate({
  fullname,
  phone,
  roomType,
  roomName,
  startDate,
  endDate,
  totalPrice,
  sessionId,
}) {
  return `
    <div style="margin:0;padding:32px 16px;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
      <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden;">
        <div style="padding:28px 32px;background:linear-gradient(135deg,#1e293b,#334155);color:#ffffff;">
          <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;opacity:0.78;">Dijari Premium</div>
          <h1 style="margin:12px 0 0;font-size:28px;line-height:1.2;">New reservation received</h1>
          <p style="margin:12px 0 0;font-size:15px;line-height:1.7;opacity:0.88;">
            A new paid reservation has been created and assigned successfully.
          </p>
        </div>

        <div style="padding:28px 32px;">
          <div style="padding:18px 20px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;">
            <div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;margin-bottom:10px;">
              Booking summary
            </div>
            <table style="width:100%;border-collapse:collapse;">
              ${detailsRow("Client", fullname)}
              ${detailsRow("Phone", phone || "-")}
              ${detailsRow("Room type", roomType)}
              ${detailsRow("Assigned room", roomName)}
              ${detailsRow("Stay", `${startDate} - ${endDate}`)}
              ${detailsRow("Total", `EUR ${totalPrice}`)}
            </table>
          </div>

          <div style="margin-top:18px;padding:18px 20px;border-radius:16px;background:#fefce8;border:1px solid #fde68a;">
            <div style="font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#a16207;margin-bottom:8px;">
              Stripe session
            </div>
            <div style="font-size:14px;font-weight:600;color:#0f172a;word-break:break-all;">
              ${sessionId}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
