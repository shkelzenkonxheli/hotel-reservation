"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Box, CircularProgress, Alert, Snackbar } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import usePageTitle from "../hooks/usePageTitle";
import PublicContainer from "../components/Public/PublicContainer";
import PublicSection from "../components/Public/PublicSection";
import PublicCard from "../components/Public/PublicCard";

export default function SuccessPage() {
  const t = useTranslations("success");
  const locale = useLocale();
  usePageTitle(t("metaTitle"));

  const [reservation, setReservation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    localStorage.removeItem("booking");
    const rawToast = sessionStorage.getItem("postRedirectToast");

    if (!rawToast) return;

    try {
      const parsed = JSON.parse(rawToast);
      if (parsed?.message) {
        setToast({
          open: true,
          message: parsed.message,
          severity: parsed.severity || "success",
        });
      }
    } catch {
      // Ignore malformed temporary feedback payloads.
    } finally {
      sessionStorage.removeItem("postRedirectToast");
    }
  }, []);

  useEffect(() => {
    async function fetchReservation() {
      if (status === "unauthenticated") {
        router.push("/login");
        return;
      }

      if (status !== "authenticated") return;

      try {
        const resv = await fetch(`/api/reservation?latest=true`);
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
      <Box className="flex justify-center items-center min-h-screen">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div className="public-page min-h-screen">
      <PublicSection className="pt-14 md:pt-20">
        <PublicContainer>
          <div className="mx-auto max-w-xl text-center reveal">
            <div
              className="mx-auto flex items-center justify-center rounded-full"
              style={{
                width: 88,
                height: 88,
                background: "var(--brass-soft)",
                color: "var(--brass-deep)",
              }}
            >
              <CheckCircleOutlineIcon sx={{ fontSize: 52 }} />
            </div>

            <span className="eyebrow mt-5 inline-block">{t("metaTitle")}</span>
            <h1 className="display text-3xl md:text-4xl mt-2">{t("title")}</h1>
            <p className="text-sm md:text-base text-slate-500 mt-3">
              {t("subtitle")}
            </p>
          </div>

          <div className="mx-auto max-w-xl mt-8 space-y-5">
            <PublicCard className="p-5 md:p-6">
              <div className="flex items-start gap-3">
                <span className="badge badge-warning">{t("pendingStatus")}</span>
              </div>
              <p className="mt-3 font-semibold text-slate-800">
                {t("pendingNoticeTitle")}
              </p>
              <p className="mt-1.5 text-sm text-slate-600">
                {t("pendingNoticeBody")}
              </p>
              <div className="divider-soft my-4" />
              <p className="text-sm text-slate-600">{t("emailHint")}</p>
              <p className="mt-2 text-sm text-slate-600">{t("stayRules")}</p>
            </PublicCard>

            {reservation ? (
              <PublicCard className="p-5 md:p-6">
                <p className="eyebrow">{t("bookingDetails")}</p>
                <h3 className="display text-xl mt-1">
                  {reservation.rooms?.name}
                </h3>

                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <CalendarMonthOutlinedIcon fontSize="small" />
                    <div>
                      <div className="text-[11px] uppercase tracking-wide text-slate-400">
                        {t("checkIn")}
                      </div>
                      <div className="font-semibold text-slate-900">
                        {new Date(reservation.start_date).toLocaleDateString(locale)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <CalendarMonthOutlinedIcon fontSize="small" />
                    <div>
                      <div className="text-[11px] uppercase tracking-wide text-slate-400">
                        {t("checkOut")}
                      </div>
                      <div className="font-semibold text-slate-900">
                        {new Date(reservation.end_date).toLocaleDateString(locale)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <GroupOutlinedIcon fontSize="small" />
                    <div>
                      <div className="text-[11px] uppercase tracking-wide text-slate-400">
                        {t("guests")}
                      </div>
                      <div className="font-semibold text-slate-900">
                        {reservation.guests}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <div>
                      <div className="text-[11px] uppercase tracking-wide text-slate-400">
                        {t("status")}
                      </div>
                      <div className="font-semibold text-slate-900">
                        {t("pendingStatus")}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className="mt-4 rounded-xl px-4 py-3 flex items-center justify-between"
                  style={{ background: "var(--sand-deep)" }}
                >
                  <span className="font-semibold text-slate-800">{t("total")}</span>
                  <span className="price-value">EUR {reservation.total_price}</span>
                </div>
              </PublicCard>
            ) : (
              <PublicCard className="p-6 text-center text-sm text-slate-500">
                {t("noReservation")}
              </PublicCard>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/reservations" className="btn btn-outline btn-block">
                {t("actions.viewReservations")}
              </Link>
              <Link href="/" className="btn btn-primary btn-block">
                {t("backHome")}
              </Link>
            </div>
          </div>
        </PublicContainer>
      </PublicSection>

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
    </div>
  );
}
