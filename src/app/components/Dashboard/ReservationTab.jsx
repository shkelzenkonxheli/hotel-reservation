"use client";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  CircularProgress,
  Chip,
  Menu,
  MenuItem,
  Typography,
  Box,
  Button,
  Snackbar,
  Alert,
} from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";
import { DoneAll } from "@mui/icons-material";
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

export default function ReservationsTab() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [reasonTarget, setReasonTarget] = useState(null);

  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
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
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const reservationIdParam = searchParams.get("reservationId");
  const notify = (message, severity = "success") => {
    setFeedback({ open: true, message, severity });
  };

  const openDetails = (r) => {
    setDetailsReservation(r);
    setDetailsOpen(true);
  };

  const toggleFavorite = (id) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  useEffect(() => {
    if (!reservationIdParam) return;
    const id = Number(reservationIdParam);
    if (!Number.isFinite(id)) return;
    const found = reservations.find((r) => r.id === id);
    if (found) {
      openDetails(found);
      router.replace(pathname);
    }
  }, [reservationIdParam, reservations]);

  async function fetchReservations() {
    try {
      const res = await fetch("/api/reservation?list=true");
      const data = await res.json();
      if (res.ok) {
        setReservations(data);
      } else {
        console.error("Error fetching reservations", data.error);
        notify(data.error || "Failed to load reservations.", "error");
      }
    } catch (error) {
      console.error("Network error:", error);
      notify("Network error while loading reservations.", "error");
    } finally {
      setLoading(false);
    }
  }

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
        notify("Reservation status updated.");
      } else {
        const data = await res.json().catch(() => ({}));
        console.error("Failed to update status");
        notify(data.error || "Failed to update status.", "error");
      }
    } catch (err) {
      console.error(err);
      notify("Network error while updating status.", "error");
    } finally {
      setAnchorEl(null);
      setSelectedReservation(null);
    }
  }

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
        notify("Payment info updated.");
      } else {
        const data = await res.json().catch(() => ({}));
        console.error("Failed to update payment status");
        notify(data.error || "Failed to update payment info.", "error");
      }
    } catch (err) {
      console.error(err);
      notify("Network error while updating payment info.", "error");
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
        notify("Reservation deleted successfully.");
        await fetchReservations();
      } else {
        const data = await res.json().catch(() => ({}));
        console.error("Failed to delete reservation");
        notify(data.error || "Failed to delete reservation.", "error");
      }
    } catch (err) {
      console.error(err);
      notify("Network error while deleting reservation.", "error");
    } finally {
      setDeleteDialog({ open: false, id: null });
    }
  }

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    if (!confirm(`Delete ${selectedIds.length} reservations?`)) return;

    try {
      const res = await fetch("/api/reservation/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        notify(data.error || "Failed to delete selected reservations.", "error");
        return;
      }
      setSelectedIds([]);
      notify("Selected reservations deleted.");
      await fetchReservations();
    } catch (err) {
      console.error(err);
      notify("Network error while deleting selected reservations.", "error");
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

  const getStatusChip = (status = "pending") => {
    const s = status.toLowerCase();

    switch (s) {
      case "pending":
        return (
          <Chip
            label="Pending"
            size="small"
            sx={{
              backgroundColor: "#fef9c3",
              color: "#854d0e",
              fontWeight: 600,
            }}
          />
        );
      case "confirmed":
        return (
          <Chip
            label="Confirmed"
            size="small"
            sx={{
              backgroundColor: "#dbeafe",
              color: "#1e40af",
              fontWeight: 600,
            }}
          />
        );
      case "completed":
        return (
          <Chip
            icon={<DoneAll sx={{ color: "#16a34a" }} />}
            label="Completed"
            size="small"
            sx={{
              backgroundColor: "#dcfce7",
              color: "#166534",
              fontWeight: 600,
            }}
          />
        );
      case "cancelled":
        return (
          <Chip
            label="Cancelled"
            size="small"
            sx={{
              backgroundColor: "#fee2e2",
              color: "#991b1b",
              fontWeight: 600,
            }}
          />
        );
      default:
        return <Chip label={status} size="small" />;
    }
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
        title="Reservations"
        subtitle="Track bookings, statuses, and payments."
        actions={
          <Box display="flex" gap={1} flexWrap="wrap">
            <Chip
              label={`Total: ${totals.total}`}
              size="small"
              sx={{
                backgroundColor: "#e0f2fe",
                color: "#075985",
                fontWeight: 600,
              }}
            />
            <Chip
              label={`Active: ${totals.active}`}
              size="small"
              sx={{
                backgroundColor: "#dcfce7",
                color: "#166534",
                fontWeight: 600,
              }}
            />
            <Chip
              label={`Finished: ${totals.finished}`}
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
        onAddNew={() => setOpenModal(true)}
      />

      <ReservationForm
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSuccess={() => {
          notify("Reservation saved successfully.");
          fetchReservations();
        }}
        mode="create"
      />
      <ReservationForm
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSuccess={() => {
          notify("Reservation updated successfully.");
          fetchReservations();
        }}
        mode="edit"
        reservation={editData}
      />

      <ReservationTabs activeTab={activeTab} onChange={setActiveTab} />

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
            Selected: {selectedIds.length}
          </Typography>
          <Button
            color="error"
            variant="contained"
            onClick={handleBulkDelete}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            Delete Selected
          </Button>
        </Box>
      ) : null}

      {displayList.length === 0 ? (
        <p className="text-center text-gray-500">No reservations found.</p>
      ) : isMobile ? (
        <ReservationListMobile
          reservations={displayList}
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
        />
      ) : (
        <ReservationTable
          reservations={displayList}
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
          getBookingState={getBookingState}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onSelectAll={(checked) => selectAllVisible(checked, displayList)}
          allSelected={
            displayList.length > 0 &&
            displayList.every((r) => selectedIds.includes(r.id))
          }
        />
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem
          onClick={() => {
            setEditData(selectedReservation);
            setEditOpen(true);
            setAnchorEl(null);
          }}
        >
          Edit Reservation
        </MenuItem>

        <MenuItem divider />

        {["Pending", "Confirmed", "Completed", "Cancelled"].map((status) => (
          <MenuItem
            key={status}
            onClick={() => {
              handleStatusChange(selectedReservation.id, status.toLowerCase());
              setAnchorEl(null);
            }}
          >
            Set as {status}
          </MenuItem>
        ))}

        <MenuItem divider />

        <MenuItem
          onClick={() =>
            handlePaymentUpdate(
              selectedReservation.id,
              "PAID",
              "cash",
              "confirmed",
            )
          }
        >
          Mark cash as paid + confirm
        </MenuItem>

        <MenuItem
          onClick={() =>
            handlePaymentUpdate(
              selectedReservation.id,
              "UNPAID",
              "cash",
              "pending",
            )
          }
        >
          Mark as unpaid
        </MenuItem>
      </Menu>

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
