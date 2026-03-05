"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { signIn } from "next-auth/react";
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
} from "@mui/material";
import {
  AccountCircle,
  EmailOutlined,
  Google,
  LockOutlined,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import PublicContainer from "../components/Public/PublicContainer";
import PublicSection from "../components/Public/PublicSection";
import PublicCard from "../components/Public/PublicCard";
import usePageTitle from "../hooks/usePageTitle";

export default function RegisterPage() {
  const t = useTranslations("register");
  usePageTitle(t("metaTitle"));

  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      setError(t("errors.invalidEmail"));
      return false;
    }

    const strongPassword = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

    if (!strongPassword.test(password)) {
      setError(
        t("errors.weakPassword"),
      );
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
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(t("messages.verificationSent"));
        setTimeout(() => router.push("/login"), 2000);
      } else {
        setError(data.message || t("errors.registerFailed"));
      }
    } catch (err) {
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
                variant="h5"
                fontWeight="bold"
                align="center"
                sx={{ color: "#0ea5e9" }}
                gutterBottom
              >
                {t("title")}
              </Typography>
              <Typography
                variant="body2"
                align="center"
                color="text.secondary"
                mb={3}
              >
                {t("subtitle")}
              </Typography>

              <Box component="form" onSubmit={handleSubmit}>
                <TextField
                  label={t("fields.fullName")}
                  fullWidth
                  required
                  variant="outlined"
                  margin="normal"
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                  </Alert>
                )}
                {message && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    {message}
                  </Alert>
                )}

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  fullWidth
                  disabled={loading}
                  sx={{
                    mt: 3,
                    py: 1.3,
                    borderRadius: 2,
                    fontWeight: 700,
                    textTransform: "none",
                  }}
                >
                  {loading ? (
                    <CircularProgress size={26} color="inherit" />
                  ) : (
                    t("buttons.register")
                  )}
                </Button>
              </Box>

              <Typography
                variant="body2"
                align="center"
                mt={3}
                color="text.secondary"
              >
                {t("haveAccount")}{" "}
                <Typography
                  component="span"
                  sx={{ cursor: "pointer", color: "#0ea5e9", fontWeight: 700 }}
                  onClick={() => router.push("/login")}
                >
                  {t("buttons.login")}
                </Typography>
              </Typography>

              <Divider sx={{ my: 2 }}>{t("or")}</Divider>

              <Button
                fullWidth
                variant="outlined"
                startIcon={<Google />}
                sx={{
                  py: 1.2,
                  textTransform: "none",
                  borderRadius: 2,
                  fontWeight: 700,
                }}
                onClick={() =>
                  signIn("google", {
                    callbackUrl: "/",
                  })
                }
              >
                {t("buttons.google")}
              </Button>
            </PublicCard>
          </Box>
        </PublicContainer>
      </PublicSection>
    </Box>
  );
}
