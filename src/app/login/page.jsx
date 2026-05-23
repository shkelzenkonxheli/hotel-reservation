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
import PublicContainer from "../components/Public/PublicContainer";
import PublicSection from "../components/Public/PublicSection";
import PublicCard from "../components/Public/PublicCard";
import usePageTitle from "../hooks/usePageTitle";

export default function LoginPage() {
  const t = useTranslations("login");
  usePageTitle(t("metaTitle"));

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
      router.replace("/");
    }
  }, [status, router, feedback.open, hasLoginSuccessParam]);

  useEffect(() => {
    if (!hasLoginSuccessParam) return;
    setFeedback({
      open: true,
      message: t("messages.loginSuccess"),
      severity: "success",
    });
    const timer = setTimeout(() => {
      router.replace("/");
    }, 700);
    return () => clearTimeout(timer);
  }, [hasLoginSuccessParam, router, t]);

  if (status === "loading") {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
      >
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
    try {
      setResendLoading(true);
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
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
    } catch (err) {
      setError(t("errors.resendFailed"));
    } finally {
      setResendLoading(false);
    }
  };

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

  const feedbackCardSx = {
    mt: 1.5,
    borderRadius: 2.5,
    alignItems: "flex-start",
    "& .MuiAlert-icon": {
      mt: "2px",
      fontSize: 22,
    },
    "& .MuiAlert-message": {
      width: "100%",
      py: 0.25,
    },
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
                  mt: 0.25,
                }}
                gutterBottom
              >
                {t("title")}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                align="center"
                mb={2.5}
                sx={{ maxWidth: 260, mx: "auto", lineHeight: 1.6, fontSize: "0.92rem" }}
              >
                {t("subtitle")}
              </Typography>

              {showResendPrompt && !error && (
                <Alert severity="info" sx={{ mb: 2.25, borderRadius: 2.5, alignItems: "flex-start" }}>
                  {t("registeredHint")}
                </Alert>
              )}

              <Box component="form" onSubmit={handleLoginCredentials}>
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
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                {error && (
                  <Alert
                    severity="error"
                    icon={<ErrorOutline />}
                    sx={feedbackCardSx}
                  >
                    {error}
                  </Alert>
                )}

                <Button
                  fullWidth
                  variant="contained"
                  sx={{
                    mt: 2.5,
                    py: 1.15,
                    fontSize: "0.96rem",
                    textTransform: "none",
                    borderRadius: 3,
                    fontWeight: 700,
                    backgroundColor: "#0284c7",
                    "&:hover": { backgroundColor: "#0369a1" },
                    "&:active": { backgroundColor: "#075985" },
                  }}
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <CircularProgress size={26} color="inherit" />
                  ) : (
                    t("buttons.login")
                  )}
                </Button>

                <Box display="flex" justifyContent="center" mt={1.75}>
                  <Typography
                    component="button"
                    type="button"
                    onClick={() => router.push("/forgot-password")}
                    sx={{
                      border: "none",
                      background: "transparent",
                      p: 0,
                      m: 0,
                      cursor: "pointer",
                      fontSize: "0.92rem",
                      fontWeight: 600,
                      color: "#0284c7",
                      textAlign: "center",
                    }}
                  >
                    {t("forgotPassword")}
                  </Typography>
                </Box>
              </Box>

              {showResendPrompt && (
                <Button
                  fullWidth
                  variant="text"
                  sx={{ mt: 1, textTransform: "none", fontWeight: 600 }}
                  onClick={handleResend}
                  disabled={resendLoading}
                >
                  {resendLoading ? t("buttons.sending") : t("buttons.resend")}
                </Button>
              )}

              <Divider sx={{ my: 2.1, fontSize: "0.9rem" }}>{t("or")}</Divider>

              <Button
                fullWidth
                variant="outlined"
                startIcon={<Google />}
                sx={{
                  py: 0.9,
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: 3,
                  fontSize: "0.96rem",
                  borderColor: "#d1dbe7",
                  "&:hover": {
                    borderColor: "#b9c7d8",
                    backgroundColor: "#f8fafc",
                  },
                }}
                onClick={() =>
                  signIn("google", {
                    callbackUrl: "/login?login=success",
                  })
                }
              >
                {t("buttons.google")}
              </Button>

              <Typography
                variant="body2"
                align="center"
                mt={2.2}
                color="text.secondary"
                sx={{ fontSize: "0.94rem" }}
              >
                {t("noAccount")}{" "}
                <Typography
                  component="span"
                  sx={{
                    cursor: "pointer",
                    fontWeight: 700,
                    color: "#0ea5e9",
                    fontSize: "0.94rem",
                  }}
                  onClick={() => router.push("/register")}
                >
                  {t("buttons.register")}
                </Typography>
              </Typography>
            </PublicCard>
          </Box>
        </PublicContainer>
      </PublicSection>
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
    </Box>
  );
}
