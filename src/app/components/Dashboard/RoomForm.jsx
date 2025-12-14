"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  MenuItem,
  Autocomplete,
  CircularProgress,
} from "@mui/material";

export default function RoomForm({ mode, room, onClose, onSaved }) {
  const [formData, setFormData] = useState(
    room || { name: "", room_number: "", type: "", price: "", description: "" }
  );

  const [loading, setLoading] = useState(false);
  const [roomTypeOptions, setRoomTypeOptions] = useState([]);
  const [typesLoading, setTypesLoading] = useState(false);

  // ✅ suggestions
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomNameOptions, setRoomNameOptions] = useState([]);

  // ✅ keep form in sync when edit room changes
  useEffect(() => {
    setFormData(
      room || {
        name: "",
        room_number: "",
        type: "",
        price: "",
        description: "",
      }
    );
  }, [room]);

  useEffect(() => {
    async function loadRoomTypes() {
      try {
        setTypesLoading(true);
        const res = await fetch("/api/rooms-type");
        const data = await res.json();

        // nxjerr vetëm type string
        const types = data.map((t) => t.type).filter(Boolean);

        setRoomTypeOptions([...new Set(types)]);
      } catch (e) {
        console.error(e);
      } finally {
        setTypesLoading(false);
      }
    }

    loadRoomTypes();
  }, []);

  // ✅ load existing rooms for name suggestions
  useEffect(() => {
    async function loadRoomNames() {
      try {
        setRoomsLoading(true);
        const res = await fetch("/api/rooms");
        const data = await res.json();

        // data mund të jetë array ose {rooms: [...]}
        const list = Array.isArray(data) ? data : data?.rooms || [];

        // nxjerr vetëm emrat unik
        const names = [...new Set(list.map((r) => r?.name).filter(Boolean))];

        setRoomNameOptions(names);
      } catch (e) {
        console.error("Failed to load room names", e);
      } finally {
        setRoomsLoading(false);
      }
    }
    loadRoomNames();
  }, []);

  async function handleSubmit() {
    if (
      !formData.name ||
      !formData.room_number ||
      !formData.type ||
      !formData.price
    ) {
      alert("Please fill in all required fields.");
      return;
    }

    try {
      setLoading(true);
      const method = mode === "edit" ? "PATCH" : "POST";
      const url = mode === "edit" ? `/api/rooms/${room.id}` : "/api/rooms";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        onSaved();
        onClose();
      } else {
        const data = await res.json();
        alert("Error: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={true} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle className="font-bold text-gray-800">
        {mode === "edit" ? " Edit Room" : " Add New Room"}
      </DialogTitle>

      <DialogContent dividers className="py-4">
        {/* ✅ Room Name with suggestions */}
        <Autocomplete
          freeSolo
          options={roomNameOptions}
          loading={roomsLoading}
          value={formData.name || ""}
          onChange={(e, newValue) => {
            // kur zgjedh nga lista
            setFormData((prev) => ({ ...prev, name: newValue || "" }));
          }}
          onInputChange={(e, newInputValue) => {
            // kur shkruan me tastaturë
            setFormData((prev) => ({ ...prev, name: newInputValue }));
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              fullWidth
              label="Room Name"
              variant="outlined"
              margin="normal"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {roomsLoading ? (
                      <CircularProgress color="inherit" size={18} />
                    ) : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />

        <TextField
          fullWidth
          label="Room Number"
          variant="outlined"
          value={formData.room_number}
          margin="normal"
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, room_number: e.target.value }))
          }
        />

        <Autocomplete
          freeSolo
          options={roomTypeOptions}
          loading={typesLoading}
          value={formData.type || ""}
          onChange={(e, newValue) => {
            setFormData((prev) => ({ ...prev, type: newValue || "" }));
          }}
          onInputChange={(e, newInputValue) => {
            setFormData((prev) => ({ ...prev, type: newInputValue }));
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              fullWidth
              label="Room Type"
              variant="outlined"
              margin="normal"
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {typesLoading ? (
                      <CircularProgress color="inherit" size={18} />
                    ) : null}
                    {params.InputProps.endAdornment}
                  </>
                ),
              }}
            />
          )}
        />

        <TextField
          fullWidth
          label="Price (€)"
          type="number"
          variant="outlined"
          margin="normal"
          value={formData.price}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, price: e.target.value }))
          }
        />

        <TextField
          fullWidth
          label="Description"
          variant="outlined"
          multiline
          rows={3}
          margin="normal"
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
        />
      </DialogContent>

      <DialogActions className="px-6 py-3">
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading}
        >
          {loading
            ? "Saving..."
            : mode === "edit"
            ? "Save Changes"
            : "Add Room"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
