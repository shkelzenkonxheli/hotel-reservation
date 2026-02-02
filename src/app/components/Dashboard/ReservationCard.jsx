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
import { MoreVert, Star, StarBorder, Print, Delete } from "@mui/icons-material";

export default function ReservationCard({
  reservation,
  favorite,
  onFavorite,
  onManage,
  onPrint,
  onDelete,
  selectable = false,
  selected = false,
  onSelect,
}) {
  return (
    <Card sx={{ borderRadius: 3, boxShadow: 2, bgcolor: "#eae1df" }}>
      <CardContent>
        {/* HEADER */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography fontWeight={600}>{reservation.full_name}</Typography>
            <Typography variant="caption" color="text.secondary">
              {reservation.users?.email}
            </Typography>
          </Box>

          <Box display="flex" alignItems="center" gap={0.5}>
            {selectable ? (
              <Checkbox
                size="small"
                checked={selected}
                onChange={(e) => onSelect?.(e.target.checked)}
                inputProps={{ "aria-label": "select reservation" }}
              />
            ) : null}
            <IconButton size="small" onClick={onFavorite}>
              {favorite ? <Star color="warning" /> : <StarBorder />}
            </IconButton>
          </Box>
        </Box>

        <Divider sx={{ my: 1.5 }} />

        {/* ROOM + STATUS */}
        <Box display="flex" gap={1} flexWrap="wrap">
          <Chip label={reservation.rooms?.name} size="small" />
          <Chip
            label={reservation.status}
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
            }}
          />
        </Box>

        {/* DATES */}
        <Box mt={1} display="flex" gap={1}>
          <Chip
            size="small"
            label={`IN: ${new Date(
              reservation.start_date
            ).toLocaleDateString()}`}
            sx={{ background: "#ecfeff", color: "#155e75" }}
          />
          <Chip
            size="small"
            label={`OUT: ${new Date(
              reservation.end_date
            ).toLocaleDateString()}`}
            sx={{ background: "#fff7ed", color: "#9a3412" }}
          />
        </Box>

        {/* ACTIONS */}
        <Box display="flex" justifyContent="flex-end" mt={2}>
          <IconButton size="small" onClick={onPrint}>
            <Print />
          </IconButton>
          <IconButton size="small" onClick={onManage}>
            <MoreVert />
          </IconButton>
          <IconButton size="small" color="error" onClick={onDelete}>
            <Delete />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
}
