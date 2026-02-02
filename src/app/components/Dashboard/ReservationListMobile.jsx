import { Box } from "@mui/material";
import ReservationCard from "./ReservationCard";

export default function ReservationListMobile({
  reservations,
  favorites,
  onToggleFavorite,
  onManage,
  onPrint,
  onDelete,
  selectedIds,
  onToggleSelect,
}) {
  return (
    <Box display="flex" flexDirection="column" gap={2}>
      {reservations.map((r) => (
        <ReservationCard
          key={r.id}
          reservation={r}
          favorite={favorites.includes(r.id)}
          onFavorite={() => onToggleFavorite(r.id)}
          onPrint={() => onPrint(r)}
          onManage={(e) => onManage(e, r)}
          onDelete={() => onDelete(r)}
          selectable
          selected={selectedIds.includes(r.id)}
          onSelect={() => onToggleSelect(r.id)}
        />
      ))}
    </Box>
  );
}
