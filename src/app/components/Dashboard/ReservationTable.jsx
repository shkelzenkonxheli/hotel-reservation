import { Box, Chip, IconButton, Tooltip, Checkbox } from "@mui/material";
import { useTranslations } from "next-intl";
import {
  MoreVert,
  Delete,
  BookOnline,
  Star,
  StarBorder,
  Print as PrintIcon,
} from "@mui/icons-material";

export default function ReservationTable({
  reservations,
  favorites,
  onToggleFavorite,
  onOpenDetails,
  onManage,
  onPrint,
  onDelete,
  getStatusChip,
  getBookingState,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  allSelected,
}) {
  const t = useTranslations("dashboard.reservations.table");
  return (
    <div className="overflow-x-auto admin-card">
      <table className="admin-table min-w-[900px]">
        <thead>
          <tr>
            <th className="px-2 py-2 text-center whitespace-nowrap text-xs">
              <Checkbox
                size="small"
                checked={allSelected}
                onChange={(e) => onSelectAll(e.target.checked)}
                inputProps={{ "aria-label": t("selectAll") }}
              />
            </th>
            <th className="px-2 py-2 text-center whitespace-nowrap text-xs">{t("pinned")}</th>
            <th className="px-2 py-2 text-left whitespace-nowrap text-xs">{t("code")}</th>
            <th className="px-2 py-2 text-left whitespace-nowrap text-xs">{t("guest")}</th>
            <th className="px-2 py-2 text-left whitespace-nowrap text-xs">{t("room")}</th>
            <th className="px-2 py-2 text-center whitespace-nowrap text-xs">{t("stay")}</th>
            <th className="px-2 py-2 text-center whitespace-nowrap text-xs">{t("status")}</th>
            <th className="px-2 py-2 text-center whitespace-nowrap text-xs">{t("total")}</th>
            <th className="px-2 py-2 text-center whitespace-nowrap text-xs">{t("actions")}</th>
          </tr>
        </thead>

        <tbody>
          {reservations.map((r) => {
            const bookingState = getBookingState(r);
            const rowBg =
              bookingState === "CANCELLED"
                ? "#fee2e2"
                : bookingState === "FINISHED"
                  ? "#fef9c3"
                  : "#dcfce7";
            return (
              <tr key={r.id} style={{ backgroundColor: rowBg }}>
                <td className="px-2 py-2 text-center">
                  <Checkbox
                    size="small"
                    checked={selectedIds.includes(r.id)}
                    onChange={() => onToggleSelect(r.id)}
                    inputProps={{ "aria-label": t("selectOne") }}
                  />
                </td>
                <td className="px-2 py-2 text-center">
                  <IconButton onClick={() => onToggleFavorite(r.id)}>
                    {favorites.includes(r.id) ? (
                      <Star color="warning" />
                    ) : (
                      <StarBorder />
                    )}
                  </IconButton>
                </td>
                <td className="px-2 py-2 font-mono text-sm text-gray-700 whitespace-nowrap">
                  {r.reservation_code || "-"}
                </td>

                <td className="px-2 py-2 font-medium text-gray-800 whitespace-nowrap">
                  {r.full_name || "-"}
                </td>

                <td className="px-2 py-2">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-600">
                      #{r.rooms?.room_number || "-"} {r.rooms?.type || "-"}
                    </span>
                  </div>
                </td>

                <td className="px-2 py-2 text-center">
                  <Box display="flex" flexDirection="column" gap={0.5}>
                    <Chip
                      size="small"
                      label={`${t("checkIn")}: ${new Date(r.start_date).toLocaleDateString()}`}
                      sx={{ background: "#ecfeff", color: "#155e75" }}
                    />
                    <Chip
                      size="small"
                      label={`${t("checkOut")}: ${new Date(r.end_date).toLocaleDateString()}`}
                      sx={{ background: "#fff7ed", color: "#9a3412" }}
                    />
                  </Box>
                </td>

                <td className="px-2 py-2 text-center">{getStatusChip(r.status)}</td>

                <td className="px-2 py-2 text-center font-semibold">
                  {Number(r.total_price ?? 0).toFixed(2)}
                </td>

                <td className="px-2 py-2 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Tooltip title={t("tooltips.viewDetails")}>
                      <IconButton size="small" onClick={() => onOpenDetails(r)}>
                        <BookOnline />
                      </IconButton>
                    </Tooltip>

                    <IconButton size="small" onClick={(e) => onManage(e, r)}>
                      <MoreVert />
                    </IconButton>

                    <Tooltip title={t("tooltips.printReceipt")}>
                      <IconButton size="small" onClick={() => onPrint(r)}>
                        <PrintIcon />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title={t("tooltips.deleteReservation")}>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => onDelete(r)}
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

