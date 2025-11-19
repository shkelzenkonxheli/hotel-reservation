"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import {
  Container,
  Typography,
  CircularProgress,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Box,
} from "@mui/material";

export default function ReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      router.push("/login");
    }
  }, [status, session, router]);
  useEffect(() => {
    if (!session?.user) return;
    async function fetchReservations() {
      try {
        const userId = session.user.id;

        const response = await fetch(
          `/api/reservation?user_id=${userId}&role=client`
        );

        const data = await response.json();
        setReservations(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching reservations:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchReservations();
  }, [session]);

  if (loading)
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          mt: 10,
        }}
      >
        <CircularProgress />
      </Box>
    );

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Typography
        variant="h4"
        textAlign="center"
        fontWeight="bold"
        gutterBottom
      >
        My Reservations
      </Typography>

      {reservations.length === 0 ? (
        <Typography
          variant="h6"
          textAlign="center"
          color="text.secondary"
          sx={{ mt: 4 }}
        >
          No reservations found.
        </Typography>
      ) : (
        <Paper elevation={4} sx={{ overflowX: "auto", mt: 3 }}>
          <Table>
            <TableHead sx={{ bgcolor: "primary.main" }}>
              <TableRow>
                <TableCell sx={{ color: "white" }}>Room Name</TableCell>
                <TableCell sx={{ color: "white" }}>Room Number</TableCell>
                <TableCell sx={{ color: "white" }}>Guest</TableCell>
                <TableCell sx={{ color: "white" }}>Email / Phone</TableCell>
                <TableCell sx={{ color: "white" }} align="center">
                  Check-in
                </TableCell>
                <TableCell sx={{ color: "white" }} align="center">
                  Check-out
                </TableCell>
                <TableCell sx={{ color: "white" }} align="center">
                  Guests
                </TableCell>
                <TableCell sx={{ color: "white" }} align="center">
                  Status
                </TableCell>
                <TableCell sx={{ color: "white" }} align="right">
                  Total (€)
                </TableCell>
                <TableCell sx={{ color: "white" }} align="center">
                  Created
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {reservations.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell>{r.rooms?.name || "Unnamed Room"}</TableCell>
                  <TableCell align="center">
                    {r.rooms?.room_number || "-"}
                  </TableCell>

                  <TableCell>{r.full_name}</TableCell>

                  <TableCell>
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                      <span>{r.users?.email}</span>
                      <span style={{ fontSize: "0.8rem", color: "#777" }}>
                        {r.phone}
                      </span>
                    </Box>
                  </TableCell>

                  <TableCell align="center" sx={{ color: "green" }}>
                    {new Date(r.start_date).toLocaleDateString()}
                  </TableCell>

                  <TableCell align="center" sx={{ color: "red" }}>
                    {new Date(r.end_date).toLocaleDateString()}
                  </TableCell>

                  <TableCell align="center">{r.guests}</TableCell>

                  <TableCell align="center">
                    <Chip
                      label={r.status}
                      color={
                        r.status === "confirmed"
                          ? "success"
                          : r.status === "pending"
                          ? "warning"
                          : r.status === "cancelled"
                          ? "error"
                          : "default"
                      }
                      variant="filled"
                      size="small"
                    />
                  </TableCell>

                  <TableCell align="right" sx={{ fontWeight: "bold" }}>
                    €{Number(r.total_price ?? 0).toFixed(2)}
                  </TableCell>

                  <TableCell align="center">
                    {r.created_at
                      ? new Date(r.created_at).toLocaleString()
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Container>
  );
}
