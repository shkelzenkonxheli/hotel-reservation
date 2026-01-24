"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import {
  Paper,
  Typography,
  Box,
  Divider,
  Avatar,
  Chip,
  Button,
  TextField,
  Snackbar,
  Alert,
} from "@mui/material";

import Tab from "@mui/material/Tab";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";

import ReservationsPage from "../reservations/page";

export default function ProfilePage() {
  const { data: session, status, update } = useSession();

  // Hooks
  const [value, setValue] = React.useState("1");
  const [openAlert, setOpenAlert] = React.useState(false);

  const [form, setForm] = React.useState({
    name: "",
    phone: "",
    address: "",
    email: "",
  });

  const [hasChanged, setHasChanged] = React.useState(false);

  // Load user data into form
  React.useEffect(() => {
    if (session?.user) {
      setForm({
        name: session.user.name || "",
        phone: session.user.phone || "",
        address: session.user.address || "",
        email: session.user.email || "",
      });
      setHasChanged(false);
    }
  }, [session]);

  const handleChangeTab = (_e, newValue) => setValue(newValue);

  const handleInput = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setHasChanged(true);
  };

  const handleSave = async () => {
    const res = await fetch("/api/profile/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      await update({
        name: form.name,
        phone: form.phone,
        address: form.address,
      });
      setOpenAlert(true);
      setHasChanged(false);
    } else {
      alert("Failed to update profile");
    }
  };

  const handleCancel = () => {
    if (!session?.user) return;

    setForm({
      name: session.user.name || "",
      phone: session.user.phone || "",
      address: session.user.address || "",
      email: session.user.email || "",
    });

    setHasChanged(false);
  };

  if (status === "loading") {
    return (
      <Typography sx={{ mt: 4, textAlign: "center" }}>Loading...</Typography>
    );
  }

  if (!session) {
    return (
      <Typography sx={{ mt: 4, textAlign: "center" }}>
        You are not logged in.
      </Typography>
    );
  }

  const user = session.user;

  return (
    <Paper sx={{ p: 3, width: "100%", mx: "auto", bgcolor: "#eae1df" }}>
      <TabContext value={value}>
        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <TabList onChange={handleChangeTab}>
            <Tab label="Profile" value="1" />
            <Tab label="Reservations" value="2" />
          </TabList>
        </Box>

        {/* PROFILE TAB */}
        <TabPanel value="1">
          <Box sx={{ maxWidth: 700, mx: "auto" }}>
            {/* Header */}
            <Box sx={{ textAlign: "center", mb: 3 }}>
              <Avatar
                sx={{
                  width: 90,
                  height: 90,
                  mx: "auto",
                  fontSize: 32,
                  bgcolor: "primary.main",
                }}
                src={"/Profile.jpg"}
              />

              <Typography variant="h5" mt={1} fontWeight={600}>
                {user.name}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                {user.email}
              </Typography>

              <Chip
                label={
                  user.role === "admin"
                    ? "Admin"
                    : user.role === "worker"
                      ? "Worker"
                      : "Guest"
                }
                color="primary"
                size="small"
                sx={{ mt: 1 }}
              />
            </Box>

            <Divider sx={{ mb: 3 }} />

            {/* FORM FIELDS */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                label="Full Name"
                name="name"
                value={form.name}
                onChange={handleInput}
                fullWidth
              />

              <TextField
                label="Email"
                name="email"
                value={form.email}
                fullWidth
                disabled
              />

              <TextField
                label="Phone"
                name="phone"
                value={form.phone}
                onChange={handleInput}
                fullWidth
              />

              <TextField
                label="Address"
                name="address"
                value={form.address}
                onChange={handleInput}
                fullWidth
              />
            </Box>

            {/* BUTTONS */}
            <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
              <Button
                variant="contained"
                color="success"
                onClick={handleSave}
                disabled={!hasChanged}
              >
                Save Changes
              </Button>

              <Button
                variant="outlined"
                color="error"
                onClick={handleCancel}
                disabled={!hasChanged}
              >
                Cancel
              </Button>
            </Box>
          </Box>

          {/* SUCCESS SNACKBAR */}
          <Snackbar
            open={openAlert}
            autoHideDuration={3000}
            onClose={() => setOpenAlert(false)}
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
          >
            <Alert severity="success" onClose={() => setOpenAlert(false)}>
              Profile updated successfully!
            </Alert>
          </Snackbar>
        </TabPanel>

        {/* RESERVATIONS TAB */}
        <TabPanel value="2">
          <Box sx={{ maxWidth: "100%", mx: "auto" }}>
            <ReservationsPage />
          </Box>
        </TabPanel>
      </TabContext>
    </Paper>
  );
}
