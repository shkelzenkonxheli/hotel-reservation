import {
  Card,
  CardContent,
  Typography,
  Chip,
  Box,
  IconButton,
} from "@mui/material";
import { MoreVert, Star, StarBorder, Print } from "@mui/icons-material";

export default function ReservationCard({
  reservation,
  favorite,
  onFavorite,
  onManage,
  onPrint,
}) {
  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between">
          <Typography fontWeight={600}>{reservation.full_name}</Typography>
          <IconButton onClick={onFavorite}>
            {favorite ? <Star color="warning" /> : <StarBorder />}
          </IconButton>
        </Box>

        <Typography variant="caption" color="text.secondary">
          {reservation.users?.email}
        </Typography>

        <Box mt={1}>
          <Chip label={reservation.rooms?.name} size="small" />
          <Chip label={reservation.status} size="small" sx={{ ml: 1 }} />
        </Box>

        <Box display="flex" justifyContent="flex-end" mt={2}>
          <IconButton onClick={onPrint}>
            <Print />
          </IconButton>
          <IconButton onClick={onManage}>
            <MoreVert />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );
}
