"use client";
import { useState, useEffect, useMemo } from "react";
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
  IconButton,
} from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";
import ReservationCard from "./ReservationCard";
import {
  CheckCircle,
  Cancel,
  HourglassEmpty,
  DoneAll,
  MoreVert,
  Delete,
  BookOnline,
  Star,
  StarBorder,
  Print as PrintIcon,
} from "@mui/icons-material";
import ReservationForm from "./ReservationForm";
import PrintReceipt from "./PrintReceipt";

export default function ReservationsTab() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });

  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const router = useRouter();
  const [openModal, setOpenModal] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState("null");

  const isMobile = useMediaQuery("(max-width:768px)");
  const [favorites, setFavorites] = useState([]);
  const [printReservation, setPrintReservation] = useState(null);

  const toggleFavorite = (id) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
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

  const filtered = useMemo(() => {
    let list = reservations;

    // 🔍 Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.full_name?.toLowerCase().includes(q) ||
          r.users?.email?.toLowerCase().includes(q)
      );
    }

    // 📌 Status
    if (statusFilter !== "all") {
      list = list.filter((r) => r.status?.toLowerCase() === statusFilter);
    }

    // 🏨 Room type
    if (typeFilter !== "all") {
      list = list.filter((r) =>
        r.rooms?.type?.toLowerCase().includes(typeFilter)
      );
    }

    // ⭐ Favorites lart
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

  function getUpcomingReservations(reservations) {
    const today = new Date().setHours(0, 0, 0, 0);

    return reservations.filter((r) => {
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

      {/* FILTER BAR */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
          p: 2,
          backgroundColor: "#eae1df",
          borderRadius: 2,
          boxShadow: 1,
        }}
      >
        {/* LEFT SIDE FILTERS */}
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <TextField
            label="Search (Name or Email)"
            variant="outlined"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ minWidth: 220 }}
          />

          <FormControl size="small" sx={{ minWidth: 140 }}>
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

          <FormControl size="small" sx={{ minWidth: 140 }}>
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
        </Box>

        {/* ADD BUTTON */}
        <Button
          variant="contained"
          color="primary"
          sx={{ borderRadius: 2, fontWeight: "bold" }}
          onClick={() => setOpenModal(true)}
        >
          + Add New
        </Button>
      </Box>

      {/* RESERVATION FORM MODAL */}
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

      {/* TABS */}
      <Box
        sx={{
          display: "flex",
          gap: 1.5,
          mb: 3,
          p: 1,
          backgroundColor: "#eae1df",
          borderRadius: 2,
          boxShadow: 1,
        }}
      >
        <Button
          variant={activeTab === "all" ? "contained" : "outlined"}
          onClick={() => setActiveTab("all")}
        >
          All
        </Button>

        <Button
          variant={activeTab === "upcoming" ? "contained" : "outlined"}
          onClick={() => setActiveTab("upcoming")}
        >
          Upcoming
        </Button>

        <Button
          variant={activeTab === "today" ? "contained" : "outlined"}
          onClick={() => setActiveTab("today")}
        >
          Today
        </Button>

        <Button
          variant={activeTab === "past" ? "contained" : "outlined"}
          onClick={() => setActiveTab("past")}
        >
          Past
        </Button>
      </Box>

      {/* ✅ MOBILE CARD VIEW — vetëm UI, pa prekur funksionet */}
      {displayList.length === 0 ? (
        <p className="text-center text-gray-500">No reservations found.</p>
      ) : isMobile ? (
        <Box display="flex" flexDirection="column" gap={2}>
          {displayList.map((r) => (
            <ReservationCard
              key={r.id}
              reservation={r}
              favorite={favorites.includes(r.id)}
              onFavorite={() => toggleFavorite(r.id)}
              onPrint={() => setPrintData(r)}
              onManage={(e) => {
                setAnchorEl(e.currentTarget);
                setSelectedReservation(r);
              }}
            />
          ))}
        </Box>
      ) : (
        /* ✅ DESKTOP TABLE — ruajtur, vetëm UI i përmirësuar për date + pin + print */
        <div className="overflow-x-auto bg-#eae1df rounded-xl shadow-md border border-gray-100 mt-4">
          <table className="min-w-full text-sm text-gray-700">
            <thead className="bg-blue-400 text-white text-xs uppercase">
              <tr>
                <th className="p-3 text-center">Pin</th>
                <th className="p-3 text-left">Reservation Code</th>
                <th className="p-3 text-left">Guest</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Room</th>
                <th className="p-3 text-center">#</th>
                <th className="p-3 text-center">Dates</th>
                <th className="p-3 text-center">Guests</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Total (€)</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {displayList.map((r) => (
                <tr
                  key={r.id}
                  className="hover:bg-blue-50 transition duration-150"
                >
                  {/* PIN */}
                  <td className="p-3 text-center">
                    <IconButton onClick={() => toggleFavorite(r.id)}>
                      {favorites.includes(r.id) ? (
                        <Star color="warning" />
                      ) : (
                        <StarBorder />
                      )}
                    </IconButton>
                  </td>

                  <td className="p-3 font-mono text-sm text-gray-700">
                    {r.reservation_code || "-"}
                  </td>

                  <td className="p-3 font-medium text-gray-800">
                    {r.full_name}
                  </td>

                  <td className="p-3">{r.users?.email}</td>

                  <td className="p-3">{r.rooms?.name}</td>

                  <td className="p-3 text-center">
                    {r.rooms?.room_number || "-"}
                  </td>

                  {/* Dates me ngjyra */}
                  <td className="p-3 text-center">
                    <Box display="flex" flexDirection="column" gap={0.5}>
                      <Chip
                        size="small"
                        label={`IN: ${new Date(
                          r.start_date
                        ).toLocaleDateString()}`}
                        sx={{ background: "#ecfeff", color: "#155e75" }}
                      />
                      <Chip
                        size="small"
                        label={`OUT: ${new Date(
                          r.end_date
                        ).toLocaleDateString()}`}
                        sx={{ background: "#fff7ed", color: "#9a3412" }}
                      />
                    </Box>
                  </td>

                  <td className="p-3 text-center">{r.guests}</td>

                  <td className="p-3 text-center">{getStatusChip(r.status)}</td>

                  <td className="p-3 text-center font-semibold">
                    €{Number(r.total_price ?? 0).toFixed(2)}
                  </td>

                  {/* Actions – ruajtur Manage + Delete, shtuar Print */}
                  <td className="p-3 text-center">
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        setAnchorEl(e.currentTarget);
                        setSelectedReservation(r);
                      }}
                    >
                      <MoreVert />
                    </IconButton>

                    <Tooltip title="Print receipt">
                      <IconButton
                        size="small"
                        onClick={() => setPrintReservation(r)}
                      >
                        <PrintIcon />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete reservation">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() =>
                          setDeleteDialog({ open: true, id: r.id })
                        }
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MENU (Manage) — pa prekur funksionet */}
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

      {/* DELETE DIALOG — pa prekur */}
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

      {/* PRINT RECEIPT — shtesë UI */}
      {printReservation && (
        <PrintReceipt
          reservation={printReservation}
          onClose={() => setPrintReservation(null)}
        />
      )}
    </div>
  );
}
