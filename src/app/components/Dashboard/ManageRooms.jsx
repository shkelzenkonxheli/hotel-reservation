"use client";
import { useEffect, useMemo, useState } from "react";
import RoomForm from "./RoomForm";
import RoomTypePhotosManager from "./RoomTypePhotosManager";
import {
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  FormControlLabel,
  Switch,
  useMediaQuery,
} from "@mui/material";
import PageHeader from "./ui/PageHeader";
import SectionCard from "./ui/SectionCard";
import EmptyState from "./ui/EmptyState";

export default function ManageRoomsTab() {
  const isMobile = useMediaQuery("(max-width:900px)");
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState([]);

  const [selectedRoom, setSelectedRoom] = useState(null);
  const [mode, setMode] = useState(null);

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterRoomType, setFilterRoomType] = useState("all");

  // ✅ toggle
  const [onlyWithPhotos, setOnlyWithPhotos] = useState(false);

  const [deleteDialog, setDeleteDialog] = useState({
    open: false,
    roomId: null,
  });

  useEffect(() => {
    fetchRooms();
  }, []);

  async function fetchRooms() {
    try {
      setLoading(true);
      const res = await fetch("/api/rooms?include=false");
      const data = await res.json();
      setRooms(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching rooms:", err);
      setRooms([]);
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(room) {
    setSelectedRoom(room);
    setMode("edit");
  }

  function handleAdd() {
    setSelectedRoom(null);
    setMode("add");
  }

  async function handleDeleteRoom() {
    try {
      const res = await fetch(`/api/rooms/${deleteDialog.roomId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchRooms();
      } else {
        alert("Failed to delete room");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteDialog({ open: false, roomId: null });
    }
  }

  const safeRooms = Array.isArray(rooms) ? rooms : [];

  const roomTypeOptions = useMemo(() => {
    return ["all", ...Array.from(new Set(safeRooms.map((r) => r.type)))];
  }, [safeRooms]);

  const filteredRooms = safeRooms.filter((room) => {
    const matchesSearch =
      room.name?.toLowerCase().includes(search.toLowerCase()) ||
      room.room_number?.toString().includes(search);

    const matchesType =
      filterType === "all" || room.type?.toLowerCase().includes(filterType);

    const matchesRoomType =
      filterRoomType === "all" || room.type === filterRoomType;

    return matchesSearch && matchesType && matchesRoomType;
  });

  return (
    <Box className="admin-page">
      <PageHeader
        title="Manage Rooms"
        subtitle="Create, edit, and manage inventory."
        actions={
          <FormControlLabel
            control={
              <Switch
                checked={onlyWithPhotos}
                onChange={(e) => setOnlyWithPhotos(e.target.checked)}
              />
            }
            label="Only rooms with photos"
          />
        }
      />

      {!onlyWithPhotos && (
        <SectionCard title="Filters">
          <Box
            display="flex"
            gap={2}
            flexWrap="wrap"
            alignItems="center"
            justifyContent="space-between"
          >
            <TextField
              label="Search rooms..."
              variant="outlined"
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ minWidth: { xs: "100%", sm: 220 } }}
            />

            <Select
              value={filterRoomType}
              onChange={(e) => setFilterRoomType(e.target.value)}
              size="small"
              sx={{ minWidth: { xs: "100%", sm: 180 } }}
            >
              {roomTypeOptions.map((type) => (
                <MenuItem key={type} value={type}>
                  {type === "all" ? "All Room Types" : type}
                </MenuItem>
              ))}
            </Select>

            <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              size="small"
              sx={{ minWidth: { xs: "100%", sm: 140 } }}
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="hotel">Hotel</MenuItem>
              <MenuItem value="apartment">Apartment</MenuItem>
            </Select>

            <Button
              variant="contained"
              onClick={handleAdd}
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              Add Room
            </Button>
          </Box>
        </SectionCard>
      )}

      {/* ✅ VIEW 1: Photo manager (Room Types) */}
      {onlyWithPhotos ? (
        <RoomTypePhotosManager />
      ) : loading ? (
        <Box textAlign="center" py={6}>
          <CircularProgress />
          <Typography mt={2}>Loading rooms...</Typography>
        </Box>
      ) : (
        /* ✅ VIEW 2: Rooms table (CRUD) */
        <SectionCard title="Rooms">
          {filteredRooms.length === 0 ? (
            <EmptyState title="No rooms found" />
          ) : isMobile ? (
            <Box display="grid" gap={1.5}>
              {filteredRooms.map((room) => (
                <Paper
                  key={room.id}
                  elevation={0}
                  sx={{ p: 1.5, border: "1px solid #e2e8f0", borderRadius: 2 }}
                >
                  <Box display="flex" justifyContent="space-between" gap={1}>
                    <Typography fontWeight={700}>
                      #{room.room_number}
                    </Typography>
                    <Typography
                      sx={{ textTransform: "capitalize" }}
                      color="text.secondary"
                    >
                      {room.type}
                    </Typography>
                  </Box>
                  <Typography fontWeight={600} mt={0.4}>
                    {room.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mt={0.4}>
                    €{room.price}
                  </Typography>

                  <Box display="flex" gap={1} mt={1.2}>
                    <Button
                      fullWidth
                      variant="outlined"
                      size="small"
                      onClick={() => handleEdit(room)}
                    >
                      Edit
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      size="small"
                      color="error"
                      onClick={() =>
                        setDeleteDialog({ open: true, roomId: room.id })
                      }
                    >
                      Delete
                    </Button>
                  </Box>
                </Paper>
              ))}
            </Box>
          ) : (
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{ overflowX: "auto" }}
            >
              <Table className="admin-table">
                <TableHead>
                  <TableRow>
                    <TableCell>Room #</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Price (€)</TableCell>

                    <TableCell
                      align="right"
                      sx={{ width: 220, whiteSpace: "nowrap" }}
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredRooms.map((room) => (
                    <TableRow key={room.id} hover>
                      <TableCell>{room.room_number}</TableCell>
                      <TableCell>{room.name}</TableCell>
                      <TableCell sx={{ textTransform: "capitalize" }}>
                        {room.type}
                      </TableCell>
                      <TableCell>€{room.price}</TableCell>

                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        <Box
                          display="flex"
                          gap={1}
                          justifyContent="flex-end"
                          flexWrap="nowrap"
                        >
                          <Button
                            variant="outlined"
                            size="small"
                            color="primary"
                            onClick={() => handleEdit(room)}
                            sx={{ minWidth: 92 }}
                          >
                            Edit
                          </Button>

                          <Button
                            variant="outlined"
                            size="small"
                            color="error"
                            onClick={() =>
                              setDeleteDialog({ open: true, roomId: room.id })
                            }
                            sx={{ minWidth: 92 }}
                          >
                            Delete
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
      )}

      {/* Delete dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, roomId: null })}
      >
        <DialogTitle>Delete Room</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this room? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialog({ open: false, roomId: null })}
          >
            Cancel
          </Button>
          <Button color="error" onClick={handleDeleteRoom}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {mode && (
        <RoomForm
          mode={mode}
          room={selectedRoom}
          onClose={() => setMode(null)}
          onSaved={fetchRooms}
        />
      )}
    </Box>
  );
}
