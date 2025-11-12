"use client";
import { useState } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
} from "@mui/material";

export default function RoomForm({ mode, room, onClose, onSaved }) {
  const [formData, setFormData] = useState(
    room || { name: "", room_number: "", type: "", price: "", description: "" }
  );
  const [loading, setLoading] = useState(false);

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
        alert("Error: " + data.error);
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
        {mode === "edit" ? "✏️ Edit Room" : "➕ Add New Room"}
      </DialogTitle>

      <DialogContent dividers className="py-4">
        <TextField
          fullWidth
          label="Room Name"
          variant="outlined"
          value={formData.name}
          margin="normal"
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        <TextField
          fullWidth
          label="Room Number"
          variant="outlined"
          value={formData.room_number}
          margin="normal"
          onChange={(e) =>
            setFormData({ ...formData, room_number: e.target.value })
          }
        />
        <TextField
          fullWidth
          label="Type (e.g. apartment, suite, double)"
          variant="outlined"
          value={formData.type}
          margin="normal"
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
        />
        <TextField
          fullWidth
          label="Price (€)"
          type="number"
          variant="outlined"
          margin="normal"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
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
            setFormData({ ...formData, description: e.target.value })
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
