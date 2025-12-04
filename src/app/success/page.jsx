"use client";
import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CircularProgress,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function SuccessPage() {
  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    localStorage.removeItem("booking");
  }, []);

  useEffect(() => {
    async function fetchReservation() {
      if (status === "unauthenticated") {
        router.push("/login");
        return;
      }

      if (status !== "authenticated") return;

      try {
        const resv = await fetch(
          `/api/reservation?latest=true&userId=${session.user.id}`
        );

        const data = await resv.json();

        if (resv.ok && data) {
          setReservation(data);
        } else {
          setReservation(null);
        }
      } catch (err) {
        console.error("Error fetching reservation:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchReservation();
  }, [session, status, router]);

  if (loading) {
    return (
      <Box className="flex justify-center items-center min-h-screen bg-gray-50">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #ecfdf5 0%, #f0f9ff 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        py: 6,
        px: 3,
      }}
    >
      <Card
        elevation={6}
        sx={{
          maxWidth: 550,
          borderRadius: "20px",
          textAlign: "center",
          p: 4,
          backgroundColor: "white",
        }}
      >
        <CheckCircleOutlineIcon
          sx={{ color: "#16a34a", fontSize: 80, mb: 2 }}
        />
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Payment Successful!
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Your booking has been confirmed. A confirmation email has been sent.
        </Typography>

        {reservation ? (
          <CardContent
            sx={{
              textAlign: "left",
              backgroundColor: "#f9fafb",
              borderRadius: "12px",
              p: 3,
              mb: 3,
            }}
          >
            <Typography variant="subtitle1" fontWeight="bold">
              Booking Details:
            </Typography>
            <Typography variant="body2">
              <strong>Room:</strong> {reservation.rooms?.name}
            </Typography>

            <Typography variant="body2">
              <strong>Check-in:</strong>{" "}
              {new Date(reservation.start_date).toLocaleDateString()}
            </Typography>
            <Typography variant="body2">
              <strong>Check-out:</strong>{" "}
              {new Date(reservation.end_date).toLocaleDateString()}
            </Typography>
            <Typography variant="body2">
              <strong>Guests:</strong> {reservation.guests}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>Total:</strong>{" "}
              <span style={{ color: "#16a34a", fontWeight: 600 }}>
                €{reservation.total_price}
              </span>
            </Typography>
          </CardContent>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No recent reservation found.
          </Typography>
        )}

        <Button
          variant="contained"
          size="large"
          sx={{
            background: "linear-gradient(90deg, #2563eb, #1d4ed8)",
            "&:hover": {
              background: "linear-gradient(90deg, #1d4ed8, #1e40af)",
            },
            borderRadius: "10px",
            px: 4,
            py: 1.5,
          }}
          onClick={() => router.push("/")}
        >
          Back to Home
        </Button>
      </Card>
    </Box>
  );
}
