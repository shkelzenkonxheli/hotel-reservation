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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ok = new URLSearchParams(window.location.search).get("login");
    setHasLoginSuccessParam(ok === "success");
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
      setError(t("messages.verificationSent"));
    } catch (err) {
      setError(t("errors.resendFailed"));
    } finally {
      setResendLoading(false);
    }
  };

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      height: 52,
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
              className="w-full max-w-md p-8 md:p-9"
              style={{
                backgroundColor: "#ffffff",
                boxShadow: "0 20px 48px rgba(15,23,42,0.12)",
              }}
            >
              <Typography
                variant="h4"
                align="center"
                fontWeight="bold"
                sx={{
                  color: "#0f172a",
                  fontSize: { xs: "1.7rem", md: "2rem" },
                  mt: 0.5,
                }}
                gutterBottom
              >
                {t("title")}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                align="center"
                mb={3.2}
              >
                {t("subtitle")}
              </Typography>

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
                    severity={
                      error.toLowerCase().includes("sent") ? "success" : "error"
                    }
                    sx={{ mt: 1 }}
                  >
                    {error}
                  </Alert>
                )}

                <Button
                  fullWidth
                  variant="contained"
                  sx={{
                    mt: 3,
                    py: 1.35,
                    fontSize: "1rem",
                    textTransform: "none",
                    borderRadius: 2,
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
              </Box>

              <Button
                fullWidth
                variant="text"
                sx={{ mt: 1, textTransform: "none" }}
                onClick={handleResend}
                disabled={resendLoading}
              >
                {resendLoading
                  ? t("buttons.sending")
                  : t("buttons.resend")}
              </Button>

              <Divider sx={{ my: 3 }}>{t("or")}</Divider>

              <Button
                fullWidth
                variant="outlined"
                startIcon={<Google />}
                sx={{
                  py: 1.25,
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: 2,
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
                mt={3}
                color="text.secondary"
              >
                {t("noAccount")}{" "}
                <Typography
                  component="span"
                  sx={{ cursor: "pointer", fontWeight: 700, color: "#0ea5e9" }}
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
          onClose={() => setFeedback({ ...feedback, open: false })}
          sx={{ fontWeight: 600 }}
        >
          {feedback.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
