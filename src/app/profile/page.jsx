"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import {
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
import PublicContainer from "../components/Public/PublicContainer";
import PublicSection from "../components/Public/PublicSection";
import PublicCard from "../components/Public/PublicCard";

export default function ProfilePage() {
  const { data: session, status, update } = useSession();

  const [value, setValue] = React.useState("1");
  const [openAlert, setOpenAlert] = React.useState(false);

  const [form, setForm] = React.useState({
    name: "",
    phone: "",
    address: "",
    email: "",
  });

  const [hasChanged, setHasChanged] = React.useState(false);
  const [avatarUrl, setAvatarUrl] = React.useState("");
  const [uploadingAvatar, setUploadingAvatar] = React.useState(false);

  React.useEffect(() => {
    if (session?.user) {
      setForm({
        name: session.user.name || "",
        phone: session.user.phone || "",
        address: session.user.address || "",
        email: session.user.email || "",
      });
      setAvatarUrl(session.user.avatar_url || "");
      setHasChanged(false);
    }
  }, [session]);

  const handleChangeTab = (_e, newValue) => setValue(newValue);

  const handleInput = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setHasChanged(true);
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      setUploadingAvatar(true);
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to upload avatar");
        return;
      }
      setAvatarUrl(data.avatar_url || "");
      await update({ avatar_url: data.avatar_url || "" });
    } catch (error) {
      console.error(error);
      alert("Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const handleSave = async () => {
    const res = await fetch("/api/profile/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, avatar_url: avatarUrl }),
    });

    if (res.ok) {
      await update({
        name: form.name,
        phone: form.phone,
        address: form.address,
        avatar_url: avatarUrl,
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
    setAvatarUrl(session.user.avatar_url || "");

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
    <Box className="public-page min-h-screen">
      <PublicSection>
        <PublicContainer>
          <PublicCard className="p-4 md:p-6">
            <TabContext value={value}>
              <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
                <TabList
                  onChange={handleChangeTab}
                  variant="scrollable"
                  scrollButtons="auto"
                  allowScrollButtonsMobile
                  sx={{
                    "& .MuiTabs-indicator": { display: "none" },
                    "& .MuiTab-root": {
                      textTransform: "none",
                      fontWeight: 700,
                      borderRadius: 999,
                      minHeight: 40,
                      px: 2,
                      mr: 1,
                      bgcolor: "rgba(0,0,0,0.04)",
                    },
                    "& .Mui-selected": {
                      bgcolor: "#0ea5e9",
                      color: "white !important",
                    },
                  }}
                >
                  <Tab label="Profile" value="1" />
                  <Tab label="Reservations" value="2" />
                </TabList>
              </Box>

              <TabPanel value="1" sx={{ p: 0 }}>
                <Box sx={{ maxWidth: 700, mx: "auto" }}>
                  <Box sx={{ textAlign: "center", mb: 3 }}>
                    <Avatar
                      sx={{
                        width: 90,
                        height: 90,
                        mx: "auto",
                        fontSize: 32,
                        bgcolor: "primary.main",
                      }}
                      src={avatarUrl || undefined}
                    />

                    <Typography variant="h5" mt={1} fontWeight={700}>
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

                  <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
                    <Button
                      variant="outlined"
                      component="label"
                      disabled={uploadingAvatar}
                      sx={{ textTransform: "none", borderRadius: 2 }}
                    >
                      {uploadingAvatar ? "Uploading..." : "Change photo"}
                      <input
                        hidden
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                      />
                    </Button>
                  </Box>

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

                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "column", sm: "row" },
                      gap: 1.2,
                      mt: 3,
                    }}
                  >
                    <Button
                      variant="contained"
                      onClick={handleSave}
                      disabled={!hasChanged}
                      sx={{
                        borderRadius: 2,
                        textTransform: "none",
                        width: { xs: "100%", sm: "auto" },
                      }}
                    >
                      Save changes
                    </Button>

                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleCancel}
                      disabled={!hasChanged}
                      sx={{
                        borderRadius: 2,
                        textTransform: "none",
                        width: { xs: "100%", sm: "auto" },
                      }}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Box>

                <Snackbar
                  open={openAlert}
                  autoHideDuration={3000}
                  onClose={() => setOpenAlert(false)}
                  anchorOrigin={{ vertical: "top", horizontal: "center" }}
                >
                  <Alert severity="success" onClose={() => setOpenAlert(false)}>
                    Profile updated successfully.
                  </Alert>
                </Snackbar>
              </TabPanel>

              <TabPanel value="2" sx={{ p: 0 }}>
                <Box sx={{ maxWidth: "100%", mx: "auto" }}>
                  <ReservationsPage />
                </Box>
              </TabPanel>
            </TabContext>
          </PublicCard>
        </PublicContainer>
      </PublicSection>
    </Box>
  );
}
