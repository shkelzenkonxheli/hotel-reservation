import { Dialog, DialogContent, Button, Typography } from "@mui/material";

export default function PrintReceipt({ reservation, onClose }) {
  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <DialogContent>
        <Typography variant="h6" fontWeight="bold" mb={2}>
          Reservation Receipt
        </Typography>

        <Typography>Guest: {reservation.full_name}</Typography>
        <Typography>Email: {reservation.users?.email}</Typography>
        <Typography>Room: {reservation.rooms?.name}</Typography>
        <Typography>Status: {reservation.status}</Typography>
        <Typography>Total: €{reservation.total_price}</Typography>

        <Button
          fullWidth
          variant="contained"
          sx={{ mt: 3 }}
          onClick={() => window.print()}
        >
          Print
        </Button>
      </DialogContent>
    </Dialog>
  );
}
