import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
} from "@mui/material";

export default function ReservationReasonDialog({
  reservation,
  open,
  onClose,
}) {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Cancellation Details</DialogTitle>
      <DialogContent>
        <DialogContentText>
          <b>Reservation:</b> #{reservation?.id}
          <br />
          <b>Guest:</b> {reservation?.full_name || "-"}
          <br />
          <b>Cancelled at:</b>{" "}
          {reservation?.cancelled_at
            ? new Date(reservation.cancelled_at).toLocaleString()
            : "-"}
          <br />
          <br />
          <b>Reason:</b>{" "}
          {reservation?.cancel_reason?.trim()
            ? reservation.cancel_reason
            : "No reason provided."}
        </DialogContentText>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
