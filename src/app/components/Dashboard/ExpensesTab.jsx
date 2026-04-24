"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
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
  useMediaQuery,
  useTheme,
} from "@mui/material";
import WalletIcon from "@mui/icons-material/AccountBalanceWallet";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import PaidIcon from "@mui/icons-material/Paid";
import GroupIcon from "@mui/icons-material/Group";
import PageHeader from "./ui/PageHeader";
import SectionCard from "./ui/SectionCard";
import StatCard from "./ui/StatCard";

const CATEGORY_OPTIONS = [
  { value: "utilities", label: "Utilities" },
  { value: "maintenance", label: "Maintenance" },
  { value: "supplies", label: "Supplies" },
  { value: "salary", label: "Salary" },
  { value: "marketing", label: "Marketing" },
  { value: "other", label: "Other" },
];

const PAYMENT_OPTIONS = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank transfer" },
];

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

function dateFmt(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString();
}

export default function ExpensesTab() {
  const t = useTranslations("dashboard.expenses");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [category, setCategory] = useState("supplies");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [note, setNote] = useState("");
  const [feedback, setFeedback] = useState("");

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (monthFilter) params.set("month", monthFilter);
      if (categoryFilter && categoryFilter !== "all") {
        params.set("category", categoryFilter);
      }

      const res = await fetch(`/api/expenses?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || t("errors.loadFailed"));
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || t("errors.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthFilter, categoryFilter]);

  const totals = useMemo(() => {
    const total = rows.reduce((sum, r) => sum + Number(r.amount || 0), 0);
    const salary = rows
      .filter((r) => r.category === "salary")
      .reduce((sum, r) => sum + Number(r.amount || 0), 0);
    const nonSalary = total - salary;
    return {
      count: rows.length,
      total,
      salary,
      nonSalary,
    };
  }, [rows]);

  const handleAdd = async () => {
    try {
      setSaving(true);
      setError("");
      setFeedback("");
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expense_date: expenseDate,
          category,
          amount: Number(amount),
          payment_method: paymentMethod,
          note,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || t("errors.createFailed"));

      setAmount("");
      setNote("");
      setFeedback(t("feedback.added"));
      fetchExpenses();
    } catch (e) {
      setError(e.message || t("errors.createFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
      />

      {error ? <Alert severity="error">{error}</Alert> : null}
      {feedback ? <Alert severity="success">{feedback}</Alert> : null}

      <Box
        display="grid"
        gap={2}
        gridTemplateColumns={{ xs: "1fr", sm: "repeat(2,1fr)", xl: "repeat(4,1fr)" }}
      >
        <StatCard
          title={t("cards.entries")}
          value={totals.count}
          icon={<WalletIcon fontSize="small" />}
          tone="#0284c7"
        />
        <StatCard
          title={t("cards.totalExpenses")}
          value={money(totals.total)}
          icon={<TrendingDownIcon fontSize="small" />}
          tone="#dc2626"
        />
        <StatCard
          title={t("cards.salaryPayouts")}
          value={money(totals.salary)}
          icon={<GroupIcon fontSize="small" />}
          tone="#7c3aed"
        />
        <StatCard
          title={t("cards.operational")}
          value={money(totals.nonSalary)}
          icon={<PaidIcon fontSize="small" />}
          tone="#d97706"
        />
      </Box>

      <SectionCard title={t("sections.addExpense")}>
        <Box
          display="grid"
          gap={1.2}
          gridTemplateColumns={{ xs: "1fr", md: "repeat(2,1fr)", lg: "repeat(3,1fr)" }}
        >
          <TextField
            label={t("fields.date")}
            type="date"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            select
            label={t("fields.category")}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {CATEGORY_OPTIONS.map((c) => (
              <MenuItem key={c.value} value={c.value}>
                {t(`categories.${c.value}`)}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label={t("fields.amount")}
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputProps={{ min: 0, step: "0.01" }}
          />
          <TextField
            select
            label={t("fields.paymentMethod")}
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            {PAYMENT_OPTIONS.map((p) => (
              <MenuItem key={p.value} value={p.value}>
                {t(`paymentMethods.${p.value}`)}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label={t("fields.note")}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            sx={{ gridColumn: { xs: "1", lg: "span 2" } }}
          />
        </Box>
        <Box mt={1.4} display="flex" justifyContent="flex-end">
          <Button
            variant="contained"
            onClick={handleAdd}
            disabled={saving || !expenseDate || !amount}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            {saving ? t("actions.saving") : t("actions.addExpense")}
          </Button>
        </Box>
      </SectionCard>

      <SectionCard
        title={t("sections.expenseList")}
        action={
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "170px 170px" },
              gap: 1,
              width: { xs: "100%", sm: "auto" },
            }}
          >
            <TextField
              label={t("fields.month")}
              type="month"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
            />
            <TextField
              select
              label={t("fields.category")}
              size="small"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <MenuItem value="all">{t("filters.allCategories")}</MenuItem>
              {CATEGORY_OPTIONS.map((c) => (
                <MenuItem key={c.value} value={c.value}>
                  {t(`categories.${c.value}`)}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        }
      >
        {loading ? (
          <Box sx={{ display: "grid", placeItems: "center", minHeight: 140 }}>
            <CircularProgress />
          </Box>
        ) : isMobile ? (
          <Stack spacing={1.1}>
            {rows.map((r) => (
              <Box
                key={r.id}
                sx={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 2,
                  p: 1.3,
                  bgcolor: "white",
                }}
              >
                <Box display="flex" justifyContent="space-between" gap={1}>
                  <Chip
                    size="small"
                    label={t(`categories.${r.category}`)}
                    sx={{ textTransform: "capitalize" }}
                  />
                  <Typography fontWeight={700}>{money(r.amount)}</Typography>
                </Box>
                <Typography variant="body2" mt={0.6}>
                  {t("fields.date")}: {dateFmt(r.expense_date)}
                </Typography>
                <Typography variant="body2">
                  {t("fields.paymentMethod")}:{" "}
                  {t(`paymentMethods.${String(r.payment_method || "").toLowerCase()}`)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("fields.createdBy")}: {r.created_by || "-"} • {dateFmt(r.created_at)}
                </Typography>
                {r.note ? (
                  <Typography variant="body2" mt={0.3}>
                    {t("fields.note")}: {r.note}
                  </Typography>
                ) : null}
              </Box>
            ))}
            {rows.length === 0 ? (
              <Box py={3} textAlign="center">
                <Typography fontWeight={700}>{t("empty")}</Typography>
              </Box>
            ) : null}
          </Stack>
        ) : (
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table size="small" sx={{ minWidth: 860 }}>
                <TableHead>
                  <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>{t("table.date")}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t("table.category")}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t("table.amount")}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t("table.payment")}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t("table.note")}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t("table.createdBy")}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{t("table.createdAt")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell>{dateFmt(r.expense_date)}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={t(`categories.${r.category}`)}
                        sx={{ textTransform: "capitalize" }}
                      />
                    </TableCell>
                    <TableCell>{money(r.amount)}</TableCell>
                    <TableCell sx={{ textTransform: "capitalize" }}>
                      {t(`paymentMethods.${String(r.payment_method || "").toLowerCase()}`)}
                    </TableCell>
                    <TableCell>{r.note || "-"}</TableCell>
                    <TableCell>{r.created_by || "-"}</TableCell>
                    <TableCell>{dateFmt(r.created_at)}</TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography fontWeight={700}>{t("empty")}</Typography>
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </SectionCard>
    </Stack>
  );
}

