"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Divider,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import SecurityIcon from "@mui/icons-material/Security";
import DashboardIcon from "@mui/icons-material/Dashboard";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import BookOnlineIcon from "@mui/icons-material/BookOnline";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import InsightsIcon from "@mui/icons-material/Insights";
import PeopleIcon from "@mui/icons-material/People";
import BuildCircleIcon from "@mui/icons-material/BuildCircle";
import HistoryIcon from "@mui/icons-material/History";
import OverviewTab from "../components/Dashboard/OverviewTab";
import RoomsTab from "../components/Dashboard/RoomsTab";
import ReservationsTab from "../components/Dashboard/ReservationTab";
import PaymentsInvoicesTab from "../components/Dashboard/PaymentsInvoicesTab";
import ReportsTab from "../components/Dashboard/ReportsTab";
import UsersTab from "../components/Dashboard/UserTab";
import ManageRoomsTab from "../components/Dashboard/ManageRooms";
import ActivityLogsTab from "../components/Dashboard/ActivityLogsTab";
import PermissionsTab from "../components/Dashboard/PremissionsTabs";
import { DASHBOARD_TABS } from "@/lib/dashboardTabs";

const drawerWidth = 256;
const collapsedWidth = 76;
// lartësia e AppBar-it të header-it (afërsisht 64px)
const HEADER_HEIGHT = 64;

export default function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reservationId = searchParams.get("reservationId");
  const { data: session, status } = useSession();

  const [activeTab, setActiveTab] = useState(
    typeof window !== "undefined"
      ? localStorage.getItem("activeTab") || "overview"
      : "overview",
  );

  const [mobileOpen, setMobileOpen] = useState(false);
  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const [collapsed, setCollapsed] = useState(
    typeof window !== "undefined"
      ? localStorage.getItem("dashboardSidebarCollapsed") === "true"
      : false,
  );

  useEffect(() => {
    if (activeTab) localStorage.setItem("activeTab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem(
      "dashboardSidebarCollapsed",
      collapsed ? "true" : "false",
    );
  }, [collapsed]);

  const user = session?.user ?? null;
  const tabs = DASHBOARD_TABS.map((t) => ({
    ...t,
    icon:
      t.key === "overview" ? (
        <DashboardIcon />
      ) : t.key === "rooms" ? (
        <MeetingRoomIcon />
      ) : t.key === "reservations" ? (
        <BookOnlineIcon />
      ) : t.key === "payments" ? (
        <ReceiptLongIcon />
      ) : t.key === "reports" ? (
        <InsightsIcon />
      ) : t.key === "users" ? (
        <PeopleIcon />
      ) : t.key === "manageRooms" ? (
        <BuildCircleIcon />
      ) : t.key === "activityLogsTab" ? (
        <HistoryIcon />
      ) : t.key === "permissions" ? (
        <SecurityIcon />
      ) : null,
  }));

  const allowedTabs =
    user?.role === "admin"
      ? tabs.map((t) => t.key)
      : user?.allowed_tabs && user.allowed_tabs.length > 0
        ? user.allowed_tabs
        : [];

  const visibleTabs = tabs.filter((t) => allowedTabs.includes(t.key));

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      router.push("/login");
    } else if (session.user.role === "client") {
      alert("You dont have permission to access dashboard");
      router.push("/");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (!user || visibleTabs.length === 0) return;
    if (reservationId && visibleTabs.find((t) => t.key === "reservations")) {
      setActiveTab("reservations");
      return;
    }
    if (!visibleTabs.find((t) => t.key === activeTab)) {
      setActiveTab(visibleTabs[0].key);
    }
  }, [visibleTabs, activeTab, reservationId]);
  useEffect(() => {
    if (!user || !visibleTabs.length) return;

    const allowedKeys = visibleTabs.map((t) => t.key);

    if (!allowedKeys.includes(activeTab)) {
      setActiveTab(allowedKeys[0]); // tab i parë i lejuar
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role, JSON.stringify(user?.allowed_tabs)]);

  if (status === "loading") {
    return (
      <Box className="flex justify-center items-center h-screen">
        <CircularProgress />
      </Box>
    );
  }

  if (!session?.user) return null;

  const drawer = (
    <Box
      component="nav"
      aria-label="Admin sidebar navigation"
      sx={{
        height: "100%",
        bgcolor: "#0f172a",
        color: "#e2e8f0",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* BRAND + PROFILE */}
      <Box
        sx={{
          height: HEADER_HEIGHT,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 2,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Avatar
          src={user?.avatar_url || undefined}
          sx={{ width: 36, height: 36 }}
          component={Link}
          href="/profile"
        />

        {!collapsed ? (
          <Box>
            <Typography fontWeight={700} color="white">
              {user.role === "admin" ? "Admin Panel" : "Worker Panel"}
            </Typography>
            <Typography variant="caption" color="#94a3b8">
              {user.name}
            </Typography>
          </Box>
        ) : null}

        <Box sx={{ marginLeft: "auto" }}>
          <IconButton
            onClick={() => setCollapsed((prev) => !prev)}
            sx={{
              color: "#e2e8f0",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 2,
              width: 32,
              height: 32,
              "&:hover": { backgroundColor: "rgba(255,255,255,0.06)" },
            }}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRightIcon sx={{ fontSize: 18 }} />
            ) : (
              <ChevronLeftIcon sx={{ fontSize: 18 }} />
            )}
          </IconButton>
        </Box>
      </Box>

      {/* MENU */}
      <List sx={{ mt: 1, px: 1 }}>
        {visibleTabs.map((tab) => (
          <ListItem key={tab.key} disablePadding>
            <ListItemButton
              selected={activeTab === tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setMobileOpen(false);
              }}
              sx={{
                my: 0.4,
                borderRadius: 2,
                gap: 1.5,
                px: collapsed ? 1.2 : 1.8,
                "&.Mui-selected": {
                  bgcolor: "rgba(59,130,246,0.18)",
                  color: "#e2e8f0",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    left: 0,
                    top: 8,
                    bottom: 8,
                    width: 3,
                    borderRadius: 8,
                    backgroundColor: "#38bdf8",
                  },
                },
                "&:hover": {
                  bgcolor: "rgba(255,255,255,0.06)",
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: "inherit",
                  minWidth: collapsed ? 32 : 36,
                }}
              >
                {tab.icon}
              </ListItemIcon>
              {!collapsed ? (
                <ListItemText
                  primary={tab.label}
                  primaryTypographyProps={{
                    fontSize: 14,
                    fontWeight: activeTab === tab.key ? 700 : 600,
                  }}
                />
              ) : null}
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {!collapsed ? (
        <Box sx={{ mt: "auto", px: 2, pb: 2 }}>
          <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", mb: 2 }} />
          <Typography variant="caption" color="#94a3b8">
            © Hotel Management
          </Typography>
        </Box>
      ) : null}
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          display: { xs: "flex", md: "none" },
          top: HEADER_HEIGHT,
          bgcolor: "#f8fafc",
          color: "#0f172a",
          borderBottom: "1px solid #e2e8f0",
          zIndex: (theme) => theme.zIndex.appBar - 1,
        }}
      >
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="subtitle1" fontWeight={700}>
            Dashboard
          </Typography>
          <IconButton
            onClick={handleDrawerToggle}
            sx={{
              color: "#0f172a",
              border: "1px solid #e2e8f0",
              borderRadius: 2,
              width: 36,
              height: 36,
            }}
          >
            <MenuIcon sx={{ fontSize: 20 }} />
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
            bgcolor: "#0f172a",
            color: "#e2e8f0",
            top: HEADER_HEIGHT,
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
          width: collapsed ? collapsedWidth : drawerWidth,
          "& .MuiDrawer-paper": {
            width: collapsed ? collapsedWidth : drawerWidth,
            bgcolor: "#0f172a",
            color: "#e2e8f0",
            top: HEADER_HEIGHT, // KJO E ZGJIDH: nis poshtë header-it
            height: `calc(100% - ${HEADER_HEIGHT}px)`,
            transition: "width 200ms ease",
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
          mt: { xs: 10, md: 2 },
          bgcolor: "#f8fafc",
          minHeight: `calc(100vh - ${HEADER_HEIGHT}px)`,
        }}
      >
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "rooms" && <RoomsTab />}
        {activeTab === "reservations" && <ReservationsTab />}
        {activeTab === "payments" && <PaymentsInvoicesTab />}
        {activeTab === "reports" && <ReportsTab />}
        {activeTab === "users" && <UsersTab />}
        {activeTab === "manageRooms" && <ManageRoomsTab />}
        {activeTab === "activityLogsTab" && <ActivityLogsTab />}
        {activeTab === "permissions" && <PermissionsTab />}
      </Box>
    </Box>
  );
}
