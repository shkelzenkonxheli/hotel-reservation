import { Box, Chip, IconButton, Tooltip, Checkbox } from "@mui/material";
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
  return (
    <div className="overflow-x-auto admin-card">
      <table className="admin-table min-w-[980px]">
        <thead>
          <tr>
            <th className="p-3 text-center">
              <Checkbox
                size="small"
                checked={allSelected}
                onChange={(e) => onSelectAll(e.target.checked)}
                inputProps={{ "aria-label": "select all reservations" }}
              />
            </th>
            <th className="p-3 text-center">Pin</th>
            <th className="p-3 text-left">Code</th>
            <th className="p-3 text-left">Guest</th>
            <th className="p-3 text-left">Room</th>
            <th className="p-3 text-center">Dates</th>
            <th className="p-3 text-center">Status</th>
            <th className="p-3 text-center">Total</th>
            <th className="p-3 text-center">Invoice</th>
            <th className="p-3 text-center">Actions</th>
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
                <td className="p-3 text-center">
                  <Checkbox
                    size="small"
                    checked={selectedIds.includes(r.id)}
                    onChange={() => onToggleSelect(r.id)}
                    inputProps={{ "aria-label": "select reservation" }}
                  />
                </td>
                <td className="p-3 text-center">
                  <IconButton onClick={() => onToggleFavorite(r.id)}>
                    {favorites.includes(r.id) ? (
                      <Star color="warning" />
                    ) : (
                      <StarBorder />
                    )}
                  </IconButton>
                </td>

                <td className="p-3 font-mono text-sm text-gray-700 whitespace-nowrap">
                  {r.reservation_code || "-"}
                </td>

                <td className="p-3 font-medium text-gray-800 whitespace-nowrap">
                  {r.full_name || "-"}
                </td>

                <td className="p-3">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-600">
                      #{r.rooms?.room_number || "-"} {r.rooms?.type || "-"}
                    </span>
                  </div>
                </td>

                <td className="p-3 text-center">
                  <Box display="flex" flexDirection="column" gap={0.5}>
                    <Chip
                      size="small"
                      label={`IN: ${new Date(r.start_date).toLocaleDateString()}`}
                      sx={{ background: "#ecfeff", color: "#155e75" }}
                    />
                    <Chip
                      size="small"
                      label={`OUT: ${new Date(r.end_date).toLocaleDateString()}`}
                      sx={{ background: "#fff7ed", color: "#9a3412" }}
                    />
                  </Box>
                </td>

                <td className="p-3 text-center">{getStatusChip(r.status)}</td>

                <td className="p-3 text-center font-semibold">
                  {Number(r.total_price ?? 0).toFixed(2)}
                </td>

                <td className="p-3 text-center">
                  {r.invoice_number ? (
                    <Chip
                      label={r.invoice_number}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  ) : (
                    <span className="text-gray-500"></span>
                  )}
                </td>

                <td className="p-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Tooltip title="View details">
                      <IconButton size="small" onClick={() => onOpenDetails(r)}>
                        <BookOnline />
                      </IconButton>
                    </Tooltip>

                    <IconButton size="small" onClick={(e) => onManage(e, r)}>
                      <MoreVert />
                    </IconButton>

                    <Tooltip title="Print receipt">
                      <IconButton size="small" onClick={() => onPrint(r)}>
                        <PrintIcon />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete reservation">
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
