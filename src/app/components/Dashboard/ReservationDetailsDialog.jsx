import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Box,
  Button,
  Divider,
  Chip,
} from "@mui/material";

export default function ReservationDetailsDialog({
  open,
  reservation,
  onClose,
}) {
  const formatDate = (value) =>
    value ? new Date(value).toLocaleDateString() : "-";
  const formatDateTime = (value) =>
    value ? new Date(value).toLocaleString() : "-";

  const statusLabel = reservation?.status || "-";
  const paymentLabel = reservation?.payment_status || "-";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
        Reservation details
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          Review guest, stay, and payment information.
        </Typography>
      </DialogTitle>
      <DialogContent dividers sx={{ bgcolor: "#f8fafc" }}>
        {reservation ? (
          <Box display="flex" flexDirection="column" gap={2}>
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#ffffff" }}>
              <Typography fontWeight={800} mb={1}>
                Guest
              </Typography>
              <Typography variant="body2">
                <b>Name:</b> {reservation.full_name || "-"}
              </Typography>
              <Typography variant="body2">
                <b>Email:</b> {reservation.users?.email || "-"}
              </Typography>
              <Typography variant="body2">
                <b>Phone:</b> {reservation.phone || "-"}
              </Typography>
              <Typography variant="body2">
                <b>Address:</b> {reservation.address || "-"}
              </Typography>
            </Box>

            <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#ffffff" }}>
              <Typography fontWeight={800} mb={1}>
                Stay
              </Typography>
              <Typography variant="body2">
                <b>Room:</b> {reservation.rooms?.name || "-"} #{
                  reservation.rooms?.room_number || "-"
                }
              </Typography>
              <Typography variant="body2">
                <b>Dates:</b> {formatDate(reservation.start_date)} -{" "}
                {formatDate(reservation.end_date)}
              </Typography>
              <Typography variant="body2">
                <b>Guests:</b> {reservation.guests ?? "-"}
              </Typography>
            </Box>

            <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#ffffff" }}>
              <Typography fontWeight={800} mb={1}>
                Booking
              </Typography>
              <Typography variant="body2">
                <b>Code:</b> {reservation.reservation_code || "-"}
              </Typography>
              <Typography variant="body2">
                <b>Invoice:</b> {reservation.invoice_number || "-"}
              </Typography>
              <Box display="flex" gap={1} mt={1} flexWrap="wrap">
                <Chip
                  label={`Status: ${statusLabel}`}
                  size="small"
                  sx={{ bgcolor: "#e2e8f0", fontWeight: 700 }}
                />
                <Chip
                  label={`Payment: ${paymentLabel}`}
                  size="small"
                  sx={{ bgcolor: "#e2e8f0", fontWeight: 700 }}
                />
              </Box>
            </Box>

            <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#ffffff" }}>
              <Typography fontWeight={800} mb={1}>
                Payment
              </Typography>
              <Typography variant="body2">
                <b>Total:</b> {Number(reservation.total_price ?? 0).toFixed(2)}
              </Typography>
              <Typography variant="body2">
                <b>Paid:</b> {Number(reservation.amount_paid ?? 0).toFixed(2)}
              </Typography>
              <Typography variant="body2">
                <b>Paid at:</b> {formatDateTime(reservation.paid_at)}
              </Typography>
            </Box>

            {reservation.cancelled_at && (
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#ffffff" }}>
                <Typography fontWeight={800} mb={1}>
                  Cancellation
                </Typography>
                <Typography variant="body2">
                  <b>Cancelled at:</b> {formatDateTime(reservation.cancelled_at)}
                </Typography>
                {reservation.cancel_reason?.trim() && (
                  <Typography variant="body2">
                    <b>Reason:</b> {reservation.cancel_reason}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
