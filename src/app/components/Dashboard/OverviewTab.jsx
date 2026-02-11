"use client";

import { useState, useEffect } from "react";
import { Box, Typography, Grid, Paper, LinearProgress, Chip } from "@mui/material";
import {
  People,
  BookOnline,
  Euro,
  Login,
  EventAvailable,
  Hotel,
} from "@mui/icons-material";
import PageHeader from "./ui/PageHeader";
import StatCard from "./ui/StatCard";

export default function OverviewTab() {
  const [stats, setStats] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    fetchOverview();
  }, []);

  async function fetchOverview() {
    try {
      setLoadError("");
      const res = await fetch("/api/dashboard");
      const data = await res.json();
      if (!res.ok) {
        setLoadError(data?.error || "Failed to load dashboard metrics");
        return;
      }
      setStats(data);
    } catch {
      setLoadError("Failed to load dashboard metrics");
    }
  }

  if (!stats && !loadError) {
    return (
      <Typography textAlign="center" color="text.secondary">
        Loading overview...
      </Typography>
    );
  }

  const currency = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  });

  const occupancy = Math.max(0, Math.min(100, Number(stats?.occupancyPercent || 0)));

  const cards = [
    {
      title: "Total Users",
      value: stats?.totalUsers ?? 0,
      icon: <People sx={{ fontSize: 22 }} />,
      tone: "#2563eb",
    },
    {
      title: "Total Reservations",
      value: stats?.totalReservation ?? 0,
      icon: <BookOnline sx={{ fontSize: 22 }} />,
      tone: "#16a34a",
    },
    {
      title: "Total Earnings",
      value: currency.format(Number(stats?.totalEarnings || 0)),
      icon: <Euro sx={{ fontSize: 22 }} />,
      tone: "#f59e0b",
    },
    {
      title: "Today Check-ins",
      value: stats?.todayCheckins ?? 0,
      icon: <Login sx={{ fontSize: 22 }} />,
      tone: "#0ea5e9",
    },
    {
      title: "Upcoming Reservations",
      value: stats?.upcomingReservations ?? 0,
      icon: <EventAvailable sx={{ fontSize: 22 }} />,
      tone: "#7c3aed",
    },
    {
      title: "Revenue Today",
      value: currency.format(Number(stats?.revenueToday || 0)),
      icon: <Euro sx={{ fontSize: 22 }} />,
      tone: "#22c55e",
    },
    {
      title: "Occupancy",
      value: `${occupancy}%`,
      icon: <Hotel sx={{ fontSize: 22 }} />,
      tone: "#dc2626",
    },
  ];
  const primaryCards = cards.slice(0, 4);
  const secondaryCards = cards.slice(4);

  return (
    <Box className="admin-page">
      <PageHeader
        title="Overview"
        subtitle="Daily operational and financial dashboard."
        actions={
          <Chip
            size="small"
            label={`Occupancy ${occupancy}%`}
            sx={{
              fontWeight: 700,
              bgcolor: "rgba(2,132,199,0.14)",
              color: "#0369a1",
            }}
          />
        }
      />

      {loadError ? (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 2,
            border: "1px solid #fecaca",
            bgcolor: "#fff1f2",
          }}
        >
          <Typography color="#b91c1c" fontWeight={700}>
            {loadError}
          </Typography>
        </Paper>
      ) : null}

      <Box display="grid" gap={3}>
        <Box>
          <Typography fontWeight={800} mb={1.2}>
            Primary KPIs
          </Typography>
          <Grid container spacing={2.4}>
            {primaryCards.map((card) => (
              <Grid item xs={12} sm={6} lg={3} key={card.title}>
                <StatCard
                  title={card.title}
                  value={card.value}
                  icon={card.icon}
                  tone={card.tone}
                />
              </Grid>
            ))}
          </Grid>
        </Box>

        <Box>
          <Typography fontWeight={800} mb={1.2}>
            Operational Snapshot
          </Typography>
          <Grid container spacing={2.4}>
            <Grid item xs={12} lg={8}>
              <Paper
                className="admin-card"
                elevation={0}
                sx={{ borderColor: "#e7edf4", boxShadow: "none" }}
              >
                <Box className="admin-card-header">
                  <Typography fontWeight={800}>Today Snapshot</Typography>
                </Box>
                <Box className="admin-card-body">
                  <Box
                    display="grid"
                    gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr 1fr" }}
                    gap={2}
                  >
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Check-ins
                      </Typography>
                      <Typography variant="h6" fontWeight={800}>
                        {stats?.todayCheckins ?? 0}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Upcoming
                      </Typography>
                      <Typography variant="h6" fontWeight={800}>
                        {stats?.upcomingReservations ?? 0}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Revenue
                      </Typography>
                      <Typography variant="h6" fontWeight={800}>
                        {currency.format(Number(stats?.revenueToday || 0))}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} lg={4}>
              <Paper
                className="admin-card"
                elevation={0}
                sx={{ borderColor: "#e7edf4", boxShadow: "none" }}
              >
                <Box className="admin-card-header">
                  <Typography fontWeight={800}>Occupancy Health</Typography>
                </Box>
                <Box className="admin-card-body">
                  <Typography variant="caption" color="text.secondary">
                    Current occupancy
                  </Typography>
                  <Typography variant="h5" fontWeight={900} sx={{ mb: 1.2 }}>
                    {occupancy}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={occupancy}
                    sx={{
                      height: 8,
                      borderRadius: 999,
                      bgcolor: "rgba(15,23,42,0.08)",
                      "& .MuiLinearProgress-bar": {
                        borderRadius: 999,
                        background:
                          "linear-gradient(90deg, #06b6d4 0%, #0284c7 100%)",
                      },
                    }}
                  />
                </Box>
              </Paper>
            </Grid>

            {secondaryCards.map((card) => (
              <Grid item xs={12} md={4} key={card.title}>
                <StatCard
                  title={card.title}
                  value={card.value}
                  icon={card.icon}
                  tone={card.tone}
                />
              </Grid>
            ))}
          </Grid>
        </Box>

      </Box>
    </Box>
  );
}
