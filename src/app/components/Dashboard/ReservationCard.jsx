import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  IconButton,
  Divider,
  Checkbox,
} from "@mui/material";
import { useTranslations } from "next-intl";
import { MoreVert, Star, StarBorder } from "@mui/icons-material";

export default function ReservationCard({
  reservation,
  favorite,
  onFavorite,
  onManage,
  selectable = false,
  selected = false,
  onSelect,
  getPaymentChip,
}) {
  const t = useTranslations("dashboard.reservations");
  const status = String(reservation?.status || "").toLowerCase();
  const isCancelled = Boolean(reservation?.cancelled_at) || status === "cancelled";
  const isCompletedByStatus = status === "completed";
  const localizedStatus =
    status === "pending" ||
    status === "confirmed" ||
    status === "completed" ||
    status === "cancelled"
      ? t(`statuses.${status}`)
      : reservation.status;

  const toLocalYmd = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0",
    )}-${String(date.getDate()).padStart(2, "0")}`;

  const extractYmd = (value) => {
    const datePart = String(value || "").slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
      return datePart;
    }
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return toLocalYmd(d);
  };

  const todayYmd = toLocalYmd(new Date());
  const endYmd = extractYmd(reservation?.end_date);
  const isFinishedByDate = Boolean(endYmd) && endYmd <= todayYmd;
  const bookingState = isCancelled
    ? "CANCELLED"
    : isCompletedByStatus || isFinishedByDate
      ? "FINISHED"
      : "ACTIVE";

  return (
    <Card
      sx={{
        borderRadius: 3,
        boxShadow: 1,
        bgcolor:
          bookingState === "CANCELLED"
            ? "#fee2e2"
            : bookingState === "FINISHED"
              ? "#fef9c3"
              : "#dcfce7",
        border: "1px solid var(--admin-border)",
      }}
    >
      <CardContent sx={{ p: 2.25, "&:last-child": { pb: 2.25 } }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1.5}>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography fontWeight={700} fontSize="1rem" lineHeight={1.25} noWrap>
              {reservation.full_name}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 0.35 }}
              noWrap
            >
              {reservation.users?.email}
            </Typography>
          </Box>

          <Box display="flex" alignItems="center" gap={0.25} flexShrink={0}>
            {selectable ? (
              <Checkbox
                size="small"
                checked={selected}
                onChange={(e) => onSelect?.(e.target.checked)}
                inputProps={{ "aria-label": t("table.selectOne") }}
              />
            ) : null}
            <IconButton size="small" onClick={onFavorite}>
              {favorite ? <Star color="warning" /> : <StarBorder />}
            </IconButton>
            <IconButton size="small" onClick={onManage}>
              <MoreVert />
            </IconButton>
          </Box>
        </Box>

        <Divider sx={{ my: 1.5 }} />

        <Typography
          fontWeight={700}
          fontSize="0.98rem"
          lineHeight={1.25}
          sx={{ mb: 1.1 }}
        >
          {reservation.rooms?.type || reservation.rooms?.name || t("table.room")}
          {reservation.rooms?.room_number ? `  #${reservation.rooms.room_number}` : ""}
        </Typography>

        <Box display="flex" gap={0.9} flexWrap="wrap" alignItems="center">
          <Chip
            label={localizedStatus}
            size="small"
            sx={{
              background:
                reservation.status === "confirmed"
                  ? "#dbeafe"
                  : reservation.status === "completed"
                    ? "#dcfce7"
                    : reservation.status === "cancelled"
                      ? "#fee2e2"
                      : "#fef9c3",
              fontWeight: 700,
            }}
          />
          {getPaymentChip?.(reservation)}
        </Box>

        <Box
          mt={1.35}
          display="grid"
          gridTemplateColumns="repeat(2, minmax(0, 1fr))"
          gap={1}
        >
          <Box
            sx={{
              minWidth: 0,
              px: 1.15,
              py: 0.95,
              borderRadius: 2,
              backgroundColor: "#ecfeff",
            }}
          >
            <Typography variant="caption" sx={{ color: "#0f766e", fontWeight: 700 }}>
              {t("table.checkIn")}
            </Typography>
            <Typography fontWeight={600} fontSize="0.9rem" color="#164e63" noWrap>
              {new Date(reservation.start_date).toLocaleDateString()}
            </Typography>
          </Box>
          <Box
            sx={{
              minWidth: 0,
              px: 1.15,
              py: 0.95,
              borderRadius: 2,
              backgroundColor: "#fff7ed",
            }}
          >
            <Typography variant="caption" sx={{ color: "#c2410c", fontWeight: 700 }}>
              {t("table.checkOut")}
            </Typography>
            <Typography fontWeight={600} fontSize="0.9rem" color="#9a3412" noWrap>
              {new Date(reservation.end_date).toLocaleDateString()}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
