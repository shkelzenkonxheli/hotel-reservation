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
  ListItemText,
  ListItemIcon,
  Toolbar,
  CircularProgress,
} from "@mui/material";

import {
  Dashboard as DashboardIcon,
  MeetingRoom as RoomIcon,
  BookOnline as ReservationIcon,
  People as UsersIcon,
  BuildCircle as ManageIcon,
} from "@mui/icons-material";

import OverviewTab from "../components/Dashboard/OverviewTab";
import RoomsTab from "../components/Dashboard/RoomsTab";
import ReservationsTab from "../components/Dashboard/ReservationTab";
import UsersTab from "../components/Dashboard/UserTab";
import ManageRoomsTab from "../components/Dashboard/ManageRooms";

const drawerWidth = 240;

export default function Dashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      router.push("/login");
    } else if (session?.user?.role === "client") {
      alert("You dont have premission to access dashboard");
      router.push("/");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <Box className="flex justify-center items-center h-screen">
        <CircularProgress />
      </Box>
    );
  }

  if (!session?.user) return null;
  if (session.user.role === "client") {
    return (
      <Box className="flex justify-center items-center h-screen">
        <CircularProgress />
      </Box>
    );
  }

  const user = session.user;

  // Cakto cilat tab-a shfaqen
  const allowedTabs =
    user.role === "admin"
      ? ["overview", "rooms", "reservations", "users", "manageRooms"]
      : user.role === "worker"
      ? ["rooms", "reservations"]
      : [];

  const tabs = [
    { key: "overview", label: "Overview", icon: <DashboardIcon /> },
    { key: "rooms", label: "Rooms", icon: <RoomIcon /> },
    { key: "reservations", label: "Reservations", icon: <ReservationIcon /> },
    { key: "users", label: "Users", icon: <UsersIcon /> },
    { key: "manageRooms", label: "Manage Rooms", icon: <ManageIcon /> },
  ];

  const visibleTabs = tabs.filter((t) => allowedTabs.includes(t.key));

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            bgcolor: "#1e293b",
            color: "white",
          },
        }}
      >
        <Toolbar
          sx={{ bgcolor: "#111827", color: "white", fontWeight: "bold" }}
        >
          {user.role === "admin" ? "Admin Panel" : "Worker Panel"}
        </Toolbar>

        <List>
          {visibleTabs.map((tab) => (
            <ListItem key={tab.key} disablePadding>
              <ListItemButton
                selected={activeTab === tab.key}
                onClick={() => setActiveTab(tab.key)}
              >
                <ListItemIcon sx={{ color: "white" }}>{tab.icon}</ListItemIcon>
                <ListItemText primary={tab.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      <Box component="main" sx={{ p: 4, flexGrow: 1 }}>
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "rooms" && <RoomsTab />}
        {activeTab === "reservations" && <ReservationsTab />}
        {activeTab === "users" && <UsersTab />}
        {activeTab === "manageRooms" && <ManageRoomsTab />}
      </Box>
    </Box>
  );
}
