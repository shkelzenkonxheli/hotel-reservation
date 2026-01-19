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
} from "@mui/material";

export default function ManageRoomsTab() {
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
    <Box p={4}>
      <Box
        display="flex"
        flexDirection={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        gap={2}
        mb={4}
      >
        <Typography variant="h5" fontWeight="bold">
          🏨 Manage Rooms
        </Typography>

        <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
          {/* Kur je te Photos manager, search/filters për rooms s’janë të domosdoshme,
              por i lëmë — thjesht s’i përdorim në atë view */}
          {!onlyWithPhotos && (
            <>
              <TextField
                label="Search rooms..."
                variant="outlined"
                size="small"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <Select
                value={filterRoomType}
                onChange={(e) => setFilterRoomType(e.target.value)}
                size="small"
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
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="hotel">Hotel</MenuItem>
                <MenuItem value="apartment">Apartment</MenuItem>
              </Select>

              <Button
                variant="contained"
                color="primary"
                onClick={handleAdd}
                sx={{ borderRadius: 2 }}
              >
                Add Room
              </Button>
            </>
          )}

          <FormControlLabel
            control={
              <Switch
                checked={onlyWithPhotos}
                onChange={(e) => setOnlyWithPhotos(e.target.checked)}
              />
            }
            label="Only rooms with photos"
          />
        </Box>
      </Box>

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
        <TableContainer component={Paper} elevation={3}>
          <Table>
            <TableHead sx={{ backgroundColor: "#d6c9c6" }}>
              <TableRow>
                <TableCell>Room #</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Price (€)</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredRooms.map((room) => (
                <TableRow
                  key={room.id}
                  hover
                  sx={{
                    "&:hover": { backgroundColor: "#f0f8ff" },
                    bgcolor: "#eae1df",
                  }}
                >
                  <TableCell>{room.room_number}</TableCell>
                  <TableCell>{room.name}</TableCell>
                  <TableCell sx={{ textTransform: "capitalize" }}>
                    {room.type}
                  </TableCell>
                  <TableCell>€{room.price}</TableCell>
                  <TableCell>{room.description?.slice(0, 60) || "—"}</TableCell>

                  <TableCell align="center">
                    <Button
                      variant="outlined"
                      size="small"
                      color="primary"
                      onClick={() => handleEdit(room)}
                      sx={{ mr: 1 }}
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
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}

              {filteredRooms.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography color="text.secondary">
                      No rooms found.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
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
