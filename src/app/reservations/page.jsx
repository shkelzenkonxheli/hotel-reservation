"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
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
  Breadcrumbs,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import PublicContainer from "../components/Public/PublicContainer";
import PublicSection from "../components/Public/PublicSection";
import PublicCard from "../components/Public/PublicCard";
import usePageTitle from "../hooks/usePageTitle";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1501117716987-c8e2a5d4d3f4?auto=format&fit=crop&w=1400&q=80";

function formatRange(start, end, locale) {
  const s = new Date(start);
  const e = new Date(end);
  const opts = { month: "short", day: "2-digit", year: "numeric" };
  return `${s.toLocaleDateString(locale, opts)} - ${e.toLocaleDateString(locale, opts)}`;
}

function isCompleted(endDate) {
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return end < today;
}

function getStatusTone(tab) {
  if (tab === "completed") {
    return { bg: "#e8edff", color: "#4f46e5" };
  }
  if (tab === "cancelled") {
    return { bg: "#ffe4e6", color: "#e11d48" };
  }
  return { bg: "#e0f2fe", color: "#0369a1" };
}

function ReservationInfoItem({ icon, label, value }) {
  return (
    <Stack direction="row" spacing={1.1} alignItems="center" sx={{ minWidth: { sm: 140 } }}>
      <Box
        sx={{
          width: 38,
          height: 38,
          borderRadius: "50%",
          display: "grid",
          placeItems: "center",
          bgcolor: "#f3f7fb",
          color: "#0b7fab",
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}
        >
          {label}
        </Typography>
        <Typography variant="body1" fontWeight={700}>
          {value}
        </Typography>
      </Box>
    </Stack>
  );
}

export default function ReservationsPage({ embedded = false }) {
  const pathname = usePathname();
  const t = useTranslations("reservations");
  const locale = useLocale();
  usePageTitle(!embedded && pathname === "/reservations" ? t("metaTitle") : "");

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
        const response = await fetch(`/api/reservation?user_id=${userId}&role=client`);
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
        alert(err.error || t("alerts.deleteFailed"));
        return;
      }
      setReservations((prev) => prev.filter((x) => x.id !== reservationId));
    } catch (e) {
      console.error(e);
      alert(t("alerts.networkError"));
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
        alert(data.error || t("alerts.cancelFailed"));
        return false;
      }

      setReservations((prev) =>
        prev.map((x) =>
          x.id === reservationId
            ? {
                ...x,
                cancelled_at: new Date().toISOString(),
                cancel_reason: reason || null,
                status: "cancelled",
              }
            : x,
        ),
      );

      return true;
    } catch (e) {
      console.error(e);
      alert(t("alerts.networkError"));
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
    () => reservations.filter((r) => String(r.status).toLowerCase() === "cancelled"),
    [reservations],
  );

  const list = tab === "upcoming" ? upcoming : tab === "completed" ? completed : cancelled;

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: embedded ? 4 : 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  const content = (
    <>
      {!embedded ? (
        <Box sx={{ maxWidth: 720, mb: 4 }}>
          <Typography
            variant="h4"
            fontWeight={900}
            sx={{ fontSize: { xs: "1.55rem", md: "1.95rem" }, mb: 1.25 }}
          >
            {t("title")}
          </Typography>
        </Box>
      ) : null}

      {reservations.length > 0 ? (
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            mb: 4,
            "& .MuiTabs-indicator": { display: "none" },
            "& .MuiTabs-flexContainer": { gap: 1.25 },
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 800,
              borderRadius: 999,
              minHeight: 40,
              minWidth: 0,
              px: 2.2,
              py: 0.5,
              fontSize: { xs: "0.92rem", md: "0.95rem" },
              bgcolor: "#f1f5f9",
              color: "#475569",
            },
            "& .Mui-selected": {
              bgcolor: "#0b7fab",
              color: "white !important",
            },
          }}
        >
          <Tab value="upcoming" label={`${t("tabs.upcoming")} (${upcoming.length})`} />
          <Tab value="completed" label={`${t("tabs.completed")} (${completed.length})`} />
          <Tab value="cancelled" label={`${t("tabs.cancelled")} (${cancelled.length})`} />
        </Tabs>
      ) : null}

      {list.length === 0 ? (
        <PublicCard className="p-8 text-center">
          <Typography variant="h6" fontWeight={800}>
            {t("empty")}
          </Typography>
        </PublicCard>
      ) : (
        <Stack spacing={2.5}>
          {list.map((r) => {
            const roomType = r.rooms?.type;
            const img = (roomType && typeCoverMap[roomType]) || FALLBACK_IMG;
            const title = r.rooms?.name || r.rooms?.type || t("unnamedRoom");
            const statusTone = getStatusTone(tab);
            const locationLine = r.rooms?.room_number
              ? `${t("room")} #${r.rooms.room_number} · ${t("hotel")}`
              : r.rooms?.type || t("hotel");

            return (
              <PublicCard
                key={r.id}
                className="overflow-hidden"
                style={{
                  padding: "14px",
                  borderRadius: "20px",
                  border: "none",
                  boxShadow: "0 18px 40px rgba(15,23,42,0.05)",
                }}
              >
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={{ xs: 2, md: 3 }}
                  alignItems={{ xs: "stretch", md: "center" }}
                >
                  <Box
                    sx={{
                      width: { xs: "100%", md: 220 },
                      maxWidth: { xs: 260, md: "none" },
                      mx: { xs: "auto", md: 0 },
                      height: { xs: 158, md: 150 },
                      borderRadius: 3.5,
                      overflow: "hidden",
                      flexShrink: 0,
                      border: "1px solid #e8eef5",
                      backgroundColor: "#f8fafc",
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

                  <Box
                    sx={{
                      flexGrow: 1,
                      minWidth: 0,
                      py: { xs: 0.75, md: 1 },
                      px: { xs: 0.25, md: 0.25 },
                    }}
                  >
                    <Stack direction={{ xs: "column", lg: "row" }} spacing={2} justifyContent="space-between">
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          justifyContent="space-between"
                          alignItems={{ xs: "flex-start", sm: "center" }}
                          spacing={1.5}
                        >
                          <Box>
                            <Typography
                              variant="h5"
                              fontWeight={900}
                              sx={{ fontSize: { xs: "1.35rem", md: "1.65rem" } }}
                            >
                              {title}
                            </Typography>
                            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.5 }}>
                              <LocationOnOutlinedIcon fontSize="small" />
                              <Typography variant="body2" color="text.secondary">
                                {locationLine}
                              </Typography>
                            </Stack>
                          </Box>

                          <Chip
                            label={
                              tab === "upcoming"
                                ? t("tabs.upcoming")
                                : tab === "completed"
                                  ? t("tabs.completed")
                                  : t("tabs.cancelled")
                            }
                            size="small"
                            sx={{
                              borderRadius: 999,
                              fontWeight: 800,
                              alignSelf: { xs: "flex-start", sm: "center" },
                              bgcolor: statusTone.bg,
                              color: statusTone.color,
                            }}
                          />
                        </Stack>

                        <Stack
                          direction={{ xs: "column", md: "row" }}
                          divider={
                            <Divider
                              flexItem
                              orientation="vertical"
                              sx={{
                                display: { xs: "none", md: "block" },
                                borderColor: "#e5e7eb",
                              }}
                            />
                          }
                          spacing={{ xs: 1.5, md: 0 }}
                          sx={{ mt: 2.75, pt: 2.25, borderTop: "1px solid #eef2f7" }}
                        >
                          <Box sx={{ pr: { md: 2.5 } }}>
                            <ReservationInfoItem
                              icon={<CalendarMonthOutlinedIcon fontSize="small" />}
                              label={t("labels.date")}
                              value={formatRange(r.start_date, r.end_date, locale)}
                            />
                          </Box>
                          <Box sx={{ px: { md: 2.5 } }}>
                            <ReservationInfoItem
                              icon={<GroupOutlinedIcon fontSize="small" />}
                              label={t("labels.guests")}
                              value={`${r.guests ?? 1} ${t("guests")}`}
                            />
                          </Box>
                          <Box sx={{ pl: { md: 2.5 } }}>
                            <ReservationInfoItem
                              icon={<PaymentsOutlinedIcon fontSize="small" />}
                              label={t("labels.total")}
                              value={`EUR ${Number(r.total_price ?? 0).toFixed(2)}`}
                            />
                          </Box>
                        </Stack>

                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          spacing={1.25}
                          alignItems={{ xs: "stretch", sm: "center" }}
                          sx={{ mt: 2.75, pt: 0.25 }}
                        >
                          <Button
                            variant="contained"
                            onClick={() => setDetails(r)}
                            sx={{
                              borderRadius: 999,
                              textTransform: "none",
                              fontWeight: 800,
                              px: 2.75,
                              bgcolor: "#0b7fab",
                              "&:hover": { bgcolor: "#086d93" },
                            }}
                          >
                            {t("buttons.viewDetails")}
                          </Button>

                          <Button
                            variant="outlined"
                            onClick={() => {
                              setCancelTarget(r);
                              setCancelReason("");
                            }}
                            disabled={!!r.cancelled_at}
                            sx={{
                              borderRadius: 999,
                              textTransform: "none",
                              fontWeight: 800,
                              px: 2.75,
                              borderColor: "#cbd5e1",
                              color: "#334155",
                            }}
                          >
                            {t("buttons.cancel")}
                          </Button>

                          <Button
                            color="error"
                            variant="text"
                            onClick={() => setDeleteTarget(r)}
                            sx={{
                              textTransform: "none",
                              fontWeight: 800,
                              alignSelf: { xs: "stretch", sm: "center" },
                            }}
                          >
                            {t("buttons.delete")}
                          </Button>
                        </Stack>
                      </Box>
                    </Stack>
                  </Box>
                </Stack>
              </PublicCard>
            );
          })}
        </Stack>
      )}

      <Dialog
        open={!!details}
        onClose={() => setDetails(null)}
        PaperProps={{ sx: { borderRadius: 3, width: 640, maxWidth: "95vw" } }}
      >
        <DialogTitle sx={{ pr: 6, fontWeight: 900 }}>
          {t("details.title")}
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
                {details.rooms?.name || t("unnamedRoom")}
              </Typography>
              <Divider />
              <Typography variant="body2">
                <b>{t("details.paymentStatus")}:</b> {details.status}
              </Typography>
              <Typography variant="body2">
                <b>{t("details.dates")}:</b> {formatRange(details.start_date, details.end_date, locale)}
              </Typography>
              <Typography variant="body2">
                <b>{t("details.guests")}:</b> {details.guests ?? 1}
              </Typography>
              <Typography variant="body2">
                <b>{t("details.total")}:</b> EUR {Number(details.total_price ?? 0).toFixed(2)}
              </Typography>
              <Typography variant="body2">
                <b>{t("details.created")}:</b>{" "}
                {details.created_at ? new Date(details.created_at).toLocaleString(locale) : "-"}
              </Typography>
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle fontWeight={800}>{t("deleteDialog.title")}</DialogTitle>
        <DialogContent>
          <Typography>
            {t("deleteDialog.line1")}
            <br />
            <b>{t("deleteDialog.line2")}</b>
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} sx={{ textTransform: "none" }}>
            {t("buttons.cancel")}
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
            {t("buttons.delete")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!cancelTarget} onClose={() => setCancelTarget(null)}>
        <DialogTitle fontWeight={800}>{t("cancelDialog.title")}</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>{t("cancelDialog.line1")}</Typography>
          <TextField
            label={t("cancelDialog.reasonLabel")}
            fullWidth
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder={t("cancelDialog.reasonPlaceholder")}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCancelTarget(null)} sx={{ textTransform: "none" }}>
            {t("cancelDialog.keepBooking")}
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
            {t("cancelDialog.cancelBooking")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );

  return embedded ? (
    <Box>{content}</Box>
  ) : (
    <Box className="public-page min-h-screen">
      <PublicSection className="pt-2 md:pt-4">
        <PublicContainer>{content}</PublicContainer>
      </PublicSection>
    </Box>
  );
}
