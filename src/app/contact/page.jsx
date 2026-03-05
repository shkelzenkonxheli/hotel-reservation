"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Alert,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import PublicContainer from "../components/Public/PublicContainer";
import PublicSection from "../components/Public/PublicSection";
import PublicCard from "../components/Public/PublicCard";
import usePageTitle from "../hooks/usePageTitle";

export default function ContactPage() {
  const t = useTranslations("contact");
  usePageTitle(t("metaTitle"));

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name || !email || !message) {
      setFeedback(t("feedback.required"));
      return;
    }

    const subject = encodeURIComponent(`${t("mail.subjectPrefix")} ${name}`);
    const body = encodeURIComponent(
      `${t("mail.name")}: ${name}\n${t("mail.email")}: ${email}\n${t("mail.phone")}: ${phone || "-"}\n\n${t("mail.message")}:\n${message}`,
    );

    window.location.href = `mailto:info@dijaripremium.com?subject=${subject}&body=${body}`;
    setFeedback(t("feedback.openingMail"));
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

              {feedback ? (
                <Alert
                  severity={
                    feedback === t("feedback.required") ? "warning" : "success"
                  }
                  sx={{ mb: 2 }}
                >
                  {feedback}
                </Alert>
              ) : null}

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
                  <Button
                    type="submit"
                    variant="contained"
                    sx={{
                      textTransform: "none",
                      borderRadius: 2,
                      fontWeight: 700,
                    }}
                  >
                    {t("form.send")}
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
                    <b>{t("details.email")}:</b> info@dijaripremium.com
                  </Typography>
                  <Typography>
                    <b>{t("details.phone")}:</b> +383 44 123 456
                  </Typography>
                  <Typography>
                    <b>{t("details.address")}:</b> Prishtina, Kosovo
                  </Typography>
                </Stack>
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
    </div>
  );
}
