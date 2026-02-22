"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import BedOutlinedIcon from "@mui/icons-material/BedOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import PriceCheckOutlinedIcon from "@mui/icons-material/PriceCheckOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import PictureAsPdfOutlinedIcon from "@mui/icons-material/PictureAsPdfOutlined";
import PageHeader from "./ui/PageHeader";
import SectionCard from "./ui/SectionCard";
import StatCard from "./ui/StatCard";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

function dateOnly(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function nightsBetween(start, end) {
  const s = dateOnly(start);
  const e = dateOnly(end);
  if (!s || !e) return 0;
  const diff = (e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.round(diff));
}

export default function ReportsTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [yearFilter, setYearFilter] = useState(new Date().getFullYear());

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        setError("");
        const res = await fetch("/api/reservation?list=true");
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load reports");
        if (active) setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        if (active) setError(e.message || "Failed to load reports");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const yearOptions = useMemo(() => {
    const years = new Set();
    rows.forEach((r) => {
      const d = new Date(r.created_at || r.start_date);
      if (!Number.isNaN(d.getTime())) years.add(d.getFullYear());
    });
    if (!years.size) years.add(new Date().getFullYear());
    return [...years].sort((a, b) => b - a);
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const d = new Date(r.created_at || r.start_date);
      if (Number.isNaN(d.getTime())) return false;
      return d.getFullYear() === Number(yearFilter);
    });
  }, [rows, yearFilter]);

  const monthly = useMemo(() => {
    const base = Array.from({ length: 12 }, (_, i) => ({
      month: i,
      reservations: 0,
      roomNights: 0,
      revenue: 0,
      paid: 0,
      cancellations: 0,
    }));

    filtered.forEach((r) => {
      const d = new Date(r.created_at || r.start_date);
      const m = d.getMonth();
      base[m].reservations += 1;
      base[m].roomNights += nightsBetween(r.start_date, r.end_date);
      base[m].revenue += Number(r.total_price || 0);
      base[m].paid += Number(r.amount_paid || 0);
      if (r.cancelled_at) base[m].cancellations += 1;
    });

    return base;
  }, [filtered]);

  const totals = useMemo(() => {
    const reservations = monthly.reduce((a, m) => a + m.reservations, 0);
    const roomNights = monthly.reduce((a, m) => a + m.roomNights, 0);
    const revenue = monthly.reduce((a, m) => a + m.revenue, 0);
    const paid = monthly.reduce((a, m) => a + m.paid, 0);
    const cancellations = monthly.reduce((a, m) => a + m.cancellations, 0);
    const avgBookingValue = reservations ? revenue / reservations : 0;
    return {
      reservations,
      roomNights,
      revenue,
      paid,
      cancellations,
      avgBookingValue,
      collectionRate: revenue > 0 ? (paid / revenue) * 100 : 0,
    };
  }, [monthly]);

  const maxRevenue = useMemo(
    () => Math.max(...monthly.map((m) => m.revenue), 0),
    [monthly],
  );

  const exportCsv = () => {
    const headers = [
      "Month",
      "Reservations",
      "Room Nights",
      "Revenue",
      "Paid",
      "Collection %",
    ];

    const rowsCsv = monthly.map((m) => {
      const collection = m.revenue > 0 ? (m.paid / m.revenue) * 100 : 0;
      return [
        MONTHS[m.month],
        m.reservations,
        m.roomNights,
        Number(m.revenue || 0).toFixed(2),
        Number(m.paid || 0).toFixed(2),
        collection.toFixed(2),
      ];
    });

    rowsCsv.push([]);
    rowsCsv.push(["Year", yearFilter]);
    rowsCsv.push(["Total Reservations", totals.reservations]);
    rowsCsv.push(["Total Room Nights", totals.roomNights]);
    rowsCsv.push(["Total Revenue", Number(totals.revenue || 0).toFixed(2)]);
    rowsCsv.push(["Total Paid", Number(totals.paid || 0).toFixed(2)]);
    rowsCsv.push(["Cancellations", totals.cancellations]);
    rowsCsv.push(["Collection Rate %", totals.collectionRate.toFixed(2)]);

    const escapeCell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const csv = [headers, ...rowsCsv]
      .map((row) => row.map(escapeCell).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reports-${yearFilter}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportPdf = async () => {
    const html2pdf = (await import("html2pdf.js")).default;
    const container = document.createElement("div");
    container.style.padding = "20px";
    container.style.fontFamily = "Arial, sans-serif";
    container.style.color = "#0f172a";

    const rows = monthly
      .map((m) => {
        const collection = m.revenue > 0 ? (m.paid / m.revenue) * 100 : 0;
        return `
          <tr>
            <td style="padding:8px;border:1px solid #e2e8f0;">${MONTHS[m.month]}</td>
            <td style="padding:8px;border:1px solid #e2e8f0;text-align:right;">${m.reservations}</td>
            <td style="padding:8px;border:1px solid #e2e8f0;text-align:right;">${m.roomNights}</td>
            <td style="padding:8px;border:1px solid #e2e8f0;text-align:right;">${Number(m.revenue || 0).toFixed(2)} EUR</td>
            <td style="padding:8px;border:1px solid #e2e8f0;text-align:right;">${Number(m.paid || 0).toFixed(2)} EUR</td>
            <td style="padding:8px;border:1px solid #e2e8f0;text-align:right;">${collection.toFixed(1)}%</td>
          </tr>
        `;
      })
      .join("");

    container.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:12px;margin-bottom:16px;">
        <div>
          <h2 style="margin:0 0 4px 0;">Dijari Premium - Annual Report</h2>
          <p style="margin:0;color:#475569;">Year: ${yearFilter}</p>
        </div>
        <p style="margin:0;color:#64748b;">Generated: ${new Date().toLocaleString()}</p>
      </div>

      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:16px;">
        <div style="border:1px solid #e2e8f0;border-radius:8px;padding:10px;"><b>Reservations:</b> ${totals.reservations}</div>
        <div style="border:1px solid #e2e8f0;border-radius:8px;padding:10px;"><b>Room Nights:</b> ${totals.roomNights}</div>
        <div style="border:1px solid #e2e8f0;border-radius:8px;padding:10px;"><b>Revenue:</b> ${Number(totals.revenue || 0).toFixed(2)} EUR</div>
        <div style="border:1px solid #e2e8f0;border-radius:8px;padding:10px;"><b>Collection Rate:</b> ${totals.collectionRate.toFixed(1)}%</div>
      </div>

      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead>
          <tr style="background:#f8fafc;">
            <th style="padding:8px;border:1px solid #e2e8f0;text-align:left;">Month</th>
            <th style="padding:8px;border:1px solid #e2e8f0;text-align:right;">Reservations</th>
            <th style="padding:8px;border:1px solid #e2e8f0;text-align:right;">Room nights</th>
            <th style="padding:8px;border:1px solid #e2e8f0;text-align:right;">Revenue</th>
            <th style="padding:8px;border:1px solid #e2e8f0;text-align:right;">Paid</th>
            <th style="padding:8px;border:1px solid #e2e8f0;text-align:right;">Collection</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;

    document.body.appendChild(container);
    await html2pdf()
      .set({
        margin: 10,
        filename: `reports-${yearFilter}.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(container)
      .save();
    document.body.removeChild(container);
  };

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="Reports"
        subtitle="Yearly performance view with monthly revenue and reservation trends."
        actions={
          <Box display="flex" gap={1} flexWrap="wrap">
            <TextField
              select
              size="small"
              value={yearFilter}
              onChange={(e) => setYearFilter(Number(e.target.value))}
              sx={{ minWidth: 140 }}
            >
              {yearOptions.map((y) => (
                <MenuItem key={y} value={y}>
                  {y}
                </MenuItem>
              ))}
            </TextField>
            <Button
              variant="outlined"
              size="small"
              onClick={exportCsv}
              startIcon={<DownloadOutlinedIcon fontSize="small" />}
              sx={{ textTransform: "none", fontWeight: 700 }}
            >
              Export CSV
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={exportPdf}
              startIcon={<PictureAsPdfOutlinedIcon fontSize="small" />}
              sx={{ textTransform: "none", fontWeight: 700 }}
            >
              Export PDF
            </Button>
          </Box>
        }
      />

      {error ? <Alert severity="error">{error}</Alert> : null}

      {loading ? (
        <Box sx={{ display: "grid", placeItems: "center", minHeight: 220 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Box
            display="grid"
            gap={2}
            gridTemplateColumns={{ xs: "1fr", sm: "repeat(2,1fr)", xl: "repeat(4,1fr)" }}
          >
            <StatCard
              title="Reservations"
              value={totals.reservations}
              icon={<EventAvailableOutlinedIcon fontSize="small" />}
              tone="#0284c7"
            />
            <StatCard
              title="Room Nights"
              value={totals.roomNights}
              icon={<BedOutlinedIcon fontSize="small" />}
              tone="#7c3aed"
            />
            <StatCard
              title="Revenue"
              value={money(totals.revenue)}
              icon={<AccountBalanceWalletOutlinedIcon fontSize="small" />}
              tone="#0f766e"
            />
            <StatCard
              title="Avg Booking"
              value={money(totals.avgBookingValue)}
              icon={<PriceCheckOutlinedIcon fontSize="small" />}
              tone="#d97706"
            />
          </Box>

          <SectionCard title="Monthly report">
            <TableContainer sx={{ overflowX: "auto" }}>
              <Table size="small" sx={{ minWidth: 880 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Month</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Reservations</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Room nights</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Revenue</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Paid</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Collection</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Revenue trend</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {monthly.map((m) => {
                    const collection = m.revenue > 0 ? (m.paid / m.revenue) * 100 : 0;
                    const width = maxRevenue > 0 ? (m.revenue / maxRevenue) * 100 : 0;
                    return (
                      <TableRow key={m.month} hover>
                        <TableCell>{MONTHS[m.month]}</TableCell>
                        <TableCell>{m.reservations}</TableCell>
                        <TableCell>{m.roomNights}</TableCell>
                        <TableCell>{money(m.revenue)}</TableCell>
                        <TableCell>{money(m.paid)}</TableCell>
                        <TableCell>{collection.toFixed(1)}%</TableCell>
                        <TableCell sx={{ minWidth: 170 }}>
                          <Box
                            sx={{
                              width: "100%",
                              height: 8,
                              borderRadius: 999,
                              bgcolor: "#e2e8f0",
                              overflow: "hidden",
                            }}
                          >
                            <Box
                              sx={{
                                width: `${width}%`,
                                height: "100%",
                                bgcolor: "#0ea5e9",
                              }}
                            />
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <Box
              mt={1.2}
              display="flex"
              justifyContent="space-between"
              gap={1}
              flexWrap="wrap"
            >
              <Typography variant="caption" color="text.secondary">
                Cancellations: {totals.cancellations}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Collection rate: {totals.collectionRate.toFixed(1)}%
              </Typography>
            </Box>
          </SectionCard>
        </>
      )}
    </Stack>
  );
}
