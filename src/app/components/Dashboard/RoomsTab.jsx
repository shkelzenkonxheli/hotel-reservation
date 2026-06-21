"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Box,
  Grid,
  Typography,
  CircularProgress,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Chip,
  TextField,
  MenuItem,
  Tooltip,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  Close,
  MeetingRoom,
  PersonOutline,
  LocalPhoneOutlined,
  CalendarMonthOutlined,
  InfoOutlined,
} from "@mui/icons-material";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import PageHeader from "./ui/PageHeader";
import SectionCard from "./ui/SectionCard";
import StatusBadge from "./ui/StatusBadge";

function formatLocalDateInput(date = new Date()) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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
    r.type.toLowerCase().includes("apartment"),
  );
  const hotelRooms = filteredRooms.filter((r) =>
    r.type.toLowerCase().includes("hotel"),
  );

  const getColor = (status) => {
    switch (status) {
      case "booked":
        return "#ef4444"; // red
      case "available":
        return "#22c55e"; // green
      case "out_of_order":
        return "#94a3b8"; // slate
      default:
        return "#9ca3af"; // gray
    }
  };
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
  const totalCount = countByStatus(filteredRooms);
  const isStatusToggleDisabled = Boolean(selectedRoom?.reservation);

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
    <Box className="admin-page">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={
          <Box className="flex items-center gap-2 flex-wrap">
            <StatusBadge
              label={t("badges.booked", { count: totalCount.booked })}
              tone="danger"
            />
            <StatusBadge
              label={t("badges.available", { count: totalCount.available })}
              tone="success"
            />
            <StatusBadge
              label={t("badges.total", { count: totalCount.total })}
              tone="neutral"
            />
          </Box>
        }
      />

      {/* Filters */}
      <SectionCard>
        <Box
          display="flex"
          flexDirection={{ xs: "column", sm: "row" }}
          alignItems={{ sm: "center" }}
          justifyContent="space-between"
          gap={2}
        >
          {/* Date picker */}
          <Box
            display="flex"
            alignItems={{ xs: "stretch", sm: "center" }}
            flexDirection={{ xs: "column", sm: "row" }}
            gap={1.2}
            width={{ xs: "100%", sm: "auto" }}
          >
            <Typography fontWeight="600" color="text.secondary">
              {t("filters.date")}
            </Typography>

            <TextField
              type="date"
              size="small"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{
                minWidth: { xs: "100%", sm: 160 },
                bgcolor: "white",
                borderRadius: 2,
              }}
            />
          </Box>

          {/* Status filter */}
          <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
            <Typography fontWeight="600" color="text.secondary">
              {t("filters.status")}
            </Typography>

            <Chip
              label={t("filters.all")}
              clickable
              onClick={() => setFilter("all")}
              color={filter === "all" ? "primary" : "default"}
              variant={filter === "all" ? "filled" : "outlined"}
            />

            <Chip
              label={t("filters.available")}
              clickable
              onClick={() => setFilter("available")}
              sx={{
                bgcolor: filter === "available" ? "#dcfce7" : "transparent",
                color: "#166534",
                borderColor: "#22c55e",
              }}
              variant={filter === "available" ? "filled" : "outlined"}
            />

            <Chip
              label={t("filters.booked")}
              clickable
              onClick={() => setFilter("booked")}
              sx={{
                bgcolor: filter === "booked" ? "#fee2e2" : "transparent",
                color: "#b91c1c",
                borderColor: "#ef4444",
              }}
              variant={filter === "booked" ? "filled" : "outlined"}
            />

          </Box>
        </Box>
      </SectionCard>

      <Grid container spacing={3}>
        {/* ðŸ¢ Apartments */}
        <Grid item xs={12} md={6}>
          <SectionCard
            title={t("sections.apartments")}
            action={
              <Box
                display="flex"
                gap={1}
                flexWrap="wrap"
                justifyContent="flex-end"
              >
                <StatusBadge
                  label={t("badges.booked", { count: apartmentsCount.booked })}
                  tone="danger"
                />
                <StatusBadge
                  label={t("badges.available", {
                    count: apartmentsCount.available,
                  })}
                  tone="success"
                />
                <StatusBadge
                  label={t("badges.total", { count: apartmentsCount.total })}
                  tone="neutral"
                />
              </Box>
            }
          >
            <Grid container spacing={2}>
              {apartments.map((room) => (
                <Grid item xs={6} sm={4} md={3} key={room.id}>
                  <Tooltip
                    title={`${room.type} | ${room.current_status}`}
                    arrow
                  >
                    <Paper
                      elevation={3}
                      sx={{
                        bgcolor: getColor(room.current_status),
                        color: "white",
                        textAlign: "center",
                        p: 2,
                        fontWeight: "bold",
                        borderRadius: 2,
                        cursor: "pointer",
                        "&:hover": { transform: "scale(1.05)" },
                      }}
                      onClick={() => {
                        setSelectedRoom({
                          room,
                          reservation: room.active_reservation,
                        });
                        setShowCalendar(false); // fillimisht i fshehur
                      }}
                    >
                      <MeetingRoom sx={{ fontSize: 24 }} />
                      <Typography>{room.room_number}</Typography>
                    </Paper>
                  </Tooltip>
                </Grid>
              ))}
            </Grid>
          </SectionCard>
        </Grid>

        {/* ðŸ¨ Hotel Rooms */}
        <Grid item xs={12} md={6}>
          <SectionCard
            title={t("sections.hotelRooms")}
            action={
              <Box
                display="flex"
                gap={1}
                flexWrap="wrap"
                justifyContent="flex-end"
              >
                <StatusBadge
                  label={t("badges.booked", { count: hotelRoomsCount.booked })}
                  tone="danger"
                />
                <StatusBadge
                  label={t("badges.available", {
                    count: hotelRoomsCount.available,
                  })}
                  tone="success"
                />
                <StatusBadge
                  label={t("badges.total", { count: hotelRoomsCount.total })}
                  tone="neutral"
                />
              </Box>
            }
          >
            <Grid container spacing={2}>
              {hotelRooms.map((room) => (
                <Grid item xs={6} sm={4} md={3} key={room.id}>
                  <Tooltip
                    title={`${room.type} | ${room.current_status}`}
                    arrow
                  >
                    <Paper
                      elevation={3}
                      sx={{
                        bgcolor: getColor(room.current_status),
                        color: "white",
                        textAlign: "center",
                        p: 2,
                        fontWeight: "bold",
                        borderRadius: 2,
                        cursor: "pointer",
                        "&:hover": { transform: "scale(1.05)" },
                      }}
                      onClick={() => {
                        setSelectedRoom({
                          room,
                          reservation: room.active_reservation,
                        });
                        setShowCalendar(false);
                      }}
                    >
                      <MeetingRoom sx={{ fontSize: 24 }} />
                      <Typography>{room.room_number}</Typography>
                    </Paper>
                  </Tooltip>
                </Grid>
              ))}
            </Grid>
          </SectionCard>
        </Grid>
      </Grid>

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

