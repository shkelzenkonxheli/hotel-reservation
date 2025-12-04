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
} from "@mui/material";
import { useSession } from "next-auth/react";

export default function CheckoutBooking() {
  const { booking } = useBooking();
  const [loading, setLoading] = useState(false);
  const [fullname, setFullname] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [guests, setGuests] = useState(2);
  const [totalPrice, setTotalPrice] = useState(0);

  const router = useRouter();
  const { data: session, status } = useSession();

  if (!booking)
    return (
      <Box className="flex items-center justify-center min-h-screen">
        <CircularProgress />
      </Box>
    );

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      router.push("/login");
    }
  }, [session, status, router]);

  const { room, startDate, endDate } = booking;

  const nights = Math.ceil(
    (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)
  );
  useEffect(() => {
    let basePrice = Number(room.price);
    let extraPrice = 0;
    const maxGuests = room.type.toLowerCase().includes("apartment") ? 4 : 2;
    if (guests > maxGuests) setGuests(maxGuests);
    if (guests > 2) extraPrice = (guests - 2) * 20;
    setTotalPrice((basePrice + extraPrice) * nights);
  }, [room.price, room.type, guests, nights]);
  useEffect(() => {
    if (session?.user) {
      setFullname(session.user.name || "");
      setAddress(session.user.address || "");
      setPhone(session.user.phone || "");
    }
  }, [session]);

  const handleBookClick = async () => {
    if (!fullname || !phone || !address) {
      alert("Please fill in all fields.");
      return;
    }

    if (!session.user) {
      alert("Please log in to complete your booking.");
      router.push("/login");
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
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Payment initialization failed.");
      }
    } catch (error) {
      console.error("Error creating payment session:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #eef2ff 0%, #f9fafb 100%)",
        py: 8,
        px: 3,
      }}
    >
      <Box sx={{ maxWidth: "1100px", mx: "auto" }}>
        <Typography
          variant="h4"
          fontWeight="bold"
          align="center"
          sx={{ mb: 4, color: "#1e3a8a" }}
        >
          🏨 Confirm Your Booking
        </Typography>

        <Paper
          elevation={4}
          sx={{
            borderRadius: "20px",
            overflow: "hidden",
            backdropFilter: "blur(8px)",
          }}
        >
          <Grid container spacing={0}>
            {/* Left - Room Info */}
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  position: "relative",
                  height: "100%",
                  backgroundColor: "#f8fafc",
                }}
              >
                <img
                  src={room.images?.[0] || "/placeholder.jpg"}
                  alt={room.name}
                  style={{
                    width: "100%",
                    height: "340px",
                    objectFit: "cover",
                    borderTopLeftRadius: "20px",
                  }}
                />
                <CardContent>
                  <Typography
                    variant="h5"
                    fontWeight="bold"
                    color="text.primary"
                  >
                    {room.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    {room.description}
                  </Typography>

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
                    €{room.price}{" "}
                    <Typography component="span">/ night</Typography>
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
                    <Typography
                      variant="h6"
                      fontWeight="bold"
                      color="success.main"
                    >
                      Total: €{totalPrice.toFixed(2)}
                    </Typography>
                  </Box>
                </CardContent>
              </Box>
            </Grid>

            {/* Right - User Info */}
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 4 }}>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  sx={{ mb: 2, color: "#1e40af" }}
                >
                  Your Information
                </Typography>

                <Box
                  component="form"
                  sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                >
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
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    inputProps={{
                      min: 1,
                      max: room.type.toLowerCase().includes("apartment")
                        ? 4
                        : 2,
                    }}
                  />
                </Box>

                <Divider sx={{ my: 3 }} />

                <Button
                  onClick={handleBookClick}
                  variant="contained"
                  size="large"
                  fullWidth
                  sx={{
                    py: 1.5,
                    borderRadius: "10px",
                    background: "linear-gradient(90deg, #2563eb, #1d4ed8)",
                    fontWeight: "bold",
                    boxShadow: "0px 4px 14px rgba(37, 99, 235, 0.4)",
                    "&:hover": {
                      background: "linear-gradient(90deg, #1d4ed8, #1e40af)",
                    },
                  }}
                  disabled={loading}
                >
                  {loading ? (
                    <CircularProgress size={26} color="inherit" />
                  ) : (
                    "Confirm Booking and Pay"
                  )}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Box>
  );
}
