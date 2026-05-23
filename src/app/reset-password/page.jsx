"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from "@mui/material";
import {
  LockOutlined,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import PublicContainer from "../components/Public/PublicContainer";
import PublicSection from "../components/Public/PublicSection";
import PublicCard from "../components/Public/PublicCard";
import usePageTitle from "../hooks/usePageTitle";

export default function ResetPasswordPage() {
  const t = useTranslations("resetPassword");
  usePageTitle(t("metaTitle"));

  const router = useRouter();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token") || "");
  }, []);

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      height: { xs: 48, md: 50 },
      borderRadius: 2,
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

    if (!token) {
      setError(t("errors.missingToken"));
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError(t("errors.passwordMismatch"));
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || t("errors.generic"));
      } else {
        setMessage(data.message || t("messages.success"));
        setTimeout(() => router.push("/login"), 1400);
      }
    } catch {
      setError(t("errors.generic"));
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
              py: { xs: 3, md: 5 },
            }}
          >
            <PublicCard
              className="w-full max-w-[420px] p-5 md:p-6"
              style={{
                backgroundColor: "#ffffff",
                borderRadius: 24,
                boxShadow: "0 18px 44px rgba(15,23,42,0.13)",
              }}
            >
              <Typography
                variant="h4"
                align="center"
                fontWeight={800}
                sx={{
                  color: "#0f172a",
                  fontSize: { xs: "1.65rem", md: "1.9rem" },
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
                mb={2.5}
                sx={{ maxWidth: 260, mx: "auto", lineHeight: 1.6, fontSize: "0.92rem" }}
              >
                {t("subtitle")}
              </Typography>

              <Box component="form" onSubmit={handleSubmit}>
                <TextField
                  label={t("fields.password")}
                  type={showPassword ? "text" : "password"}
                  fullWidth
                  required
                  margin="normal"
                  sx={fieldSx}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  helperText={t("passwordHint")}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlined />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword((prev) => !prev)}>
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  label={t("fields.confirmPassword")}
                  type={showConfirmPassword ? "text" : "password"}
                  fullWidth
                  required
                  margin="normal"
                  sx={fieldSx}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlined />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
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
                    mt: 2.5,
                    py: 1.15,
                    borderRadius: 3,
                    fontWeight: 700,
                    textTransform: "none",
                    fontSize: "0.96rem",
                    backgroundColor: "#0284c7",
                    "&:hover": { backgroundColor: "#0369a1" },
                  }}
                >
                  {loading ? (
                    <CircularProgress size={26} color="inherit" />
                  ) : (
                    t("buttons.save")
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
