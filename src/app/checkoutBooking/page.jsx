"use client";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { useBooking } from "@/context/BookingContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  Snackbar,
  Alert,
  useTheme,
  useMediaQuery,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { useSession } from "next-auth/react";
import PublicContainer from "../components/Public/PublicContainer";
import PublicSection from "../components/Public/PublicSection";
import PublicCard from "../components/Public/PublicCard";
import usePageTitle from "../hooks/usePageTitle";
import {
  calculateNightlyRate,
  calculateReservationTotal,
  clampGuests,
  getRoomCapacityConfig,
} from "@/lib/pricing";

export default function CheckoutBooking() {
  const t = useTranslations("checkout");
  const locale = useLocale();
  usePageTitle(t("metaTitle"));

  const { booking, setBooking } = useBooking();
  const router = useRouter();
  const { data: session, status } = useSession();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [loading, setLoading] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [toast, setToast] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const [fullname, setFullname] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [guests, setGuests] = useState(2);
  const [totalPrice, setTotalPrice] = useState(0);
  const [expandedRoom, setExpandedRoom] = useState(null);
  const [stayStartDate, setStayStartDate] = useState("");
  const [stayEndDate, setStayEndDate] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [availability, setAvailability] = useState({
    loading: false,
    available: true,
    message: "",
  });

  const showToast = (message, severity = "error") => {
    setToast({ open: true, message, severity });
  };

  const formatDisplayDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

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

  useEffect(() => {
    if (!booking) return;
    setStayStartDate(booking.startDate || "");
    setStayEndDate(booking.endDate || "");
  }, [booking]);

  /* ---------------- PRICE CALCULATION ---------------- */
  useEffect(() => {
    if (!booking) return;

    const { room } = booking;
    const startDate = stayStartDate || booking.startDate;
    const endDate = stayEndDate || booking.endDate;

    const nights =
      (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24);

    if (nights <= 0) {
      setTotalPrice(0);
      return;
    }

    const normalizedGuests = clampGuests(room, guests);
    if (normalizedGuests !== guests) setGuests(normalizedGuests);
    setTotalPrice(calculateReservationTotal(room, normalizedGuests, startDate, endDate));
  }, [booking, guests, stayStartDate, stayEndDate]);

  useEffect(() => {
    if (!booking || !stayStartDate || !stayEndDate) return;
    if (
      booking.startDate === stayStartDate &&
      booking.endDate === stayEndDate
    ) {
      return;
    }

    setBooking({
      ...booking,
      startDate: stayStartDate,
      endDate: stayEndDate,
    });
  }, [booking, setBooking, stayStartDate, stayEndDate]);

  const startDate = stayStartDate || booking?.startDate || "";
  const endDate = stayEndDate || booking?.endDate || "";

  useEffect(() => {
    if (!booking) return;
    if (!startDate || !endDate) {
      setAvailability({
        loading: false,
        available: false,
        message: t("availability.selectDatesFirst"),
      });
      return;
    }

    const nights =
      (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24);

    if (nights <= 0) {
      setAvailability({
        loading: false,
        available: false,
        message: t("alerts.invalidDates"),
      });
      return;
    }

    let active = true;

    async function checkAvailability() {
      try {
        setAvailability({
          loading: true,
          available: false,
          message: t("availability.checking"),
        });

        const res = await fetch(
          `/api/reservation?room_type=${booking.room.type}&start_date=${startDate}&end_date=${endDate}`,
        );
        const data = await res.json();

        if (!active) return;

        if (!res.ok) {
          setAvailability({
            loading: false,
            available: false,
            message: data?.error || t("availability.unavailable"),
          });
          return;
        }

        setAvailability({
          loading: false,
          available: Boolean(data?.available),
          message: data?.available ? "" : t("availability.unavailable"),
        });
      } catch {
        if (!active) return;
        setAvailability({
          loading: false,
          available: false,
          message: t("availability.checkFailed"),
        });
      }
    }

    checkAvailability();
    return () => {
      active = false;
    };
  }, [booking, startDate, endDate, t]);

  /* ---------------- LOADING IF NO BOOKING ---------------- */
  if (!booking) {
    return (
      <Box className="flex items-center justify-center min-h-screen">
        <CircularProgress />
      </Box>
    );
  }

  const { room } = booking;

  const nights = Math.ceil(
    (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24),
  );

  const adjustedNightlyRate = calculateNightlyRate(room, guests);
  const totalFormatted = totalPrice.toFixed(2);
  const { includedGuests, maxGuests, extraGuestPrice } = getRoomCapacityConfig(room);

  /* ---------------- SUBMIT ---------------- */
  const handleBookClick = async () => {
    if (!fullname || !phone || !address) {
      showToast(t("alerts.fillAllFields"));
      return;
    }

    if (!startDate || !endDate || nights <= 0) {
      showToast(t("alerts.invalidDates"));
      return;
    }

    if (startDate < new Date().toISOString().split("T")[0]) {
      showToast(t("alerts.pastDate"));
      return;
    }

    if (!availability.available) {
      showToast(availability.message || t("availability.unavailable"));
      return;
    }

    if (!acceptedTerms) {
      showToast(t("alerts.acceptTerms"));
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/reservation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: room.type,
          startDate,
          endDate,
          fullname,
          email: session?.user?.email || "",
          phone,
          address,
          guests,
          total_price: totalPrice,
          payment_method: "cash",
          payment_status: "UNPAID",
          locale,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data?.error || t("alerts.reservationFailed"));
        return;
      }
      sessionStorage.setItem(
        "postRedirectToast",
        JSON.stringify({
          message: t("alerts.pendingCreated"),
          severity: "success",
        }),
      );
      router.push("/success");
    } catch (error) {
      console.error(error);
      showToast(t("alerts.genericError"));
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- HELPERS ---------------- */
  const getFirstLine = (text) => {
    if (!text) return "";
    return text.split("\n")[0];
  };

  const renderSummaryCard = () => (
    <PublicCard className="p-5 md:p-6">
      <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl">
        <img
          src={room.images?.[0] || "/placeholder.jpg"}
          alt={room.name}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="mt-4">
        <Typography variant="h6" fontWeight={800}>
          {room.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {getFirstLine(room.description)}
        </Typography>
        {Array.isArray(room.amenities) && room.amenities.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {room.amenities.map((amenity) => (
              <span
                key={amenity}
                className="text-xs px-2.5 py-1 rounded-full border border-slate-200 text-slate-700 bg-slate-50"
              >
                {amenity}
              </span>
            ))}
          </div>
        ) : null}
        <button
          className="text-slate-700 text-sm mt-2 underline underline-offset-4"
          onClick={() => setExpandedRoom(room)}
        >
          {t("viewDetails")}
        </button>
      </div>

      <Divider sx={{ my: 2 }} />

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>{t("summary.checkIn")}</span>
          <span className="font-semibold text-slate-900">
            {formatDisplayDate(startDate)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>{t("summary.checkOut")}</span>
          <span className="font-semibold text-slate-900">
            {formatDisplayDate(endDate)}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>{t("summary.nights")}</span>
          <span className="font-semibold text-slate-900">{nights}</span>
        </div>
      </div>

      <Divider sx={{ my: 2 }} />

      <div className="space-y-2">
        <Typography variant="subtitle2" fontWeight={700}>
          {t("summary.priceBreakdown")}
        </Typography>
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>
            EUR {adjustedNightlyRate.toFixed(2)} x {nights} {t("summary.nightsLower")}
          </span>
          <span className="font-semibold text-slate-900">
            EUR {(adjustedNightlyRate * nights).toFixed(2)}
          </span>
        </div>
        {extraGuestPrice > 0 && maxGuests > includedGuests ? (
          <Typography variant="caption" color="text.secondary">
            {t("summary.guestPricing", {
              included: includedGuests,
              price: Number(extraGuestPrice).toFixed(2),
              max: maxGuests,
            })}
          </Typography>
        ) : null}
      </div>

      <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <Typography variant="subtitle1" fontWeight={800}>
            {t("summary.total")}
          </Typography>
          <Typography variant="h6" fontWeight={900} color="success.main">
            EUR {totalFormatted}
          </Typography>
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-500">{t("summary.secureNote")}</p>
    </PublicCard>
  );

  const renderUserForm = () => (
    <PublicCard className="p-5 md:p-6">
      <div className="flex items-center justify-between mb-2">
        <Typography variant="h6" fontWeight={800}>
          {t("form.guestInformation")}
        </Typography>
        <span className="text-xs text-slate-500">
          {t("form.requiredFields")}
        </span>
      </div>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          {t("form.changeDatesHint")}
        </Alert>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 2,
          }}
        >
          <TextField
            label={t("summary.checkIn")}
            type="date"
            value={startDate}
            onChange={(e) => setStayStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: new Date().toISOString().split("T")[0] }}
          />
          <TextField
            label={t("summary.checkOut")}
            type="date"
            value={endDate}
            onChange={(e) => setStayEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={{
              min: startDate || new Date().toISOString().split("T")[0],
            }}
          />
        </Box>
        {(availability.loading || availability.message) && (
          <Alert
            severity={availability.loading ? "info" : "warning"}
            sx={{ borderRadius: 2 }}
          >
            {availability.message}
          </Alert>
        )}
        <TextField
          label={t("form.fullName")}
          value={fullname}
          onChange={(e) => setFullname(e.target.value)}
          helperText={t("form.fullNameHelper")}
        />
        <TextField
          label={t("form.phone")}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          helperText={t("form.phoneHelper")}
        />
        <TextField
          label={t("form.address")}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          helperText={t("form.addressHelper")}
        />
        <TextField
          label={t("form.guests")}
          type="number"
          inputProps={{ min: 1, max: maxGuests }}
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
          helperText={`${t("form.guestsHelper")} (${includedGuests}-${maxGuests})`}
        />

      </Box>

      <Divider sx={{ my: 3 }} />

      <Box
        sx={{
          mb: 2.25,
          px: 0.5,
          py: 1.25,
          borderRadius: 2,
          backgroundColor: "#f8fafc",
          border: "1px solid #e2e8f0",
        }}
      >
        <FormControlLabel
          sx={{ alignItems: "flex-start", m: 0 }}
          control={
            <Checkbox
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              sx={{ pt: 0.2, pr: 1.25 }}
            />
          }
          label={
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
              {t("form.acceptPrefix")}{" "}
              <Link
                href="/terms-conditions"
                target="_blank"
                className="font-semibold text-[#1f6feb] underline underline-offset-4"
              >
                {t("form.termsLink")}
              </Link>{" "}
              {t("form.and")}{" "}
              <Link
                href="/privacy-policy"
                target="_blank"
                className="font-semibold text-[#1f6feb] underline underline-offset-4"
              >
                {t("form.privacyLink")}
              </Link>
              .
            </Typography>
          }
        />
      </Box>

      <Button
        onClick={handleBookClick}
        variant="contained"
        size="large"
        fullWidth
        disabled={
          loading ||
          availability.loading ||
          !availability.available ||
          !acceptedTerms
        }
        sx={{ textTransform: "none", borderRadius: 2, fontWeight: 700 }}
      >
        {loading ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          t("confirmCash")
        )}
      </Button>
    </PublicCard>
  );

  /* ---------------- RENDER ---------------- */
  return (
    <div className="public-page min-h-screen">
      <PublicSection className="pt-10">
        <PublicContainer>
          <div className="max-w-3xl">
            <h2 className="text-3xl md:text-4xl font-semibold mt-3">
              {t("title")}
            </h2>
            <p className="text-sm md:text-base text-slate-500 mt-2">
              {t("subtitle")}
            </p>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] items-start">
            <div className="space-y-6">
              {isMobile ? (
                <PublicCard className="p-4">
                  <Typography variant="h6" fontWeight="bold">
                    {room.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDisplayDate(startDate)} {t("mobile.to")}{" "}
                    {formatDisplayDate(endDate)} ({nights}{" "}
                    {t("summary.nightsLower")})
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  <Typography fontWeight="bold" color="success.main">
                    {t("summary.total")}: EUR {totalFormatted}
                  </Typography>

                  <Button
                    fullWidth
                    sx={{ mt: 2, textTransform: "none", borderRadius: 2 }}
                    variant="outlined"
                    onClick={() => setOpenDetails(true)}
                  >
                    {t("mobile.viewSummary")}
                  </Button>

                  <Dialog
                    open={openDetails}
                    onClose={() => setOpenDetails(false)}
                    fullWidth
                    maxWidth="sm"
                  >
                    <DialogTitle>{t("mobile.bookingSummary")}</DialogTitle>
                    <DialogContent
                      sx={{ maxHeight: "70vh", overflowY: "auto", pb: 4 }}
                    >
                      {renderSummaryCard()}
                    </DialogContent>
                  </Dialog>
                </PublicCard>
              ) : null}

              {renderUserForm()}
            </div>

            <div className="hidden lg:block lg:sticky lg:top-24">
              {renderSummaryCard()}
            </div>
          </div>
        </PublicContainer>
      </PublicSection>

      {expandedRoom && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="public-card p-6 max-w-lg w-full relative">
            <button
              className="absolute top-3 right-3 text-slate-500"
              onClick={() => setExpandedRoom(null)}
            >
              {t("close")}
            </button>
            <h2 className="text-xl font-semibold mb-4">{expandedRoom.name}</h2>
            <p className="text-slate-600 text-sm">{expandedRoom.description}</p>
            {Array.isArray(expandedRoom.amenities) &&
            expandedRoom.amenities.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {expandedRoom.amenities.map((amenity) => (
                  <span
                    key={amenity}
                    className="text-xs px-2.5 py-1 rounded-full border border-slate-200 text-slate-700 bg-slate-50"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      )}

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
