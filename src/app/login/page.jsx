"use client";

import { useSession, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
  Alert,
  Divider,
  IconButton,
  InputAdornment,
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

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/");
    }
  }, [status, router]);

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

  if (status === "authenticated") {
    return null;
  }

  const handleLoginCredentials = async (e) => {
    e.preventDefault();
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res.error === "EMAIL_NOT_VERIFIED") {
      setError("Email is not verified. Please check your inbox.");
    } else if (res.error) {
      setError("Invalid email or password");
    }
    else router.push("/");

    setLoading(false);
  };

  const handleResend = async () => {
    if (!email) {
      setError("Enter your email to resend verification.");
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
        setError(data.error || "Failed to resend verification email.");
        return;
      }
      setError("Verification email sent. Check your inbox.");
    } catch (err) {
      setError("Failed to resend verification email.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <Box className="public-page min-h-screen">
      <PublicSection className="pt-10">
        <PublicContainer>
          <div className="max-w-md mx-auto">
            <PublicCard className="p-6 md:p-8">
              <Typography
                variant="h5"
                align="center"
                fontWeight="bold"
                sx={{ color: "#0ea5e9" }}
                gutterBottom
              >
                Welcome back
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                align="center"
                mb={3}
              >
                Sign in to access your account
              </Typography>

              <form onSubmit={handleLoginCredentials}>
                <TextField
                  label="Email"
                  fullWidth
                  required
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
                  label="Password"
                  fullWidth
                  required
                  margin="normal"
                  type={showPassword ? "text" : "password"}
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
                    py: 1.3,
                    fontSize: "1rem",
                    textTransform: "none",
                    borderRadius: 2,
                    fontWeight: 700,
                  }}
                  type="submit"
                  disabled={loading}
                >
                {loading ? (
                  <CircularProgress size={26} color="inherit" />
                ) : (
                  "Login"
                )}
              </Button>
            </form>

            <Button
              fullWidth
              variant="text"
              sx={{ mt: 1, textTransform: "none" }}
              onClick={handleResend}
              disabled={resendLoading}
            >
              {resendLoading ? "Sending..." : "Didn't receive the link? Resend"}
            </Button>

            <Divider sx={{ my: 3 }}>OR</Divider>

              <Button
                fullWidth
                variant="outlined"
                startIcon={<Google />}
                sx={{
                  py: 1.2,
                  textTransform: "none",
                  fontWeight: 700,
                  borderRadius: 2,
                }}
                onClick={() =>
                  signIn("google", {
                    callbackUrl: "/",
                  })
                }
              >
                Continue with Google
              </Button>

              <Typography
                variant="body2"
                align="center"
                mt={3}
                color="text.secondary"
              >
                Don't have an account?{" "}
                <Typography
                  component="span"
                  sx={{ cursor: "pointer", fontWeight: 700, color: "#0ea5e9" }}
                  onClick={() => router.push("/register")}
                >
                  Register
                </Typography>
              </Typography>
            </PublicCard>
          </div>
        </PublicContainer>
      </PublicSection>
    </Box>
  );
}
