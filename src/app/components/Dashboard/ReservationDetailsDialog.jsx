import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Box,
  Button,
} from "@mui/material";

export default function ReservationDetailsDialog({
  open,
  reservation,
  onClose,
}) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Reservation Details</DialogTitle>
      <DialogContent dividers>
        {reservation ? (
          <Box display="flex" flexDirection="column" gap={1.2}>
            <Typography variant="body2">
              <b>Code:</b> {reservation.reservation_code || "-"}
            </Typography>

            <Typography variant="body2">
              <b>Invoice:</b> {reservation.invoice_number || "â€”"}
            </Typography>

            <Typography variant="body2">
              <b>Guest:</b> {reservation.full_name || "-"}
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

            <Typography variant="body2">
              <b>Room:</b> {reservation.rooms?.name || "-"} #
              {reservation.rooms?.room_number || "-"}
            </Typography>

            <Typography variant="body2">
              <b>Dates:</b>{" "}
              {new Date(reservation.start_date).toLocaleDateString()}{" "}
              {new Date(reservation.end_date).toLocaleDateString()}
            </Typography>

            <Typography variant="body2">
              <b>Guests:</b> {reservation.guests ?? "-"}
            </Typography>

            <Typography variant="body2">
              <b>Status:</b> {reservation.status || "-"}
            </Typography>

            <Typography variant="body2">
              <b>Total:</b> {Number(reservation.total_price ?? 0).toFixed(2)}
            </Typography>

            <Typography variant="body2">
              <b>Paid:</b> {Number(reservation.amount_paid ?? 0).toFixed(2)}
            </Typography>

            <Typography variant="body2">
              <b>Payment status:</b> {reservation.payment_status || "â€”"}
            </Typography>

            <Typography variant="body2">
              <b>Paid at:</b>{" "}
              {reservation.paid_at
                ? new Date(reservation.paid_at).toLocaleString()
                : "â€”"}
            </Typography>

            {reservation.cancelled_at && (
              <Typography variant="body2">
                <b>Cancelled at:</b>{" "}
                {new Date(reservation.cancelled_at).toLocaleString()}
              </Typography>
            )}

            {reservation.cancel_reason?.trim() && (
              <Typography variant="body2">
                <b>Cancel reason:</b> {reservation.cancel_reason}
              </Typography>
            )}
          </Box>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
