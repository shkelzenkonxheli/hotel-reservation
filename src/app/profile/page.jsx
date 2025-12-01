"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { Paper, Typography, Box, TextField, Divider } from "@mui/material";

import Tab from "@mui/material/Tab";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import ReservationsPage from "../reservations/page";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [value, setValue] = React.useState("1"); // 🔹 Tash është brenda komponentit

  const handleChange = (_event, newValue) => {
    setValue(newValue);
  };

  if (status === "loading") {
    return (
      <Typography variant="body1" sx={{ mt: 4, textAlign: "center" }}>
        Loading profile...
      </Typography>
    );
  }

  if (!session) {
    return (
      <Typography variant="body1" sx={{ mt: 4, textAlign: "center" }}>
        You are not logged in.
      </Typography>
    );
  }

  const user = session.user;

  return (
    <Box sx={{ maxWidth: 700, mx: "auto", mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <TabContext value={value}>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <TabList onChange={handleChange} aria-label="Profile tabs">
              <Tab label="Profile" value="1" />
              <Tab label="Reservations" value="2" />
            </TabList>
          </Box>

          {/* 🔹 TAB 1 – PROFILI */}
          <TabPanel value="1">
            <Typography variant="h6" mb={2}>
              My Profile
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <TextField
              label="Full Name"
              fullWidth
              margin="normal"
              value={user.name || ""}
              disabled
            />
            <TextField
              label="Email"
              fullWidth
              margin="normal"
              value={user.email || ""}
              disabled
            />
            <TextField
              label="Phone"
              fullWidth
              margin="normal"
              value={user.phone || ""}
              disabled
            />
            <TextField
              label="Username"
              fullWidth
              margin="normal"
              value={user.username || ""}
              disabled
            />
          </TabPanel>

          {/* 🔹 TAB 2 – REZERVIMET (placeholder për tani) */}
          <TabPanel value="2">
            <Typography variant="h6" mb={2}>
              My Reservations
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <ReservationsPage />
          </TabPanel>
        </TabContext>
      </Paper>
    </Box>
  );
}
