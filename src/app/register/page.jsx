"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { signIn } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Divider,
  InputAdornment,
  IconButton,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import {
  AccountCircle,
  EmailOutlined,
  Google,
  LockOutlined,
  Visibility,
  VisibilityOff,
  CheckCircleOutline,
  ErrorOutline,
} from "@mui/icons-material";
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

const feedbackCardSx = {
  mt: 2,
  borderRadius: 2.5,
  alignItems: "flex-start",
  "& .MuiAlert-icon": { mt: "2px", fontSize: 22 },
  "& .MuiAlert-message": { width: "100%", py: 0.25 },
};

export default function RegisterPage() {
  const t = useTranslations("register");
  const th = useTranslations("home");
  usePageTitle(t("metaTitle"));

  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [showCaptcha, setShowCaptcha] = useState(false);

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      setError(t("errors.invalidEmail"));
      return false;
    }

    const strongPassword = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

    if (!strongPassword.test(password)) {
      setError(t("errors.weakPassword"));
      return false;
    }

    if (!acceptedTerms) {
      setError(t("errors.acceptTerms"));
      return false;
    }

    if (turnstileSiteKey && !captchaToken) {
      setShowCaptcha(true);
      setError(t("errors.captchaRequired"));
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          acceptedTerms,
          captchaToken,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(t("messages.verificationSent"));
        setTimeout(
          () =>
            router.push(`/login?registered=1&email=${encodeURIComponent(email)}`),
          1500,
        );
      } else {
        setError(data.message || t("errors.registerFailed"));
        setCaptchaToken("");
      }
    } catch (err) {
      setError(t("errors.generic"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="public-page min-h-screen bg-[var(--sand)]">
      <div className="flex min-h-screen flex-col lg:flex-row">
        {/* Brand / imagery panel */}
        <div className="relative h-[38vh] w-full overflow-hidden lg:h-auto lg:w-1/2">
          <Image
            src="/hotel-images/seaview1.JPG"
            alt={th("cta.imageAlt")}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--ink)] via-[var(--ink)]/55 to-[var(--ink)]/20 lg:bg-gradient-to-tr" />
          <div className="relative z-10 flex h-full flex-col justify-between p-6 sm:p-10 lg:p-14">
            <div className="flex items-center gap-3">
              <Image src="/hotel-images/Logo.png" alt="Dijari Premium" width={40} height={40} className="rounded-full" />
              <span className="font-semibold tracking-[0.2em] text-white/90 uppercase text-xs">
                Dijari Premium
              </span>
            </div>
            <div className="hidden lg:block max-w-md">
              <p className="eyebrow text-white/70">{th("cta.eyebrow")}</p>
              <h2 className="display mt-4 text-3xl leading-tight text-white xl:text-4xl">
                {th("cta.title")}
              </h2>
              <p className="mt-5 max-w-sm text-sm leading-7 text-white/85">
                {th("cta.subtitle")}
              </p>
            </div>
            <div className="lg:hidden" />
          </div>
        </div>

        {/* Form panel */}
        <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8 lg:py-16">
          <div className="w-full max-w-[440px]">
            <div className="surface-raised rounded-3xl p-6 sm:p-9">
              <p className="eyebrow">{t("metaTitle").split("|")[0].trim()}</p>
              <h1 className="display mt-2 text-3xl text-[var(--ink)] sm:text-4xl">{t("title")}</h1>
              <p className="mt-3 text-sm leading-6 text-[var(--public-muted)]">{t("subtitle")}</p>

              <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
                <TextField
                  label={t("fields.fullName")}
                  fullWidth
                  required
                  variant="outlined"
                  margin="normal"
                  sx={fieldSx}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AccountCircle />
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label={t("fields.email")}
                  type="email"
                  fullWidth
                  required
                  variant="outlined"
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
                <TextField
                  label={t("fields.password")}
                  type={showPassword ? "text" : "password"}
                  fullWidth
                  required
                  variant="outlined"
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
                        <IconButton onClick={() => setShowPassword(!showPassword)} sx={{ p: 1.2 }}>
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <FormControlLabel
                  sx={{
                    mt: 1,
                    alignItems: "flex-start",
                    mr: 0,
                    ml: 0,
                    "& .MuiFormControlLabel-label": {
                      fontSize: "0.86rem",
                      lineHeight: 1.5,
                      color: "var(--public-muted)",
                    },
                  }}
                  control={
                    <Checkbox
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      sx={{ pt: 0.2 }}
                    />
                  }
                  label={
                    <span style={{ display: "inline", wordBreak: "break-word" }}>
                      {t("terms.prefix")}{" "}
                      <Link
                        href="/terms-conditions"
                        style={{ color: "var(--brass-deep)", fontWeight: 700, textDecoration: "none" }}
                      >
                        {t("terms.termsLink")}
                      </Link>{" "}
                      {t("terms.and")}{" "}
                      <Link
                        href="/privacy-policy"
                        style={{ color: "var(--brass-deep)", fontWeight: 700, textDecoration: "none" }}
                      >
                        {t("terms.privacyLink")}
                      </Link>
                      .
                    </span>
                  }
                />

                <DeferredTurnstile
                  siteKey={turnstileSiteKey}
                  show={showCaptcha}
                  onTokenChange={setCaptchaToken}
                />

                {error && (
                  <Alert severity="error" icon={<ErrorOutline />} sx={feedbackCardSx}>
                    {error}
                  </Alert>
                )}
                {message && (
                  <Alert severity="success" icon={<CheckCircleOutline />} sx={feedbackCardSx}>
                    {message}
                  </Alert>
                )}

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
                  {loading ? <CircularProgress size={26} color="inherit" /> : t("buttons.register")}
                </Button>
              </Box>

              <p className="mt-6 text-center text-sm text-[var(--public-muted)]">
                {t("haveAccount")}{" "}
                <Link href="/login" className="font-bold text-[var(--brass-deep)] hover:underline">
                  {t("buttons.login")}
                </Link>
              </p>

              <Divider sx={{ my: 3, fontSize: "0.85rem", color: "var(--public-muted)" }}>{t("or")}</Divider>

              <Button
                fullWidth
                variant="outlined"
                startIcon={<Google />}
                sx={{
                  py: 1.15,
                  textTransform: "none",
                  borderRadius: 3,
                  fontWeight: 700,
                  fontSize: "0.96rem",
                  borderColor: "var(--public-border)",
                  color: "var(--ink)",
                  "&:hover": { borderColor: "var(--brass-soft)", backgroundColor: "var(--sand)" },
                }}
                onClick={() => signIn("google", { callbackUrl: "/" })}
              >
                {t("buttons.google")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
