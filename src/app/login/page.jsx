"use client";

import { useState } from "react";
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
} from "@mui/material";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        window.dispatchEvent(new Event("userChanged"));
        router.push("/");
      } else {
        const data = await res.json();
        setError(data.message || "Invalid email or password");
      }
    } catch (err) {
      setError("Something went wrong. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      sx={{
        background:
          "linear-gradient(135deg, #dbeafe 0%, #eff6ff 50%, #ffffff 100%)",
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: 400,
          borderRadius: 3,
          boxShadow: 4,
        }}
      >
        <CardContent sx={{ p: 5 }}>
          <Typography
            variant="h5"
            fontWeight="bold"
            align="center"
            color="primary"
            gutterBottom
          >
            Welcome Back 👋
          </Typography>
          <Typography
            variant="body2"
            align="center"
            color="text.secondary"
            mb={3}
          >
            Please sign in to continue
          </Typography>

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              label="Email"
              type="email"
              variant="outlined"
              fullWidth
              required
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              label="Password"
              type="password"
              variant="outlined"
              fullWidth
              required
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
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
                fontWeight: "bold",
                textTransform: "none",
              }}
            >
              {loading ? (
                <CircularProgress size={26} color="inherit" />
              ) : (
                "Login"
              )}
            </Button>
          </Box>

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
              sx={{ cursor: "pointer" }}
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
