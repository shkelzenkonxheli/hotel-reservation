"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Paper,
  Snackbar,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import PageHeader from "./ui/PageHeader";
import SectionCard from "./ui/SectionCard";
import EmptyState from "./ui/EmptyState";

const initialForm = {
  room_type: "",
  label: "",
  start_date: "",
  end_date: "",
  promo_price: "",
  active: true,
};

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function SpecialRatesTab() {
  const t = useTranslations("dashboard.specialRates");
  const isMobile = useMediaQuery("(max-width:900px)");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rates, setRates] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRate, setEditingRate] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [inlineError, setInlineError] = useState("");
  const [feedback, setFeedback] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const notify = (message, severity = "success") =>
    setFeedback({ open: true, message, severity });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [ratesRes, roomTypesRes] = await Promise.all([
        fetch("/api/special-rates"),
        fetch("/api/rooms-type"),
      ]);

      const ratesData = await ratesRes.json();
      const roomTypesData = await roomTypesRes.json();

      if (!ratesRes.ok) {
        throw new Error(ratesData?.error || t("messages.loadFailed"));
      }

      setRates(Array.isArray(ratesData) ? ratesData : []);
      setRoomTypes(
        Array.isArray(roomTypesData)
          ? roomTypesData.map((room) => room.type).filter(Boolean)
          : [],
      );
    } catch (error) {
      console.error(error);
      notify(t("messages.loadFailed"), "error");
      setRates([]);
    } finally {
      setLoading(false);
    }
  }

  function openCreateDialog() {
    setEditingRate(null);
    setForm(initialForm);
    setInlineError("");
    setDialogOpen(true);
  }

  function openEditDialog(rate) {
    setEditingRate(rate);
    setForm({
      room_type: rate.room_type || "",
      label: rate.label || "",
      start_date: String(rate.start_date || "").slice(0, 10),
      end_date: String(rate.end_date || "").slice(0, 10),
      promo_price: rate.promo_price ?? "",
      active: rate.active !== false,
    });
    setInlineError("");
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingRate(null);
    setForm(initialForm);
    setInlineError("");
  }

  async function handleSave() {
    if (
      !form.room_type ||
      !form.label ||
      !form.start_date ||
      !form.end_date ||
      form.promo_price === ""
    ) {
      setInlineError(t("errors.required"));
      return;
    }

    try {
      setSaving(true);
      setInlineError("");

      const res = await fetch(
        editingRate ? `/api/special-rates/${editingRate.id}` : "/api/special-rates",
        {
          method: editingRate ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );

      const data = await res.json();
      if (!res.ok) {
        setInlineError(data?.error || t("errors.generic"));
        return;
      }

      await loadData();
      closeDialog();
      notify(
        editingRate ? t("messages.updated") : t("messages.created"),
      );
    } catch (error) {
      console.error(error);
      setInlineError(t("errors.generic"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(rate) {
    const confirmed = window.confirm(
      t("deleteConfirm", { label: rate.label }),
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/special-rates/${rate.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok) {
        notify(data?.error || t("messages.deleteFailed"), "error");
        return;
      }

      await loadData();
      notify(t("messages.deleted"));
    } catch (error) {
      console.error(error);
      notify(t("messages.deleteFailed"), "error");
    }
  }

  const filteredRates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rates.filter((rate) => {
      if (!showInactive && !rate.active) return false;
      if (!q) return true;
      return (
        String(rate.label || "").toLowerCase().includes(q) ||
        String(rate.room_type || "").toLowerCase().includes(q)
      );
    });
  }, [rates, search, showInactive]);

  return (
    <Box className="admin-page">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={
          <Button variant="contained" onClick={openCreateDialog}>
            {t("actions.add")}
          </Button>
        }
      />

      <SectionCard>
        <Box
          display="flex"
          gap={2}
          flexWrap="wrap"
          alignItems="center"
          justifyContent="space-between"
        >
          <TextField
            label={t("fields.search")}
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: { xs: "100%", sm: 260 } }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
              />
            }
            label={t("fields.showInactive")}
          />
        </Box>
      </SectionCard>

      <SectionCard title={t("sections.list")}>
        {loading ? (
          <Box textAlign="center" py={6}>
            <CircularProgress />
          </Box>
        ) : filteredRates.length === 0 ? (
          <EmptyState
            title={t("empty.title")}
            subtitle={t("empty.subtitle")}
          />
        ) : isMobile ? (
          <Box display="grid" gap={1.5}>
            {filteredRates.map((rate) => (
              <Paper
                key={rate.id}
                elevation={0}
                sx={{ p: 1.75, border: "1px solid #e2e8f0", borderRadius: 3 }}
              >
                <Box display="flex" justifyContent="space-between" gap={1} mb={1}>
                  <Box>
                    <Typography fontWeight={800}>{rate.label}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {rate.room_type}
                    </Typography>
                  </Box>
                  <Chip
                    label={rate.active ? t("status.active") : t("status.inactive")}
                    color={rate.active ? "success" : "default"}
                    size="small"
                  />
                </Box>

                <Typography variant="body2" color="text.secondary">
                  {t("fields.period")}: {formatDate(rate.start_date)} - {formatDate(rate.end_date)}
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={0.5}>
                  {t("fields.basePrice")}:{" "}
                  {rate.base_price != null ? `EUR ${Number(rate.base_price).toFixed(2)}` : "-"}
                </Typography>
                <Typography fontWeight={700} mt={1}>
                  {t("fields.promoPrice")}: EUR {Number(rate.promo_price || 0).toFixed(2)}
                </Typography>

                <Box display="flex" gap={1} mt={1.5}>
                  <Button fullWidth variant="outlined" onClick={() => openEditDialog(rate)}>
                    {t("actions.edit")}
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="error"
                    onClick={() => handleDelete(rate)}
                  >
                    {t("actions.delete")}
                  </Button>
                </Box>
              </Paper>
            ))}
          </Box>
        ) : (
          <TableContainer component={Paper} elevation={0}>
            <Table className="admin-table">
              <TableHead>
                <TableRow>
                  <TableCell>{t("table.label")}</TableCell>
                  <TableCell>{t("table.roomType")}</TableCell>
                  <TableCell>{t("table.period")}</TableCell>
                  <TableCell>{t("table.basePrice")}</TableCell>
                  <TableCell>{t("table.promoPrice")}</TableCell>
                  <TableCell>{t("table.status")}</TableCell>
                  <TableCell align="right">{t("table.actions")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRates.map((rate) => (
                  <TableRow key={rate.id} hover>
                    <TableCell sx={{ fontWeight: 700 }}>{rate.label}</TableCell>
                    <TableCell>{rate.room_type}</TableCell>
                    <TableCell>
                      {formatDate(rate.start_date)} - {formatDate(rate.end_date)}
                    </TableCell>
                    <TableCell>
                      {rate.base_price != null
                        ? `EUR ${Number(rate.base_price).toFixed(2)}`
                        : "-"}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: "#1f6feb" }}>
                      EUR {Number(rate.promo_price || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={rate.active ? t("status.active") : t("status.inactive")}
                        color={rate.active ? "success" : "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" gap={1} justifyContent="flex-end">
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => openEditDialog(rate)}
                        >
                          {t("actions.edit")}
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          color="error"
                          onClick={() => handleDelete(rate)}
                        >
                          {t("actions.delete")}
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </SectionCard>

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>
          {editingRate ? t("dialog.editTitle") : t("dialog.addTitle")}
        </DialogTitle>
        <DialogContent dividers>
          <Box display="grid" gap={2} mt={0.5}>
            <TextField
              select
              label={t("fields.roomType")}
              value={form.room_type}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, room_type: e.target.value }))
              }
            >
              {roomTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label={t("fields.label")}
              value={form.label}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, label: e.target.value }))
              }
            />

            <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }} gap={2}>
              <TextField
                label={t("fields.startDate")}
                type="date"
                value={form.start_date}
                InputLabelProps={{ shrink: true }}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, start_date: e.target.value }))
                }
              />
              <TextField
                label={t("fields.endDate")}
                type="date"
                value={form.end_date}
                InputLabelProps={{ shrink: true }}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, end_date: e.target.value }))
                }
              />
            </Box>

            <TextField
              label={t("fields.promoPrice")}
              type="number"
              inputProps={{ min: 0, step: "0.01" }}
              value={form.promo_price}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, promo_price: e.target.value }))
              }
            />

            <FormControlLabel
              control={
                <Switch
                  checked={form.active}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, active: e.target.checked }))
                  }
                />
              }
              label={t("fields.active")}
            />

            <Alert severity="info" sx={{ borderRadius: 2 }}>
              {t("helper")}
            </Alert>

            {inlineError ? <Alert severity="error">{inlineError}</Alert> : null}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>{t("actions.cancel")}</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>
            {saving ? t("actions.saving") : t("actions.save")}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={feedback.open}
        autoHideDuration={3500}
        onClose={() => setFeedback((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          severity={feedback.severity}
          variant="filled"
          onClose={() => setFeedback((prev) => ({ ...prev, open: false }))}
        >
          {feedback.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
