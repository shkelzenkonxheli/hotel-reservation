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
  MenuItem,
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
  IconButton,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
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
  const [stayStartDate, setStayStartDate] = useState("");
  const [stayEndDate, setStayEndDate] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [pricingRoom, setPricingRoom] = useState(null);
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
      year: "2-digit",
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
    setPricingRoom(booking.room || null);
  }, [booking]);

  const startDate = stayStartDate || booking?.startDate || "";
  const endDate = stayEndDate || booking?.endDate || "";

  useEffect(() => {
    if (!booking?.room?.type || !startDate || !endDate) return;

    let active = true;

    async function loadPricingRoom() {
      try {
        const params = new URLSearchParams({
          start_date: startDate,
          end_date: endDate,
        });

        const res = await fetch(`/api/rooms-type?${params.toString()}`);
        const data = await res.json();

        if (!active || !res.ok || !Array.isArray(data)) return;

        const matchedRoom = data.find((item) => item.type === booking.room.type);
        if (matchedRoom) {
          setPricingRoom((prev) => ({
            ...(prev || booking.room),
            ...matchedRoom,
          }));
        }
      } catch (error) {
        console.error("Failed to refresh checkout room pricing:", error);
      }
    }

    loadPricingRoom();

    return () => {
      active = false;
    };
  }, [booking, startDate, endDate]);

  /* ---------------- GUEST NORMALIZATION ---------------- */
  useEffect(() => {
    if (!booking) return;

    const room = pricingRoom || booking.room;
    const normalizedGuests = clampGuests(room, guests);

    if (normalizedGuests !== guests) {
      setGuests(normalizedGuests);
    }
  }, [booking, guests, pricingRoom]);

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

  const room = pricingRoom || booking.room;

  const nights = Math.ceil(
    (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24),
  );

  const adjustedNightlyRate = calculateNightlyRate(room, guests);
  const { includedGuests, maxGuests, extraGuestPrice } = getRoomCapacityConfig(room);
  const originalNightlyRate = calculateNightlyRate(
    {
      ...room,
      effective_price: room.original_price ?? room.price,
    },
    guests,
  );
  const hasDiscount =
    Boolean(room?.has_discount) &&
    Number(originalNightlyRate) > Number(adjustedNightlyRate);
  const finalStayTotal = adjustedNightlyRate * nights;
  const originalStayTotal = originalNightlyRate * nights;
  const totalFormatted = finalStayTotal.toFixed(2);
  const savingsTotal = hasDiscount
    ? originalStayTotal - finalStayTotal
    : 0;

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
          total_price: finalStayTotal,
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

  const canConfirm =
    !loading && !availability.loading && availability.available && acceptedTerms;

  const inputSx = {
    "& .MuiOutlinedInput-root": { borderRadius: "12px" },
  };

  const renderSteps = () => (
    <div className="steps mb-2" role="list" aria-label={t("title")}>
      <div className="step done">
        <span className="step-dot" />
        {t("steps.dates")}
      </div>
      <span className="step-sep" />
      <div className="step done">
        <span className="step-dot" />
        {t("steps.room")}
      </div>
      <span className="step-sep" />
      <div className="step active">
        <span className="step-dot" />
        {t("steps.details")}
      </div>
      <span className="step-sep" />
      <div className="step">
        <span className="step-dot" />
        {t("steps.confirm")}
      </div>
    </div>
  );

  const renderSummaryCard = () => (
    <PublicCard className="p-5 md:p-6">
      <div className="media aspect-[4/3] w-full overflow-hidden rounded-2xl">
        <img
          src={room.images?.[0] || "/placeholder.jpg"}
          alt={room.name}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="mt-4">
        <Typography variant="h6" fontWeight={800} className="display">
          {room.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {getFirstLine(room.description)}
        </Typography>
        {Array.isArray(room.amenities) && room.amenities.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {room.amenities.map((amenity) => (
              <span key={amenity} className="amenity">
                {amenity}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="divider-soft my-4" />

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

      <div className="divider-soft my-4" />

      <div className="space-y-2">
        <Typography variant="subtitle2" fontWeight={700}>
          {t("summary.priceBreakdown")}
        </Typography>
        {hasDiscount ? (
          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>{t("summary.originalRate")}</span>
            <span className="price-old">EUR {originalStayTotal.toFixed(2)}</span>
          </div>
        ) : null}
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>
            {(hasDiscount
              ? room.special_rate?.label || t("summary.discountedRate")
              : t("summary.currentRate"))}{" "}
            - EUR{" "}
            {adjustedNightlyRate.toFixed(2)} x {nights} {t("summary.nightsLower")}
          </span>
          <span className="font-semibold" style={{ color: "var(--brass-deep)" }}>
            EUR {finalStayTotal.toFixed(2)}
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
        {hasDiscount ? (
          <span className="badge badge-brass" style={{ display: "inline-block", marginTop: 4 }}>
            {t("summary.savings", { amount: savingsTotal.toFixed(2) })}
          </span>
        ) : null}
      </div>

      <div className="mt-4 rounded-xl px-4 py-3" style={{ background: "var(--sand-deep)" }}>
        <div className="flex items-center justify-between">
          <Typography variant="subtitle1" fontWeight={800}>
            {t("summary.total")}
          </Typography>
          <span className="price-value" style={{ fontSize: "1.35rem" }}>
            EUR {totalFormatted}
          </span>
        </div>
      </div>

      <p className="mt-4 text-xs text-slate-500">{t("summary.secureNote")}</p>
    </PublicCard>
  );

  const renderUserForm = () => (
    <PublicCard className="p-5 md:p-6">
      <div className="flex items-center justify-between mb-1">
        <Typography variant="h6" fontWeight={800} className="display">
          {t("form.guestInformation")}
        </Typography>
        <span className="text-xs text-slate-500">
          {t("form.requiredFields")}
        </span>
      </div>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
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
            sx={inputSx}
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
            sx={inputSx}
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

        <div className="rule" />

        <TextField
          label={t("form.fullName")}
          value={fullname}
          onChange={(e) => setFullname(e.target.value)}
          helperText={t("form.fullNameHelper")}
          sx={inputSx}
        />
        <TextField
          label={t("form.phone")}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          helperText={t("form.phoneHelper")}
          sx={inputSx}
        />
        <TextField
          label={t("form.address")}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          helperText={t("form.addressHelper")}
          sx={inputSx}
        />
        <TextField
          label={t("form.guests")}
          select
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
          helperText={`${t("form.guestsHelper")} (${includedGuests}-${maxGuests})`}
          sx={inputSx}
        >
          {Array.from({ length: maxGuests }, (_, index) => index + 1).map(
            (guestCount) => (
              <MenuItem key={guestCount} value={guestCount}>
                {guestCount}
              </MenuItem>
            ),
          )}
        </TextField>
      </Box>

      <div className="divider-soft my-6" />

      <div className="mb-5 rounded-2xl px-4 py-3" style={{ background: "var(--sand-deep)", border: "1px solid var(--public-border)" }}>
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
                className="font-semibold underline underline-offset-4"
                style={{ color: "var(--brass-deep)" }}
              >
                {t("form.termsLink")}
              </Link>{" "}
              {t("form.and")}{" "}
              <Link
                href="/privacy-policy"
                target="_blank"
                className="font-semibold underline underline-offset-4"
                style={{ color: "var(--brass-deep)" }}
              >
                {t("form.privacyLink")}
              </Link>
              .
            </Typography>
          }
        />
      </div>

      <button
        type="button"
        onClick={handleBookClick}
        disabled={!canConfirm}
        className="btn btn-primary btn-lg btn-block hidden md:inline-flex"
      >
        {loading ? <CircularProgress size={22} color="inherit" /> : t("confirmCash")}
      </button>
    </PublicCard>
  );

  /* ---------------- RENDER ---------------- */
  return (
    <div className="public-page min-h-screen pb-28 md:pb-0">
      <PublicSection className="pt-10">
        <PublicContainer>
          <div className="max-w-3xl">
            <span className="eyebrow">{t("metaTitle")}</span>
            <h2 className="display text-3xl md:text-4xl mt-2">
              {t("title")}
            </h2>
            <p className="text-sm md:text-base text-slate-500 mt-2">
              {t("subtitle")}
            </p>
          </div>

          {renderSteps()}

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr] items-start">
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

                  <div className="divider-soft my-3" />

                  <div className="space-y-2">
                    {hasDiscount ? (
                      <div className="flex items-center justify-between text-sm text-slate-500">
                        <span>{t("summary.originalRate")}</span>
                        <span className="price-old">
                          EUR {originalStayTotal.toFixed(2)}
                        </span>
                      </div>
                    ) : null}

                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>
                        {hasDiscount
                          ? room.special_rate?.label || t("summary.discountedRate")
                          : t("summary.currentRate")}
                      </span>
                      <span className="font-semibold" style={{ color: "var(--brass-deep)" }}>
                        EUR {finalStayTotal.toFixed(2)}
                      </span>
                    </div>

                    {hasDiscount ? (
                      <span className="badge badge-brass">
                        {t("summary.savings", { amount: savingsTotal.toFixed(2) })}
                      </span>
                    ) : null}

                    <Typography fontWeight="bold" sx={{ color: "var(--brass-deep)" }}>
                      {t("summary.total")}: EUR {totalFormatted}
                    </Typography>
                  </div>

                  <button
                    type="button"
                    className="btn btn-outline btn-block mt-3"
                    onClick={() => setOpenDetails(true)}
                  >
                    {t("mobile.viewSummary")}
                  </button>

                  <Dialog
                    open={openDetails}
                    onClose={() => setOpenDetails(false)}
                    fullWidth
                    maxWidth="sm"
                  >
                    <DialogTitle
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        pr: 1,
                      }}
                    >
                      {t("mobile.bookingSummary")}
                      <IconButton
                        aria-label={t("close")}
                        onClick={() => setOpenDetails(false)}
                        size="small"
                      >
                        <CloseRoundedIcon fontSize="small" />
                      </IconButton>
                    </DialogTitle>
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

      {/* Mobile fixed bottom action bar */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between gap-3 px-4 py-3"
        style={{
          background: "rgba(251,248,243,0.97)",
          borderTop: "1px solid var(--public-border)",
          backdropFilter: "blur(6px)",
          boxShadow: "0 -8px 24px rgba(11,29,40,0.08)",
        }}
      >
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">
            {t("summary.total")}
          </div>
          <div className="price-value" style={{ fontSize: "1.15rem" }}>
            EUR {totalFormatted}
          </div>
        </div>
        <button
          type="button"
          onClick={handleBookClick}
          disabled={!canConfirm}
          className="btn btn-primary btn-lg"
          style={{ flexShrink: 0 }}
        >
          {loading ? <CircularProgress size={20} color="inherit" /> : t("confirmCash")}
        </button>
      </div>

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
