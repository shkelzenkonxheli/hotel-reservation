"use client";

import { useState } from "react";
import { Alert, Box, Button, Stack, TextField, Typography } from "@mui/material";
import PublicContainer from "../components/Public/PublicContainer";
import PublicSection from "../components/Public/PublicSection";
import PublicCard from "../components/Public/PublicCard";
import usePageTitle from "../hooks/usePageTitle";

export default function ContactPage() {
  usePageTitle("Contact | Dijari Premium");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name || !email || !message) {
      setFeedback("Please fill in all required fields.");
      return;
    }

    const subject = encodeURIComponent(`Contact request from ${name}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nPhone: ${phone || "-"}\n\nMessage:\n${message}`,
    );

    window.location.href = `mailto:info@dijaripremium.com?subject=${subject}&body=${body}`;
    setFeedback("Your email app is opening. We will get back to you shortly.");
  };

  return (
    <div className="public-page min-h-screen">
      <PublicSection className="pt-10">
        <PublicContainer>
          <div className="max-w-3xl">
            <p className="public-badge">Contact</p>
            <h1 className="text-3xl md:text-4xl font-semibold mt-3">
              Let&apos;s plan your stay
            </h1>
            <p className="text-sm md:text-base text-slate-500 mt-2">
              Send us your request and our team will assist you with rooms,
              booking details, and special arrangements.
            </p>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] items-start">
            <PublicCard className="p-5 md:p-6">
              <Typography variant="h6" fontWeight={800} mb={1}>
                Send a message
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Fields marked with * are required.
              </Typography>

              {feedback ? (
                <Alert
                  severity={
                    feedback.includes("required") ? "warning" : "success"
                  }
                  sx={{ mb: 2 }}
                >
                  {feedback}
                </Alert>
              ) : null}

              <Box component="form" onSubmit={handleSubmit}>
                <Stack spacing={2}>
                  <TextField
                    label="Full Name *"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    fullWidth
                  />
                  <TextField
                    label="Email *"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    fullWidth
                  />
                  <TextField
                    label="Phone (optional)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    fullWidth
                  />
                  <TextField
                    label="Message *"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    multiline
                    minRows={4}
                    fullWidth
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    sx={{ textTransform: "none", borderRadius: 2, fontWeight: 700 }}
                  >
                    Send message
                  </Button>
                </Stack>
              </Box>
            </PublicCard>

            <div className="space-y-6">
              <PublicCard className="p-5 md:p-6">
                <Typography variant="h6" fontWeight={800} mb={1}>
                  Contact details
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Reach us directly any time.
                </Typography>
                <Stack spacing={1}>
                  <Typography>
                    <b>Email:</b> info@dijaripremium.com
                  </Typography>
                  <Typography>
                    <b>Phone:</b> +383 44 123 456
                  </Typography>
                  <Typography>
                    <b>Address:</b> Prishtina, Kosovo
                  </Typography>
                </Stack>
              </PublicCard>

              <PublicCard className="p-5 md:p-6">
                <Typography variant="h6" fontWeight={800} mb={1}>
                  Response time
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Standard requests: within 2-4 hours.
                  <br />
                  Booking urgent support: same day.
                </Typography>
              </PublicCard>
            </div>
          </div>
        </PublicContainer>
      </PublicSection>
    </div>
  );
}
