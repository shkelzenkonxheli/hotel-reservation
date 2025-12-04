"use client";

import { useState, useEffect } from "react";
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
} from "@mui/material";
import { CleaningServices, Close, MeetingRoom } from "@mui/icons-material";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

export default function RoomsTab() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [filter, setFilter] = useState("all");
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    fetchRooms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  async function fetchRooms() {
    try {
      setLoading(true);
      const res = await fetch(`/api/rooms?include=true&date=${selectedDate}`);
      const data = await res.json();
      setRooms(data);
      console.log("📦 Rooms received:", data);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCleanRoom(room_id) {
    if (!confirm("Mark this room as cleaned?")) return;

    try {
      const res = await fetch("/api/rooms", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room_id }),
      });
      if (res.ok) {
        fetchRooms();
        setSelectedRoom(null);
      } else {
        alert("Error cleaning room");
      }
    } catch (err) {
      console.error(err);
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
    r.type.toLowerCase().includes("apartment")
  );
  const hotelRooms = filteredRooms.filter((r) =>
    r.type.toLowerCase().includes("hotel")
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

  // Ngjyros ditët e rezervuara në calendar
  function tileClassName({ date, view }) {
    if (!selectedRoom || view !== "month") return "";

    const reservations = selectedRoom.room.reservations || [];

    // Normalizo today
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Normalizo ditën e qelizës
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    // Past dates (para dites se sotme)
    if (d < today) return "";

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
        start.getDate()
      );
      const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());

      // 1️⃣ BOOKED: d falls inside (start ≤ d < end)
      if (d >= startDay && d < endDay) {
        isBooked = true;
        break;
      }

      // 2️⃣ Check-out day (d == end)
      if (d.getTime() === endDay.getTime()) {
        isCheckout = true;
      }

      // 3️⃣ Check-in day (d == start)
      if (d.getTime() === startDay.getTime()) {
        isCheckin = true;
      }
    }

    // 🟥 if this date is check-out & check-in at the same date → it's ACTUALLY booked
    if (isCheckout && isCheckin) {
      return "booked-day";
    }

    // 🟥 Booked
    if (isBooked) return "booked-day";

    // 🟣 Checkout day (only if NOT booked and NOT check-in)
    if (isCheckout) return "checkout-day";

    // 🟢 Otherwise → free & future
    return "available-day";
  }

  if (loading)
    return (
      <Box className="flex justify-center items-center h-64">
        <CircularProgress />
      </Box>
    );

  return (
    <Box className="p-6">
      {/* Header */}
      <Box className="flex justify-between items-center mb-6">
        <Typography variant="h5" fontWeight="bold" color="text.primary">
          🏨 Rooms Overview
        </Typography>

        <Box className="flex items-center gap-3 text-sm">
          <Chip
            label="Available"
            sx={{ bgcolor: "#dcfce7", color: "#166534" }}
          />
          <Chip label="Booked" sx={{ bgcolor: "#fee2e2", color: "#b91c1c" }} />
          <Chip
            label="Needs Cleaning"
            sx={{ bgcolor: "#fef9c3", color: "#a16207" }}
          />
        </Box>
      </Box>

      {/* Filters */}
      <Box className="flex flex-col sm:flex-row gap-4 mb-6">
        <TextField
          label="Select Date"
          type="date"
          size="small"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="Filter"
          size="small"
          select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="available">Available</MenuItem>
          <MenuItem value="booked">Booked</MenuItem>
          <MenuItem value="needs_cleaning">Needs Cleaning</MenuItem>
        </TextField>
      </Box>

      <Grid container spacing={4}>
        {/* 🏢 Apartments */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
            <Typography
              variant="h6"
              align="center"
              fontWeight="bold"
              mb={2}
              color="text.primary"
            >
              🏢 Apartments
            </Typography>

            <Grid container spacing={2}>
              {apartments.map((room) => (
                <Grid item xs={3} key={room.id}>
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
          </Paper>
        </Grid>

        {/* 🏨 Hotel Rooms */}
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
            <Typography
              variant="h6"
              align="center"
              fontWeight="bold"
              mb={2}
              color="text.primary"
            >
              🏨 Hotel Rooms
            </Typography>

            <Grid container spacing={2}>
              {hotelRooms.map((room) => (
                <Grid item xs={3} key={room.id}>
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
          </Paper>
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
          <DialogTitle>
            Room {selectedRoom.room.room_number}
            <Button
              onClick={() => setSelectedRoom(null)}
              sx={{
                position: "absolute",
                right: 10,
                top: 10,
                color: "gray.500",
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
                  <strong>Guest:</strong> {selectedRoom.reservation.full_name}
                </Typography>
                <Typography>
                  <strong>Phone:</strong> {selectedRoom.reservation.phone}
                </Typography>
                <Typography>
                  <strong>Check-in:</strong>{" "}
                  {new Date(
                    selectedRoom.reservation.start_date
                  ).toLocaleDateString()}
                </Typography>
                <Typography>
                  <strong>Check-out:</strong>{" "}
                  {new Date(
                    selectedRoom.reservation.end_date
                  ).toLocaleDateString()}
                </Typography>

                <Box display="flex" alignItems="center" gap={1} mt={1}>
                  <Typography fontWeight="bold">Status:</Typography>
                  <Chip
                    label={selectedRoom.reservation.status}
                    color="warning"
                    size="small"
                  />
                </Box>

                <Typography variant="h6" mt={2}>
                  💰 Total: {selectedRoom.reservation.total_price} €
                </Typography>
              </>
            ) : (
              <Typography color="text.secondary">
                No active reservation.
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
                  Clean Room
                </Button>
              </Box>
            )}

            {/* Button për të shfaqur/fshirë calendarin */}
            <Box mt={3}>
              <Button
                variant="outlined"
                onClick={() => setShowCalendar((prev) => !prev)}
              >
                {showCalendar ? "Hide Calendar" : "Show Calendar"}
              </Button>
            </Box>

            {/* Calendar opcional – për TË GJITHA dhomat */}
            {showCalendar && (
              <Box mt={2}>
                <Calendar tileClassName={tileClassName} />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedRoom(null)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}
