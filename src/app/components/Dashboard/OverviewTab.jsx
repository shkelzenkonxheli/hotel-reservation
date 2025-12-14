"use client";

import { useState, useEffect } from "react";
import { Box, Typography, Grid, Paper } from "@mui/material";
import {
  People,
  BookOnline,
  Euro,
  Login,
  EventAvailable,
  Hotel,
} from "@mui/icons-material";

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

  const Card = ({ title, value, icon, color }) => (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        borderRadius: 3,
        display: "flex",
        alignItems: "center",
        gap: 2,
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          backgroundColor: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
        }}
      >
        {icon}
      </Box>

      <Box>
        <Typography variant="body2" color="text.secondary">
          {title}
        </Typography>
        <Typography variant="h5" fontWeight="bold">
          {value}
        </Typography>
      </Box>
    </Paper>
  );

  return (
    <Box p={3}>
      <Typography variant="h5" fontWeight="bold" mb={3}>
        Dashboard Overview
      </Typography>

      <Grid container spacing={3}>
        {/* TOTAL USERS */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            title="Total Users"
            value={stats.totalUsers}
            icon={<People />}
            color="#2563eb"
          />
        </Grid>

        {/* TOTAL RESERVATIONS */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            title="Total Reservations"
            value={stats.totalReservation}
            icon={<BookOnline />}
            color="#16a34a"
          />
        </Grid>

        {/* TOTAL EARNINGS */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            title="Total Earnings"
            value={`€${stats.totalEarnings.toFixed(2)}`}
            icon={<Euro />}
            color="#f59e0b"
          />
        </Grid>

        {/* TODAY CHECK-INS */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            title="Today Check-ins"
            value={stats.todayCheckins}
            icon={<Login />}
            color="#0ea5e9"
          />
        </Grid>

        {/* UPCOMING */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            title="Upcoming Reservations"
            value={stats.upcomingReservations}
            icon={<EventAvailable />}
            color="#7c3aed"
          />
        </Grid>

        {/* REVENUE TODAY */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            title="Revenue Today"
            value={`€${stats.revenueToday.toFixed(2)}`}
            icon={<Euro />}
            color="#22c55e"
          />
        </Grid>

        {/* OCCUPANCY */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            title="Occupancy"
            value={`${stats.occupancyPercent}%`}
            icon={<Hotel />}
            color="#dc2626"
          />
        </Grid>
      </Grid>
    </Box>
  );
}
