"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  Autocomplete,
  CircularProgress,
  Box,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Chip,
} from "@mui/material";

const DEFAULT_AMENITIES = [
  "Wi-Fi",
  "Air Conditioning",
  "TV",
  "Private Bathroom",
  "Balcony",
  "Mini Bar",
  "Breakfast Included",
  "Kitchen",
  "Parking",
  "Sea View",
];

export default function RoomForm({ mode, room, onClose, onSaved }) {
  const initialState = {
    name: "",
    room_number: "",
    type: "",
    price: "",
    description: "",
    amenities: [],
  };

  const [formData, setFormData] = useState(room || initialState);

  const [loading, setLoading] = useState(false);
  const [roomTypeOptions, setRoomTypeOptions] = useState([]);
  const [typesLoading, setTypesLoading] = useState(false);

  // ✅ suggestions
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomNameOptions, setRoomNameOptions] = useState([]);
  const [customAmenity, setCustomAmenity] = useState("");
  const [amenityOptions, setAmenityOptions] = useState(DEFAULT_AMENITIES);
  const [applyToType, setApplyToType] = useState(false);

  const selectedAmenities = useMemo(
    () => (Array.isArray(formData.amenities) ? formData.amenities : []),
    [formData.amenities],
  );

  // ✅ keep form in sync when edit room changes
  useEffect(() => {
    setFormData(
      room || {
        name: "",
        room_number: "",
        type: "",
        price: "",
        description: "",
        amenities: [],
      }
    );
    setApplyToType(false);
  }, [room]);

  useEffect(() => {
    const fromRoom = Array.isArray(room?.amenities) ? room.amenities : [];
    if (fromRoom.length > 0) {
      setAmenityOptions((prev) => [...new Set([...prev, ...fromRoom])]);
    }
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
        body: JSON.stringify({
          ...formData,
          apply_to_type: mode === "edit" ? applyToType : false,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (mode === "edit" && applyToType) {
          alert(
            data?.message ||
              "Updated this room and all rooms of the selected type.",
          );
        }
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

  function toggleAmenity(amenity) {
    setFormData((prev) => {
      const current = Array.isArray(prev.amenities) ? prev.amenities : [];
      const exists = current.includes(amenity);
      return {
        ...prev,
        amenities: exists
          ? current.filter((a) => a !== amenity)
          : [...current, amenity],
      };
    });
  }

  function addCustomAmenity() {
    const value = customAmenity.trim();
    if (!value) return;

    setAmenityOptions((prev) => [...new Set([...prev, value])]);
    setFormData((prev) => {
      const current = Array.isArray(prev.amenities) ? prev.amenities : [];
      return current.includes(value)
        ? prev
        : { ...prev, amenities: [...current, value] };
    });
    setCustomAmenity("");
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
          label="Short Marketing Description"
          variant="outlined"
          multiline
          rows={2}
          margin="normal"
          placeholder="e.g. Modern sea-view room ideal for couples."
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, description: e.target.value }))
          }
        />

        <Box mt={2}>
          <Typography variant="subtitle2" fontWeight={700} mb={1}>
            Amenities
          </Typography>

          <FormGroup>
            <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }}>
              {amenityOptions.map((amenity) => (
                <FormControlLabel
                  key={amenity}
                  control={
                    <Checkbox
                      checked={selectedAmenities.includes(amenity)}
                      onChange={() => toggleAmenity(amenity)}
                    />
                  }
                  label={amenity}
                />
              ))}
            </Box>
          </FormGroup>

          <Box display="flex" gap={1} mt={1.2}>
            <TextField
              fullWidth
              size="small"
              label="Add custom amenity"
              value={customAmenity}
              onChange={(e) => setCustomAmenity(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomAmenity();
                }
              }}
            />
            <Button variant="outlined" onClick={addCustomAmenity}>
              Add
            </Button>
          </Box>

          {selectedAmenities.length > 0 ? (
            <Box display="flex" gap={0.8} flexWrap="wrap" mt={1.2}>
              {selectedAmenities.map((amenity) => (
                <Chip
                  key={amenity}
                  label={amenity}
                  onDelete={() => toggleAmenity(amenity)}
                  size="small"
                />
              ))}
            </Box>
          ) : null}
        </Box>

        {mode === "edit" ? (
          <Box mt={2}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={applyToType}
                  onChange={(e) => setApplyToType(e.target.checked)}
                />
              }
              label="Apply shared fields to all rooms of this type"
            />
            <Typography variant="caption" color="text.secondary" display="block" ml={4}>
              Applies name, price, short description and amenities to all rooms with this type.
            </Typography>
          </Box>
        ) : null}
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
