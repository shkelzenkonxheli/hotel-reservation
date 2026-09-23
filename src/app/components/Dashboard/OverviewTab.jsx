"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("dashboard.overview");
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
        setLoadError(data?.error || t("errors.loadFailed"));
        return;
      }
      setStats(data);
    } catch {
      setLoadError(t("errors.loadFailed"));
    }
  }

  if (!stats && !loadError) {
    return (
      <Typography textAlign="center" color="text.secondary">
        {t("loading")}
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
      title: t("cards.totalUsers"),
      value: stats?.totalUsers ?? 0,
      icon: <People sx={{ fontSize: 22 }} />,
      tone: "#2563eb",
    },
    {
      title: t("cards.totalReservations"),
      value: stats?.totalReservation ?? 0,
      icon: <BookOnline sx={{ fontSize: 22 }} />,
      tone: "#16a34a",
    },
    {
      title: t("cards.totalEarnings"),
      value: currency.format(Number(stats?.totalEarnings || 0)),
      icon: <Euro sx={{ fontSize: 22 }} />,
      tone: "#f59e0b",
    },
    {
      title: t("cards.todayCheckins"),
      value: stats?.todayCheckins ?? 0,
      icon: <Login sx={{ fontSize: 22 }} />,
      tone: "#0ea5e9",
    },
    {
      title: t("cards.upcomingReservations"),
      value: stats?.upcomingReservations ?? 0,
      icon: <EventAvailable sx={{ fontSize: 22 }} />,
      tone: "#7c3aed",
    },
    {
      title: t("cards.revenueToday"),
      value: currency.format(Number(stats?.revenueToday || 0)),
      icon: <Euro sx={{ fontSize: 22 }} />,
      tone: "#22c55e",
    },
    {
      title: t("cards.occupancy"),
      value: `${occupancy}%`,
      icon: <Hotel sx={{ fontSize: 22 }} />,
      tone: "#dc2626",
    },
  ];
  const primaryCards = cards.slice(0, 4);

  return (
    <Box className="admin-page">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={
          <Chip
            size="small"
            label={t("occupancyChip", { value: occupancy })}
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

      <Box display="grid" gap={3.5}>
        <Box>
          <Typography
            sx={{
              mb: 1.5,
              fontSize: 12,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontWeight: 700,
              color: "var(--admin-muted)",
            }}
          >
            {t("sections.primaryKpis")}
          </Typography>
          <Grid container spacing={2}>
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
          <Typography
            sx={{
              mb: 1.5,
              fontSize: 12,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontWeight: 700,
              color: "var(--admin-muted)",
            }}
          >
            {t("sections.operationalSnapshot")}
          </Typography>
          <Paper
            className="admin-card"
            elevation={0}
            sx={{ overflow: "hidden", boxShadow: "none" }}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  lg: "repeat(4, minmax(0, 1fr))",
                },
              }}
            >
              {[
                {
                  label: t("snapshot.checkIns"),
                  value: stats?.todayCheckins ?? 0,
                  icon: <Login />,
                  tone: "#0e7490",
                },
                {
                  label: t("snapshot.upcoming"),
                  value: stats?.upcomingReservations ?? 0,
                  icon: <EventAvailable />,
                  tone: "#6d5b8c",
                },
                {
                  label: t("snapshot.revenue"),
                  value: currency.format(Number(stats?.revenueToday || 0)),
                  icon: <Euro />,
                  tone: "#39735c",
                },
                {
                  label: t("snapshot.currentOccupancy"),
                  value: `${occupancy}%`,
                  icon: <Hotel />,
                  tone: "#a76d2a",
                  progress: occupancy,
                },
              ].map((item, index) => (
                <Box
                  key={item.label}
                  sx={{
                    p: { xs: 2.25, md: 2.75 },
                    minHeight: 148,
                    borderRight: {
                      lg: index < 3 ? "1px solid var(--admin-border)" : "none",
                    },
                    borderBottom: {
                      xs: index < 3 ? "1px solid var(--admin-border)" : "none",
                      sm: index < 2 ? "1px solid var(--admin-border)" : "none",
                      lg: "none",
                    },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 2 }}>
                    <Box
                      sx={{
                        width: 34,
                        height: 34,
                        borderRadius: "8px",
                        display: "grid",
                        placeItems: "center",
                        bgcolor: `${item.tone}12`,
                        color: item.tone,
                        "& .MuiSvgIcon-root": { fontSize: 19 },
                      }}
                    >
                      {item.icon}
                    </Box>
                    <Typography
                      sx={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "var(--admin-muted)",
                      }}
                    >
                      {item.label}
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      fontFamily: "var(--font-display, 'Instrument Serif', serif)",
                      fontSize: 32,
                      lineHeight: 1.1,
                      color: "var(--admin-text)",
                    }}
                  >
                    {item.value}
                  </Typography>
                  {item.progress !== undefined ? (
                    <LinearProgress
                      variant="determinate"
                      value={item.progress}
                      sx={{
                        mt: 2,
                        height: 5,
                        borderRadius: 999,
                        bgcolor: "var(--admin-bg)",
                        "& .MuiLinearProgress-bar": {
                          borderRadius: 999,
                          bgcolor: item.tone,
                        },
                      }}
                    />
                  ) : null}
                </Box>
              ))}
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
