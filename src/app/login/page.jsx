"use client";

import { useSession, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  TextField,
  Typography,
  Alert,
  Divider,
  IconButton,
} from "@mui/material";
import { InputAdornment } from "@mui/material";
import {
  Email,
  EmailOutlined,
  Google,
  PasswordOutlined,
} from "@mui/icons-material";
import { VisibilityOff } from "@mui/icons-material";
import { Visibility } from "@mui/icons-material";
import { LockOutlined } from "@mui/icons-material";

export default function LoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

    if (res.error) setError("Invalid email or password");
    else router.push("/");

    setLoading(false);
  };

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      sx={{
        background:
          "linear-gradient(135deg, #e0e7ff 0%, #f8fafc 50%, #ffffff 100%)",
        padding: 2,
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: 420,
          borderRadius: 3,
          boxShadow: 6,
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Typography
            variant="h5"
            align="center"
            fontWeight="bold"
            color="primary"
            gutterBottom
          >
            Welcome Back 👋
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            mb={3}
          >
            Sign in to access your account
          </Typography>

          {/* Form - Credentials Login */}
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
                    <IconButton onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {error && (
              <Alert severity="error" sx={{ mt: 1 }}>
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

          {/* Divider */}
          <Divider sx={{ my: 3 }}>OR</Divider>

          {/* Google Login */}

          <Button
            fullWidth
            variant="outlined"
            startIcon={<Google />}
            sx={{
              py: 1.2,
              textTransform: "none",
              fontWeight: "bold",
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
            Don’t have an account?{" "}
            <Typography
              component="span"
              color="primary"
              sx={{ cursor: "pointer", fontWeight: "bold" }}
              onClick={() => router.push("/register")}
            >
              Register
            </Typography>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
