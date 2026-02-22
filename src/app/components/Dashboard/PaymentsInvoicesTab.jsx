"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
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
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PaymentsIcon from "@mui/icons-material/Payments";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import StatCard from "./ui/StatCard";
import PageHeader from "./ui/PageHeader";
import SectionCard from "./ui/SectionCard";
import ReservationDetailsDialog from "./ReservationDetailsDialog";
import PrintReceipt from "./PrintReceipt";

function formatCurrency(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString();
}

export default function PaymentsInvoicesTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadPayments() {
      try {
        setLoading(true);
        setError("");
        const res = await fetch("/api/reservation?list=true");
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.error || "Failed to load invoices");
        }
        if (active) {
          setRows(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        if (active) {
          setError(e.message || "Failed to load invoices");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPayments();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.payment_status !== statusFilter) {
        return false;
      }
      if (monthFilter) {
        const created = new Date(r.created_at);
        if (Number.isNaN(created.getTime())) return false;
        const ym = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}`;
        if (ym !== monthFilter) return false;
      }
      if (!q) return true;
      const haystack = [
        r.invoice_number || "",
        r.reservation_code || "",
        r.full_name || "",
        r.phone || "",
        r.rooms?.room_number || "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [rows, search, statusFilter, monthFilter]);

  const metrics = useMemo(() => {
    let paidAmount = 0;
    let pendingAmount = 0;
    let paidCount = 0;
    let pendingCount = 0;

    filtered.forEach((r) => {
      const total = Number(r.total_price || 0);
      const paid = Number(r.amount_paid || 0);
      const isPaid = String(r.payment_status || "").toUpperCase() === "PAID";

      if (isPaid) {
        paidCount += 1;
        paidAmount += paid || total;
      } else {
        pendingCount += 1;
        pendingAmount += Math.max(total - paid, 0);
      }
    });

    return {
      totalInvoices: filtered.length,
      paidCount,
      pendingCount,
      paidAmount,
      pendingAmount,
    };
  }, [filtered]);

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="Payments & Invoices"
        subtitle="Track invoice status, paid amounts, and pending balances."
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
            gridTemplateColumns={{ xs: "1fr", sm: "repeat(2,1fr)", lg: "repeat(4,1fr)" }}
          >
            <StatCard
              title="Invoices"
              value={metrics.totalInvoices}
              icon={<ReceiptLongIcon fontSize="small" />}
              tone="#0ea5e9"
            />
            <StatCard
              title="Paid"
              value={metrics.paidCount}
              icon={<PaymentsIcon fontSize="small" />}
              tone="#10b981"
            />
            <StatCard
              title="Pending"
              value={metrics.pendingCount}
              icon={<PendingActionsIcon fontSize="small" />}
              tone="#f59e0b"
            />
            <StatCard
              title="Collected"
              value={formatCurrency(metrics.paidAmount)}
              icon={<AccountBalanceWalletIcon fontSize="small" />}
              tone="#0f766e"
            />
          </Box>

          <SectionCard
            title="Invoice list"
            action={
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "160px 170px 240px" },
                  gap: 1,
                  width: { xs: "100%", sm: "auto" },
                }}
              >
                <TextField
                  select
                  size="small"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  sx={{ minWidth: 160 }}
                >
                  <MenuItem value="all">All statuses</MenuItem>
                  <MenuItem value="PAID">Paid</MenuItem>
                  <MenuItem value="UNPAID">Unpaid</MenuItem>
                </TextField>
                <TextField
                  size="small"
                  type="month"
                  label="Month"
                  InputLabelProps={{ shrink: true }}
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                />
                <TextField
                  size="small"
                  placeholder="Search invoice / guest / phone"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </Box>
            }
          >
            <TableContainer sx={{ overflowX: "auto" }}>
              <Table size="small" sx={{ minWidth: 900 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Invoice</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Guest</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Room</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Stay</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Paid</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Method</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Created</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id} hover>
                      <TableCell>
                        <Typography fontWeight={700}>
                          {r.invoice_number || `INV-${r.id}`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {r.reservation_code || `#${r.id}`}
                        </Typography>
                      </TableCell>
                      <TableCell>{r.full_name || "-"}</TableCell>
                      <TableCell>{r.rooms?.room_number ? `#${r.rooms.room_number}` : "-"}</TableCell>
                      <TableCell>
                        {formatDate(r.start_date)} - {formatDate(r.end_date)}
                      </TableCell>
                      <TableCell>{formatCurrency(r.total_price)}</TableCell>
                      <TableCell>{formatCurrency(r.amount_paid)}</TableCell>
                      <TableCell sx={{ textTransform: "capitalize" }}>
                        {r.payment_method || "-"}
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={r.payment_status || "UNPAID"}
                          sx={{
                            fontWeight: 700,
                            bgcolor:
                              String(r.payment_status).toUpperCase() === "PAID"
                                ? "#dcfce7"
                                : "#fef3c7",
                            color:
                              String(r.payment_status).toUpperCase() === "PAID"
                                ? "#166534"
                                : "#92400e",
                          }}
                        />
                      </TableCell>
                      <TableCell>{formatDate(r.created_at)}</TableCell>
                      <TableCell align="right">
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: 0.8,
                            flexWrap: "wrap",
                          }}
                        >
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<VisibilityOutlinedIcon fontSize="small" />}
                            sx={{ textTransform: "none" }}
                            onClick={() => {
                              setSelectedReservation(r);
                              setDetailsOpen(true);
                            }}
                          >
                            View
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<PrintOutlinedIcon fontSize="small" />}
                            sx={{ textTransform: "none" }}
                            onClick={() => {
                              setSelectedReservation(r);
                              setPrintOpen(true);
                            }}
                          >
                            Print
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                        <Typography fontWeight={700}>No invoices found</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Try changing status filter or search query.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : null}
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
                Showing {filtered.length} invoice(s)
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Pending balance: {formatCurrency(metrics.pendingAmount)}
              </Typography>
            </Box>
          </SectionCard>
        </>
      )}

      {selectedReservation ? (
        <ReservationDetailsDialog
          open={detailsOpen}
          reservation={selectedReservation}
          onClose={() => setDetailsOpen(false)}
        />
      ) : null}

      {selectedReservation && printOpen ? (
        <PrintReceipt
          reservation={selectedReservation}
          onClose={() => setPrintOpen(false)}
        />
      ) : null}
    </Stack>
  );
}
