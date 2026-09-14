"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
  IconButton,
} from "@mui/material";
import { LockOutlined, Visibility, VisibilityOff } from "@mui/icons-material";
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

export default function ResetPasswordPage() {
  const t = useTranslations("resetPassword");
  usePageTitle(t("metaTitle"));

  const router = useRouter();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const showFeedback = (message, severity = "success") => {
    setFeedback({ open: true, message, severity });
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token") || "");
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!token) {
      showFeedback(t("errors.missingToken"), "error");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      showFeedback(t("errors.passwordMismatch"), "error");
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
        showFeedback(data.message || t("errors.generic"), "error");
      } else {
        showFeedback(data.message || t("messages.success"), "success");
        setTimeout(() => router.push("/login"), 1400);
      }
    } catch {
      showFeedback(t("errors.generic"), "error");
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
                    <IconButton onClick={() => setShowPassword((prev) => !prev)} sx={{ p: 1.2 }}>
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
                    <IconButton onClick={() => setShowConfirmPassword((prev) => !prev)} sx={{ p: 1.2 }}>
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
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
              {loading ? <CircularProgress size={26} color="inherit" /> : t("buttons.save")}
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
