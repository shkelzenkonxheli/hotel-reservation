"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  IconButton,
  CircularProgress,
  AppBar,
  Typography,
  Avatar,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import BookOnlineIcon from "@mui/icons-material/BookOnline";
import PeopleIcon from "@mui/icons-material/People";
import BuildCircleIcon from "@mui/icons-material/BuildCircle";
import HistoryIcon from "@mui/icons-material/History";

import OverviewTab from "../components/Dashboard/OverviewTab";
import RoomsTab from "../components/Dashboard/RoomsTab";
import ReservationsTab from "../components/Dashboard/ReservationTab";
import UsersTab from "../components/Dashboard/UserTab";
import ManageRoomsTab from "../components/Dashboard/ManageRooms";
import ActivityLogsTab from "../components/Dashboard/ActivityLogsTab";

const drawerWidth = 240;
// lartësia e AppBar-it të header-it (afërsisht 64px)
const HEADER_HEIGHT = 64;

export default function Dashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [activeTab, setActiveTab] = useState(
    typeof window !== "undefined"
      ? localStorage.getItem("activeTab") || "overview"
      : "overview"
  );

  const [mobileOpen, setMobileOpen] = useState(false);
  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  useEffect(() => {
    if (activeTab) localStorage.setItem("activeTab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      router.push("/login");
    } else if (session.user.role === "client") {
      alert("You dont have permission to access dashboard");
      router.push("/");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <Box className="flex justify-center items-center h-screen">
        <CircularProgress />
      </Box>
    );
  }

  if (!session?.user) return null;

  const user = session.user;

  const allowedTabs =
    user.role === "admin"
      ? [
          "overview",
          "rooms",
          "reservations",
          "users",
          "manageRooms",
          "activityLogsTab",
        ]
      : user.role === "worker"
      ? ["rooms", "reservations"]
      : [];

  const tabs = [
    { key: "overview", label: "Overview", icon: <DashboardIcon /> },
    { key: "rooms", label: "Rooms", icon: <MeetingRoomIcon /> },
    { key: "reservations", label: "Reservations", icon: <BookOnlineIcon /> },
    { key: "users", label: "Users", icon: <PeopleIcon /> },
    { key: "manageRooms", label: "Manage Rooms", icon: <BuildCircleIcon /> },
    { key: "activityLogsTab", label: "Activity Log", icon: <HistoryIcon /> },
  ];

  const visibleTabs = tabs.filter((t) => allowedTabs.includes(t.key));

  const drawer = (
    <Box sx={{ height: "100%", bgcolor: "#364958" }}>
      {/* BRAND + PROFILE */}
      <Box
        sx={{
          height: HEADER_HEIGHT,
          display: "flex",
          alignItems: "center",
          gap: 2,
          px: 2,
        }}
      >
        <Avatar
          src={user.image || "/profile.jpg"} // fallback image
          sx={{ width: 40, height: 40 }}
        />
        <Box>
          <Typography fontWeight={600} color="white">
            {user.role === "admin" ? "Admin Panel" : "Worker Panel"}
          </Typography>
          <Typography variant="caption" color="gray">
            {user.email}
          </Typography>
        </Box>
      </Box>

      {/* MENU */}
      <List sx={{ mt: 1 }}>
        {visibleTabs.map((tab) => (
          <ListItem key={tab.key} disablePadding>
            <ListItemButton
              selected={activeTab === tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setMobileOpen(false);
              }}
              sx={{
                mx: 1,
                my: 0.5,
                borderRadius: 2,
                "&.Mui-selected": {
                  bgcolor: "#39555e",
                },
              }}
            >
              <ListItemIcon sx={{ color: "white", minWidth: 36 }}>
                {tab.icon}
              </ListItemIcon>
              <ListItemText primary={tab.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        sx={{
          display: { xs: "flex", md: "none" },
          top: 50,
          bgcolor: "#111827",
          zIndex: (theme) => theme.zIndex.appBar - 1,
        }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="h6">Dashboard</Typography>
          <IconButton color="inherit" onClick={handleDrawerToggle}>
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* DRAWER MOBILE */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            bgcolor: "#1e293b",
            color: "white",
            top: HEADER_HEIGHT, // mos e mbulo header-in
            height: `calc(100% - ${HEADER_HEIGHT}px)`,
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* DRAWER DESKTOP */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          width: drawerWidth,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            bgcolor: "#1e293b",
            color: "white",
            top: HEADER_HEIGHT, // KJO E ZGJIDH: nis poshtë header-it
            height: `calc(100% - ${HEADER_HEIGHT}px)`,
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* PËRMBAJTJA KRYESORE */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 4 },
          mt: { xs: 8, md: 0 },
          bgcolor: "#eae1df",
        }}
      >
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "rooms" && <RoomsTab />}
        {activeTab === "reservations" && <ReservationsTab />}
        {activeTab === "users" && <UsersTab />}
        {activeTab === "manageRooms" && <ManageRoomsTab />}
        {activeTab === "activityLogsTab" && <ActivityLogsTab />}
      </Box>
    </Box>
  );
}
