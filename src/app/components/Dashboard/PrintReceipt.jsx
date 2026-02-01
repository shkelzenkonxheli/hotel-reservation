"use client";
import {
  Dialog,
  DialogContent,
  Typography,
  Button,
  Box,
  Divider,
  Chip,
} from "@mui/material";
import QRCode from "react-qr-code";

function Row({ label, value }) {
  return (
    <Box
      display="grid"
      gridTemplateColumns="160px 1fr"
      alignItems="center"
      py={0.75}
    >
      <Typography fontWeight={600} color="text.secondary">
        {label}
      </Typography>
      <Typography fontWeight={500}>{value}</Typography>
    </Box>
  );
}

export default function PrintReceipt({ reservation, onClose }) {
  const handlePrint = () => window.print();

  const handleDownloadPDF = async () => {
    const html2pdf = (await import("html2pdf.js")).default;
    const element = document.querySelector(".receipt-print");

    html2pdf()
      .set({
        margin: 12,
        filename: `invoice-${reservation.invoice_number || reservation.reservation_code}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(element)
      .save();
  };

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogContent>
        <Box className="receipt-print" sx={{ p: 2 }}>
          {/* HEADER */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
          >
            <Box>
              <Typography variant="h4" fontWeight={800}>
                Dijari Premium
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Hotel • +383 44 123 456
              </Typography>
            </Box>

            <Box textAlign="right">
              <Chip
                label={reservation.payment_status}
                color={
                  reservation.payment_status === "PAID" ? "success" : "warning"
                }
                sx={{ fontWeight: 700 }}
              />
              <Typography variant="caption" display="block" mt={1}>
                Invoice
              </Typography>
              <Typography fontWeight={700}>
                {reservation.invoice_number || reservation.reservation_code}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* GUEST & STAY INFO */}
          <Box>
            <Typography fontWeight={700} mb={1}>
              Guest & Stay Information
            </Typography>

            <Row label="Guest name" value={reservation.full_name} />
            <Row label="Email" value={reservation.users?.email || "-"} />
            <Row label="Phone" value={reservation.phone} />
            <Row label="Room" value={reservation.rooms?.name || "-"} />
            <Row
              label="Check-in"
              value={new Date(reservation.start_date).toLocaleDateString()}
            />
            <Row
              label="Check-out"
              value={new Date(reservation.end_date).toLocaleDateString()}
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* PAYMENT */}
          <Box>
            <Typography fontWeight={700} mb={1}>
              Payment details
            </Typography>

            <Row
              label="Payment method"
              value={reservation.payment_method?.toUpperCase() || "-"}
            />
            <Row label="Payment status" value={reservation.payment_status} />
            <Row
              label="Paid at"
              value={
                reservation.paid_at
                  ? new Date(reservation.paid_at).toLocaleString()
                  : "-"
              }
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* TOTAL */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            px={2}
            py={2}
            sx={{
              bgcolor: "#f9fafb",
              borderRadius: 2,
              border: "1px solid #e5e7eb",
            }}
          >
            <Typography fontWeight={800} fontSize={18}>
              Total amount
            </Typography>
            <Typography fontWeight={800} fontSize={22}>
              €{Number(reservation.total_price).toFixed(2)}
            </Typography>
          </Box>

          {/* QR */}
          <Box mt={4} textAlign="center">
            <QRCode
              value={reservation.invoice_number || reservation.reservation_code}
              size={90}
            />
            <Typography variant="caption" color="text.secondary" mt={1}>
              Scan to verify invoice
            </Typography>
          </Box>

          {/* FOOTER */}
          <Typography
            variant="caption"
            color="text.secondary"
            textAlign="center"
            mt={4}
            display="block"
          >
            Thank you for choosing Dijari Premium Hotel
            <br />
            This invoice is system-generated.
          </Typography>
        </Box>

        {/* ACTIONS (NO PRINT) */}
        <Box display="flex" gap={2} mt={3} className="no-print">
          <Button fullWidth variant="outlined" onClick={handleDownloadPDF}>
            Download PDF
          </Button>
          <Button fullWidth variant="contained" onClick={handlePrint}>
            Print
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
