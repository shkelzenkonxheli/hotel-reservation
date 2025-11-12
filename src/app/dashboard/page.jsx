"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// 🧩 Importet nga MUI
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  CircularProgress,
} from "@mui/material";

import {
  Dashboard as DashboardIcon,
  MeetingRoom as RoomIcon,
  BookOnline as ReservationIcon,
  People as UsersIcon,
  BuildCircle as ManageIcon,
} from "@mui/icons-material";

// Komponentët ekzistues
import OverviewTab from "../components/Dashboard/OverviewTab";
import RoomsTab from "../components/Dashboard/RoomsTab";
import ReservationsTab from "../components/Dashboard/ReservationTab";
import UsersTab from "../components/Dashboard/UserTab";
import ManageRoomsTab from "../components/Dashboard/ManageRooms";

const drawerWidth = 240;

export default function Dashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [user, setUser] = useState(null);
  const [allowedTabs, setAllowedTabs] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔐 Kontrolli i user-it me cookie
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        if (!res.ok) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        setUser(data.user);

        if (data.user?.role === "admin") {
          setAllowedTabs([
            "overview",
            "rooms",
            "reservations",
            "users",
            "manageRooms",
          ]);
        } else if (data.user?.role === "worker") {
          setAllowedTabs(["rooms", "reservations"]);
        } else {
          router.push("/");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [router]);

  // Ruajtja e tab-it aktiv në localStorage
  useEffect(() => {
    const savedTab = localStorage.getItem("activeTab");
    if (savedTab) setActiveTab(savedTab);
  }, []);
  useEffect(() => {
    localStorage.setItem("activeTab", activeTab);
  }, [activeTab]);

  if (loading)
    return (
      <Box
        className="flex items-center justify-center h-screen bg-gray-50"
        sx={{ color: "text.secondary" }}
      >
        <CircularProgress />
      </Box>
    );

  if (!user) return null;

  // Defino tab-at me ikonat
  const tabs = [
    { key: "overview", label: "Overview", icon: <DashboardIcon /> },
    { key: "rooms", label: "Rooms", icon: <RoomIcon /> },
    { key: "reservations", label: "Reservations", icon: <ReservationIcon /> },
    { key: "users", label: "Users", icon: <UsersIcon /> },
    { key: "manageRooms", label: "Manage Rooms", icon: <ManageIcon /> },
  ];

  const visibleTabs = tabs.filter((t) => allowedTabs.includes(t.key));

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "grey.50" }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
            bgcolor: "#1e293b", // Tailwind gray-800
            color: "white",
          },
        }}
      >
        <Toolbar
          sx={{
            bgcolor: "#111827", // Tailwind gray-900
            color: "white",
            fontWeight: "bold",
            fontSize: 20,
            textAlign: "center",
          }}
        >
          {user.role === "admin" ? "Admin Panel" : "Worker Panel"}
        </Toolbar>

        <List sx={{ mt: 2 }}>
          {visibleTabs.map((tab) => (
            <ListItem key={tab.key} disablePadding>
              <ListItemButton
                selected={activeTab === tab.key}
                onClick={() => setActiveTab(tab.key)}
                sx={{
                  "&.Mui-selected": {
                    bgcolor: "#2563eb",
                    "&:hover": { bgcolor: "#1d4ed8" },
                  },
                  "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
                }}
              >
                <ListItemIcon sx={{ color: "white" }}>{tab.icon}</ListItemIcon>
                <ListItemText primary={tab.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 4,
          backgroundColor: "#f9fafb", // Tailwind gray-50
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
