import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
} from "@mui/material";
import { useTranslations } from "next-intl";

export default function ReservationReasonDialog({
  reservation,
  open,
  onClose,
}) {
  const t = useTranslations("dashboard.reservations.reasonDialog");
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{t("title")}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          <b>{t("reservation")}:</b> #{reservation?.id}
          <br />
          <b>{t("guest")}:</b> {reservation?.full_name || "-"}
          <br />
          <b>{t("cancelledAt")}:</b>{" "}
          {reservation?.cancelled_at
            ? new Date(reservation.cancelled_at).toLocaleString()
            : "-"}
          <br />
          <br />
          <b>{t("reason")}:</b>{" "}
          {reservation?.cancel_reason?.trim()
            ? reservation.cancel_reason
            : t("noReason")}
        </DialogContentText>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{t("close")}</Button>
      </DialogActions>
    </Dialog>
  );
}
