import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
} from "@mui/material";
import { useTranslations } from "next-intl";

export default function ReservationDeleteDialog({ open, onClose, onConfirm }) {
  const t = useTranslations("dashboard.reservations.deleteDialog");
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{t("title")}</DialogTitle>
      <DialogContent>
        <DialogContentText>{t("description")}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("cancel")}</Button>
        <Button color="error" onClick={onConfirm}>
          {t("delete")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
