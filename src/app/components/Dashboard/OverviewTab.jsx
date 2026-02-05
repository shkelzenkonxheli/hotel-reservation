"use client";

import { useState, useEffect } from "react";
import { Box, Typography, Grid } from "@mui/material";
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

  useEffect(() => {
    fetchOverview();
  }, []);

  async function fetchOverview() {
    const res = await fetch("/api/dashboard");
    const data = await res.json();
    setStats(data);
  }

  if (!stats) {
    return (
      <Typography textAlign="center" color="text.secondary">
        Loading dashboard...
      </Typography>
    );
  }

  return (
    <Box className="admin-page">
      <PageHeader
        title="Overview"
        subtitle="Key operational metrics for today."
      />

      <Grid container spacing={3}>
        {/* TOTAL USERS */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={<People sx={{ fontSize: 22 }} />}
            tone="#2563eb"
          />
        </Grid>

        {/* TOTAL RESERVATIONS */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Reservations"
            value={stats.totalReservation}
            icon={<BookOnline sx={{ fontSize: 22 }} />}
            tone="#16a34a"
          />
        </Grid>

        {/* TOTAL EARNINGS */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Earnings"
            value={`€${stats.totalEarnings.toFixed(2)}`}
            icon={<Euro sx={{ fontSize: 22 }} />}
            tone="#f59e0b"
          />
        </Grid>

        {/* TODAY CHECK-INS */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Today Check-ins"
            value={stats.todayCheckins}
            icon={<Login sx={{ fontSize: 22 }} />}
            tone="#0ea5e9"
          />
        </Grid>

        {/* UPCOMING */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Upcoming Reservations"
            value={stats.upcomingReservations}
            icon={<EventAvailable sx={{ fontSize: 22 }} />}
            tone="#7c3aed"
          />
        </Grid>

        {/* REVENUE TODAY */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Revenue Today"
            value={`€${stats.revenueToday.toFixed(2)}`}
            icon={<Euro sx={{ fontSize: 22 }} />}
            tone="#22c55e"
          />
        </Grid>

        {/* OCCUPANCY */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Occupancy"
            value={`${stats.occupancyPercent}%`}
            icon={<Hotel sx={{ fontSize: 22 }} />}
            tone="#dc2626"
          />
        </Grid>
      </Grid>
    </Box>
  );
}
