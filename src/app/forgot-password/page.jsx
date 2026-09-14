"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import {
  Box,
  TextField,
  Button,
  Alert,
  Snackbar,
  CircularProgress,
  InputAdornment,
} from "@mui/material";
import { EmailOutlined } from "@mui/icons-material";
import DeferredTurnstile from "../components/Public/DeferredTurnstile";
import usePageTitle from "../hooks/usePageTitle";

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    height: 52,
    borderRadius: "12px",
    backgroundColor: "#ffffff",
    "& fieldset": { borderColor: "var(--public-border)" },
    "&:hover fieldset": { borderColor: "var(--brass-soft)" },
    "&.Mui-focused fieldset": { borderColor: "var(--brass)", borderWidth: 2 },
  },
};

export default function ForgotPasswordPage() {
  const t = useTranslations("forgotPassword");
  const locale = useLocale();
  usePageTitle(t("metaTitle"));
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

  const router = useRouter();
  const [email, setEmail] = useState("");
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
    if (turnstileSiteKey && !captchaToken) {
      setShowCaptcha(true);
      showFeedback(t("errors.captchaRequired"), "warning");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale, captchaToken }),
      });

      const data = await res.json();
      if (!res.ok) {
        showFeedback(data.message || t("messages.success"), "info");
      } else {
        showFeedback(data.message || t("messages.success"), "success");
      }
      setCaptchaToken("");
    } catch {
      showFeedback(t("messages.success"), "info");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="public-page min-h-screen bg-[var(--sand)] flex items-center justify-center px-4 py-14">
      <div className="w-full max-w-[440px]">
        <div className="mb-6 flex flex-col items-center text-center">
          <Image src="/hotel-images/Logo.png" alt="Dijari Premium" width={52} height={52} className="rounded-full" />
          <span className="mt-3 text-xs font-semibold uppercase tracking-[0.25em] text-[var(--brass-deep)]">
            Dijari Premium
          </span>
        </div>
        <div className="surface-raised rounded-3xl p-6 sm:p-9">
          <h1 className="display text-center text-3xl text-[var(--ink)] sm:text-[2.1rem]">{t("title")}</h1>
          <p className="mx-auto mt-3 max-w-[280px] text-center text-sm leading-6 text-[var(--public-muted)]">
            {t("subtitle")}
          </p>

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <TextField
              label={t("fields.email")}
              type="email"
              fullWidth
              required
              margin="normal"
              sx={fieldSx}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlined />
                  </InputAdornment>
                ),
              }}
            />
            <DeferredTurnstile siteKey={turnstileSiteKey} show={showCaptcha} onTokenChange={setCaptchaToken} />
            <Button
              type="submit"
              variant="contained"
              disableElevation
              fullWidth
              disabled={loading}
              sx={{
                mt: 2.5,
                py: 1.35,
                borderRadius: 3,
                fontWeight: 700,
                textTransform: "none",
                fontSize: "0.96rem",
                backgroundColor: "var(--ink)",
                "&:hover": { backgroundColor: "#132734" },
              }}
            >
              {loading ? <CircularProgress size={26} color="inherit" /> : t("buttons.send")}
            </Button>
          </Box>

          <p className="mt-6 text-center">
            <Link href="/login" className="text-sm font-bold text-[var(--brass-deep)] hover:underline">
              {t("backToLogin")}
            </Link>
          </p>
        </div>
      </div>

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
