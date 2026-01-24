"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  Paper,
  Stack,
  Chip,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1501117716987-c8e2a5d4d3f4?auto=format&fit=crop&w=1400&q=80";

function formatRange(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  const opts = { month: "short", day: "2-digit", year: "numeric" };
  return `${s.toLocaleDateString(undefined, opts)} - ${e.toLocaleDateString(undefined, opts)}`;
}

function isCompleted(endDate) {
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return end < today;
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("upcoming"); // upcoming | completed | cancelled
  const [details, setDetails] = useState(null);
  const [typeCoverMap, setTypeCoverMap] = useState({});

  const router = useRouter();
  const { data: session, status } = useSession();

  // auth: siç e ke, pa e kompliku
  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) router.push("/login");
  }, [status, session, router]);

  // fetch reservations: siç e ke, pa ndryshim
  useEffect(() => {
    if (!session?.user) return;

    async function fetchReservations() {
      try {
        const userId = session.user.id;
        const response = await fetch(
          `/api/reservation?user_id=${userId}&role=client`,
        );
        const data = await response.json();
        setReservations(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching reservations:", err);
        setReservations([]);
      } finally {
        setLoading(false);
      }
    }

    fetchReservations();
  }, [session]);
  useEffect(() => {
    async function fetchRoomImages() {
      try {
        const res = await fetch("/api/room-images");
        const images = await res.json();

        // krijojmë map: type -> coverUrl
        const map = {};

        for (const img of images) {
          if (!img?.type || !img?.url) continue;

          // Prefero cover (isCover === true)
          if (img.isCover) {
            map[img.type] = img.url;
            continue;
          }

          // nëse nuk ka ende cover për atë type, merre të parën sipas order
          if (!map[img.type]) {
            map[img.type] = img.url;
          }
        }

        setTypeCoverMap(map);
      } catch (e) {
        console.error("Failed to load room images", e);
        setTypeCoverMap({});
      }
    }

    fetchRoomImages();
  }, []);
  // Tabs sipas dates (jo status pagesës)
  const upcoming = useMemo(
    () =>
      reservations.filter(
        (r) =>
          r.end_date &&
          !isCompleted(r.end_date) &&
          String(r.status).toLowerCase() !== "cancelled",
      ),
    [reservations],
  );

  const completed = useMemo(
    () =>
      reservations.filter(
        (r) =>
          r.end_date &&
          isCompleted(r.end_date) &&
          String(r.status).toLowerCase() !== "cancelled",
      ),
    [reservations],
  );

  const cancelled = useMemo(
    () =>
      reservations.filter(
        (r) => String(r.status).toLowerCase() === "cancelled",
      ),
    [reservations],
  );

  const list =
    tab === "upcoming" ? upcoming : tab === "completed" ? completed : cancelled;

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", py: { xs: 4, md: 6 } }}>
      <Container maxWidth="lg">
        <Typography variant="h3" fontWeight={950} sx={{ mb: 0.5 }}>
          My Bookings
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Manage your reservations and travel plans
        </Typography>

        {/* Tabs si foto */}
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{
            mb: 3,
            "& .MuiTabs-indicator": { display: "none" },
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 900,
              borderRadius: 999,
              minHeight: 44,
              px: 2,
              mr: 1,
              bgcolor: "rgba(0,0,0,0.04)",
            },
            "& .Mui-selected": {
              bgcolor: "#d4a373",
              color: "white !important",
            },
          }}
        >
          <Tab
            value="upcoming"
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <span>Upcoming</span>
                <Chip
                  size="small"
                  label={upcoming.length}
                  sx={{
                    height: 22,
                    fontWeight: 900,
                    bgcolor:
                      tab === "upcoming"
                        ? "rgba(255,255,255,0.25)"
                        : "rgba(0,0,0,0.08)",
                    color: tab === "upcoming" ? "white" : "text.primary",
                  }}
                />
              </Stack>
            }
          />
          <Tab
            value="completed"
            label={
              <Stack direction="row" spacing={1} alignItems="center">
                <span>Completed</span>
                <Chip
                  size="small"
                  label={completed.length}
                  sx={{
                    height: 22,
                    fontWeight: 900,
                    bgcolor:
                      tab === "completed"
                        ? "rgba(255,255,255,0.25)"
                        : "rgba(0,0,0,0.08)",
                    color: tab === "completed" ? "white" : "text.primary",
                  }}
                />
              </Stack>
            }
          />
          <Tab value="cancelled" label="Cancelled" />
        </Tabs>

        {/* List cards */}
        {list.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              p: 4,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "rgba(255,255,255,0.6)",
              textAlign: "center",
            }}
          >
            <Typography variant="h6" fontWeight={900}>
              No bookings here.
            </Typography>
          </Paper>
        ) : (
          <Stack spacing={2}>
            {list.map((r) => {
              const roomType = r.rooms?.type;
              const img = (roomType && typeCoverMap[roomType]) || FALLBACK_IMG;
              const title = r.rooms?.name || "Unnamed Room";
              const locationLine = r.rooms?.room_number
                ? `Room #${r.rooms.room_number}`
                : r.rooms?.type || "Hotel";

              return (
                <Paper
                  key={r.id}
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    overflow: "hidden",
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "rgba(255,255,255,0.75)",
                  }}
                >
                  <Stack direction={{ xs: "column", sm: "row" }}>
                    {/* Image */}
                    <Box
                      sx={{
                        width: { xs: "100%", sm: 260 },
                        height: { xs: 180, sm: 170 },
                        flexShrink: 0,
                      }}
                    >
                      <img
                        src={img}
                        alt={title}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    </Box>

                    {/* Content */}
                    <Box sx={{ flexGrow: 1, p: 2.2 }}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        spacing={2}
                        alignItems="flex-start"
                      >
                        <Box>
                          <Chip
                            label={
                              tab === "upcoming"
                                ? "Upcoming"
                                : tab === "completed"
                                  ? "Completed"
                                  : "Cancelled"
                            }
                            size="small"
                            sx={{
                              borderRadius: 999,
                              fontWeight: 900,
                              bgcolor: "rgba(0,0,0,0.06)",
                            }}
                          />

                          <Typography
                            variant="h5"
                            fontWeight={950}
                            sx={{ mt: 1 }}
                          >
                            {title}
                          </Typography>

                          <Stack
                            direction="row"
                            spacing={0.75}
                            alignItems="center"
                            sx={{ mt: 0.5 }}
                          >
                            <LocationOnOutlinedIcon fontSize="small" />
                            <Typography variant="body2" color="text.secondary">
                              {locationLine}
                            </Typography>
                          </Stack>

                          <Stack
                            direction="row"
                            spacing={1.5}
                            alignItems="center"
                            sx={{ mt: 1 }}
                          >
                            <Stack
                              direction="row"
                              spacing={0.75}
                              alignItems="center"
                            >
                              <CalendarMonthOutlinedIcon fontSize="small" />
                              <Typography variant="body2">
                                {formatRange(r.start_date, r.end_date)}
                              </Typography>
                            </Stack>

                            <Stack
                              direction="row"
                              spacing={0.75}
                              alignItems="center"
                            >
                              <GroupOutlinedIcon fontSize="small" />
                              <Typography variant="body2">
                                {r.guests ?? 1} Guests
                              </Typography>
                            </Stack>
                          </Stack>
                        </Box>

                        {/* Total + button */}
                        <Box sx={{ textAlign: "right", minWidth: 140 }}>
                          <Typography variant="body2" color="text.secondary">
                            Total
                          </Typography>
                          <Typography variant="h6" fontWeight={950}>
                            €{Number(r.total_price ?? 0).toFixed(2)}
                          </Typography>

                          <Button
                            variant="outlined"
                            onClick={() => setDetails(r)}
                            endIcon={<ChevronRightIcon />}
                            sx={{
                              mt: 2,
                              borderRadius: 999,
                              textTransform: "none",
                              fontWeight: 900,
                              bgcolor: "rgba(255,255,255,0.55)",
                            }}
                          >
                            View Details
                          </Button>
                        </Box>
                      </Stack>
                    </Box>
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        )}
      </Container>

      {/* Simple details modal */}
      <Dialog
        open={!!details}
        onClose={() => setDetails(null)}
        PaperProps={{ sx: { borderRadius: 3, width: 640, maxWidth: "95vw" } }}
      >
        <DialogTitle sx={{ pr: 6, fontWeight: 950 }}>
          Booking Details
          <IconButton
            onClick={() => setDetails(null)}
            sx={{ position: "absolute", right: 10, top: 10 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {details && (
            <Stack spacing={1.1}>
              <Typography variant="h6" fontWeight={950}>
                {details.rooms?.name || "Unnamed Room"}
              </Typography>
              <Divider />
              <Typography variant="body2">
                <b>Payment status:</b> {details.status}
              </Typography>
              <Typography variant="body2">
                <b>Dates:</b>{" "}
                {formatRange(details.start_date, details.end_date)}
              </Typography>
              <Typography variant="body2">
                <b>Guests:</b> {details.guests ?? 1}
              </Typography>
              <Typography variant="body2">
                <b>Total:</b> €{Number(details.total_price ?? 0).toFixed(2)}
              </Typography>
              <Typography variant="body2">
                <b>Created:</b>{" "}
                {details.created_at
                  ? new Date(details.created_at).toLocaleString()
                  : "-"}
              </Typography>
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
