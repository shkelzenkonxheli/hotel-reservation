"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Box,
  Grid,
  Typography,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Chip,
  TextField,
  Tooltip,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  Close,
  PersonOutline,
  LocalPhoneOutlined,
  CalendarMonthOutlined,
  InfoOutlined,
} from "@mui/icons-material";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import EmptyState from "./ui/EmptyState";

function formatLocalDateInput(date = new Date()) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getTypeLabel(type = "") {
  return String(type || "")
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function RoomsTab() {
  const t = useTranslations("dashboard.rooms");
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(formatLocalDateInput());
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [filter, setFilter] = useState("all");
  const [showCalendar, setShowCalendar] = useState(false);
  const [feedback, setFeedback] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const notify = (message, severity = "success") =>
    setFeedback({ open: true, message, severity });

  useEffect(() => {
    fetchRooms();
  }, [selectedDate]);

  async function fetchRooms() {
    try {
      setLoading(true);
      const res = await fetch(`/api/rooms?include=true&date=${selectedDate}`);
      const data = await res.json();
      setRooms(data);
      console.log("ðŸ“¦ Rooms received:", data);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRoomStatus(room_id) {
    if (selectedRoom?.reservation) {
      notify(t("messages.statusBlockedByReservation"), "warning");
      return;
    }

    const res = await fetch("/api/rooms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room_id, action: "TOGGLE_OUT_OF_ORDER" }),
    });

    if (res.ok) {
      fetchRooms();
      setSelectedRoom(null);
      notify(t("messages.statusUpdated"));
    } else {
      const e = await res.json();
      notify(e.error || t("messages.statusError"), "error");
    }
  }

  // Filtrimi sipas statusit
  const filteredRooms = rooms.filter((r) => {
    if (filter === "booked") return r.current_status === "booked";
    if (filter === "available") return r.current_status === "available";
    return true;
  });

  const apartments = filteredRooms.filter((r) =>
    String(r.type || "").toLowerCase().includes("apartment"),
  );
  const hotelRooms = filteredRooms.filter((r) =>
    String(r.type || "").toLowerCase().includes("hotel"),
  );

  const countByStatus = (list) => {
    const booked = list.filter((r) => r.current_status === "booked").length;
    const available = list.filter(
      (r) => r.current_status === "available",
    ).length;
    const outOfOrder = list.filter(
      (r) => r.current_status === "out_of_order",
    ).length;

    return { booked, available, outOfOrder, total: list.length };
  };

  const apartmentsCount = countByStatus(apartments);
  const hotelRoomsCount = countByStatus(hotelRooms);
  const totalCount = countByStatus(rooms);
  const isStatusToggleDisabled = Boolean(selectedRoom?.reservation);
  const occupancyRate = totalCount.total
    ? Math.round((totalCount.booked / totalCount.total) * 100)
    : 0;

  const getStatusClass = (status) => {
    if (status === "booked") return "booked";
    if (status === "out_of_order") return "out-of-order";
    return "available";
  };

  const getStatusLabel = (status) => {
    if (status === "booked") return t("status.booked");
    if (status === "out_of_order") return t("status.outOfOrder");
    return t("status.available");
  };

  const getFloorKey = (roomNumber) => {
    const digits = String(roomNumber || "").replace(/\D/g, "");
    const numericValue = Number.parseInt(digits || "0", 10);

    if (!numericValue || numericValue < 100) return "01";
    if (digits.length >= 4 && digits.startsWith("0")) {
      return digits.slice(0, 2);
    }

    return String(Math.floor(numericValue / 100)).padStart(2, "0");
  };

  const groupRoomsByFloor = (list) => {
    const groups = list.reduce((acc, room) => {
      const floor = getFloorKey(room.room_number);
      if (!acc[floor]) acc[floor] = [];
      acc[floor].push(room);
      return acc;
    }, {});

    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
      .map(([floor, items]) => ({
        floor,
        rooms: items.sort((a, b) =>
          String(a.room_number || "").localeCompare(
            String(b.room_number || ""),
            undefined,
            { numeric: true },
          ),
        ),
      }));
  };

  const renderFilterButton = (value, label) => (
    <Button
      key={value}
      type="button"
      onClick={() => setFilter(value)}
      className={`rooms-filter-chip ${filter === value ? "active" : ""}`}
      disableElevation
    >
      {label}
    </Button>
  );

  const renderCountPill = (label, count, tone) => (
    <span className={`rooms-count-pill ${tone}`}>
      {label}: {count}
    </span>
  );

  const renderRoomTile = (room) => (
    <Tooltip
      key={room.id}
      title={`${getTypeLabel(room.type)} | ${getStatusLabel(room.current_status)}`}
      arrow
    >
      <button
        type="button"
        className={`room-rack-tile ${getStatusClass(room.current_status)}`}
        onClick={() => {
          setSelectedRoom({
            room,
            reservation: room.active_reservation,
          });
          setShowCalendar(false);
        }}
      >
        <span className="room-rack-number">{room.room_number}</span>
        <span className="room-rack-status">
          {getStatusLabel(room.current_status)}
        </span>
      </button>
    </Tooltip>
  );

  const renderFloorGroup = ({ floor, rooms: floorRooms }) => (
    <Box key={floor} className="room-floor-group">
      <Box className="room-floor-heading">
        <Typography component="h3">
          {t("floor.label", { floor })}
        </Typography>
        <span />
        <Typography component="p">
          {t("floor.count", { count: floorRooms.length })}
        </Typography>
      </Box>
      <Box className="room-rack-grid">
        {floorRooms.map((room) => renderRoomTile(room))}
      </Box>
    </Box>
  );

  const renderRoomCollection = (title, list, counts) => (
    <Box className="rooms-collection">
      <Box className="rooms-collection-head">
        <Box>
          <Typography className="rooms-collection-kicker">
            {t("summary.liveStatus")}
          </Typography>
          <Typography component="h2">{title}</Typography>
        </Box>
        <Box className="rooms-collection-pills">
          {renderCountPill(t("summary.booked"), counts.booked, "booked")}
          {renderCountPill(t("summary.available"), counts.available, "available")}
          {renderCountPill(t("summary.total"), counts.total, "neutral")}
        </Box>
      </Box>

      {list.length === 0 ? (
        <EmptyState title={t("empty")} />
      ) : (
        <Box className="rooms-floor-stack">
          {groupRoomsByFloor(list).map((group) => renderFloorGroup(group))}
        </Box>
      )}
    </Box>
  );

  // Ngjyros ditÃ«t e rezervuara nÃ« calendar
  function tileClassName({ date, view }) {
    if (!selectedRoom || view !== "month") return "";

    const reservations = selectedRoom.room.reservations || [];

    // Normalizo today
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Normalizo ditÃ«n e qelizÃ«s
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    // Past dates (para dites se sotme)
    if (d < today) return "";
    if (selectedRoom.room.current_status === "out_of_order") return "";

    let isBooked = false;
    let isCheckout = false;
    let isCheckin = false;

    // Check each reservation
    for (let i = 0; i < reservations.length; i++) {
      const r = reservations[i];

      const start = new Date(r.start_date);
      const end = new Date(r.end_date);

      const startDay = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate(),
      );
      const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());

      // 1ï¸âƒ£ BOOKED: d falls inside (start â‰¤ d < end)
      if (d >= startDay && d < endDay) {
        isBooked = true;
        break;
      }

      // 2ï¸âƒ£ Check-out day (d == end)
      if (d.getTime() === endDay.getTime()) {
        isCheckout = true;
      }

      // 3ï¸âƒ£ Check-in day (d == start)
      if (d.getTime() === startDay.getTime()) {
        isCheckin = true;
      }
    }

    // ðŸŸ¥ if this date is check-out & check-in at the same date â†’ it's ACTUALLY booked
    if (isCheckout && isCheckin) {
      return "booked-day";
    }

    // ðŸŸ¥ Booked
    if (isBooked) return "booked-day";

    // ðŸŸ£ Checkout day (only if NOT booked and NOT check-in)
    if (isCheckout) return "checkout-day";

    // ðŸŸ¢ Otherwise â†’ free & future
    return "available-day";
  }

  if (loading)
    return (
      <Box className="flex justify-center items-center h-64">
        <CircularProgress />
      </Box>
    );

  return (
    <Box className="admin-page rooms-admin-page">
      <Box className="rooms-command-card">
        <Box className="rooms-command-head">
          <Box>
            <Typography className="rooms-kicker">
              {t("summary.liveStatus")}
            </Typography>
            <Typography component="h1" className="rooms-main-title">
              {t("title")}
            </Typography>
            <Typography className="rooms-main-subtitle">
              {t("subtitle")}
            </Typography>
          </Box>
          <Box className="rooms-occupancy-chip">
            <span>{t("summary.occupancy")}</span>
            <strong>{occupancyRate}%</strong>
          </Box>
        </Box>

        <Box className="rooms-stats-grid">
          <Box className="rooms-stat-card booked">
            <Typography component="p">{t("summary.booked")}</Typography>
            <Typography component="strong">{totalCount.booked}</Typography>
          </Box>
          <Box className="rooms-stat-card available">
            <Typography component="p">{t("summary.available")}</Typography>
            <Typography component="strong">{totalCount.available}</Typography>
          </Box>
          <Box className="rooms-stat-card total">
            <Typography component="p">{t("summary.totalCapacity")}</Typography>
            <Typography component="strong">{totalCount.total}</Typography>
          </Box>
        </Box>

        <Box className="rooms-filter-panel">
          <Box className="rooms-date-control">
            <Typography component="label">{t("filters.date")}</Typography>
            <TextField
              type="date"
              size="small"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              className="rooms-date-field"
            />
          </Box>

          <Box className="rooms-status-control">
            <Typography component="span">{t("filters.status")}</Typography>
            <Box className="rooms-filter-buttons">
              {renderFilterButton("all", t("filters.all"))}
              {renderFilterButton("available", t("filters.available"))}
              {renderFilterButton("booked", t("filters.booked"))}
            </Box>
          </Box>
        </Box>
      </Box>

      <Box className="rooms-map-stack">
        {renderRoomCollection(t("sections.apartments"), apartments, apartmentsCount)}
        {renderRoomCollection(t("sections.hotelRooms"), hotelRooms, hotelRoomsCount)}
      </Box>

      {/* Room Details Dialog */}
      {selectedRoom && (
        <Dialog
          open={!!selectedRoom}
          onClose={() => setSelectedRoom(null)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 4,
              overflow: "hidden",
            },
          }}
        >
          <DialogTitle
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 1.5,
              pr: 6,
              position: "relative",
              pb: 2.5,
            }}
          >
            <Box
              sx={{
                width: "100%",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 2,
                pr: 6,
              }}
            >
              <Box>
                <Typography variant="h5" component="div" fontWeight={800}>
                  {t("dialog.roomTitle", {
                    room: selectedRoom.room.room_number,
                  })}
                </Typography>
                {selectedRoom.room.current_status === "out_of_order" ? (
                  <Chip
                    label={t("dialog.outOfOrder")}
                    size="small"
                    sx={{
                      mt: 1,
                      bgcolor: "#fee2e2",
                      color: "#b91c1c",
                      fontWeight: 700,
                      borderRadius: 999,
                    }}
                  />
                ) : null}
              </Box>

              <Tooltip
                title={
                  isStatusToggleDisabled ? t("dialog.statusLockedHint") : ""
                }
                arrow
              >
                <span>
                  <Button
                    variant="outlined"
                    onClick={() => handleRoomStatus(selectedRoom.room.id)}
                    disabled={isStatusToggleDisabled}
                    sx={{
                      mt: 0.25,
                      minWidth: 0,
                      borderColor:
                        selectedRoom.room.current_status === "out_of_order"
                          ? "#22c55e"
                          : "#f59e0b",
                      color:
                        selectedRoom.room.current_status === "out_of_order"
                          ? "#16a34a"
                          : "#b45309",
                      textTransform: "none",
                      borderRadius: 2.5,
                      px: 2,
                      py: 0.75,
                      fontWeight: 700,
                      fontSize: "0.8rem",
                      whiteSpace: "nowrap",
                      "&:hover": {
                        borderColor:
                          selectedRoom.room.current_status === "out_of_order"
                            ? "#16a34a"
                            : "#92400e",
                        bgcolor: "transparent",
                      },
                      "&.Mui-disabled": {
                        borderColor: "#cbd5e1",
                        color: "#94a3b8",
                      },
                    }}
                  >
                    {selectedRoom.room.current_status === "out_of_order"
                      ? t("dialog.markAvailable")
                      : t("dialog.markUnavailable")}
                  </Button>
                </span>
              </Tooltip>
            </Box>

            <Button
              onClick={() => setSelectedRoom(null)}
              sx={{
                position: "absolute",
                right: 8,
                top: 8,
                color: "gray",
                minWidth: "32px",
              }}
            >
              <Close />
            </Button>
          </DialogTitle>

          <Divider />
          <DialogContent dividers sx={{ px: 3, py: 2.5 }}>
            {selectedRoom.reservation ? (
              <Box display="flex" flexDirection="column" gap={2.2}>
                <Box display="flex" alignItems="flex-start" gap={1.25}>
                  <PersonOutline sx={{ color: "#6366f1", mt: "2px" }} />
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ textTransform: "uppercase", letterSpacing: "0.08em" }}
                    >
                      {t("dialog.fields.guest")}
                    </Typography>
                    <Typography fontWeight={600}>
                      {selectedRoom.reservation.full_name}
                    </Typography>
                  </Box>
                </Box>

                <Box display="flex" alignItems="flex-start" gap={1.25}>
                  <LocalPhoneOutlined sx={{ color: "#10b981", mt: "2px" }} />
                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ textTransform: "uppercase", letterSpacing: "0.08em" }}
                    >
                      {t("dialog.fields.phone")}
                    </Typography>
                    <Typography fontWeight={600}>
                      {selectedRoom.reservation.phone}
                    </Typography>
                  </Box>
                </Box>

                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="flex-start" gap={1.25}>
                      <CalendarMonthOutlined
                        sx={{ color: "#8b5cf6", mt: "2px" }}
                      />
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                          }}
                        >
                          {t("dialog.fields.checkIn")}
                        </Typography>
                        <Typography fontWeight={600}>
                          {new Date(
                            selectedRoom.reservation.start_date,
                          ).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box display="flex" alignItems="flex-start" gap={1.25}>
                      <CalendarMonthOutlined
                        sx={{ color: "#3b82f6", mt: "2px" }}
                      />
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                          }}
                        >
                          {t("dialog.fields.checkOut")}
                        </Typography>
                        <Typography fontWeight={600}>
                          {new Date(
                            selectedRoom.reservation.end_date,
                          ).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>

                <Box display="flex" alignItems="center" gap={1}>
                  <InfoOutlined sx={{ color: "#f59e0b", fontSize: 20 }} />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ textTransform: "uppercase", letterSpacing: "0.08em" }}
                  >
                    {t("dialog.fields.status")}:
                  </Typography>
                  <Chip
                    label={selectedRoom.reservation.status}
                    color="warning"
                    size="small"
                    sx={{ fontWeight: 700, textTransform: "capitalize" }}
                  />
                </Box>

                <Divider />

                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  gap={2}
                >
                  <Typography color="text.secondary" fontWeight={500}>
                    {t("dialog.fields.total")}
                  </Typography>
                  <Typography variant="h4" fontWeight={800} color="#0f172a">
                    {selectedRoom.reservation.total_price} €
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Typography color="text.secondary">
                {t("dialog.noActiveReservation")}
              </Typography>
            )}

            {showCalendar && (
              <Box mt={2} sx={{ overflowX: "auto" }}>
                <Calendar tileClassName={tileClassName} />
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5, pt: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setShowCalendar((prev) => !prev)}
              sx={{
                textTransform: "none",
                borderRadius: 2.5,
                px: 2.2,
                fontWeight: 700,
              }}
            >
              {showCalendar ? t("dialog.hideCalendar") : t("dialog.showCalendar")}
            </Button>
            <Box sx={{ flexGrow: 1 }} />
            <Button
              variant="contained"
              onClick={() => setSelectedRoom(null)}
              sx={{
                textTransform: "none",
                borderRadius: 2.5,
                px: 3,
                fontWeight: 700,
                bgcolor: "#0f172a",
                "&:hover": { bgcolor: "#111827" },
              }}
            >
              {t("dialog.close")}
            </Button>
          </DialogActions>
        </Dialog>
      )}
      <Snackbar
        open={feedback.open}
        autoHideDuration={3500}
        onClose={() => setFeedback((f) => ({ ...f, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          severity={feedback.severity}
          variant="filled"
          onClose={() => setFeedback((f) => ({ ...f, open: false }))}
        >
          {feedback.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

