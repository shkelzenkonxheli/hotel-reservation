"use client";
import { useState, useEffect, useMemo } from "react";
import { CircularProgress, Chip, Menu, MenuItem, Typography } from "@mui/material";
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

  async function fetchReservations() {
    try {
      const res = await fetch("/api/reservation?list=true");
      const data = await res.json();
      if (res.ok) {
        setReservations(data);
      } else {
        console.error("Error fetching reservations", data.error);
      }
    } catch (error) {
      console.error("Network error:", error);
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
      } else {
        console.error("Failed to update status");
      }
    } catch (err) {
      console.error(err);
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
        alert("Reservation successfully deleted!");
        fetchReservations();
      } else {
        console.error("Failed to delete reservation");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteDialog({ open: false, id: null });
    }
  }

  function getUpcomingReservations(reservationsList) {
    const today = new Date().setHours(0, 0, 0, 0);

    return reservationsList.filter((r) => {
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
      const start = new Date(r.start_date).setHours(0, 0, 0, 0);
      return start === today;
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
    if (r.cancelled_at) return "CANCELLED";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const end = new Date(r.end_date);
    end.setHours(0, 0, 0, 0);

    if (end < today) return "FINISHED";

    return "ACTIVE";
  }

  if (loading)
    return (
      <div className="flex justify-center py-16">
        <CircularProgress />
      </div>
    );

  return (
    <div className="p-6">
      <Typography variant="h5" fontWeight="bold" className="mb-6">
        Reservations Overview
      </Typography>

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
        onSuccess={fetchReservations}
        mode="create"
      />
      <ReservationForm
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSuccess={fetchReservations}
        mode="edit"
        reservation={editData}
      />

      <ReservationTabs activeTab={activeTab} onChange={setActiveTab} />

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
    </div>
  );
}
