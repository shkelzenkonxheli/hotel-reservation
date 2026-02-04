"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

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
import SecurityIcon from "@mui/icons-material/Security";
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
import PermissionsTab from "../components/Dashboard/PremissionsTabs";
import { DASHBOARD_TABS } from "@/lib/dashboardTabs";

const drawerWidth = 240;
// lartësia e AppBar-it të header-it (afërsisht 64px)
const HEADER_HEIGHT = 64;

export default function Dashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [activeTab, setActiveTab] = useState(
    typeof window !== "undefined"
      ? localStorage.getItem("activeTab") || "overview"
      : "overview",
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
  const tabs = DASHBOARD_TABS.map((t) => ({
    ...t,
    icon:
      t.key === "overview"
        ? <DashboardIcon />
        : t.key === "rooms"
          ? <MeetingRoomIcon />
          : t.key === "reservations"
            ? <BookOnlineIcon />
            : t.key === "users"
              ? <PeopleIcon />
              : t.key === "manageRooms"
                ? <BuildCircleIcon />
                : t.key === "activityLogsTab"
                  ? <HistoryIcon />
                  : t.key === "permissions"
                    ? <SecurityIcon />
                    : null,
  }));

  const allowedTabs =
    user.role === "admin"
      ? tabs.map((t) => t.key)
      : user.allowed_tabs && user.allowed_tabs.length > 0
        ? user.allowed_tabs
        : [];

  const visibleTabs = tabs.filter((t) => allowedTabs.includes(t.key));

  useEffect(() => {
    if (visibleTabs.length === 0) return;
    if (!visibleTabs.find((t) => t.key === activeTab)) {
      setActiveTab(visibleTabs[0].key);
    }
  }, [visibleTabs, activeTab]);
  useEffect(() => {
    if (!visibleTabs.length) return;

    const allowedKeys = visibleTabs.map((t) => t.key);

    if (!allowedKeys.includes(activeTab)) {
      setActiveTab(allowedKeys[0]); // tab i parë i lejuar
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role, JSON.stringify(user?.allowed_tabs)]);

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
          src={"/Profile.jpg"} // fallback image
          sx={{ width: 60, height: 60 }}
          component={Link}
          href="/profile"
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
        {activeTab === "permissions" && <PermissionsTab />}
      </Box>
    </Box>
  );
}
