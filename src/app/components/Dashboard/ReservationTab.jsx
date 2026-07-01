"use client";
import { useState, useEffect, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import {
  CircularProgress,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Button,
  Snackbar,
  Alert,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";
import {
  DoneAll,
  EditOutlined,
  HourglassEmptyRounded,
  CheckCircleOutlineRounded,
  TaskAltRounded,
  CancelOutlined,
  PaymentsOutlined,
  MoneyOffCsredOutlined,
  PrintOutlined,
  DeleteOutline,
  DownloadRounded,
} from "@mui/icons-material";
import ReservationFilters from "./ReservationFilters";
import ReservationTabs from "./ReservationTabs";
import ReservationTable from "./ReservationTable";
import ReservationListMobile from "./ReservationListMobile";
import ReservationDetailsDialog from "./ReservationDetailsDialog";
import ReservationDeleteDialog from "./ReservationDeleteDialog";
import ReservationReasonDialog from "./ReservationReasonDialog";
import ReservationForm from "./ReservationForm";
import PrintReceipt from "./PrintReceipt";
import PageHeader from "./ui/PageHeader";

function escapeCsvValue(value) {
  const normalized =
    value === null || value === undefined ? "" : String(value).replace(/\r?\n/g, " ");
  return `"${normalized.replace(/"/g, '""')}"`;
}

const CSV_SEPARATOR = ";";

function formatIsoDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatIsoDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const datePart = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
  const timePart = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return `${datePart} ${timePart}`;
}

export default function ReservationsTab() {
  const t = useTranslations("dashboard.reservations");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [quickActionMenu, setQuickActionMenu] = useState({
    anchorEl: null,
    type: null,
    reservation: null,
  });
  const [exportAnchorEl, setExportAnchorEl] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [reasonTarget, setReasonTarget] = useState(null);
  const [actionDialog, setActionDialog] = useState({
    open: false,
    title: "",
    description: "",
    confirmLabel: "",
    tone: "primary",
    onConfirm: null,
  });
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dateRange, setDateRange] = useState("last30");
  const [search, setSearch] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const isMobile = useMediaQuery("(max-width:768px)");
  const [favorites, setFavorites] = useState([]);
  const [printReservation, setPrintReservation] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsReservation, setDetailsReservation] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [feedback, setFeedback] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const reservationIdParam = searchParams.get("reservationId");
  const confirmCopy = {
    sq: {
      cancel: "Anulo",
      statusTitle: "Konfirmo ndryshimin në {status}",
      statusDescription:
        "A jeni të sigurt që doni ta vendosni rezervimin e {guest} si {status}?",
      markPaidTitle: "Konfirmo pagesën cash",
      markPaidDescription:
        "A jeni të sigurt që doni ta shënoni rezervimin e {guest} si të paguar dhe të konfirmuar?",
      markUnpaidTitle: "Ktheje si të papaguar",
      markUnpaidDescription:
        "A jeni të sigurt që doni ta ktheni rezervimin e {guest} si të papaguar dhe në pritje?",
    },
    en: {
      cancel: "Cancel",
      statusTitle: "Confirm change to {status}",
      statusDescription:
        "Are you sure you want to set {guest}'s reservation as {status}?",
      markPaidTitle: "Confirm cash payment",
      markPaidDescription:
        "Are you sure you want to mark {guest}'s reservation as paid and confirmed?",
      markUnpaidTitle: "Mark as unpaid again",
      markUnpaidDescription:
        "Are you sure you want to move {guest}'s reservation back to unpaid and pending?",
    },
  };
  const confirmLocale = String(locale || "").startsWith("en") ? "en" : "sq";
  const menuCopy =
    confirmLocale === "en"
      ? {
          edit: "Edit reservation",
          print: "Print receipt",
          delete: "Delete reservation",
          pending: "Set pending",
          confirmed: "Confirm reservation",
          completed: "Complete reservation",
          cancelled: "Cancel reservation",
          paid: "Mark cash paid",
          unpaid: "Mark unpaid",
        }
      : {
          edit: "Ndrysho rezervimin",
          print: "Printo faturen",
          delete: "Fshij rezervimin",
          pending: "Ne pritje",
          confirmed: "Konfirmo rezervimin",
          completed: "Perfundo rezervimin",
          cancelled: "Anulo rezervimin",
          paid: "Sheno cash te paguar",
          unpaid: "Sheno te papaguar",
        };
  const confirmT = (key, values) => {
    if (typeof t.has === "function" && t.has(`confirm.${key}`)) {
      return t(`confirm.${key}`, values);
    }
    let template = confirmCopy[confirmLocale][key] || "";
    if (!values) return template;
    return Object.entries(values).reduce(
      (acc, [name, value]) => acc.replaceAll(`{${name}}`, String(value)),
      template,
    );
  };
  const notify = (message, severity = "success") => {
    setFeedback({ open: true, message, severity });
  };
  const exportCopy =
    confirmLocale === "en"
      ? {
          label: "Export",
          all: "Export all CSV",
          filtered: "Export filtered CSV",
          successAll: "All reservations exported.",
          successFiltered: "Filtered reservations exported.",
          empty: "There are no reservations to export.",
        }
      : {
          label: "Export",
          all: "Eksporto te gjitha CSV",
          filtered: "Eksporto te filtruarat CSV",
          successAll: "U eksportuan te gjitha rezervimet.",
          successFiltered: "U eksportuan rezervimet e filtruara.",
          empty: "Nuk ka rezervime per eksport.",
        };

  const openDetails = (r) => {
    setDetailsReservation(r);
    setDetailsOpen(true);
  };

  const closeActionDialog = () => {
    setActionDialog({
      open: false,
      title: "",
      description: "",
      confirmLabel: "",
      tone: "primary",
      onConfirm: null,
    });
  };

  const closeQuickActionMenu = () => {
    setQuickActionMenu({ anchorEl: null, type: null, reservation: null });
  };

  const openQuickActionMenu = (type, event, reservation) => {
    setQuickActionMenu({
      anchorEl: event.currentTarget,
      type,
      reservation,
    });
  };

  const requestActionConfirmation = ({
    title,
    description,
    confirmLabel,
    tone = "primary",
    onConfirm,
  }) => {
    setAnchorEl(null);
    closeQuickActionMenu();
    setActionDialog({
      open: true,
      title,
      description,
      confirmLabel,
      tone,
      onConfirm,
    });
  };

  const toggleFavorite = (id) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  useEffect(() => {
    fetchReservations(dateRange);
  }, [dateRange]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, typeFilter, activeTab, dateRange, pageSize]);

  useEffect(() => {
    if (!reservationIdParam) return;
    const id = Number(reservationIdParam);
    if (!Number.isFinite(id)) return;
    const found = reservations.find((r) => r.id === id);
    if (found) {
      openDetails(found);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("reservationId");
      const next = params.toString();
      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    }
  }, [reservationIdParam, reservations]);

  function getDateRangeFromPreset(preset) {
    if (preset === "all") return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (preset === "thisMonth") {
      return new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString()
        .slice(0, 10);
    }

    const from = new Date(today);
    from.setDate(from.getDate() - (preset === "last90" ? 89 : 29));
    return from.toISOString().slice(0, 10);
  }

  async function fetchReservations(rangePreset = dateRange) {
    try {
      const params = new URLSearchParams({ list: "true" });
      const from = getDateRangeFromPreset(rangePreset);
      if (from) params.set("from", from);

      const res = await fetch(`/api/reservation?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setReservations(data);
      } else {
        console.error("Error fetching reservations", data.error);
        notify(data.error || t("messages.loadFailed"), "error");
      }
    } catch (error) {
      console.error("Network error:", error);
      notify(t("messages.loadNetworkError"), "error");
    } finally {
      setLoading(false);
    }
  }

  const buildCsvRows = (items) => {
    const headers = [
      "id",
      "reservation_code",
      "guest_name",
      "guest_email",
      "user_email",
      "phone",
      "address",
      "room_type",
      "room_name",
      "room_number",
      "check_in",
      "check_out",
      "guests",
      "status",
      "payment_status",
      "payment_method",
      "total_price",
      "amount_paid",
      "invoice_number",
      "special_rate_label",
      "base_nightly_rate",
      "applied_nightly_rate",
      "locale",
      "created_at",
      "paid_at",
      "cancelled_at",
      "cancel_reason",
      "user_id",
      "room_id",
    ];

    const rows = items.map((reservation) => [
      reservation.id,
      reservation.reservation_code,
      reservation.full_name,
      reservation.guest_email,
      reservation.users?.email,
      reservation.phone,
      reservation.address,
      reservation.rooms?.type,
      reservation.rooms?.name,
      reservation.rooms?.room_number,
      formatIsoDate(reservation.start_date),
      formatIsoDate(reservation.end_date),
      reservation.guests,
      reservation.status,
      reservation.payment_status,
      reservation.payment_method,
      reservation.total_price,
      reservation.amount_paid ? Number(reservation.amount_paid) : 0,
      reservation.invoice_number,
      reservation.special_rate_label,
      reservation.base_nightly_rate ? Number(reservation.base_nightly_rate) : "",
      reservation.applied_nightly_rate ? Number(reservation.applied_nightly_rate) : "",
      reservation.guest_locale,
      formatIsoDateTime(reservation.created_at),
      formatIsoDateTime(reservation.paid_at),
      formatIsoDateTime(reservation.cancelled_at),
      reservation.cancel_reason,
      reservation.user_id,
      reservation.room_id,
    ]);

    return [
      `sep=${CSV_SEPARATOR}`,
      headers.map(escapeCsvValue).join(CSV_SEPARATOR),
      ...rows.map((row) => row.map(escapeCsvValue).join(CSV_SEPARATOR)),
    ].join("\n");
  };

  const downloadCsv = (filename, csvContent) => {
    const blob = new Blob([`\uFEFF${csvContent}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportReservations = async (mode) => {
    try {
      if (mode === "filtered") {
        if (displayList.length === 0) {
          notify(exportCopy.empty, "warning");
          return;
        }

        downloadCsv(
          `reservations-filtered-${new Date().toISOString().slice(0, 10)}.csv`,
          buildCsvRows(displayList),
        );
        notify(exportCopy.successFiltered);
        return;
      }

      const res = await fetch("/api/reservation?list=true");
      const data = await res.json();

      if (!res.ok) {
        notify(data?.error || t("messages.loadFailed"), "error");
        return;
      }

      if (!Array.isArray(data) || data.length === 0) {
        notify(exportCopy.empty, "warning");
        return;
      }

      downloadCsv(
        `reservations-all-${new Date().toISOString().slice(0, 10)}.csv`,
        buildCsvRows(data),
      );
      notify(exportCopy.successAll);
    } catch (error) {
      console.error("Failed to export reservations:", error);
      notify(t("messages.loadNetworkError"), "error");
    }
  };

  async function handleStatusChange(id, newStatus) {
    try {
      const res = await fetch(`/api/reservation/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setReservations((prev) =>
          prev.map((r) => (r.id === updated.id ? updated : r)),
        );
        notify(t("messages.statusUpdated"));
      } else {
        const data = await res.json().catch(() => ({}));
        console.error("Failed to update status");
        notify(data.error || t("messages.statusUpdateFailed"), "error");
      }
    } catch (err) {
      console.error(err);
      notify(t("messages.statusUpdateNetworkError"), "error");
    } finally {
      setAnchorEl(null);
      setSelectedReservation(null);
    }
  }

  const getStatusActionMeta = (status) => {
    switch (status) {
      case "pending":
        return {
          icon: <HourglassEmptyRounded fontSize="small" sx={{ color: "#d97706" }} />,
          tone: "warning",
        };
      case "confirmed":
        return {
          icon: <CheckCircleOutlineRounded fontSize="small" sx={{ color: "#16a34a" }} />,
          tone: "success",
        };
      case "completed":
        return {
          icon: <TaskAltRounded fontSize="small" sx={{ color: "#2563eb" }} />,
          tone: "info",
        };
      case "cancelled":
        return {
          icon: <CancelOutlined fontSize="small" sx={{ color: "#dc2626" }} />,
          tone: "error",
        };
      default:
        return {
          icon: <DoneAll fontSize="small" />,
          tone: "primary",
        };
    }
  };

  async function handlePaymentUpdate(id, paymentStatus, paymentMethod, status) {
    try {
      const res = await fetch(`/api/reservation/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_status: paymentStatus,
          payment_method: paymentMethod,
          status,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setReservations((prev) =>
          prev.map((r) => (r.id === updated.id ? updated : r)),
        );
        notify(t("messages.paymentUpdated"));
      } else {
        const data = await res.json().catch(() => ({}));
        console.error("Failed to update payment status");
        notify(data.error || t("messages.paymentUpdateFailed"), "error");
      }
    } catch (err) {
      console.error(err);
      notify(t("messages.paymentUpdateNetworkError"), "error");
    } finally {
      setAnchorEl(null);
      setSelectedReservation(null);
    }
  }

  const filtered = useMemo(() => {
    let list = reservations;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.full_name?.toLowerCase().includes(q) ||
          r.guest_email?.toLowerCase().includes(q) ||
          r.users?.email?.toLowerCase().includes(q),
      );
    }

    if (statusFilter !== "all") {
      list = list.filter((r) => r.status?.toLowerCase() === statusFilter);
    }

    if (typeFilter !== "all") {
      list = list.filter((r) =>
        r.rooms?.type?.toLowerCase().includes(typeFilter),
      );
    }

    list = [...list].sort((a, b) => {
      const aFav = favorites.includes(a.id);
      const bFav = favorites.includes(b.id);
      return bFav - aFav;
    });

    return list;
  }, [reservations, search, statusFilter, typeFilter, favorites]);

  async function handleDeleteReservation() {
    try {
      const res = await fetch(`/api/reservation/${deleteDialog.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        notify(t("messages.deleted"));
        await fetchReservations();
      } else {
        const data = await res.json().catch(() => ({}));
        console.error("Failed to delete reservation");
        notify(data.error || t("messages.deleteFailed"), "error");
      }
    } catch (err) {
      console.error(err);
      notify(t("messages.deleteNetworkError"), "error");
    } finally {
      setDeleteDialog({ open: false, id: null });
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return;

    try {
      const res = await fetch("/api/reservation/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        notify(data.error || t("messages.bulkDeleteFailed"), "error");
        return;
      }
      setSelectedIds([]);
      notify(t("messages.bulkDeleted"));
      await fetchReservations();
    } catch (err) {
      console.error(err);
      notify(t("messages.bulkDeleteNetworkError"), "error");
    }
  }

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const selectAllVisible = (checked, list) => {
    if (checked) {
      setSelectedIds(list.map((r) => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  function getUpcomingReservations(reservationsList) {
    const today = new Date().setHours(0, 0, 0, 0);

    return reservationsList.filter((r) => {
      if (r.cancelled_at !== null) return false;
      const start = new Date(r.start_date).setHours(0, 0, 0, 0);
      return start >= today;
    });
  }

  let displayList = filtered;
  if (activeTab === "upcoming") {
    displayList = getUpcomingReservations(filtered);
  }
  if (activeTab === "today") {
    const today = new Date().setHours(0, 0, 0, 0);
    displayList = filtered.filter((r) => {
      if (r.cancelled_at !== null) return false;
      const start = new Date(r.start_date).setHours(0, 0, 0, 0);
      return start === today;
    });
  }
  if (activeTab === "present") {
    const today = new Date().setHours(0, 0, 0, 0);
    displayList = filtered.filter((r) => {
      if (r.cancelled_at !== null) return false;
      const start = new Date(r.start_date).setHours(0, 0, 0, 0);
      const end = new Date(r.end_date).setHours(0, 0, 0, 0);
      return start <= today && end > today;
    });
  }
  if (activeTab === "past") {
    const today = new Date().setHours(0, 0, 0, 0);
    displayList = filtered.filter((r) => {
      const end = new Date(r.end_date).setHours(0, 0, 0, 0);
      return end < today;
    });
  }

  const totalPages = Math.max(1, Math.ceil(displayList.length / pageSize));
  const paginatedList = displayList.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const getStatusChip = (status = "pending", interactive = false) => {
    const s = status.toLowerCase();
    const interactiveSx = interactive
      ? {
          cursor: "pointer",
          transition: "transform 0.15s ease, box-shadow 0.15s ease",
          "&:hover": {
            transform: "translateY(-1px)",
            boxShadow: "0 6px 16px rgba(15, 23, 42, 0.12)",
          },
        }
      : {};

    switch (s) {
      case "pending":
        return (
          <Chip
            label={t("statuses.pending")}
            size="small"
            sx={{
              backgroundColor: "#fef9c3",
              color: "#854d0e",
              fontWeight: 600,
              ...interactiveSx,
            }}
          />
        );
      case "confirmed":
        return (
          <Chip
            label={t("statuses.confirmed")}
            size="small"
            sx={{
              backgroundColor: "#dbeafe",
              color: "#1e40af",
              fontWeight: 600,
              ...interactiveSx,
            }}
          />
        );
      case "completed":
        return (
          <Chip
            icon={<DoneAll sx={{ color: "#16a34a" }} />}
            label={t("statuses.completed")}
            size="small"
            sx={{
              backgroundColor: "#dcfce7",
              color: "#166534",
              fontWeight: 600,
              ...interactiveSx,
            }}
          />
        );
      case "cancelled":
        return (
          <Chip
            label={t("statuses.cancelled")}
            size="small"
            sx={{
              backgroundColor: "#fee2e2",
              color: "#991b1b",
              fontWeight: 600,
              ...interactiveSx,
            }}
          />
        );
      default:
        return <Chip label={status} size="small" sx={interactiveSx} />;
    }
  };

  const getPaymentChip = (reservation, interactive = false) => {
    const isPaid = String(reservation?.payment_status || "").toUpperCase() === "PAID";
    const interactiveSx = interactive
      ? {
          cursor: "pointer",
          transition: "transform 0.15s ease, box-shadow 0.15s ease",
          "&:hover": {
            transform: "translateY(-1px)",
            boxShadow: "0 6px 16px rgba(15, 23, 42, 0.12)",
          },
        }
      : {};
    return (
      <Chip
        size="small"
        label={t(`payment.${isPaid ? "paid" : "unpaid"}`)}
        sx={{
          backgroundColor: isPaid ? "#dcfce7" : "#fee2e2",
          color: isPaid ? "#166534" : "#991b1b",
          fontWeight: 600,
          ...interactiveSx,
        }}
      />
    );
  };

  function getBookingState(r) {
    const status = String(r?.status || "").toLowerCase();
    if (r.cancelled_at || status === "cancelled") return "CANCELLED";
    if (status === "completed") return "FINISHED";

    const toLocalYmd = (date) =>
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0",
      )}-${String(date.getDate()).padStart(2, "0")}`;

    const extractYmd = (value) => {
      const datePart = String(value || "").slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
        return datePart;
      }
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return "";
      return toLocalYmd(d);
    };

    const todayYmd = toLocalYmd(new Date());
    const endYmd = extractYmd(r.end_date);

    // Checkout day and older reservations are treated as finished.
    if (endYmd && endYmd <= todayYmd) return "FINISHED";

    return "ACTIVE";
  }

  const totals = useMemo(() => {
    const total = displayList.length;
    let active = 0;
    let finished = 0;
    for (const r of displayList) {
      const state = getBookingState(r);
      if (state === "FINISHED") finished++;
      if (state === "ACTIVE") active++;
    }
    return { total, active, finished };
  }, [displayList]);

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <CircularProgress />
      </div>
    );

  return (
    <div className="admin-page">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={
          <Box display="flex" gap={1} flexWrap="wrap">
            <Chip
              label={t("summary.total", { count: totals.total })}
              size="small"
              sx={{
                backgroundColor: "#e0f2fe",
                color: "#075985",
                fontWeight: 600,
              }}
            />
            <Chip
              label={t("summary.active", { count: totals.active })}
              size="small"
              sx={{
                backgroundColor: "#dcfce7",
                color: "#166534",
                fontWeight: 600,
              }}
            />
            <Chip
              label={t("summary.finished", { count: totals.finished })}
              size="small"
              sx={{
                backgroundColor: "#fef9c3",
                color: "#854d0e",
                fontWeight: 600,
              }}
            />
          </Box>
        }
      />

      <ReservationFilters
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        onAddNew={() => setOpenModal(true)}
      />

      <ReservationForm
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSuccess={() => {
          notify(t("messages.saved"));
          fetchReservations();
        }}
        mode="create"
      />
      <ReservationForm
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSuccess={() => {
          notify(t("messages.updated"));
          fetchReservations();
        }}
        mode="edit"
        reservation={editData}
      />

      <Box
        sx={{
          display: "flex",
          alignItems: { xs: "stretch", md: "center" },
          justifyContent: "space-between",
          gap: 1.5,
          flexDirection: { xs: "column", md: "row" },
          mb: 2,
        }}
      >
        <ReservationTabs activeTab={activeTab} onChange={setActiveTab} />

        <Button
          variant="outlined"
          onClick={(event) => setExportAnchorEl(event.currentTarget)}
          startIcon={<DownloadRounded fontSize="small" />}
          sx={{
            borderRadius: 2,
            fontWeight: 700,
            minHeight: 40,
            whiteSpace: "nowrap",
            alignSelf: { xs: "flex-end", md: "center" },
          }}
        >
          {exportCopy.label}
        </Button>
      </Box>

      {selectedIds.length > 0 ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "stretch", sm: "center" },
            justifyContent: "space-between",
            gap: 1.2,
            mb: 2,
            p: 1.5,
            borderRadius: 2,
            backgroundColor: "#fff7ed",
            border: "1px solid #fed7aa",
          }}
        >
          <Typography fontWeight={600}>
            {t("selected", { count: selectedIds.length })}
          </Typography>
          <Button
            color="error"
            variant="contained"
            onClick={() =>
              requestActionConfirmation({
                title: t("deleteSelected"),
                description: t("messages.bulkDeleteConfirm", {
                  count: selectedIds.length,
                }),
                confirmLabel: t("deleteSelected"),
                tone: "error",
                onConfirm: handleBulkDelete,
              })
            }
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            {t("deleteSelected")}
          </Button>
        </Box>
      ) : null}

      {displayList.length === 0 ? (
        <p className="text-center text-gray-500">
          {t("emptyFiltered", { range: t(`filters.ranges.${dateRange}`) })}
        </p>
      ) : isMobile ? (
        <ReservationListMobile
          reservations={paginatedList}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          onManage={(e, r) => {
            setAnchorEl(e.currentTarget);
            setSelectedReservation(r);
          }}
          onPrint={setPrintReservation}
          onDelete={(r) => setDeleteDialog({ open: true, id: r.id })}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          getStatusChip={getStatusChip}
          getPaymentChip={getPaymentChip}
          onOpenStatusMenu={(e, r) => openQuickActionMenu("status", e, r)}
          onOpenPaymentMenu={(e, r) => openQuickActionMenu("payment", e, r)}
        />
      ) : (
        <ReservationTable
          reservations={paginatedList}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          onOpenDetails={openDetails}
          onManage={(e, r) => {
            setAnchorEl(e.currentTarget);
            setSelectedReservation(r);
          }}
          onPrint={setPrintReservation}
          onDelete={(r) => setDeleteDialog({ open: true, id: r.id })}
          getStatusChip={getStatusChip}
          getPaymentChip={getPaymentChip}
          getBookingState={getBookingState}
          onOpenStatusMenu={(e, r) => openQuickActionMenu("status", e, r)}
          onOpenPaymentMenu={(e, r) => openQuickActionMenu("payment", e, r)}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onSelectAll={(checked) => selectAllVisible(checked, paginatedList)}
          allSelected={
            paginatedList.length > 0 &&
            paginatedList.every((r) => selectedIds.includes(r.id))
          }
        />
      )}

      {totalPages > 1 ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            color="primary"
            onChange={(_, value) => setPage(value)}
          />
        </Box>
      ) : null}

      <Menu
        anchorEl={exportAnchorEl}
        open={Boolean(exportAnchorEl)}
        onClose={() => setExportAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <MenuItem
          onClick={() => {
            setExportAnchorEl(null);
            exportReservations("filtered");
          }}
        >
          {exportCopy.filtered}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setExportAnchorEl(null);
            exportReservations("all");
          }}
        >
          {exportCopy.all}
        </MenuItem>
      </Menu>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            width: { xs: "min(90vw, 296px)", sm: 296 },
            maxWidth: "calc(100vw - 24px)",
            mt: 0.25,
            borderRadius: 3,
            border: "1px solid #e2e8f0",
            boxShadow: "0 18px 45px rgba(15, 23, 42, 0.18)",
            overflow: "hidden",
          },
        }}
        MenuListProps={{
          sx: {
            py: 0.35,
          },
        }}
      >
        <MenuItem
          onClick={() => {
            setEditData(selectedReservation);
            setEditOpen(true);
            setAnchorEl(null);
          }}
          sx={{ minHeight: 36, gap: 0.75, py: 0.45, px: 1.4 }}
        >
          <ListItemIcon sx={{ minWidth: 28 }}>
            <EditOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary={menuCopy.edit}
            primaryTypographyProps={{ fontSize: 13.5, fontWeight: 500 }}
          />
        </MenuItem>

        <MenuItem
          onClick={() => {
            setPrintReservation(selectedReservation);
            setAnchorEl(null);
          }}
          sx={{ minHeight: 36, gap: 0.75, py: 0.45, px: 1.4 }}
        >
          <ListItemIcon sx={{ minWidth: 28 }}>
            <PrintOutlined fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary={menuCopy.print}
            primaryTypographyProps={{ fontSize: 13.5, fontWeight: 500 }}
          />
        </MenuItem>

        <MenuItem
          onClick={() => {
            setDeleteDialog({ open: true, id: selectedReservation?.id ?? null });
            setAnchorEl(null);
          }}
          sx={{ minHeight: 36, gap: 0.75, py: 0.45, px: 1.4 }}
        >
          <ListItemIcon sx={{ minWidth: 28 }}>
            <DeleteOutline fontSize="small" sx={{ color: "#dc2626" }} />
          </ListItemIcon>
          <ListItemText
            primary={menuCopy.delete}
            primaryTypographyProps={{ fontSize: 13.5, fontWeight: 500 }}
          />
        </MenuItem>

        {["pending", "confirmed", "completed", "cancelled"].map((status) => (
          <MenuItem
            key={status}
            onClick={() => {
              const meta = getStatusActionMeta(status);
              requestActionConfirmation({
                title: confirmT("statusTitle", {
                  status: t(`statuses.${status}`),
                }),
                description: confirmT("statusDescription", {
                  guest: selectedReservation?.full_name || "-",
                  status: t(`statuses.${status}`),
                }),
                confirmLabel: t("menu.setAs", {
                  status: t(`statuses.${status}`),
                }),
                tone: meta.tone,
                onConfirm: () => handleStatusChange(selectedReservation.id, status),
              });
            }}
            sx={{
              minHeight: 34,
              gap: 0.75,
              py: 0.35,
              px: 1.4,
            }}
          >
            <ListItemIcon sx={{ minWidth: 28 }}>
              {getStatusActionMeta(status).icon}
            </ListItemIcon>
            <ListItemText
              primary={menuCopy[status]}
              primaryTypographyProps={{ fontSize: 13.25, fontWeight: 500 }}
            />
          </MenuItem>
        ))}

        <MenuItem
          onClick={() =>
            requestActionConfirmation({
              title: confirmT("markPaidTitle"),
              description: confirmT("markPaidDescription", {
                guest: selectedReservation?.full_name || "-",
              }),
              confirmLabel: t("menu.markCashPaidAndConfirm"),
              tone: "success",
              onConfirm: () =>
                handlePaymentUpdate(
                  selectedReservation.id,
                  "PAID",
                  "cash",
                  "confirmed",
                ),
            })
          }
          sx={{
            minHeight: 34,
            gap: 0.75,
            py: 0.35,
            px: 1.4,
          }}
        >
          <ListItemIcon sx={{ minWidth: 28 }}>
            <PaymentsOutlined fontSize="small" sx={{ color: "#16a34a" }} />
          </ListItemIcon>
          <ListItemText
            primary={menuCopy.paid}
            primaryTypographyProps={{ fontSize: 13.25, fontWeight: 500 }}
          />
        </MenuItem>

        <MenuItem
          onClick={() =>
            requestActionConfirmation({
              title: confirmT("markUnpaidTitle"),
              description: confirmT("markUnpaidDescription", {
                guest: selectedReservation?.full_name || "-",
              }),
              confirmLabel: t("menu.markAsUnpaid"),
              tone: "warning",
              onConfirm: () =>
                handlePaymentUpdate(
                  selectedReservation.id,
                  "UNPAID",
                  "cash",
                  "pending",
                ),
            })
          }
          sx={{
            minHeight: 34,
            gap: 0.75,
            py: 0.35,
            px: 1.4,
          }}
        >
          <ListItemIcon sx={{ minWidth: 28 }}>
            <MoneyOffCsredOutlined fontSize="small" sx={{ color: "#b45309" }} />
          </ListItemIcon>
          <ListItemText
            primary={menuCopy.unpaid}
            primaryTypographyProps={{ fontSize: 13.25, fontWeight: 500 }}
          />
        </MenuItem>
      </Menu>

      <Menu
        anchorEl={quickActionMenu.anchorEl}
        open={Boolean(quickActionMenu.anchorEl)}
        onClose={closeQuickActionMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
        PaperProps={{
          sx: {
            minWidth: 220,
            borderRadius: 3,
            border: "1px solid #e2e8f0",
            boxShadow: "0 18px 45px rgba(15, 23, 42, 0.18)",
          },
        }}
      >
        {quickActionMenu.type === "status"
          ? ["pending", "confirmed", "completed", "cancelled"].map((status) => (
              <MenuItem
                key={status}
                disabled={
                  String(quickActionMenu.reservation?.status || "").toLowerCase() === status
                }
                onClick={() => {
                  const meta = getStatusActionMeta(status);
                  requestActionConfirmation({
                    title: confirmT("statusTitle", {
                      status: t(`statuses.${status}`),
                    }),
                    description: confirmT("statusDescription", {
                      guest: quickActionMenu.reservation?.full_name || "-",
                      status: t(`statuses.${status}`),
                    }),
                    confirmLabel: menuCopy[status],
                    tone: meta.tone,
                    onConfirm: () =>
                      handleStatusChange(quickActionMenu.reservation.id, status),
                  });
                }}
                sx={{ minHeight: 38, gap: 0.75, py: 0.55, px: 1.4 }}
              >
                <ListItemIcon sx={{ minWidth: 28 }}>
                  {getStatusActionMeta(status).icon}
                </ListItemIcon>
                <ListItemText
                  primary={menuCopy[status]}
                  primaryTypographyProps={{ fontSize: 13.5, fontWeight: 500 }}
                />
              </MenuItem>
            ))
          : null}

        {quickActionMenu.type === "payment"
          ? [
              {
                key: "paid",
                icon: (
                  <PaymentsOutlined fontSize="small" sx={{ color: "#16a34a" }} />
                ),
                label: menuCopy.paid,
                disabled:
                  String(quickActionMenu.reservation?.payment_status || "").toUpperCase() ===
                  "PAID",
                onConfirm: () =>
                  requestActionConfirmation({
                    title: confirmT("markPaidTitle"),
                    description: confirmT("markPaidDescription", {
                      guest: quickActionMenu.reservation?.full_name || "-",
                    }),
                    confirmLabel: menuCopy.paid,
                    tone: "success",
                    onConfirm: () =>
                      handlePaymentUpdate(
                        quickActionMenu.reservation.id,
                        "PAID",
                        "cash",
                        "confirmed",
                      ),
                  }),
              },
              {
                key: "unpaid",
                icon: (
                  <MoneyOffCsredOutlined
                    fontSize="small"
                    sx={{ color: "#b45309" }}
                  />
                ),
                label: menuCopy.unpaid,
                disabled:
                  String(quickActionMenu.reservation?.payment_status || "").toUpperCase() ===
                  "UNPAID",
                onConfirm: () =>
                  requestActionConfirmation({
                    title: confirmT("markUnpaidTitle"),
                    description: confirmT("markUnpaidDescription", {
                      guest: quickActionMenu.reservation?.full_name || "-",
                    }),
                    confirmLabel: menuCopy.unpaid,
                    tone: "warning",
                    onConfirm: () =>
                      handlePaymentUpdate(
                        quickActionMenu.reservation.id,
                        "UNPAID",
                        "cash",
                        "pending",
                      ),
                  }),
              },
            ].map((item) => (
              <MenuItem
                key={item.key}
                disabled={item.disabled}
                onClick={item.onConfirm}
                sx={{ minHeight: 38, gap: 0.75, py: 0.55, px: 1.4 }}
              >
                <ListItemIcon sx={{ minWidth: 28 }}>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontSize: 13.5, fontWeight: 500 }}
                />
              </MenuItem>
            ))
          : null}
      </Menu>

      <Dialog
        open={actionDialog.open}
        onClose={closeActionDialog}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>{actionDialog.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{actionDialog.description}</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={closeActionDialog}>{confirmT("cancel")}</Button>
          <Button
            variant="contained"
            color={actionDialog.tone}
            onClick={async () => {
              const action = actionDialog.onConfirm;
              closeActionDialog();
              if (action) await action();
            }}
          >
            {actionDialog.confirmLabel}
          </Button>
        </DialogActions>
      </Dialog>

      <ReservationDetailsDialog
        open={detailsOpen}
        reservation={detailsReservation}
        onClose={() => {
          setDetailsOpen(false);
          setDetailsReservation(null);
        }}
      />

      <ReservationDeleteDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null })}
        onConfirm={handleDeleteReservation}
      />

      <ReservationReasonDialog
        open={!!reasonTarget}
        reservation={reasonTarget}
        onClose={() => setReasonTarget(null)}
      />

      {printReservation && (
        <PrintReceipt
          reservation={printReservation}
          onClose={() => setPrintReservation(null)}
        />
      )}

      <Snackbar
        open={feedback.open}
        autoHideDuration={3200}
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
    </div>
  );
}
