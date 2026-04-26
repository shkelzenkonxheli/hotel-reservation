"use client";

import { useTranslations } from "next-intl";
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip,
  Paper,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import MinimizeIcon from "@mui/icons-material/Minimize";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import CloseIcon from "@mui/icons-material/Close";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

export default function ReservationForm({
  open,
  onClose,
  onSuccess,
  mode = "create",
  reservation = null,
}) {
  const t = useTranslations("dashboard.reservations.form");
  const { data: session } = useSession();

  const paymentStatusLabel =
    paymentStatus === "PAID"
      ? t("paymentStatus.paid")
      : t("paymentStatus.unpaid");

  const [roomTypes, setRoomTypes] = useState([]);

  const [fullname, setFullname] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [type, setType] = useState("");
  const [roomId, setRoomId] = useState("");
  const [availableRooms, setAvailableRooms] = useState([]);
  const [unavailableRooms, setUnavailableRooms] = useState([]);
  const [guests, setGuests] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [totalPrice, setTotalPrice] = useState("");
  const [isAvailable, setIsAvailable] = useState(null);
  const [selectedRoomPrice, setSelectedRoomPrice] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentStatus, setPaymentStatus] = useState("UNPAID");
  const [step, setStep] = useState(1);
  const [isMinimized, setIsMinimized] = useState(false);
  const [feedback, setFeedback] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const sectionCardSx = {
    p: 2.25,
    borderRadius: 3,
    bgcolor: "#ffffff",
    border: "1px solid #e2e8f0",
    boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)",
  };

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 2.5,
      backgroundColor: "#ffffff",
      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
        borderColor: "#14b8a6",
        borderWidth: 2,
      },
    },
    "& .MuiInputLabel-root.Mui-focused": {
      color: "#0f766e",
    },
  };

  const primaryButtonSx = {
    bgcolor: "#0f766e",
    "&:hover": { bgcolor: "#115e59" },
    borderRadius: 2.5,
    px: 2,
    minHeight: 42,
    fontWeight: 700,
    textTransform: "none",
    boxShadow: "0 8px 18px rgba(15,118,110,0.22)",
  };

  const secondaryButtonSx = {
    borderRadius: 2.5,
    px: 2,
    minHeight: 42,
    fontWeight: 600,
    textTransform: "none",
    borderColor: "#cbd5e1",
    color: "#334155",
  };

  useEffect(() => {
    async function loadTypes() {
      const res = await fetch("/api/rooms-type");
      const data = await res.json();
      setRoomTypes(data);
    }
    loadTypes();
  }, []);

  useEffect(() => {
    if (!open) {
      setIsMinimized(false);
      setStep(1);
    }
  }, [open]);

  useEffect(() => {
    if (mode === "edit" && reservation) {
      setFullname(reservation.full_name || "");
      setPhone(reservation.phone || "");
      setAddress(reservation.address || "");
      setType(reservation.rooms?.type || "");
      setRoomId(reservation.room_id || "");
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
    setRoomId("");
    setAvailableRooms([]);
    setUnavailableRooms([]);
    setGuests("");
    setStartDate("");
    setEndDate("");
    setTotalPrice("");
    setIsAvailable(null);
  };

  useEffect(() => {
    if (!type || !startDate || !endDate) {
      setIsAvailable(null);
      setAvailableRooms([]);
      setUnavailableRooms([]);
      setRoomId("");
      return;
    }

    const selected = roomTypes.find((r) => r.type === type);
    if (selected) setSelectedRoomPrice(selected.price);

    const nights =
      (new Date(endDate).getTime() - new Date(startDate).getTime()) /
      (1000 * 60 * 60 * 24);

    if (nights > 0 && selected) {
      setTotalPrice((nights * selected.price).toFixed(2));
    }

    async function checkAvailability() {
      // Clear stale options while loading new availability for selected dates/type.
      setAvailableRooms([]);
      setUnavailableRooms([]);
      setRoomId("");

      const res = await fetch(
        `/api/reservation?room_type=${type}&start_date=${startDate}&end_date=${endDate}&include_rooms=true&reservation_id=${
          reservation?.id || ""
        }`,
      );
      const data = await res.json();
      setIsAvailable(data.available);
      setAvailableRooms(Array.isArray(data.availableRooms) ? data.availableRooms : []);
      setUnavailableRooms(
        Array.isArray(data.unavailableRooms) ? data.unavailableRooms : [],
      );

      if (mode === "create") {
        setRoomId((prev) => {
          if (prev && data.availableRooms?.some((r) => r.id === Number(prev))) {
            return prev;
          }
          return data.availableRooms?.[0]?.id || "";
        });
      } else {
        setRoomId((prev) => {
          if (prev && data.availableRooms?.some((r) => r.id === Number(prev))) {
            return prev;
          }
          if (reservation?.room_id && data.availableRooms?.some((r) => r.id === Number(reservation.room_id))) {
            return reservation.room_id;
          }
          return data.availableRooms?.[0]?.id || "";
        });
      }
    }

    checkAvailability();
  }, [type, startDate, endDate, roomTypes, mode, reservation?.id, reservation?.room_id]);

  const handleSubmit = async () => {
    if (!fullname || !phone || !type || !roomId || !startDate || !endDate) {
      setFeedback({
        open: true,
        message: t("messages.requiredFields"),
        severity: "warning",
      });
      return;
    }

    if (isAvailable === false) {
      setFeedback({
        open: true,
        message: t("messages.noAvailability"),
        severity: "error",
      });
      return;
    }

    const payload = {
      fullname,
      phone,
      address,
      type,
      roomId: Number(roomId),
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
      await fetch("/api/rooms?include=true");
      if (mode === "create") {
        resetForm();
      }
      setFeedback({
        open: true,
        message:
          mode === "create" ? t("messages.created") : t("messages.updated"),
        severity: "success",
      });
      onClose();
      if (onSuccess) onSuccess();
    } else {
      const data = await res.json();
      setFeedback({
        open: true,
        message: data.error || t("messages.saveFailed"),
        severity: "error",
      });
    }
  };

  const canProceedToStep2 =
    Boolean(type) &&
    Boolean(startDate) &&
    Boolean(endDate) &&
    Boolean(roomId) &&
    isAvailable !== false;

  const handleCancel = () => {
    resetForm();
    setStep(1);
    onClose();
  };

  if (open && isMinimized) {
    return (
      <Paper
        elevation={6}
        sx={{
          position: "fixed",
          right: 16,
          bottom: 16,
          zIndex: 1400,
          borderRadius: 2,
          px: 1.5,
          py: 1,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Typography variant="body2" fontWeight={700}>
          {t("minimized.title")}
        </Typography>
        <Tooltip title={t("minimized.restore")}>
          <IconButton size="small" onClick={() => setIsMinimized(false)}>
            <OpenInFullIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={t("minimized.close")}>
          <IconButton size="small" onClick={handleCancel}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Paper>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: "hidden",
          boxShadow: "0 24px 60px rgba(2, 6, 23, 0.22)",
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={1}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: "#0f172a" }}>
              {mode === "create" ? t("title.create") : t("title.edit")}
            </Typography>
            <Typography variant="body2" color="#64748b" mt={0.5}>
              {t("title.step", {
                step,
                total: 2,
                current: step === 1 ? t("steps.stayRoom") : t("steps.guestPayment"),
              })}
            </Typography>
          </Box>
          <Tooltip title={t("title.minimize")}>
            <IconButton size="small" onClick={() => setIsMinimized(true)}>
              <MinimizeIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ bgcolor: "#f8fafc" }}>
        <Stack spacing={2.5}>
          {step === 1 && (
            <Box sx={sectionCardSx}>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                mb={1}
              >
                <Typography fontWeight={800}>{t("sections.stayDetails")}</Typography>
                {isAvailable === true && (
                  <Chip
                    label={t("availability.available")}
                    size="small"
                    sx={{ bgcolor: "#dcfce7", color: "#166534" }}
                  />
                )}
                {isAvailable === false && (
                  <Chip
                    label={t("availability.unavailable")}
                    size="small"
                    sx={{ bgcolor: "#fee2e2", color: "#b91c1c" }}
                  />
                )}
              </Box>

              <Stack spacing={2}>
                <TextField
                  label={t("fields.roomType")}
                  select
                  fullWidth
                  sx={fieldSx}
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value);
                    setRoomId("");
                    setAvailableRooms([]);
                  }}
                >
                  {roomTypes.map((room, index) => (
                    <MenuItem key={index} value={room.type}>
                      {t("fields.roomTypeOption", {
                        type: room.type,
                        price: room.price,
                      })}
                    </MenuItem>
                  ))}
                </TextField>

                <Box
                  display="grid"
                  gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }}
                  gap={2}
                >
                  <TextField
                    label={t("fields.checkIn")}
                    type="date"
                    sx={fieldSx}
                    InputLabelProps={{ shrink: true }}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    inputProps={{ min: new Date().toISOString().split("T")[0] }}
                    fullWidth
                  />
                  <TextField
                    label={t("fields.checkOut")}
                    type="date"
                    sx={fieldSx}
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
                  label={t("fields.roomNumber")}
                  select
                  fullWidth
                  sx={fieldSx}
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  disabled={!type || !startDate || !endDate || availableRooms.length === 0}
                  helperText={
                    !type || !startDate || !endDate
                      ? t("helpers.selectTypeAndDates")
                      : availableRooms.length === 0
                        ? t("helpers.noRoomsForDates")
                        : t("helpers.showingAvailableRooms")
                  }
                >
                  {availableRooms.map((room) => (
                    <MenuItem key={room.id} value={room.id}>
                      #{room.room_number} - {room.name || room.type}
                    </MenuItem>
                  ))}
                </TextField>

                {unavailableRooms.length > 0 && (
                  <Accordion
                    disableGutters
                    elevation={0}
                    sx={{
                      border: "1px solid #e2e8f0",
                      borderRadius: 2,
                      "&:before": { display: "none" },
                      overflow: "hidden",
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      sx={{ bgcolor: "#f8fafc", minHeight: 48 }}
                    >
                      <Typography variant="subtitle2" fontWeight={700}>
                        {t("helpers.unavailableRooms", {
                          count: unavailableRooms.length,
                        })}
                      </Typography>
                    </AccordionSummary>
                  <AccordionDetails sx={{ bgcolor: "#ffffff", py: 1.5 }}>
                      <Stack spacing={0.5}>
                        {unavailableRooms.map((room) => {
                          const until = room.until
                            ? new Date(room.until).toLocaleDateString()
                            : null;
                          const details =
                            room.reason === "Out of order"
                              ? t("helpers.outOfOrder")
                              : until
                                ? t("helpers.bookedUntil", { until })
                                : t("helpers.bookedInSelectedDates");
                          return (
                            <Typography
                              key={room.id}
                              variant="body2"
                              color="text.secondary"
                            >
                              #{room.room_number} - {details}
                            </Typography>
                          );
                        })}
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                )}
              </Stack>

              {isAvailable === true && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  {t("availability.success")}
                </Alert>
              )}
              {isAvailable === false && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {t("availability.error")}
                </Alert>
              )}
            </Box>
          )}

          {step === 2 && (
            <>
              <Box sx={sectionCardSx}>
                <Typography fontWeight={800} mb={1}>
                  {t("sections.guestDetails")}
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    label={t("fields.fullName")}
                    fullWidth
                    sx={fieldSx}
                    value={fullname}
                    onChange={(e) => setFullname(e.target.value)}
                    helperText={t("helpers.required")}
                  />

                  <TextField
                    label={t("fields.phone")}
                    type="tel"
                    fullWidth
                    sx={fieldSx}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    helperText={t("helpers.required")}
                  />

                  <TextField
                    label={t("fields.addressOptional")}
                    fullWidth
                    sx={fieldSx}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />

                  <TextField
                    label={t("fields.guests")}
                    type="number"
                    fullWidth
                    sx={fieldSx}
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                  />
                </Stack>
              </Box>

              <Box sx={sectionCardSx}>
                <Typography fontWeight={800} mb={1}>
                  {t("sections.pricingPayment")}
                </Typography>

                <TextField
                  label={t("fields.totalPrice")}
                  fullWidth
                  sx={fieldSx}
                  value={totalPrice}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">{t("fields.currency")}</InputAdornment>
                    ),
                  }}
                  helperText={
                    selectedRoomPrice
                      ? t("helpers.nightlyRate", { price: selectedRoomPrice })
                      : ""
                  }
                  onChange={(e) => setTotalPrice(e.target.value)}
                />

                <Divider sx={{ my: 2 }} />

                <Box mt={1}>
                  <FormControl>
                    <FormLabel sx={{ fontWeight: 700 }}>{t("fields.paymentMethod")}</FormLabel>
                    <RadioGroup
                      row
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <FormControlLabel
                        value="cash"
                        control={<Radio />}
                        label={t("paymentMethods.cash")}
                      />
                      <FormControlLabel
                        value="card"
                        control={<Radio />}
                        label={t("paymentMethods.card")}
                      />
                    </RadioGroup>
                  </FormControl>
                </Box>

                <Box mt={1}>
                  <FormControl>
                    <FormLabel sx={{ fontWeight: 700 }}>{t("fields.paymentStatus")}</FormLabel>
                    <RadioGroup
                      row
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    >
                      <FormControlLabel
                        value="UNPAID"
                        control={<Radio />}
                        label={t("paymentStatus.unpaid")}
                      />
                      <FormControlLabel
                        value="PAID"
                        control={<Radio />}
                        label={t("paymentStatus.paid")}
                      />
                    </RadioGroup>
                  </FormControl>
                </Box>

                <Chip
                  size="small"
                  label={`${t("fields.paymentStatus")}: ${paymentStatusLabel}`}
                  sx={{
                    mt: 1.5,
                    bgcolor: paymentStatus === "PAID" ? "#dcfce7" : "#fef3c7",
                    color: paymentStatus === "PAID" ? "#166534" : "#92400e",
                    fontWeight: 700,
                  }}
                />
              </Box>
            </>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleCancel} variant="outlined" sx={secondaryButtonSx}>
          {t("actions.cancel")}
        </Button>
        {step === 2 && (
          <Button variant="outlined" onClick={() => setStep(1)} sx={secondaryButtonSx}>
            {t("actions.back")}
          </Button>
        )}
        {step === 1 ? (
          <Button
            variant="contained"
            onClick={() => setStep(2)}
            disabled={!canProceedToStep2}
            sx={primaryButtonSx}
          >
            {t("actions.next")}
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleSubmit}
            sx={primaryButtonSx}
            disabled={
              isAvailable === false ||
              !fullname ||
              !phone ||
              !type ||
              !roomId ||
              !startDate ||
              !endDate
            }
          >
            {mode === "create" ? t("actions.create") : t("actions.save")}
          </Button>
        )}
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
