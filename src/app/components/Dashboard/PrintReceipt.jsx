"use client";
import {
  Dialog,
  DialogContent,
  Typography,
  Button,
  Box,
  Divider,
} from "@mui/material";
import QRCode from "react-qr-code";

function Row({ label, value }) {
  return (
    <Box display="grid" gridTemplateColumns="140px 1fr" mb={1.5} gap={1}>
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
        margin: 10,
        filename: `reservation-${reservation.reservation_code}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(element)
      .save();
  };

  return (
    <Dialog open onClose={onClose} maxWidth="md" fullWidth>
      <DialogContent>
        <Box className="receipt-print">
          {/* HEADER */}
          <Box textAlign="center" mb={3}>
            <Typography variant="h4" fontWeight={700}>
              Dijari Premium
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={2}>
              Hotel +383 44 123 456
            </Typography>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* INFO */}
          <Row label="Invoice No" value={reservation.reservation_code} />
          <Row label="Guest" value={reservation.full_name} />
          <Row label="Email" value={reservation.users?.email || "-"} />
          <Row label="Room" value={reservation.rooms?.name} />
          <Row
            label="Check-in"
            value={new Date(reservation.start_date).toLocaleDateString()}
          />
          <Row
            label="Check-out"
            value={new Date(reservation.end_date).toLocaleDateString()}
          />

          <Divider sx={{ my: 3 }} />

          {/* TOTAL */}
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            p={2}
            sx={{ background: "#f9fafb", borderRadius: 2 }}
          >
            <Typography fontWeight={700}>Total</Typography>
            <Typography fontWeight={700} fontSize={20}>
              €{Number(reservation.total_price).toFixed(2)}
            </Typography>
          </Box>

          {/* QR */}
          <Box mt={4} textAlign="center">
            <QRCode value={reservation.reservation_code} size={80} />
            <Typography variant="caption" display="block" mt={1}>
              Scan to verify reservation
            </Typography>
          </Box>

          {/* FOOTER */}
          <Typography
            variant="caption"
            color="text.secondary"
            textAlign="center"
            mt={4}
          >
            Thank you for choosing Dijari Premium Hotel
          </Typography>
        </Box>

        {/* ACTIONS */}
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
