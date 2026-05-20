"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
} from "@mui/material";
import { EmailOutlined } from "@mui/icons-material";
import PublicContainer from "../components/Public/PublicContainer";
import PublicSection from "../components/Public/PublicSection";
import PublicCard from "../components/Public/PublicCard";
import usePageTitle from "../hooks/usePageTitle";

export default function ForgotPasswordPage() {
  const t = useTranslations("forgotPassword");
  const locale = useLocale();
  usePageTitle(t("metaTitle"));

  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      height: 54,
      borderRadius: 3,
      backgroundColor: "#ffffff",
      "& fieldset": { borderColor: "#dbe3ed" },
      "&:hover fieldset": { borderColor: "#b9c7d8" },
      "&.Mui-focused fieldset": {
        borderColor: "#0ea5e9",
        borderWidth: 2,
      },
    },
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || t("messages.success"));
      } else {
        setMessage(data.message || t("messages.success"));
      }
    } catch {
      setError(t("messages.success"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      className="public-page min-h-screen"
      sx={{
        backgroundImage:
          "linear-gradient(135deg, rgba(15,23,42,0.62), rgba(15,23,42,0.42)), url('/hotel-images/hotelbg1.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <PublicSection className="py-0">
        <PublicContainer>
          <Box
            sx={{
              minHeight: { xs: "calc(100vh - 72px)", md: "calc(100vh - 84px)" },
              display: "grid",
              placeItems: "center",
              py: { xs: 4, md: 6 },
            }}
          >
            <PublicCard
              className="w-full max-w-md p-7 md:p-8"
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 28,
                boxShadow: "0 22px 56px rgba(15,23,42,0.14)",
              }}
            >
              <Typography
                variant="h4"
                align="center"
                fontWeight={800}
                sx={{
                  color: "#0f172a",
                  fontSize: { xs: "1.9rem", md: "2.15rem" },
                  letterSpacing: "-0.03em",
                }}
                gutterBottom
              >
                {t("title")}
              </Typography>
              <Typography
                variant="body2"
                align="center"
                color="text.secondary"
                mb={3.5}
                sx={{ maxWidth: 320, mx: "auto", lineHeight: 1.7 }}
              >
                {t("subtitle")}
              </Typography>

              <Box component="form" onSubmit={handleSubmit}>
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

                {message && (
                  <Alert severity="success" sx={{ mt: 2, borderRadius: 2.5 }}>
                    {message}
                  </Alert>
                )}
                {error && (
                  <Alert severity="error" sx={{ mt: 2, borderRadius: 2.5 }}>
                    {error}
                  </Alert>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={loading}
                  sx={{
                    mt: 3,
                    py: 1.35,
                    borderRadius: 3,
                    fontWeight: 700,
                    textTransform: "none",
                    fontSize: "1rem",
                    backgroundColor: "#0284c7",
                    "&:hover": { backgroundColor: "#0369a1" },
                  }}
                >
                  {loading ? (
                    <CircularProgress size={26} color="inherit" />
                  ) : (
                    t("buttons.send")
                  )}
                </Button>
              </Box>

              <Typography
                variant="body2"
                align="center"
                mt={3}
                color="text.secondary"
                sx={{ cursor: "pointer", fontWeight: 700, color: "#0284c7" }}
                onClick={() => router.push("/login")}
              >
                {t("backToLogin")}
              </Typography>
            </PublicCard>
          </Box>
        </PublicContainer>
      </PublicSection>
    </Box>
  );
}
