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
import PublicContainer from "../components/Public/PublicContainer";
import PublicSection from "../components/Public/PublicSection";
import PublicCard from "../components/Public/PublicCard";
import DeferredTurnstile from "../components/Public/DeferredTurnstile";
import usePageTitle from "../hooks/usePageTitle";

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
        body: JSON.stringify({
          name,
          email,
          phone,
          message,
          captchaToken,
        }),
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
      <PublicSection className="pt-10">
        <PublicContainer>
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-semibold mt-3">
              {t("title")}
            </h1>
            <p className="text-sm md:text-base text-slate-500 mt-2">
              {t("subtitle")}
            </p>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] items-start">
            <PublicCard className="p-5 md:p-6">
              <Typography variant="h6" fontWeight={800} mb={1}>
                {t("form.title")}
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                {t("form.requiredNote")}
              </Typography>

              <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={2}>
                  <TextField
                    label={t("form.fullName")}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    fullWidth
                  />
                  <TextField
                    label={t("form.email")}
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    fullWidth
                  />
                  <TextField
                    label={t("form.phoneOptional")}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    fullWidth
                  />
                  <TextField
                    label={t("form.message")}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    multiline
                    minRows={4}
                    fullWidth
                  />
                  <DeferredTurnstile
                    siteKey={turnstileSiteKey}
                    show={showCaptcha}
                    onTokenChange={setCaptchaToken}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    sx={{
                      textTransform: "none",
                      borderRadius: 2,
                      fontWeight: 700,
                    }}
                  >
                    {loading ? t("form.sending") : t("form.send")}
                  </Button>
                </Stack>
              </Box>
            </PublicCard>

            <div className="space-y-6">
              <PublicCard className="p-5 md:p-6">
                <Typography variant="h6" fontWeight={800} mb={1}>
                  {t("details.title")}
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  {t("details.subtitle")}
                </Typography>
                <Stack spacing={1}>
                  <Typography>
                    <b>{t("details.email")}:</b> dijaripremium@gmail.com
                  </Typography>
                  <Typography>
                    <b>{t("details.phone")}:</b>{" "}
                    <a
                      href="tel:+38268317993"
                      className="text-[#1f6feb] hover:underline"
                    >
                      +382 68 317 993
                    </a>
                  </Typography>
                  <Typography>
                    <b>{t("details.address")}:</b>{" "}
                    <a
                      href="https://www.bing.com/maps/default.aspx?v=2&pc=FACEBK&mid=8100&where1=Mujo%20Ul%C3%A7inaku%2C%20Ulcinj%2C%20Montenegro&FORM=FBKPL1&mkt=en-US&fbclid=IwZXh0bgNhZW0CMTAAYnJpZBExcGV1MERDQ2plbmw1bFNFNnNydGMGYXBwX2lkEDIyMjAzOTE3ODgyMDA4OTIAAR7GVdvq4ITTNRVGRMUGeXkSymUr7PXCBQAQOmWJLoiaEooemHNBM3GURXJRCg_aem_lBIgrXbzKxHyjDgMor39Pg"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#1f6feb] hover:underline"
                    >
                      Mujo Ulcinaku, Ulqin, Mali i Zi
                    </a>
                  </Typography>
                </Stack>
                <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
                  {t("details.stayRules")}
                </Alert>
              </PublicCard>

              <PublicCard className="p-5 md:p-6">
                <Typography variant="h6" fontWeight={800} mb={1}>
                  {t("response.title")}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("response.standard")}
                  <br />
                  {t("response.urgent")}
                </Typography>
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
