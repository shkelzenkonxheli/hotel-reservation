"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Box,
  Typography,
  CircularProgress,
  Stack,
  Chip,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  DialogActions,
  TextField,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import PublicContainer from "../components/Public/PublicContainer";
import PublicSection from "../components/Public/PublicSection";
import PublicCard from "../components/Public/PublicCard";

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
  const [tab, setTab] = useState("upcoming");
  const [details, setDetails] = useState(null);
  const [typeCoverMap, setTypeCoverMap] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState("");

  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) router.push("/login");
  }, [status, session, router]);

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

        const map = {};

        for (const img of images) {
          if (!img?.type || !img?.url) continue;

          if (img.isCover) {
            map[img.type] = img.url;
            continue;
          }

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

  async function hideReservation(reservationId) {
    try {
      const res = await fetch("/api/reservation/hide", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to delete");
        return;
      }
      setReservations((prev) => prev.filter((x) => x.id !== reservationId));
    } catch (e) {
      console.error(e);
      alert("Network error");
    }
  }

  async function cancelReservation(reservationId, reason) {
    try {
      const res = await fetch("/api/reservation/cancel", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId, reason }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.error || "Failed to cancel");
        return false;
      }

      setReservations((prev) =>
        prev.map((x) =>
          x.id === reservationId
            ? {
                ...x,
                cancelled_at: new Date().toISOString(),
                cancel_reason: reason || null,
              }
            : x,
        ),
      );

      return true;
    } catch (e) {
      console.error(e);
      alert("Network error");
      return false;
    }
  }

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
    <Box className="public-page min-h-screen">
      <PublicSection className="pt-10">
        <PublicContainer>
          <div className="max-w-3xl">
            <p className="public-badge">Your stays</p>
            <Typography variant="h3" fontWeight={900} sx={{ mb: 0.5 }}>
              My bookings
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Manage your reservations and travel plans.
            </Typography>
          </div>

          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            sx={{
              mb: 3,
              "& .MuiTabs-indicator": { display: "none" },
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 800,
                borderRadius: 999,
                minHeight: 44,
                px: 2,
                mr: 1,
                bgcolor: "rgba(0,0,0,0.04)",
              },
              "& .Mui-selected": {
                bgcolor: "#0ea5e9",
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
                      fontWeight: 800,
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
                      fontWeight: 800,
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

          {list.length === 0 ? (
            <PublicCard className="p-8 text-center">
              <Typography variant="h6" fontWeight={800}>
                No bookings here.
              </Typography>
            </PublicCard>
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
                  <PublicCard key={r.id} className="overflow-hidden">
                    <Stack direction={{ xs: "column", sm: "row" }}>
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
                                fontWeight: 800,
                                bgcolor: "rgba(0,0,0,0.06)",
                              }}
                            />

                            <Typography variant="h5" fontWeight={900} sx={{ mt: 1 }}>
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
                              <Stack direction="row" spacing={0.75} alignItems="center">
                                <CalendarMonthOutlinedIcon fontSize="small" />
                                <Typography variant="body2">
                                  {formatRange(r.start_date, r.end_date)}
                                </Typography>
                              </Stack>

                              <Stack direction="row" spacing={0.75} alignItems="center">
                                <GroupOutlinedIcon fontSize="small" />
                                <Typography variant="body2">
                                  {r.guests ?? 1} Guests
                                </Typography>
                              </Stack>
                            </Stack>
                          </Box>

                          <Box sx={{ textAlign: "right", minWidth: 160 }}>
                            <Typography variant="body2" color="text.secondary">
                              Total
                            </Typography>
                            <Typography variant="h6" fontWeight={900}>
                              EUR {Number(r.total_price ?? 0).toFixed(2)}
                            </Typography>

                            <Button
                              variant="outlined"
                              onClick={() => setDetails(r)}
                              endIcon={<ChevronRightIcon />}
                              sx={{
                                mt: 2,
                                borderRadius: 999,
                                textTransform: "none",
                                fontWeight: 800,
                              }}
                            >
                              View details
                            </Button>
                            <Button
                              variant="outlined"
                              onClick={() => {
                                setCancelTarget(r);
                                setCancelReason("");
                              }}
                              disabled={!!r.cancelled_at}
                              sx={{
                                mt: 1,
                                borderRadius: 999,
                                textTransform: "none",
                                fontWeight: 800,
                              }}
                            >
                              Cancel
                            </Button>

                            <Button
                              color="error"
                              variant="text"
                              onClick={() => setDeleteTarget(r)}
                              sx={{
                                mt: 1,
                                borderRadius: 999,
                                textTransform: "none",
                                fontWeight: 800,
                              }}
                            >
                              Delete
                            </Button>
                          </Box>
                        </Stack>
                      </Box>
                    </Stack>
                  </PublicCard>
                );
              })}
            </Stack>
          )}
        </PublicContainer>
      </PublicSection>

      <Dialog
        open={!!details}
        onClose={() => setDetails(null)}
        PaperProps={{ sx: { borderRadius: 3, width: 640, maxWidth: "95vw" } }}
      >
        <DialogTitle sx={{ pr: 6, fontWeight: 900 }}>
          Booking details
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
              <Typography variant="h6" fontWeight={900}>
                {details.rooms?.name || "Unnamed Room"}
              </Typography>
              <Divider />
              <Typography variant="body2">
                <b>Payment status:</b> {details.status}
              </Typography>
              <Typography variant="body2">
                <b>Dates:</b> {formatRange(details.start_date, details.end_date)}
              </Typography>
              <Typography variant="body2">
                <b>Guests:</b> {details.guests ?? 1}
              </Typography>
              <Typography variant="body2">
                <b>Total:</b> EUR {Number(details.total_price ?? 0).toFixed(2)}
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

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle fontWeight={800}>Delete reservation?</DialogTitle>

        <DialogContent>
          <Typography>
            Are you sure you want to remove this reservation from your list?
            <br />
            <b>This action cannot be undone.</b>
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setDeleteTarget(null)}
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>

          <Button
            color="error"
            variant="contained"
            sx={{ textTransform: "none", fontWeight: 800 }}
            onClick={async () => {
              await hideReservation(deleteTarget.id);
              setDeleteTarget(null);
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!cancelTarget} onClose={() => setCancelTarget(null)}>
        <DialogTitle fontWeight={800}>Cancel reservation?</DialogTitle>

        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Are you sure you want to cancel this reservation?
          </Typography>

          <TextField
            label="Reason (optional)"
            fullWidth
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Change of plans..."
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setCancelTarget(null)}
            sx={{ textTransform: "none" }}
          >
            Keep booking
          </Button>

          <Button
            color="warning"
            variant="contained"
            sx={{ textTransform: "none", fontWeight: 800 }}
            onClick={async () => {
              const ok = await cancelReservation(cancelTarget.id, cancelReason);
              if (ok) setCancelTarget(null);
            }}
          >
            Cancel booking
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
