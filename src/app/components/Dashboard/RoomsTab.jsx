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
import { CleaningServices, Close, MeetingRoom } from "@mui/icons-material";
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

  async function handleCleanRoom(room_id) {
    if (!confirm(t("messages.confirmClean"))) return;

    const res = await fetch("/api/rooms", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room_id, action: "CLEAN" }),
    });

    if (res.ok) {
      await fetchRooms();
      setSelectedRoom(null);
      notify(t("messages.cleaned"));
    } else {
      const e = await res.json();
      notify(e.error || t("messages.cleanError"), "error");
    }
  }
  async function handleRoomStatus(room_id) {
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
    if (filter === "needs_cleaning")
      return r.current_status === "needs_cleaning";
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
      case "needs_cleaning":
        return "#facc15"; // yellow
      default:
        return "#9ca3af"; // gray
    }
  };
  const countByStatus = (list) => {
    const booked = list.filter((r) => r.current_status === "booked").length;
    const available = list.filter(
      (r) => r.current_status === "available",
    ).length;
    const needsCleaning = list.filter(
      (r) => r.current_status === "needs_cleaning",
    ).length;
    const outOfOrder = list.filter(
      (r) => r.current_status === "out_of_order",
    ).length;

    return { booked, available, needsCleaning, outOfOrder, total: list.length };
  };

  const apartmentsCount = countByStatus(apartments);
  const hotelRoomsCount = countByStatus(hotelRooms);
  const totalCount = countByStatus(filteredRooms);

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

            <Chip
              label={t("filters.needsCleaning")}
              clickable
              onClick={() => setFilter("needs_cleaning")}
              sx={{
                bgcolor:
                  filter === "needs_cleaning" ? "#fef9c3" : "transparent",
                color: "#a16207",
                borderColor: "#facc15",
              }}
              variant={filter === "needs_cleaning" ? "filled" : "outlined"}
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
        >
          <DialogTitle
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "space-between",
              alignItems: { xs: "stretch", sm: "center" },
              gap: 1.2,
              pr: 6, // i jep hapÃ«sirÃ« qÃ« X tÃ« mos afrohet te butoni
              position: "relative",
            }}
          >
            {/* TITULLI */}
            <Typography variant="h6" component="div" fontWeight="bold">
              {t("dialog.roomTitle", { room: selectedRoom.room.room_number })}
            </Typography>

            {/* BUTONI OUT OF ORDER */}
            <Button
              variant="outlined"
              onClick={() => handleRoomStatus(selectedRoom.room.id)}
              sx={{
                borderColor:
                  selectedRoom.room.current_status === "out_of_order"
                    ? "#22c55e"
                    : "#f87171",
                color:
                  selectedRoom.room.current_status === "out_of_order"
                    ? "#16a34a"
                    : "#dc2626",
                textTransform: "none",
                borderRadius: 2,
                px: 2,
                py: 0.5,
                fontWeight: "600",
                width: { xs: "100%", sm: "auto" },
                "&:hover": {
                  borderColor:
                    selectedRoom.room.current_status === "out_of_order"
                      ? "#16a34a"
                      : "#b91c1c",
                  bgcolor: "transparent",
                },
              }}
            >
              {selectedRoom.room.current_status === "out_of_order"
                ? t("dialog.markAvailable")
                : t("dialog.outOfOrder")}
            </Button>

            {/* CLOSE BUTTON */}
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
          <DialogContent dividers>
            {selectedRoom.reservation ? (
              <>
                <Typography>
                  <strong>{t("dialog.fields.guest")}:</strong>{" "}
                  {selectedRoom.reservation.full_name}
                </Typography>
                <Typography>
                  <strong>{t("dialog.fields.phone")}:</strong>{" "}
                  {selectedRoom.reservation.phone}
                </Typography>
                <Typography>
                  <strong>{t("dialog.fields.checkIn")}:</strong>{" "}
                  {new Date(
                    selectedRoom.reservation.start_date,
                  ).toLocaleDateString()}
                </Typography>
                <Typography>
                  <strong>{t("dialog.fields.checkOut")}:</strong>{" "}
                  {new Date(
                    selectedRoom.reservation.end_date,
                  ).toLocaleDateString()}
                </Typography>

                <Box display="flex" alignItems="center" gap={1} mt={1}>
                  <Typography fontWeight="bold">
                    {t("dialog.fields.status")}:
                  </Typography>
                  <Chip
                    label={selectedRoom.reservation.status}
                    color="warning"
                    size="small"
                  />
                </Box>

                <Typography variant="h6" mt={2}>
                  {t("dialog.fields.total")}:{" "}
                  {selectedRoom.reservation.total_price} €
                </Typography>
              </>
            ) : (
              <Typography color="text.secondary">
                {t("dialog.noActiveReservation")}
              </Typography>
            )}

            {selectedRoom.room.current_status === "needs_cleaning" && (
              <Box textAlign="center" mt={3}>
                <Button
                  variant="contained"
                  startIcon={<CleaningServices />}
                  onClick={() => handleCleanRoom(selectedRoom.room.id)}
                  sx={{
                    bgcolor: "#facc15",
                    color: "black",
                    "&:hover": { bgcolor: "#eab308" },
                  }}
                >
                  {t("dialog.cleanRoom")}
                </Button>
              </Box>
            )}

            {/* Button pÃ«r tÃ« shfaqur/fshirÃ« calendarin */}
            <Box mt={3}>
              <Button
                variant="outlined"
                onClick={() => setShowCalendar((prev) => !prev)}
              >
                {showCalendar ? t("dialog.hideCalendar") : t("dialog.showCalendar")}
              </Button>
            </Box>

            {/* Calendar opcional â€“ pÃ«r TÃ‹ GJITHA dhomat */}
            {showCalendar && (
              <Box mt={2} sx={{ overflowX: "auto" }}>
                <Calendar tileClassName={tileClassName} />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedRoom(null)}>{t("dialog.close")}</Button>
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

