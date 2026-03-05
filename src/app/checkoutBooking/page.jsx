"use client";
import { useTranslations } from "next-intl";
import { useBooking } from "@/context/BookingContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  PaymentsOutlined,
  AccountBalanceWalletOutlined,
} from "@mui/icons-material";
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
  useTheme,
  useMediaQuery,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { useSession } from "next-auth/react";
import PublicContainer from "../components/Public/PublicContainer";
import PublicSection from "../components/Public/PublicSection";
import PublicCard from "../components/Public/PublicCard";
import usePageTitle from "../hooks/usePageTitle";

export default function CheckoutBooking() {
  const t = useTranslations("checkout");
  usePageTitle(t("metaTitle"));

  const { booking } = useBooking();
  const router = useRouter();
  const { data: session, status } = useSession();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [loading, setLoading] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);

  const [fullname, setFullname] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [guests, setGuests] = useState(2);
  const [totalPrice, setTotalPrice] = useState(0);
  const [expandedRoom, setExpandedRoom] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("card");

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

  /* ---------------- PRICE CALCULATION ---------------- */
  useEffect(() => {
    if (!booking) return;

    const { room, startDate, endDate } = booking;

    const nights =
      (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24);

    if (nights <= 0) {
      router.push("/rooms");
      return;
    }

    let basePrice = Number(room.price);
    let extraPrice = 0;

    const maxGuests = room.type.toLowerCase().includes("apartment") ? 4 : 2;
    if (guests > maxGuests) setGuests(maxGuests);

    if (guests > 2) extraPrice = (guests - 2) * 20;

    setTotalPrice((basePrice + extraPrice) * nights);
  }, [booking, guests, router]);

  /* ---------------- LOADING IF NO BOOKING ---------------- */
  if (!booking) {
    return (
      <Box className="flex items-center justify-center min-h-screen">
        <CircularProgress />
      </Box>
    );
  }

  const { room, startDate, endDate } = booking;

  const nights = Math.ceil(
    (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24),
  );

  const nightlyRate = Number(room.price || 0);
  const totalFormatted = totalPrice.toFixed(2);

  /* ---------------- SUBMIT ---------------- */
  const handleBookClick = async () => {
    if (!fullname || !phone || !address) {
      alert(t("alerts.fillAllFields"));
      return;
    }

    try {
      setLoading(true);
      if (paymentMethod === "card") {
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
          alert(t("alerts.paymentInitFailed"));
        }
      } else {
        const res = await fetch("/api/reservation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: room.type,
            startDate,
            endDate,
            fullname,
            phone,
            address,
            guests,
            total_price: totalPrice,
            payment_method: "cash",
            payment_status: "UNPAID",
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          alert(data?.error || t("alerts.reservationFailed"));
          return;
        }
        alert(t("alerts.pendingCreated"));
        router.push("/success");
      }
    } catch (error) {
      console.error(error);
      alert(t("alerts.genericError"));
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
          <span className="font-semibold text-slate-900">{startDate}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>{t("summary.checkOut")}</span>
          <span className="font-semibold text-slate-900">{endDate}</span>
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
            EUR {nightlyRate.toFixed(2)} x {nights} {t("summary.nightsLower")}
          </span>
          <span className="font-semibold text-slate-900">
            EUR {(nightlyRate * nights).toFixed(2)}
          </span>
        </div>
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

      <p className="mt-4 text-xs text-slate-500">
        {t("summary.secureNote")}
      </p>
    </PublicCard>
  );

  const renderUserForm = () => (
    <PublicCard className="p-5 md:p-6">
      <div className="flex items-center justify-between mb-2">
        <Typography variant="h6" fontWeight={800}>
          {t("form.guestInformation")}
        </Typography>
        <span className="text-xs text-slate-500">{t("form.requiredFields")}</span>
      </div>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
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
          inputProps={{ min: 1 }}
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
          helperText={t("form.guestsHelper")}
        />

        <Box>
          <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>
            {t("form.paymentMethod")}
          </Typography>
          <ToggleButtonGroup
            fullWidth
            exclusive
            value={paymentMethod}
            onChange={(_, value) => value && setPaymentMethod(value)}
            size="medium"
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 1.1,
              "& .MuiToggleButtonGroup-grouped": {
                border: "1px solid #dbe3ed !important",
                borderRadius: "12px !important",
                textTransform: "none",
                justifyContent: "flex-start",
                px: 1.5,
                py: 1.2,
                minHeight: 56,
                fontWeight: 700,
                color: "#334155",
                backgroundColor: "#ffffff",
              },
              "& .Mui-selected": {
                borderColor: "#0284c7 !important",
                color: "#0369a1 !important",
                backgroundColor: "#e0f2fe !important",
                boxShadow: "inset 0 0 0 1px #0284c7",
              },
            }}
          >
            <ToggleButton value="card">
              <Box display="flex" alignItems="center" gap={1}>
                <PaymentsOutlined fontSize="small" />
                <Box textAlign="left">
                  <Typography fontSize={14} fontWeight={800}>
                    {t("payment.onlineTitle")}
                  </Typography>
                  <Typography fontSize={12} color="text.secondary">
                    {t("payment.onlineSubtitle")}
                  </Typography>
                </Box>
              </Box>
            </ToggleButton>
            <ToggleButton value="cash">
              <Box display="flex" alignItems="center" gap={1}>
                <AccountBalanceWalletOutlined fontSize="small" />
                <Box textAlign="left">
                  <Typography fontSize={14} fontWeight={800}>
                    {t("payment.cashTitle")}
                  </Typography>
                  <Typography fontSize={12} color="text.secondary">
                    {t("payment.cashSubtitle")}
                  </Typography>
                </Box>
              </Box>
            </ToggleButton>
          </ToggleButtonGroup>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mt: 1, display: "block" }}
          >
            {paymentMethod === "cash"
              ? t("payment.cashNote")
              : t("payment.cardNote")}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Button
        onClick={handleBookClick}
        variant="contained"
        size="large"
        fullWidth
        disabled={loading}
        sx={{ textTransform: "none", borderRadius: 2, fontWeight: 700 }}
      >
        {loading ? (
          <CircularProgress size={24} color="inherit" />
        ) : paymentMethod === "cash" ? (
          t("confirmCash")
        ) : (
          t("confirmAndPay")
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
                    {startDate} {t("mobile.to")} {endDate} ({nights} {t("summary.nightsLower")})
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
    </div>
  );
}
