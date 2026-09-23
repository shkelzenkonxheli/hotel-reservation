"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Box, Typography, Grid, Paper, LinearProgress, Chip } from "@mui/material";
import {
  People,
  BookOnline,
  Euro,
  Login,
  EventAvailable,
  Hotel,
} from "@mui/icons-material";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import PageHeader from "./ui/PageHeader";
import StatCard from "./ui/StatCard";

const STATUS_COLORS = {
  pending: "#a76d2a",
  confirmed: "#0e7490",
  checked_in: "#2563eb",
  completed: "#39735c",
  cancelled: "#b91c1c",
  no_show: "#6d5b8c",
};
const FALLBACK_COLORS = ["#0e7490", "#a76d2a", "#39735c", "#6d5b8c", "#b91c1c", "#2563eb"];

const CHART_TICK = { fontSize: 11, fill: "var(--admin-muted)" };
const TOOLTIP_STYLE = {
  borderRadius: 12,
  border: "1px solid var(--admin-border)",
  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.10)",
  fontSize: 12,
  padding: "10px 14px",
};

export default function OverviewTab() {
  const t = useTranslations("dashboard.overview");
  const locale = useLocale();
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

  // Monthly buckets -> chart data with localized month labels.
  const monthly = (stats?.monthly || []).map((m) => ({
    ...m,
    label: new Date(`${m.key}-01T00:00:00Z`).toLocaleDateString(
      locale === "sq" ? "sq-AL" : "en-GB",
      { month: "short", timeZone: "UTC" },
    ),
  }));
  const sixMonthRevenue = monthly.reduce((sum, m) => sum + Number(m.revenue || 0), 0);
  const sixMonthBookings = monthly.reduce((sum, m) => sum + Number(m.bookings || 0), 0);

  // Status breakdown -> donut data with translated labels.
  const statusName = (s) => {
    const keys = {
      pending: t("status.pending"),
      confirmed: t("status.confirmed"),
      checked_in: t("status.checkedIn"),
      completed: t("status.completed"),
      cancelled: t("status.cancelled"),
      no_show: t("status.noShow"),
    };
    return keys[s] || String(s).replace(/_/g, " ");
  };
  const pieData = (stats?.statusBreakdown || []).map((s) => ({
    ...s,
    name: statusName(s.status),
  }));

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
            {t("sections.analytics")}
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
              gap: 2,
            }}
          >
            <Paper
              className="admin-card"
              elevation={0}
              sx={{ p: { xs: 2, md: 3 }, boxShadow: "none" }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  gap: 2,
                  flexWrap: "wrap",
                  mb: 2.5,
                }}
              >
                <Typography
                  sx={{ fontSize: 15, fontWeight: 700, color: "var(--admin-text)" }}
                >
                  {t("charts.revenueBookings")}
                </Typography>
                <Typography sx={{ fontSize: 12, color: "var(--admin-muted)" }}>
                  {t("charts.sixMonthSummary", {
                    revenue: currency.format(sixMonthRevenue),
                    bookings: sixMonthBookings,
                  })}
                </Typography>
              </Box>
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={monthly} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--admin-border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={{ stroke: "var(--admin-border)" }}
                    tick={CHART_TICK}
                  />
                  <YAxis
                    yAxisId="revenue"
                    tickLine={false}
                    axisLine={false}
                    width={56}
                    tick={CHART_TICK}
                    tickFormatter={(v) =>
                      v >= 1000 ? `€${Math.round(v / 1000)}k` : `€${v}`
                    }
                  />
                  <YAxis
                    yAxisId="bookings"
                    orientation="right"
                    tickLine={false}
                    axisLine={false}
                    width={32}
                    tick={CHART_TICK}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    formatter={(value, name) =>
                      name === t("legend.revenue")
                        ? [currency.format(Number(value)), name]
                        : [value, name]
                    }
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                    iconType="circle"
                    iconSize={9}
                  />
                  <Area
                    yAxisId="revenue"
                    type="monotone"
                    dataKey="revenue"
                    name={t("legend.revenue")}
                    stroke="#0e7490"
                    fill="#0e7490"
                    fillOpacity={0.12}
                    strokeWidth={2.5}
                    activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
                  />
                  <Bar
                    yAxisId="bookings"
                    dataKey="bookings"
                    name={t("legend.bookings")}
                    fill="#a76d2a"
                    fillOpacity={0.85}
                    barSize={18}
                    radius={[4, 4, 0, 0]}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </Paper>

            <Paper
              className="admin-card"
              elevation={0}
              sx={{ p: { xs: 2, md: 3 }, boxShadow: "none" }}
            >
              <Typography
                sx={{ fontSize: 15, fontWeight: 700, color: "var(--admin-text)", mb: 2.5 }}
              >
                {t("charts.statusDistribution")}
              </Typography>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="count"
                      nameKey="name"
                      innerRadius={62}
                      outerRadius={92}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={entry.status}
                          fill={
                            STATUS_COLORS[entry.status] ||
                            FALLBACK_COLORS[index % FALLBACK_COLORS.length]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(value, name) => [value, name]}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: 12 }}
                      iconType="circle"
                      iconSize={9}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Typography sx={{ fontSize: 13, color: "var(--admin-muted)", py: 8, textAlign: "center" }}>
                  {t("charts.noData")}
                </Typography>
              )}
            </Paper>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
