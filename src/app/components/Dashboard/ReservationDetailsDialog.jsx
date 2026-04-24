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
import { useTranslations } from "next-intl";

export default function ReservationDetailsDialog({
  open,
  reservation,
  onClose,
}) {
  const t = useTranslations("dashboard.reservations.detailsDialog");
  const formatDate = (value) =>
    value ? new Date(value).toLocaleDateString() : "-";
  const formatDateTime = (value) =>
    value ? new Date(value).toLocaleString() : "-";

  const statusLabel = reservation?.status || "-";
  const paymentLabel = reservation?.payment_status || "-";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
        {t("title")}
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          {t("subtitle")}
        </Typography>
      </DialogTitle>
      <DialogContent dividers sx={{ bgcolor: "#f8fafc" }}>
        {reservation ? (
          <Box display="flex" flexDirection="column" gap={2}>
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#ffffff" }}>
              <Typography fontWeight={800} mb={1}>
                {t("sections.guest")}
              </Typography>
              <Typography variant="body2">
                <b>{t("fields.name")}:</b> {reservation.full_name || "-"}
              </Typography>
              <Typography variant="body2">
                <b>{t("fields.email")}:</b> {reservation.users?.email || "-"}
              </Typography>
              <Typography variant="body2">
                <b>{t("fields.phone")}:</b> {reservation.phone || "-"}
              </Typography>
              <Typography variant="body2">
                <b>{t("fields.address")}:</b> {reservation.address || "-"}
              </Typography>
            </Box>

            <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#ffffff" }}>
              <Typography fontWeight={800} mb={1}>
                {t("sections.stay")}
              </Typography>
              <Typography variant="body2">
                <b>{t("fields.room")}:</b> {reservation.rooms?.name || "-"} #{
                  reservation.rooms?.room_number || "-"
                }
              </Typography>
              <Typography variant="body2">
                <b>{t("fields.dates")}:</b> {formatDate(reservation.start_date)} -{" "}
                {formatDate(reservation.end_date)}
              </Typography>
              <Typography variant="body2">
                <b>{t("fields.guests")}:</b> {reservation.guests ?? "-"}
              </Typography>
            </Box>

            <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#ffffff" }}>
              <Typography fontWeight={800} mb={1}>
                {t("sections.booking")}
              </Typography>
              <Typography variant="body2">
                <b>{t("fields.code")}:</b> {reservation.reservation_code || "-"}
              </Typography>
              <Typography variant="body2">
                <b>{t("fields.invoice")}:</b> {reservation.invoice_number || "-"}
              </Typography>
              <Box display="flex" gap={1} mt={1} flexWrap="wrap">
                <Chip
                  label={`${t("fields.status")}: ${statusLabel}`}
                  size="small"
                  sx={{ bgcolor: "#e2e8f0", fontWeight: 700 }}
                />
                <Chip
                  label={`${t("fields.payment")}: ${paymentLabel}`}
                  size="small"
                  sx={{ bgcolor: "#e2e8f0", fontWeight: 700 }}
                />
              </Box>
            </Box>

            <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#ffffff" }}>
              <Typography fontWeight={800} mb={1}>
                {t("sections.payment")}
              </Typography>
              <Typography variant="body2">
                <b>{t("fields.total")}:</b> {Number(reservation.total_price ?? 0).toFixed(2)}
              </Typography>
              <Typography variant="body2">
                <b>{t("fields.paid")}:</b> {Number(reservation.amount_paid ?? 0).toFixed(2)}
              </Typography>
              <Typography variant="body2">
                <b>{t("fields.paidAt")}:</b> {formatDateTime(reservation.paid_at)}
              </Typography>
            </Box>

            {reservation.cancelled_at && (
              <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#ffffff" }}>
                <Typography fontWeight={800} mb={1}>
                  {t("sections.cancellation")}
                </Typography>
                <Typography variant="body2">
                  <b>{t("fields.cancelledAt")}:</b> {formatDateTime(reservation.cancelled_at)}
                </Typography>
                {reservation.cancel_reason?.trim() && (
                  <Typography variant="body2">
                    <b>{t("fields.reason")}:</b> {reservation.cancel_reason}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        ) : null}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">
          {t("close")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
