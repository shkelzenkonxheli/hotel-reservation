"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Box,
  Button,
  Snackbar,
  Alert,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { EmailOutlined, PhoneOutlined, PlaceOutlined, AccessTimeOutlined } from "@mui/icons-material";
import PublicContainer from "../components/Public/PublicContainer";
import PublicSection from "../components/Public/PublicSection";
import PublicCard from "../components/Public/PublicCard";
import DeferredTurnstile from "../components/Public/DeferredTurnstile";
import usePageTitle from "../hooks/usePageTitle";

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    backgroundColor: "#ffffff",
    "& fieldset": { borderColor: "var(--public-border)" },
    "&:hover fieldset": { borderColor: "var(--brass-soft)" },
    "&.Mui-focused fieldset": { borderColor: "var(--brass)", borderWidth: 2 },
  },
};

export default function ContactPage() {
  const t = useTranslations("contact");
  usePageTitle(t("metaTitle"));
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [feedback, setFeedback] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showFeedback = (message, severity = "success") => {
    setFeedback({ open: true, message, severity });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !email || !message) {
      showFeedback(t("feedback.required"), "warning");
      return;
    }

    if (turnstileSiteKey && !captchaToken) {
      setShowCaptcha(true);
      showFeedback(t("feedback.captchaRequired"), "warning");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, message, captchaToken }),
      });

      const data = await res.json();
      if (!res.ok) {
        showFeedback(data.message || t("feedback.sendFailed"), "error");
        return;
      }

      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
      setCaptchaToken("");
      showFeedback(data.message || t("feedback.sent"), "success");
    } catch {
      showFeedback(t("feedback.sendFailed"), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="public-page min-h-screen">
      {/* Hero strip */}
      <div
        className="relative flex min-h-[42vh] items-end overflow-hidden bg-cover bg-center sm:min-h-[46vh]"
        style={{ backgroundImage: "url('/hotel-images/hotelbg2.jpg')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--ink)] via-[var(--ink)]/55 to-[var(--ink)]/10" />
        <PublicContainer className="relative z-10 pb-10 sm:pb-14">
          <p className="eyebrow text-white/70">Dijari Premium</p>
          <h1 className="display mt-3 text-[2.2rem] text-white md:text-[3rem]">{t("title")}</h1>
          <p className="mt-4 max-w-xl text-sm leading-8 text-white/85 md:text-base">{t("subtitle")}</p>
        </PublicContainer>
      </div>

      <PublicSection className="pt-10 pb-16">
        <PublicContainer>
          {/* Quick contact cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card-lux p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--sand)] text-[var(--brass-deep)]">
                <EmailOutlined fontSize="small" />
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--public-muted)]">
                {t("details.email")}
              </p>
              <a
                href="mailto:dijaripremium@gmail.com"
                className="mt-1 block break-words text-sm font-semibold text-[var(--ink)] hover:text-[var(--brass-deep)]"
              >
                dijaripremium@gmail.com
              </a>
            </div>

            <div className="card-lux p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--sand)] text-[var(--brass-deep)]">
                <PhoneOutlined fontSize="small" />
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--public-muted)]">
                {t("details.phone")}
              </p>
              <a
                href="tel:+38268317993"
                className="mt-1 block text-sm font-semibold text-[var(--ink)] hover:text-[var(--brass-deep)]"
              >
                +382 68 317 993
              </a>
            </div>

            <div className="card-lux p-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--sand)] text-[var(--brass-deep)]">
                <PlaceOutlined fontSize="small" />
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.15em] text-[var(--public-muted)]">
                {t("details.address")}
              </p>
              <a
                href="https://www.bing.com/maps/default.aspx?v=2&pc=FACEBK&mid=8100&where1=Mujo%20Ul%C3%A7inaku%2C%20Ulcinj%2C%20Montenegro&FORM=FBKPL1&mkt=en-US&fbclid=IwZXh0bgNhZW0CMTAAYnJpZBExcGV1MERDQ2plbmw1bFNFNnNydGMGYXBwX2lkEDIyMjAzOTE3ODgyMDA4OTIAAR7GVdvq4ITTNRVGRMUGeXkSymUr7PXCBQAQOmWJLoiaEooemHNBM3GURXJRCg_aem_lBIgrXbzKxHyjDgMor39Pg"
                target="_blank"
                rel="noreferrer"
                className="mt-1 block text-sm font-semibold text-[var(--ink)] hover:text-[var(--brass-deep)]"
              >
                Mujo Ulcinaku, Ulqin, Mali i Zi
              </a>
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] items-start">
            <PublicCard className="p-5 md:p-8">
              <p className="eyebrow">{t("form.title")}</p>
              <h2 className="display mt-2 text-2xl text-[var(--ink)] md:text-3xl">{t("form.title")}</h2>
              <p className="mt-2 text-sm text-[var(--public-muted)]">{t("form.requiredNote")}</p>

              <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
                <Stack spacing={2.25}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <TextField
                      label={t("form.fullName")}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      fullWidth
                      sx={fieldSx}
                    />
                    <TextField
                      label={t("form.email")}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      fullWidth
                      sx={fieldSx}
                    />
                  </div>
                  <TextField
                    label={t("form.phoneOptional")}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    fullWidth
                    sx={fieldSx}
                  />
                  <TextField
                    label={t("form.message")}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    multiline
                    minRows={5}
                    fullWidth
                    sx={fieldSx}
                  />
                  <DeferredTurnstile
                    siteKey={turnstileSiteKey}
                    show={showCaptcha}
                    onTokenChange={setCaptchaToken}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    disableElevation
                    disabled={loading}
                    sx={{
                      alignSelf: { xs: "stretch", sm: "flex-start" },
                      px: 4,
                      py: 1.35,
                      textTransform: "none",
                      borderRadius: 3,
                      fontWeight: 700,
                      backgroundColor: "var(--ink)",
                      "&:hover": { backgroundColor: "#132734" },
                    }}
                  >
                    {loading ? t("form.sending") : t("form.send")}
                  </Button>
                </Stack>
              </Box>
            </PublicCard>

            <div className="space-y-6">
              <PublicCard className="p-5 md:p-6">
                <p className="eyebrow">{t("details.title")}</p>
                <p className="mt-2 text-sm text-[var(--public-muted)]">{t("details.subtitle")}</p>
                <div className="mt-4 flex items-start gap-3 rounded-2xl bg-[var(--sand)] p-4">
                  <AccessTimeOutlined sx={{ color: "var(--brass-deep)" }} fontSize="small" />
                  <p className="text-sm leading-6 text-[var(--ink)]">{t("details.stayRules")}</p>
                </div>
              </PublicCard>

              <PublicCard className="p-5 md:p-6">
                <p className="eyebrow">{t("response.title")}</p>
                <div className="mt-3 space-y-2 text-sm leading-6 text-[var(--public-muted)]">
                  <p>{t("response.standard")}</p>
                  <p>{t("response.urgent")}</p>
                </div>
              </PublicCard>
            </div>
          </div>
        </PublicContainer>
      </PublicSection>

      <Snackbar
        open={feedback.open}
        autoHideDuration={4000}
        onClose={() => setFeedback((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={feedback.severity}
          variant="filled"
          onClose={() => setFeedback((prev) => ({ ...prev, open: false }))}
          sx={{ width: "100%" }}
        >
          {feedback.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
