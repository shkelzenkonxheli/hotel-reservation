import { Box, Chip, IconButton, Tooltip, Checkbox } from "@mui/material";
import { useTranslations } from "next-intl";
import {
  MoreVert,
  BookOnline,
  Star,
  StarBorder,
} from "@mui/icons-material";

export default function ReservationTable({
  reservations,
  favorites,
  onToggleFavorite,
  onOpenDetails,
  onManage,
  getStatusChip,
  getPaymentChip,
  getBookingState,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  allSelected,
}) {
  const t = useTranslations("dashboard.reservations.table");
  const formatShortDate = (value) =>
    new Date(value).toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
    });

  return (
    <div className="overflow-x-auto admin-card">
      <table className="admin-table min-w-[820px]">
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
            <th className="px-2 py-2 text-left whitespace-nowrap text-xs">{t("guest")}</th>
            <th className="px-2 py-2 text-left whitespace-nowrap text-xs">{t("room")}</th>
            <th className="px-2 py-2 text-center whitespace-nowrap text-xs">{t("stay")}</th>
            <th className="px-2 py-2 text-center whitespace-nowrap text-xs">{t("status")}</th>
            <th className="px-2 py-2 text-center whitespace-nowrap text-xs">{t("payment")}</th>
            <th className="px-2 py-2 text-center whitespace-nowrap text-xs">{t("total")}</th>
            <th className="px-2 py-2 text-center whitespace-nowrap text-xs">{t("actions")}</th>
          </tr>
        </thead>

        <tbody>
          {reservations.map((r) => {
            const bookingState = getBookingState(r);
            const rowStyle =
              bookingState === "CANCELLED"
                ? {
                    backgroundColor: "#ffe4e6",
                    boxShadow: "inset 4px 0 0 #e11d48",
                  }
                : bookingState === "FINISHED"
                  ? {
                      backgroundColor: "#fef3c7",
                      boxShadow: "inset 4px 0 0 #d97706",
                    }
                  : {
                      backgroundColor: "#e6f4ff",
                      boxShadow: "inset 4px 0 0 #2563eb",
                    };
            return (
              <tr key={r.id} style={rowStyle}>
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
                <td className="px-3 py-2.5 font-medium text-gray-800 whitespace-nowrap align-middle">
                  {r.full_name || "-"}
                </td>

                <td className="px-3 py-2.5 align-middle">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-slate-800">
                      {r.rooms?.type || "-"}
                    </span>
                    <span className="text-xs text-slate-500">
                      #{r.rooms?.room_number || "-"}
                    </span>
                  </div>
                </td>

                <td className="px-3 py-2.5 text-center align-middle">
                  <Box display="flex" flexDirection="column" gap={0.75}>
                    <Chip
                      size="small"
                      label={`${t("checkIn")}: ${formatShortDate(r.start_date)}`}
                      sx={{
                        background: "#f8fafc",
                        color: "#334155",
                        fontWeight: 600,
                        border: "1px solid #e2e8f0",
                      }}
                    />
                    <Chip
                      size="small"
                      label={`${t("checkOut")}: ${formatShortDate(r.end_date)}`}
                      sx={{
                        background: "#f8fafc",
                        color: "#334155",
                        fontWeight: 600,
                        border: "1px solid #e2e8f0",
                      }}
                    />
                  </Box>
                </td>

                <td className="px-3 py-2.5 text-center align-middle">{getStatusChip(r.status)}</td>

                <td className="px-3 py-2.5 text-center align-middle">{getPaymentChip(r)}</td>

                <td className="px-3 py-2.5 text-center font-semibold text-slate-900 align-middle">
                  EUR {Number(r.total_price ?? 0).toFixed(2)}
                </td>

                <td className="px-3 py-2.5 text-center align-middle">
                  <div className="flex items-center justify-center gap-1">
                    <Tooltip title={t("tooltips.viewDetails")}>
                      <IconButton size="small" onClick={() => onOpenDetails(r)}>
                        <BookOnline />
                      </IconButton>
                    </Tooltip>

                    <IconButton size="small" onClick={(e) => onManage(e, r)}>
                      <MoreVert />
                    </IconButton>
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

