import { Box } from "@mui/material";
import ReservationCard from "./ReservationCard";

export default function ReservationListMobile({
  reservations,
  favorites,
  onToggleFavorite,
  onManage,
  selectedIds,
  onToggleSelect,
  getStatusChip,
  getPaymentChip,
  onOpenStatusMenu,
  onOpenPaymentMenu,
}) {
  return (
    <Box display="flex" flexDirection="column" gap={2}>
      {reservations.map((r) => (
        <ReservationCard
          key={r.id}
          reservation={r}
          favorite={favorites.includes(r.id)}
          onFavorite={() => onToggleFavorite(r.id)}
          onManage={(e) => onManage(e, r)}
          selectable
          selected={selectedIds.includes(r.id)}
          onSelect={() => onToggleSelect(r.id)}
          getStatusChip={getStatusChip}
          getPaymentChip={getPaymentChip}
          onOpenStatusMenu={onOpenStatusMenu}
          onOpenPaymentMenu={onOpenPaymentMenu}
        />
      ))}
    </Box>
  );
}
