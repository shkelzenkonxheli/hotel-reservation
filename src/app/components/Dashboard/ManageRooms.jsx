"use client";
import { useEffect, useState } from "react";
import RoomForm from "./RoomForm";
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

// ✅ Swiper
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import { Navigation, Pagination } from "swiper/modules";

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

  const [galleryRoom, setGalleryRoom] = useState(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  async function fetchRooms() {
    try {
      const res = await fetch("/api/rooms?include=false");
      const data = await res.json();
      setRooms(data);
    } catch (err) {
      console.error("Error fetching rooms:", err);
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

  function confirmDeleteRoom(id) {
    setDeleteDialog({ open: true, roomId: id });
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
  const roomTypeOptions = [
    "all",
    ...Array.from(new Set(safeRooms.map((room) => room.type))),
  ];

  const hasPhotos = (room) =>
    Array.isArray(room?.images) &&
    room.images.some((img) => typeof img === "string" && img.trim().length > 0);

  const filteredRooms = safeRooms.filter((room) => {
    const matchesSearch =
      room.name.toLowerCase().includes(search.toLowerCase()) ||
      room.room_number.toString().includes(search);

    const matchesType =
      filterType === "all" || room.type.toLowerCase().includes(filterType);

    const matchesRoomType =
      filterRoomType === "all" || room.type === filterRoomType;

    // ✅ vetëm kur toggle ON filtro me foto
    const matchesPhotos = !onlyWithPhotos || hasPhotos(room);

    return matchesSearch && matchesType && matchesRoomType && matchesPhotos;
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

          {/* ✅ Only when enabled: show rooms with photos + show photos column */}
          <FormControlLabel
            control={
              <Switch
                checked={onlyWithPhotos}
                onChange={(e) => setOnlyWithPhotos(e.target.checked)}
              />
            }
            label="Only rooms with photos"
          />

          <Button
            variant="contained"
            color="primary"
            onClick={handleAdd}
            sx={{ borderRadius: 2 }}
          >
            Add Room
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box textAlign="center" py={6}>
          <CircularProgress />
          <Typography mt={2}>Loading rooms...</Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={3}>
          <Table>
            <TableHead sx={{ backgroundColor: "#d6c9c6" }}>
              <TableRow>
                <TableCell>Room #</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Price (€)</TableCell>
                <TableCell>Description</TableCell>

                {/* ✅ kolona Photos shfaqet vetëm kur toggle ON */}
                {onlyWithPhotos && <TableCell>Photos</TableCell>}

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

                  {/* ✅ fotot shfaqen vetëm kur toggle ON */}
                  {onlyWithPhotos && (
                    <TableCell sx={{ width: 240 }}>
                      <div
                        className="h-24 w-52"
                        style={{ borderRadius: 12, overflow: "hidden" }}
                      >
                        <Swiper
                          modules={[Navigation, Pagination]}
                          navigation
                          pagination={{ clickable: true }}
                          className="h-full w-full cursor-pointer"
                          onClick={() => setGalleryRoom(room)}
                        >
                          {(room.images || []).map((img, i) => (
                            <SwiperSlide key={i}>
                              <img
                                src={img}
                                className="w-full h-full object-cover"
                                alt={`${room.name}-${i}`}
                              />
                            </SwiperSlide>
                          ))}
                        </Swiper>
                      </div>
                    </TableCell>
                  )}

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
                  {/* ✅ colSpan ndryshon varësisht a ka photos column */}
                  <TableCell
                    colSpan={onlyWithPhotos ? 7 : 6}
                    align="center"
                    sx={{ py: 3 }}
                  >
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

      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, id: null })}
      >
        <DialogTitle>Delete Room</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this room? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, id: null })}>
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

      {/* ✅ Gallery modal shfaqet vetëm kur ke foto dhe klikon */}
      {galleryRoom && onlyWithPhotos && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="relative w-full max-w-4xl px-4">
            <button
              className="absolute -top-10 right-0 text-white text-3xl"
              onClick={() => setGalleryRoom(null)}
            >
              ✕
            </button>

            <Swiper
              modules={[Navigation, Pagination]}
              navigation
              pagination={{ clickable: true }}
              className="w-full h-[70vh] rounded-lg overflow-hidden"
            >
              {(galleryRoom.images || []).map((img, i) => (
                <SwiperSlide key={i}>
                  <img
                    src={img}
                    className="w-full h-full object-contain bg-black"
                    alt={`gallery-${i}`}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      )}
    </Box>
  );
}
