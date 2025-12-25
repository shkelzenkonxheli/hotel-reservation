"use client";

import { useBooking } from "@/context/BookingContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Divider,
  Grid,
  CircularProgress,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { useSession } from "next-auth/react";

export default function CheckoutBooking() {
  const { booking } = useBooking();
  const router = useRouter();
  const { data: session, status } = useSession();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [loading, setLoading] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);

  const [fullname, setFullname] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [guests, setGuests] = useState(2);
  const [totalPrice, setTotalPrice] = useState(0);
  const [expandedRoom, setExpandedRoom] = useState(null);

  /* ---------------- AUTH GUARD ---------------- */
  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) router.push("/login");
  }, [session, status, router]);

  /* ---------------- PREFILL USER DATA ---------------- */
  useEffect(() => {
    if (session?.user) {
      setFullname(session.user.name || "");
      setAddress(session.user.address || "");
      setPhone(session.user.phone || "");
    }
  }, [session]);

  /* ---------------- PRICE CALCULATION ---------------- */
  useEffect(() => {
    if (!booking) return;

    const { room, startDate, endDate } = booking;

    const nights =
      (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24);

    if (nights <= 0) {
      router.push("/rooms");
      return;
    }

    let basePrice = Number(room.price);
    let extraPrice = 0;

    const maxGuests = room.type.toLowerCase().includes("apartment") ? 4 : 2;
    if (guests > maxGuests) setGuests(maxGuests);

    if (guests > 2) extraPrice = (guests - 2) * 20;

    setTotalPrice((basePrice + extraPrice) * nights);
  }, [booking, guests, router]);

  /* ---------------- LOADING IF NO BOOKING ---------------- */
  if (!booking) {
    return (
      <Box className="flex items-center justify-center min-h-screen">
        <CircularProgress />
      </Box>
    );
  }

  const { room, startDate, endDate } = booking;

  const nights = Math.ceil(
    (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)
  );

  /* ---------------- SUBMIT ---------------- */
  const handleBookClick = async () => {
    if (!fullname || !phone || !address) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalPrice,
          roomName: room.name,
          userEmail: session.user.email,
          type: room.type,
          startDate,
          endDate,
          fullname,
          phone,
          address,
          guests,
          roomId: room.id,
        }),
      });

      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else alert("Payment initialization failed.");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- HELPERS ---------------- */
  const getFirstLine = (text) => {
    if (!text) return "";
    return text.split("\n")[0];
  };

  /* ---------------- COMPONENTS ---------------- */
  const RoomInfo = () => (
    <Box sx={{ background: "#eae1df", borderRadius: isMobile ? 2 : 0 }}>
      <img
        src={room.images?.[0] || "/placeholder.jpg"}
        alt={room.name}
        style={{
          width: "100%",
          height: "260px",
          objectFit: "cover",
          borderRadius: isMobile ? "12px" : "0",
        }}
      />

      <CardContent>
        <Typography variant="h5" fontWeight="bold">
          {room.name}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {getFirstLine(room.description)}
        </Typography>

        <button
          className="text-blue-600 text-sm mt-1 underline w-fit"
          onClick={() => setExpandedRoom(room)}
        >
          View more
        </button>

        <Divider sx={{ my: 2 }} />

        <Typography>
          <strong>Check-in:</strong> {startDate}
        </Typography>
        <Typography>
          <strong>Check-out:</strong> {endDate}
        </Typography>
        <Typography>
          <strong>Nights:</strong> {nights}
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" color="primary">
          €{room.price} / night
        </Typography>

        <Box
          sx={{
            mt: 3,
            background: "#f1f5f9",
            borderRadius: "12px",
            textAlign: "center",
            py: 2,
          }}
        >
          <Typography variant="h6" fontWeight="bold" color="success.main">
            Total: €{totalPrice.toFixed(2)}
          </Typography>
        </Box>
      </CardContent>
    </Box>
  );

  const UserForm = () => (
    <>
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
        Your Information
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField
          label="Full Name"
          value={fullname}
          onChange={(e) => setFullname(e.target.value)}
        />
        <TextField
          label="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <TextField
          label="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
        <TextField
          label="Guests"
          type="number"
          inputProps={{ min: 1 }}
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
        />
      </Box>

      <Divider sx={{ my: 3 }} />

      <Button
        onClick={handleBookClick}
        variant="contained"
        size="large"
        fullWidth
        disabled={loading}
      >
        {loading ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          "Confirm Booking & Pay"
        )}
      </Button>
    </>
  );

  /* ---------------- RENDER ---------------- */
  return (
    <Box sx={{ minHeight: "100vh", py: 6, px: 2, bgcolor: "#eae1df" }}>
      <Box sx={{ maxWidth: "800px", mx: "auto" }}>
        <Typography
          variant="h4"
          fontWeight="bold"
          align="center"
          sx={{ mb: 4 }}
        >
          🏨 Confirm Your Booking
        </Typography>

        {!isMobile && (
          <Paper
            elevation={4}
            sx={{ borderRadius: 4, overflow: "hidden", bgcolor: "#eae1df" }}
          >
            <Grid container>
              <Grid item xs={12} md={6}>
                <RoomInfo />
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ p: 4 }}>
                  <UserForm />
                </Box>
              </Grid>
            </Grid>
          </Paper>
        )}

        {isMobile && (
          <>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold">
                  {room.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {startDate} → {endDate} ({nights} nights)
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Typography fontWeight="bold" color="success.main">
                  Total: €{totalPrice.toFixed(2)}
                </Typography>

                <Button
                  fullWidth
                  sx={{ mt: 2 }}
                  variant="outlined"
                  onClick={() => setOpenDetails(true)}
                >
                  View booking details
                </Button>
              </CardContent>
            </Card>

            <Dialog
              open={openDetails}
              onClose={() => setOpenDetails(false)}
              fullWidth
              maxWidth="sm"
            >
              <DialogTitle>Complete booking</DialogTitle>
              <DialogContent
                sx={{ maxHeight: "70vh", overflowY: "auto", pb: 10 }}
              >
                <UserForm />
              </DialogContent>
            </Dialog>
          </>
        )}
      </Box>

      {expandedRoom && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full relative">
            <button
              className="absolute top-3 right-3 text-gray-500"
              onClick={() => setExpandedRoom(null)}
            >
              ✕
            </button>
            <h2 className="text-xl font-bold mb-4">{expandedRoom.name}</h2>
            <p className="text-gray-700 text-sm whitespace-pre-line">
              {expandedRoom.description}
            </p>
          </div>
        </div>
      )}
    </Box>
  );
}
