"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Box,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
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

function canCancelReservation(reservation) {
  const status = String(reservation?.status || "").toLowerCase();
  if (status === "cancelled") return false;

  const start = new Date(reservation?.start_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return start > today;
}

function statusBadgeClass(tab) {
  if (tab === "completed") return "badge badge-ink";
  if (tab === "cancelled") return "badge badge-danger";
  return "badge badge-brass";
}

function ReservationInfoItem({ icon, label, value }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <span
        className="flex items-center justify-center rounded-full flex-shrink-0"
        style={{ width: 38, height: 38, background: "var(--brass-soft)", color: "var(--brass-deep)" }}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
          {label}
        </div>
        <div className="text-sm font-bold text-slate-900 truncate">{value}</div>
      </div>
    </div>
  );
}

function ReservationSkeleton() {
  return (
    <div className="grid gap-5">
      {[1, 2].map((i) => (
        <div key={i} className="card-lux p-3.5 flex flex-col md:flex-row gap-4">
          <div className="skeleton rounded-2xl" style={{ width: "100%", maxWidth: 220, height: 158 }} />
          <div className="flex-1 space-y-3 py-1">
            <div className="skeleton rounded" style={{ height: 20, width: "45%" }} />
            <div className="skeleton rounded" style={{ height: 14, width: "30%" }} />
            <div className="skeleton rounded" style={{ height: 14, width: "70%" }} />
            <div className="skeleton rounded" style={{ height: 40, width: "100%" }} />
          </div>
        </div>
      ))}
    </div>
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
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const router = useRouter();
  const { data: session, status } = useSession();

  const showToast = (message, severity = "error") => {
    setToast({ open: true, message, severity });
  };

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
        if (!response.ok) {
          showToast(data?.error || t("alerts.networkError"));
          setReservations([]);
          return;
        }
        setReservations(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching reservations:", err);
        showToast(t("alerts.networkError"));
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
        showToast(t("alerts.imageLoadFailed"));
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
        showToast(err.error || t("alerts.deleteFailed"));
        return;
      }
      setReservations((prev) => prev.filter((x) => x.id !== reservationId));
      showToast(t("alerts.deleteSuccess"), "success");
    } catch (e) {
      console.error(e);
      showToast(t("alerts.networkError"));
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
        showToast(data.error || t("alerts.cancelFailed"));
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

      showToast(t("alerts.cancelSuccess"), "success");

      return true;
    } catch (e) {
      console.error(e);
      showToast(t("alerts.networkError"));
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
      <div className={embedded ? "" : "public-page min-h-screen"}>
        {embedded ? (
          <ReservationSkeleton />
        ) : (
          <PublicSection className="!pt-4 md:!pt-6 !pb-12 md:!pb-16">
            <PublicContainer>
              <ReservationSkeleton />
            </PublicContainer>
          </PublicSection>
        )}
      </div>
    );
  }

  const content = (
    <>
      {!embedded ? (
        <div className="max-w-xl mb-6">
          <span className="eyebrow">{t("metaTitle")}</span>
          <h1 className="display text-2xl md:text-3xl mt-1">{t("title")}</h1>
          <p className="text-sm text-slate-500 mt-2">{t("subtitle")}</p>
        </div>
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
            minHeight: 0,
            "& .MuiTabs-indicator": { display: "none" },
            "& .MuiTabs-flexContainer": { gap: 1.25 },
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 800,
              borderRadius: 999,
              minHeight: 48,
              minWidth: 0,
              px: 2.4,
              py: 0.5,
              fontSize: "0.92rem",
              bgcolor: "var(--sand-deep)",
              color: "var(--ink-soft)",
            },
            "& .Mui-selected": {
              bgcolor: "var(--brass)",
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
        <div className="empty-state">
          <h3 className="display text-xl">{t("emptyState.title")}</h3>
          <p className="text-sm text-slate-500 mt-2">{t("emptyState.subtitle")}</p>
          <Link href="/rooms" className="btn btn-primary mt-4 inline-flex">
            {t("emptyState.cta")}
          </Link>
        </div>
      ) : (
        <div className="grid gap-5">
          {list.map((r) => {
            const roomType = r.rooms?.type;
            const img = (roomType && typeCoverMap[roomType]) || FALLBACK_IMG;
            const title = r.rooms?.name || r.rooms?.type || t("unnamedRoom");
            const locationLine = r.rooms?.room_number
              ? `${t("room")} #${r.rooms.room_number} · ${t("hotel")}`
              : r.rooms?.type || t("hotel");

            return (
              <div key={r.id} className="card-lux p-3.5">
                <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-stretch md:items-center">
                  <div
                    className="media w-full md:w-[220px] mx-auto md:mx-0 flex-shrink-0"
                    style={{ maxWidth: 260, height: 158, borderRadius: 16 }}
                  >
                    <img src={img} alt={title} className="h-full w-full object-cover" />
                  </div>

                  <div className="flex-1 min-w-0 py-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="display text-lg md:text-xl">{title}</h3>
                        <div className="flex items-center gap-1.5 mt-1 text-sm text-slate-500">
                          <LocationOnOutlinedIcon fontSize="small" />
                          <span>{locationLine}</span>
                        </div>
                      </div>

                      <span className={statusBadgeClass(tab)}>
                        {tab === "upcoming"
                          ? t("tabs.upcoming")
                          : tab === "completed"
                            ? t("tabs.completed")
                            : t("tabs.cancelled")}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4" style={{ borderTop: "1px solid var(--public-border)" }}>
                      <ReservationInfoItem
                        icon={<CalendarMonthOutlinedIcon fontSize="small" />}
                        label={t("labels.date")}
                        value={formatRange(r.start_date, r.end_date, locale)}
                      />
                      <ReservationInfoItem
                        icon={<GroupOutlinedIcon fontSize="small" />}
                        label={t("labels.guests")}
                        value={`${r.guests ?? 1} ${t("guests")}`}
                      />
                      <ReservationInfoItem
                        icon={<PaymentsOutlinedIcon fontSize="small" />}
                        label={t("labels.total")}
                        value={`EUR ${Number(r.total_price ?? 0).toFixed(2)}`}
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5 mt-4">
                      <button
                        type="button"
                        onClick={() => setDetails(r)}
                        className="btn btn-ink btn-sm"
                      >
                        {t("buttons.viewDetails")}
                      </button>

                      {canCancelReservation(r) ? (
                        <button
                          type="button"
                          onClick={() => {
                            setCancelTarget(r);
                            setCancelReason("");
                          }}
                          className="btn btn-outline btn-sm"
                        >
                          {t("buttons.cancel")}
                        </button>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => setDeleteTarget(r)}
                        className="btn btn-quiet btn-sm"
                        style={{ color: "#e11d48" }}
                      >
                        {t("buttons.delete")}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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
            <div className="space-y-2">
              <h4 className="display text-lg">{details.rooms?.name || t("unnamedRoom")}</h4>
              <div className="divider-soft" />
              <p className="text-sm">
                <b>{t("details.paymentStatus")}:</b> {details.status}
              </p>
              <p className="text-sm">
                <b>{t("details.dates")}:</b> {formatRange(details.start_date, details.end_date, locale)}
              </p>
              <p className="text-sm">
                <b>{t("details.guests")}:</b> {details.guests ?? 1}
              </p>
              <p className="text-sm">
                <b>{t("details.total")}:</b> EUR {Number(details.total_price ?? 0).toFixed(2)}
              </p>
              <p className="text-sm">
                <b>{t("details.created")}:</b>{" "}
                {details.created_at ? new Date(details.created_at).toLocaleString(locale) : "-"}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle fontWeight={800}>{t("deleteDialog.title")}</DialogTitle>
        <DialogContent>
          <p className="text-sm text-slate-600">
            {t("deleteDialog.line1")}
            <br />
            <b>{t("deleteDialog.line2")}</b>
          </p>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <button type="button" onClick={() => setDeleteTarget(null)} className="btn btn-quiet btn-sm">
            {t("buttons.cancel")}
          </button>
          <button
            type="button"
            className="btn btn-sm"
            style={{ background: "#e11d48", color: "white" }}
            onClick={async () => {
              await hideReservation(deleteTarget.id);
              setDeleteTarget(null);
            }}
          >
            {t("buttons.delete")}
          </button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!cancelTarget} onClose={() => setCancelTarget(null)}>
        <DialogTitle fontWeight={800}>{t("cancelDialog.title")}</DialogTitle>
        <DialogContent>
          <p className="text-sm text-slate-600 mb-3">{t("cancelDialog.line1")}</p>
          <TextField
            label={t("cancelDialog.reasonLabel")}
            fullWidth
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder={t("cancelDialog.reasonPlaceholder")}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <button type="button" onClick={() => setCancelTarget(null)} className="btn btn-quiet btn-sm">
            {t("cancelDialog.keepBooking")}
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={async () => {
              const ok = await cancelReservation(cancelTarget.id, cancelReason);
              if (ok) setCancelTarget(null);
            }}
          >
            {t("cancelDialog.cancelBooking")}
          </button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={toast.severity}
          variant="filled"
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          sx={{ width: "100%" }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </>
  );

  return embedded ? (
    <div>{content}</div>
  ) : (
    <div className="public-page min-h-screen">
      <PublicSection className="!pt-4 md:!pt-6 !pb-12 md:!pb-16">
        <PublicContainer>{content}</PublicContainer>
      </PublicSection>
    </div>
  );
}
