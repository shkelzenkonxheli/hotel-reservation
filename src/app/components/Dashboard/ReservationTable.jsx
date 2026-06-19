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
  onOpenStatusMenu,
  onOpenPaymentMenu,
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
      <table className="admin-table min-w-[920px]" style={{ tableLayout: "fixed" }}>
        <colgroup>
          <col style={{ width: "52px" }} />
          <col style={{ width: "92px" }} />
          <col style={{ width: "208px" }} />
          <col style={{ width: "164px" }} />
          <col style={{ width: "150px" }} />
          <col style={{ width: "132px" }} />
          <col style={{ width: "132px" }} />
          <col style={{ width: "120px" }} />
          <col style={{ width: "88px" }} />
        </colgroup>
        <thead>
          <tr>
            <th className="px-4 py-3 text-center whitespace-nowrap text-xs align-middle">
              <Checkbox
                size="small"
                checked={allSelected}
                onChange={(e) => onSelectAll(e.target.checked)}
                inputProps={{ "aria-label": t("selectAll") }}
              />
            </th>
            <th className="px-4 py-3 text-center whitespace-nowrap text-xs align-middle">
              <div className="flex w-full justify-center">{t("pinned")}</div>
            </th>
            <th className="px-4 py-3 text-left whitespace-nowrap text-xs align-middle">
              <div className="w-full text-left">{t("guest")}</div>
            </th>
            <th className="px-3 py-3 text-left whitespace-nowrap text-xs align-middle">
              <div className="w-full text-left">{t("room")}</div>
            </th>
            <th className="px-4 py-3 text-center whitespace-nowrap text-xs align-middle">
              <div className="flex w-full justify-center">{t("stay")}</div>
            </th>
            <th className="px-4 py-3 text-center whitespace-nowrap text-xs align-middle">
              <div className="flex w-full justify-center">{t("status")}</div>
            </th>
            <th className="px-4 py-3 text-center whitespace-nowrap text-xs align-middle">
              <div className="flex w-full justify-center">{t("payment")}</div>
            </th>
            <th className="px-4 py-3 text-center whitespace-nowrap text-xs align-middle">
              <div className="flex w-full justify-center">{t("total")}</div>
            </th>
            <th className="px-4 py-3 text-center whitespace-nowrap text-xs align-middle">
              <div className="flex w-full justify-center">{t("actions")}</div>
            </th>
          </tr>
        </thead>

        <tbody>
          {reservations.map((r) => {
            const bookingState = getBookingState(r);
            const rowStyle =
              bookingState === "CANCELLED"
              ? {
                    backgroundColor: "#fff1f2",
                    boxShadow: "inset 4px 0 0 #e11d48",
                  }
                : bookingState === "FINISHED"
                  ? {
                      backgroundColor: "#fff7d6",
                      boxShadow: "inset 4px 0 0 #d97706",
                    }
                  : {
                      backgroundColor: "#eef6ff",
                      boxShadow: "inset 4px 0 0 #2563eb",
                    };
            return (
              <tr key={r.id} style={rowStyle}>
                <td className="px-4 py-3 text-center align-middle">
                  <Checkbox
                    size="small"
                    checked={selectedIds.includes(r.id)}
                    onChange={() => onToggleSelect(r.id)}
                    inputProps={{ "aria-label": t("selectOne") }}
                  />
                </td>
                <td className="px-4 py-3 text-center align-middle">
                  <IconButton onClick={() => onToggleFavorite(r.id)}>
                    {favorites.includes(r.id) ? (
                      <Star color="warning" />
                    ) : (
                      <StarBorder />
                    )}
                  </IconButton>
                </td>
                <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap align-middle">
                  <div className="w-full text-left">{r.full_name || "-"}</div>
                </td>

                <td className="px-3 py-3 align-middle">
                  <div className="flex w-full flex-col text-left">
                    <span className="text-sm font-semibold text-slate-800">
                      {r.rooms?.type || "-"}
                    </span>
                    <span className="text-xs text-slate-500">
                      #{r.rooms?.room_number || "-"}
                    </span>
                  </div>
                </td>

                <td className="px-4 py-3 text-center align-middle">
                  <Box display="flex" flexDirection="column" gap={0.75} alignItems="center">
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

                <td className="px-4 py-3 text-center align-middle">
                  <div className="flex w-full justify-center">
                    <button
                      type="button"
                      className="inline-flex rounded-full"
                      onClick={(e) => onOpenStatusMenu?.(e, r)}
                    >
                      {getStatusChip(r.status, true)}
                    </button>
                  </div>
                </td>

                <td className="px-4 py-3 text-center align-middle">
                  <div className="flex w-full justify-center">
                    <button
                      type="button"
                      className="inline-flex rounded-full"
                      onClick={(e) => onOpenPaymentMenu?.(e, r)}
                    >
                      {getPaymentChip(r, true)}
                    </button>
                  </div>
                </td>

                <td className="px-4 py-3 text-center font-semibold text-slate-900 align-middle whitespace-nowrap">
                  <div className="w-full text-center">
                    EUR {Number(r.total_price ?? 0).toFixed(2)}
                  </div>
                </td>

                <td className="px-4 py-3 text-center align-middle">
                  <div className="flex w-full items-center justify-center gap-1">
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

