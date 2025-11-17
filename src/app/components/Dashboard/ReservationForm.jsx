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

export default function ReservationForm({ open, onClose, onSuccess }) {
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
    if (!type || !startDate || !endDate) return;

    const selected = roomTypes.find((r) => r.type === type);
    if (selected) setSelectedRoomPrice(selected.price);

    const nights =
      (new Date(endDate).getTime() - new Date(startDate).getTime()) /
      (1000 * 60 * 60 * 24);

    if (nights > 0 && selected) {
      setTotalPrice((nights * selected.price).toFixed(2));
    }

    // CHECK AVAILABILITY
    async function checkAvailability() {
      const res = await fetch(
        `/api/reservation?room_type=${type}&start_date=${startDate}&end_date=${endDate}`
      );
      const data = await res.json();
      setIsAvailable(data.available);
    }

    checkAvailability();
  }, [type, startDate, endDate, roomTypes]);

  const handleCreate = async () => {
    if (!fullname || !phone || !type || !startDate || !endDate) {
      alert("Please fill all required fields.");
      return;
    }

    if (isAvailable === false) {
      alert("No rooms available for these dates!");
      return;
    }

    const res = await fetch("/api/reservation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: session?.user?.id,
        fullname,
        phone,
        address,
        type,
        guests,
        startDate,
        endDate,
        total_price: totalPrice,
      }),
    });

    if (res.ok) {
      alert("Reservation created successfully!");
      onClose();
      if (onSuccess) onSuccess();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to create reservation.");
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
          Create Reservation
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
          />

          <TextField
            label="Check-out date"
            type="date"
            InputLabelProps={{ shrink: true }}
            fullWidth
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />

          {/* AVAILABILITY STATUS */}
          {isAvailable === true && (
            <Alert severity="success">Room AVAILABLE ✔</Alert>
          )}

          {isAvailable === false && (
            <Alert severity="error">No Rooms Available ❌</Alert>
          )}

          {/* Total Price */}
          <TextField
            label="Total price (€)"
            type="number"
            fullWidth
            value={totalPrice}
            onChange={(e) => setTotalPrice(e.target.value)}
          />

          <Button variant="contained" onClick={handleCreate}>
            Create Reservation
          </Button>
        </Stack>
      </Box>
    </Modal>
  );
}
