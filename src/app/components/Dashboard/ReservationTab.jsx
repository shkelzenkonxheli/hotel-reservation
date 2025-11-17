"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CircularProgress,
  Chip,
  Tooltip,
  Button,
  Box,
  TextField,
  InputLabel,
  Select,
  Menu,
  MenuItem,
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
  DialogContentText,
  Typography,
  FormControl,
} from "@mui/material";
import {
  CheckCircle,
  Cancel,
  HourglassEmpty,
  DoneAll,
  MoreVert,
  Delete,
  BookOnline,
} from "@mui/icons-material";
import ReservationForm from "./ReservationForm";

export default function ReservationsTab() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [filtered, setFiltered] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const router = useRouter();
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    fetchReservations();
  }, []);

  async function fetchReservations() {
    try {
      const res = await fetch("/api/reservation?list=true");
      const data = await res.json();
      if (res.ok) {
        setReservations(data);
        setFiltered(data);
      } else {
        console.error("Error fetching reservations", data.error);
      }
    } catch (error) {
      console.error("Network error:", error);
    } finally {
      setLoading(false);
    }
  }

  // 🔁 Funksioni për ndryshimin e statusit
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
          prev.map((r) => (r.id === updated.id ? updated : r))
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
  useEffect(() => {
    let filteredList = reservations;
    if (search.trim()) {
      filteredList = filteredList.filter(
        (r) =>
          r.full_name?.toLowerCase().includes(search.toLowerCase()) ||
          r.email?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (statusFilter !== "all") {
      filteredList = filteredList.filter(
        (r) => r.status?.toLowerCase() === statusFilter
      );
    }
    if (typeFilter !== "all") {
      filteredList = filteredList.filter((r) =>
        r.rooms?.type?.toLowerCase().includes(typeFilter)
      );
    }
    setFiltered(filteredList);
  }, [search, statusFilter, typeFilter, reservations]);

  // 🗑️ Funksioni për fshirje
  async function handleDeleteReservation() {
    try {
      const res = await fetch(`/api/reservation/${deleteDialog.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
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

  const getStatusChip = (status = "pending") => {
    const s = status.toLowerCase();
    const base = "text-xs font-semibold";

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

      {/* 🔍 Filters */}
      <Box className="flex flex-wrap gap-4 mb-6 mt-4">
        <TextField
          label="Search (Name or Email)"
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <FormControl size="small" className="w-40">
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="confirmed">Confirmed</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" className="w-40">
          <InputLabel>Type</InputLabel>
          <Select
            value={typeFilter}
            label="Type"
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="hotel">Hotel</MenuItem>
            <MenuItem value="apartment">Apartment</MenuItem>
          </Select>
        </FormControl>
        <Button
          variant="contained"
          color="primary"
          sx={{ borderRadius: 2, fontWeight: "bold" }}
          onClick={() => setOpenModal(true)}
        >
          + Add New
        </Button>
        <ReservationForm
          open={openModal}
          onClose={() => setOpenModal(false)}
          onSuccess={fetchReservations}
        />
      </Box>
      {filtered.length === 0 ? (
        <p className="text-center text-gray-500">No reservations found.</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl shadow-md border border-gray-100 mt-4">
          <table className="min-w-full text-sm text-gray-700">
            <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs uppercase">
              <tr>
                <th className="p-3 text-left">Guest</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Room</th>
                <th className="p-3 text-center">#</th>
                <th className="p-3 text-center">Check-in</th>
                <th className="p-3 text-center">Check-out</th>
                <th className="p-3 text-center">Guests</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Total (€)</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className="hover:bg-blue-50 transition duration-150"
                >
                  <td className="p-3 font-medium text-gray-800">
                    {r.full_name}
                  </td>
                  <td className="p-3">{r.users?.email}</td>
                  <td className="p-3">{r.rooms?.name}</td>
                  <td className="p-3 text-center">
                    {r.rooms?.room_number || "-"}
                  </td>
                  <td className="p-3 text-center text-gray-700">
                    {new Date(r.start_date).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-center text-gray-700">
                    {new Date(r.end_date).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-center">{r.guests}</td>
                  <td className="p-3 text-center">{getStatusChip(r.status)}</td>
                  <td className="p-3 text-center font-semibold">
                    €{Number(r.total_price ?? 0).toFixed(2)}
                  </td>

                  {/* 🔘 Butona për veprime */}
                  <td className="p-3 text-center">
                    <Button
                      size="small"
                      variant="outlined"
                      color="primary"
                      onClick={(e) => {
                        setAnchorEl(e.currentTarget);
                        setSelectedReservation(r);
                      }}
                      startIcon={<MoreVert />}
                    >
                      Manage
                    </Button>

                    <Button
                      size="small"
                      color="error"
                      variant="outlined"
                      startIcon={<Delete />}
                      className="ml-2"
                      onClick={() => setDeleteDialog({ open: true, id: r.id })}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        {["Pending", "Confirmed", "Completed", "Cancelled"].map((status) => (
          <MenuItem
            key={status}
            onClick={() =>
              handleStatusChange(selectedReservation.id, status.toLowerCase())
            }
          >
            Set as {status}
          </MenuItem>
        ))}
      </Menu>
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null })}
      >
        <DialogTitle>Delete Reservation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this reservation? This action cannot
            be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, id: null })}>
            Cancel
          </Button>
          <Button color="error" onClick={handleDeleteReservation}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
