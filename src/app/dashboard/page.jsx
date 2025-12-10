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
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import BookOnlineIcon from "@mui/icons-material/BookOnline";
import PeopleIcon from "@mui/icons-material/People";
import BuildCircleIcon from "@mui/icons-material/BuildCircle";

import OverviewTab from "../components/Dashboard/OverviewTab";
import RoomsTab from "../components/Dashboard/RoomsTab";
import ReservationsTab from "../components/Dashboard/ReservationTab";
import UsersTab from "../components/Dashboard/UserTab";
import ManageRoomsTab from "../components/Dashboard/ManageRooms";

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

  // cilat tab-a lejohet me i pa
  const allowedTabs =
    user.role === "admin"
      ? ["overview", "rooms", "reservations", "users", "manageRooms"]
      : user.role === "worker"
      ? ["rooms", "reservations"]
      : [];

  const tabs = [
    { key: "overview", label: "Overview", icon: <DashboardIcon /> },
    { key: "rooms", label: "Rooms", icon: <MeetingRoomIcon /> },
    { key: "reservations", label: "Reservations", icon: <BookOnlineIcon /> },
    { key: "users", label: "Users", icon: <PeopleIcon /> },
    { key: "manageRooms", label: "Manage Rooms", icon: <BuildCircleIcon /> },
  ];

  const visibleTabs = tabs.filter((t) => allowedTabs.includes(t.key));

  const drawer = (
    <div>
      <Toolbar
        sx={{
          bgcolor: "#111827",
          color: "white",
          fontWeight: "bold",
          textAlign: "center",
        }}
      >
        {user.role === "admin" ? "Admin Panel" : "Worker Panel"}
      </Toolbar>

      <List>
        {visibleTabs.map((tab) => (
          <ListItem key={tab.key} disablePadding>
            <ListItemButton
              selected={activeTab === tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setMobileOpen(false);
              }}
            >
              <ListItemIcon sx={{ color: "white" }}>{tab.icon}</ListItemIcon>
              <ListItemText primary={tab.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* APPBAR VETËM PËR MOBILE (brenda dashboard-it) */}
      <AppBar
        position="fixed"
        sx={{
          display: { xs: "flex", md: "none" },
          top: 50, // poshtë header-it kryesor
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
          // për mobile: header kryesor + appbar i dashboard-it
          mt: { xs: 8, md: 0 },
        }}
      >
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "rooms" && <RoomsTab />}
        {activeTab === "reservations" && <ReservationsTab />}
        {activeTab === "users" && <UsersTab />}
        {activeTab === "manageRooms" && <ManageRoomsTab />}
      </Box>
    </Box>
  );
}
