"use client";

import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Typography,
  Stack,
  Alert,
  Divider,
  Chip,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  InputAdornment,
  Snackbar,
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
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentStatus, setPaymentStatus] = useState("UNPAID");
  const [feedback, setFeedback] = useState({
    open: false,
    message: "",
    severity: "success",
  });

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
        }`,
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
      payment_method: paymentMethod,
      payment_status: paymentStatus,
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
      setFeedback({
        open: true,
        message:
          mode === "create"
            ? "Reservation created successfully"
            : "Reservation updated successfully",
        severity: "success",
      });
      await fetch("/api/rooms?include=true");
      if (mode === "create") {
        resetForm();
      }
      onClose();
      setTimeout(() => onClose(), 600);
      if (onSuccess) onSuccess();
    } else {
      const data = await res.json();
      setFeedback({
        open: true,
        message: data.error || "Failed to save reservation",
        severity: "error",
      });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
        {mode === "create" ? "New walk-in reservation" : "Edit reservation"}
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          Add reservation manually (walk-in, phone, admin).
        </Typography>
      </DialogTitle>

      <DialogContent dividers sx={{ bgcolor: "#f8fafc" }}>
        <Stack spacing={2.5}>
          <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#ffffff" }}>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              mb={1}
            >
              <Typography fontWeight={800}>Guest details</Typography>
              {isAvailable === true && (
                <Chip
                  label="Available"
                  size="small"
                  sx={{ bgcolor: "#dcfce7", color: "#166534" }}
                />
              )}
              {isAvailable === false && (
                <Chip
                  label="No availability"
                  size="small"
                  sx={{ bgcolor: "#fee2e2", color: "#b91c1c" }}
                />
              )}
            </Box>

            <Stack spacing={2}>
              <TextField
                label="Full name"
                fullWidth
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                helperText="Required"
              />

              <TextField
                label="Phone"
                type="tel"
                fullWidth
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                helperText="Required"
              />

              <TextField
                label="Address (optional)"
                fullWidth
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </Stack>
          </Box>

          <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#ffffff" }}>
            <Typography fontWeight={800} mb={1}>
              Stay details
            </Typography>

            <Stack spacing={2}>
              <TextField
                label="Room type"
                select
                fullWidth
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                {roomTypes.map((room, index) => (
                  <MenuItem key={index} value={room.type}>
                    {room.type} - EUR {room.price}/night
                  </MenuItem>
                ))}
              </TextField>

              <Box
                display="grid"
                gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }}
                gap={2}
              >
                <TextField
                  label="Check-in"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  inputProps={{ min: new Date().toISOString().split("T")[0] }}
                  fullWidth
                />
                <TextField
                  label="Check-out"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  inputProps={{
                    min: startDate || new Date().toISOString().split("T")[0],
                  }}
                  fullWidth
                />
              </Box>

              <TextField
                label="Guests"
                type="number"
                fullWidth
                value={guests}
                onChange={(e) => setGuests(e.target.value)}
              />
            </Stack>

            {isAvailable === true && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Room available for selected dates.
              </Alert>
            )}
            {isAvailable === false && (
              <Alert severity="error" sx={{ mt: 2 }}>
                No rooms available for selected dates.
              </Alert>
            )}
          </Box>

          <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#ffffff" }}>
            <Typography fontWeight={800} mb={1}>
              Pricing and payment
            </Typography>

            <TextField
              label="Total price"
              fullWidth
              value={totalPrice}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">EUR</InputAdornment>
                ),
              }}
              helperText={
                selectedRoomPrice
                  ? `Nightly rate: EUR ${selectedRoomPrice}`
                  : ""
              }
              onChange={(e) => setTotalPrice(e.target.value)}
            />

            <Divider sx={{ my: 2 }} />

            <Box mt={1}>
              <FormControl>
                <FormLabel sx={{ fontWeight: 700 }}>Payment method</FormLabel>
                <RadioGroup
                  row
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                >
                  <FormControlLabel
                    value="cash"
                    control={<Radio />}
                    label="Cash"
                  />
                  <FormControlLabel
                    value="card"
                    control={<Radio />}
                    label="Card"
                  />
                </RadioGroup>
              </FormControl>
            </Box>

            <Box mt={1}>
              <FormControl>
                <FormLabel sx={{ fontWeight: 700 }}>Payment status</FormLabel>
                <RadioGroup
                  row
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                >
                  <FormControlLabel
                    value="UNPAID"
                    control={<Radio />}
                    label="Unpaid"
                  />
                  <FormControlLabel
                    value="PAID"
                    control={<Radio />}
                    label="Paid"
                  />
                </RadioGroup>
              </FormControl>
            </Box>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
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
          {mode === "create" ? "Create reservation" : "Save changes"}
        </Button>
      </DialogActions>
      <Snackbar
        open={feedback.open}
        autoHideDuration={4000}
        onClose={() => setFeedback({ ...feedback, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          severity={feedback.severity}
          variant="filled"
          onClose={() => setFeedback({ ...feedback, open: false })}
          sx={{ fontWeight: 600 }}
        >
          {feedback.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
}
