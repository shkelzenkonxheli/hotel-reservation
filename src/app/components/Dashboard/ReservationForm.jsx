"use client";

import {
  Box,
  Button,
  Modal,
  TextField,
  MenuItem,
  Typography,
  Stack,
  Alert,
} from "@mui/material";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function ReservationForm({
  open,
  onClose,
  onSuccess,
  mode = "create",
  reservation = null,
}) {
  const { data: session } = useSession();

  const [roomTypes, setRoomTypes] = useState([]);

  const [fullname, setFullname] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [type, setType] = useState("");
  const [guests, setGuests] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [totalPrice, setTotalPrice] = useState("");
  const [isAvailable, setIsAvailable] = useState(null);
  const [selectedRoomPrice, setSelectedRoomPrice] = useState(0);

  useEffect(() => {
    async function loadTypes() {
      const res = await fetch("/api/rooms-type");
      const data = await res.json();
      setRoomTypes(data);
    }
    loadTypes();
  }, []);

  useEffect(() => {
    if (mode === "edit" && reservation) {
      setFullname(reservation.full_name || "");
      setPhone(reservation.phone || "");
      setAddress(reservation.address || "");
      setType(reservation.rooms?.type || "");
      setGuests(reservation.guests || "");
      setStartDate(reservation.start_date?.split("T")[0] || "");
      setEndDate(reservation.end_date?.split("T")[0] || "");
      setTotalPrice(reservation.total_price || "");
    }
  }, [reservation, mode]);
  const resetForm = () => {
    setFullname("");
    setPhone("");
    setAddress("");
    setType("");
    setGuests("");
    setStartDate("");
    setEndDate("");
    setTotalPrice("");
    setIsAvailable(null);
  };

  useEffect(() => {
    if (!type || !startDate || !endDate) return;

    const selected = roomTypes.find((r) => r.type === type);
    if (selected) setSelectedRoomPrice(selected.price);

    const nights =
      (new Date(endDate).getTime() - new Date(startDate).getTime()) /
      (1000 * 60 * 60 * 24);

    if (nights > 0 && selected) {
      setTotalPrice((nights * selected.price).toFixed(2));
    }

    async function checkAvailability() {
      const res = await fetch(
        `/api/reservation?room_type=${type}&start_date=${startDate}&end_date=${endDate}&reservation_id=${
          reservation?.id || ""
        }`
      );
      const data = await res.json();
      setIsAvailable(data.available);
    }

    checkAvailability();
  }, [type, startDate, endDate, roomTypes]);

  const handleSubmit = async () => {
    if (!fullname || !phone || !type || !startDate || !endDate) {
      alert("Please fill all required fields.");
      return;
    }

    if (isAvailable === false) {
      alert("No rooms available for these dates.");
      return;
    }

    const payload = {
      fullname,
      phone,
      address,
      type,
      guests,
      startDate,
      endDate,
      total_price: totalPrice,
    };

    let res;

    if (mode === "create") {
      payload.userId = session.user.id;
      res = await fetch("/api/reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      res = await fetch(`/api/reservation/${reservation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    if (res.ok) {
      await fetch("/api/rooms?include=true");
      if (mode === "create") {
        resetForm();
      }
      onClose();
      if (onSuccess) onSuccess();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to save reservation.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "auto",
        py: 4,
      }}
    >
      <Box
        sx={{
          width: 450,
          bgcolor: "white",
          p: 4,
          borderRadius: 2,
          boxShadow: 10,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <Typography variant="h5" mb={2} fontWeight="bold">
          {mode === "create" ? "Create Reservation" : "Edit Reservation"}
        </Typography>

        <Stack spacing={2}>
          <TextField
            label="Full name (client)"
            fullWidth
            value={fullname}
            onChange={(e) => setFullname(e.target.value)}
          />

          <TextField
            label="Phone number"
            type="number"
            fullWidth
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <TextField
            label="Address"
            fullWidth
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <TextField
            label="Room Type"
            select
            fullWidth
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {roomTypes.map((room, index) => (
              <MenuItem key={index} value={room.type}>
                {room.type} — €{room.price}/night
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Guests"
            type="number"
            fullWidth
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
          />

          <TextField
            label="Check-in date"
            type="date"
            InputLabelProps={{ shrink: true }}
            fullWidth
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            inputProps={{
              min: new Date().toISOString().split("T")[0],
            }}
          />

          <TextField
            label="Check-out date"
            type="date"
            InputLabelProps={{ shrink: true }}
            fullWidth
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            inputProps={{
              min: startDate || new Date().toISOString().split("T")[0],
            }}
          />

          {isAvailable === true && (
            <Alert severity="success">Room AVAILABLE ✔</Alert>
          )}
          {isAvailable === false && (
            <Alert severity="error">No Rooms Available ❌</Alert>
          )}

          <TextField
            label="Total price (€)"
            type="number"
            fullWidth
            value={totalPrice}
            onChange={(e) => setTotalPrice(e.target.value)}
          />

          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={
              isAvailable === false ||
              !fullname ||
              !phone ||
              !type ||
              !startDate ||
              !endDate
            }
          >
            {mode === "create" ? "Create Reservation" : "Save Changes"}
          </Button>
        </Stack>
      </Box>
    </Modal>
  );
}
