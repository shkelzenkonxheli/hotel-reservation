"use client";

import { useSession, signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
  Divider,
  IconButton,
  InputAdornment,
  Alert,
  Snackbar,
} from "@mui/material";
import {
  EmailOutlined,
  Google,
  LockOutlined,
  VisibilityOff,
  Visibility,
  CheckCircleOutline,
  ErrorOutline,
} from "@mui/icons-material";
import Image from "next/image";
import Link from "next/link";
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
  mt: 1.5,
  borderRadius: 2.5,
  alignItems: "flex-start",
  "& .MuiAlert-icon": { mt: "2px", fontSize: 22 },
  "& .MuiAlert-message": { width: "100%", py: 0.25 },
};

export default function LoginPage() {
  const t = useTranslations("login");
  const th = useTranslations("home");
  usePageTitle(t("metaTitle"));
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";

  const router = useRouter();
  const { data: session, status } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [feedback, setFeedback] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [hasLoginSuccessParam, setHasLoginSuccessParam] = useState(false);
  const [showResendPrompt, setShowResendPrompt] = useState(false);
  const [resendCaptchaToken, setResendCaptchaToken] = useState("");
  const [showResendCaptcha, setShowResendCaptcha] = useState(false);

  const resolvePostLoginDestination = () => {
    if (typeof window === "undefined") return "/";
    const raw = localStorage.getItem("postLoginRedirect");
    if (!raw) return "/";

    try {
      const parsed = JSON.parse(raw);
      if (parsed?.booking) {
        localStorage.setItem("booking", JSON.stringify(parsed.booking));
      }
      return parsed?.destination || "/";
    } catch {
      return "/";
    } finally {
      localStorage.removeItem("postLoginRedirect");
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const ok = params.get("login");
    const registered = params.get("registered");
    const prefillEmail = params.get("email");
    setHasLoginSuccessParam(ok === "success");
    setShowResendPrompt(registered === "1");
    if (prefillEmail) setEmail(prefillEmail);
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    if (hasLoginSuccessParam) return;
    if (!feedback.open) {
      router.replace(resolvePostLoginDestination());
    }
  }, [status, router, feedback.open, hasLoginSuccessParam]);

  useEffect(() => {
    if (!hasLoginSuccessParam) return;
    setFeedback({
      open: true,
      message: t("messages.loginSuccess"),
      severity: "success",
    });
    const destination = resolvePostLoginDestination();
    const timer = setTimeout(() => {
      router.replace(destination);
    }, 700);
    return () => clearTimeout(timer);
  }, [hasLoginSuccessParam, router, t]);

  if (status === "loading") {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (status === "authenticated" && !hasLoginSuccessParam && !feedback.open) {
    return null;
  }

  const handleLoginCredentials = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res.error === "EMAIL_NOT_VERIFIED") {
      setError(t("errors.emailNotVerified"));
    } else if (res.error) {
      setError(t("errors.invalidCredentials"));
    } else {
      router.replace("/login?login=success");
    }

    setLoading(false);
  };

  const handleResend = async () => {
    if (!email) {
      setError(t("errors.enterEmailForResend"));
      return;
    }
    if (turnstileSiteKey && !resendCaptchaToken) {
      setShowResendCaptcha(true);
      setError(t("errors.captchaRequired"));
      return;
    }
    try {
      setResendLoading(true);
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, captchaToken: resendCaptchaToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("errors.resendFailed"));
        return;
      }
      setError("");
      setFeedback({
        open: true,
        message: t("messages.verificationSent"),
        severity: "success",
      });
      setResendCaptchaToken("");
    } catch (err) {
      setError(t("errors.resendFailed"));
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="public-page min-h-screen bg-[var(--sand)]">
      <div className="flex min-h-screen flex-col lg:flex-row">
        {/* Brand / imagery panel */}
        <div className="relative h-[38vh] w-full overflow-hidden lg:h-auto lg:w-1/2">
          <Image
            src="/hotel-images/hotelbg1.jpg"
            alt={th("story.imageAlt")}
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
              <p className="eyebrow text-white/70">{th("hero.eyebrow")}</p>
              <h2 className="display mt-4 text-3xl leading-tight text-white xl:text-4xl">
                {th("hero.title")}
              </h2>
              <ul className="mt-8 space-y-3">
                {th.raw("story.highlights").map((h) => (
                  <li key={h} className="flex items-center gap-3 text-sm text-white/85">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--brass)]" />
                    {h}
                  </li>
                ))}
              </ul>
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

              {showResendPrompt && !error && (
                <Alert severity="info" sx={{ mt: 3, borderRadius: 2.5, alignItems: "flex-start" }}>
                  {t("registeredHint")}
                </Alert>
              )}

              <Box component="form" onSubmit={handleLoginCredentials} sx={{ mt: 3 }}>
                <TextField
                  label={t("fields.email")}
                  fullWidth
                  required
                  margin="normal"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  sx={fieldSx}
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
                  fullWidth
                  required
                  margin="normal"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  sx={fieldSx}
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

                {error && (
                  <Alert severity="error" icon={<ErrorOutline />} sx={feedbackCardSx}>
                    {error}
                  </Alert>
                )}

                <Button
                  fullWidth
                  variant="contained"
                  disableElevation
                  sx={{
                    mt: 2.5,
                    py: 1.35,
                    fontSize: "0.96rem",
                    textTransform: "none",
                    borderRadius: 3,
                    fontWeight: 700,
                    backgroundColor: "var(--ink)",
                    "&:hover": { backgroundColor: "#132734" },
                  }}
                  type="submit"
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={26} color="inherit" /> : t("buttons.login")}
                </Button>

                <div className="mt-4 flex justify-center">
                  <Link
                    href="/forgot-password"
                    className="text-sm font-semibold text-[var(--brass-deep)] hover:underline"
                  >
                    {t("forgotPassword")}
                  </Link>
                </div>
              </Box>

              {showResendPrompt && (
                <>
                  <DeferredTurnstile
                    siteKey={turnstileSiteKey}
                    show={showResendCaptcha}
                    onTokenChange={setResendCaptchaToken}
                  />
                  <Button
                    fullWidth
                    variant="text"
                    sx={{ mt: 1, textTransform: "none", fontWeight: 600 }}
                    onClick={handleResend}
                    disabled={resendLoading}
                  >
                    {resendLoading ? t("buttons.sending") : t("buttons.resend")}
                  </Button>
                </>
              )}

              <Divider sx={{ my: 3, fontSize: "0.85rem", color: "var(--public-muted)" }}>{t("or")}</Divider>

              <Button
                fullWidth
                variant="outlined"
                startIcon={<Google />}
                sx={{
                  py: 1.15,
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: 3,
                  fontSize: "0.96rem",
                  borderColor: "var(--public-border)",
                  color: "var(--ink)",
                  "&:hover": { borderColor: "var(--brass-soft)", backgroundColor: "var(--sand)" },
                }}
                onClick={() => signIn("google", { callbackUrl: "/login?login=success" })}
              >
                {t("buttons.google")}
              </Button>

              <p className="mt-6 text-center text-sm text-[var(--public-muted)]">
                {t("noAccount")}{" "}
                <Link href="/register" className="font-bold text-[var(--brass-deep)] hover:underline">
                  {t("buttons.register")}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <Snackbar
        open={feedback.open}
        autoHideDuration={4000}
        onClose={() => setFeedback({ ...feedback, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          severity={feedback.severity}
          variant="filled"
          iconMapping={{
            success: <CheckCircleOutline fontSize="inherit" />,
            error: <ErrorOutline fontSize="inherit" />,
          }}
          onClose={() => setFeedback({ ...feedback, open: false })}
          sx={{
            minWidth: 320,
            borderRadius: 2.5,
            fontWeight: 600,
            boxShadow: "0 18px 40px rgba(15,23,42,0.18)",
            "& .MuiAlert-icon": { fontSize: 22, alignItems: "center" },
          }}
        >
          {feedback.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
