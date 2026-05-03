"use client";

import { Suspense, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
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
  Divider,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import SecurityIcon from "@mui/icons-material/Security";
import DashboardIcon from "@mui/icons-material/Dashboard";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import BookOnlineIcon from "@mui/icons-material/BookOnline";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import InsightsIcon from "@mui/icons-material/Insights";
import ReceiptIcon from "@mui/icons-material/Receipt";
import PeopleIcon from "@mui/icons-material/People";
import BuildCircleIcon from "@mui/icons-material/BuildCircle";
import HistoryIcon from "@mui/icons-material/History";
import OverviewTab from "../components/Dashboard/OverviewTab";
import RoomsTab from "../components/Dashboard/RoomsTab";
import ReservationsTab from "../components/Dashboard/ReservationTab";
import PaymentsInvoicesTab from "../components/Dashboard/PaymentsInvoicesTab";
import ReportsTab from "../components/Dashboard/ReportsTab";
import ExpensesTab from "../components/Dashboard/ExpensesTab";
import UsersTab from "../components/Dashboard/UserTab";
import ManageRoomsTab from "../components/Dashboard/ManageRooms";
import ActivityLogsTab from "../components/Dashboard/ActivityLogsTab";
import PermissionsTab from "../components/Dashboard/PremissionsTabs";
import { DASHBOARD_TABS } from "@/lib/dashboardTabs";
import usePageTitle from "../hooks/usePageTitle";

const drawerWidth = 256;
// lartÃ«sia e AppBar-it tÃ« header-it (afÃ«rsisht 64px)
const HEADER_HEIGHT = 64;

function DashboardContent() {
  const t = useTranslations("dashboard");
  usePageTitle(t("metaTitle"));

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

  useEffect(() => {
    if (activeTab) localStorage.setItem("activeTab", activeTab);
  }, [activeTab]);

  const user = session?.user ?? null;
  const tabs = DASHBOARD_TABS.map((tab) => ({
    ...tab,
    label: t(`tabs.${tab.labelKey}`),
    icon:
      tab.key === "overview" ? (
        <DashboardIcon />
      ) : tab.key === "rooms" ? (
        <MeetingRoomIcon />
      ) : tab.key === "reservations" ? (
        <BookOnlineIcon />
      ) : tab.key === "payments" ? (
        <ReceiptLongIcon />
      ) : tab.key === "reports" ? (
        <InsightsIcon />
      ) : tab.key === "expenses" ? (
        <ReceiptIcon />
      ) : tab.key === "users" ? (
        <PeopleIcon />
      ) : tab.key === "manageRooms" ? (
        <BuildCircleIcon />
      ) : tab.key === "activityLogsTab" ? (
        <HistoryIcon />
      ) : tab.key === "permissions" ? (
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
      router.replace("/login");
    } else if (session.user.role === "client") {
      router.replace("/");
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
      setActiveTab(allowedKeys[0]); // tab i parÃ« i lejuar
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
  if (session.user.role === "client") return null;
  if (visibleTabs.length === 0) return null;

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
      <List sx={{ px: 1, py: 1 }}>
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
                px: 1.8,
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
                  minWidth: 36,
                }}
              >
                {tab.icon}
              </ListItemIcon>
              <ListItemText
                primary={tab.label}
                primaryTypographyProps={{
                  fontSize: 14,
                  fontWeight: activeTab === tab.key ? 700 : 600,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Box sx={{ mt: "auto", px: 2, pb: 2 }}>
        <Divider sx={{ borderColor: "rgba(255,255,255,0.06)", mb: 2 }} />
        <Typography variant="caption" color="#94a3b8">
          © {t("shell.copyright")}
        </Typography>
      </Box>
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
            {t("shell.mobileTitle")}
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
          width: drawerWidth,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            bgcolor: "#0f172a",
            color: "#e2e8f0",
            top: HEADER_HEIGHT, // KJO E ZGJIDH: nis poshtÃ« header-it
            height: `calc(100% - ${HEADER_HEIGHT}px)`,
          },
        }}
      >
        {drawer}
      </Drawer>

      {/* PÃ‹RMBAJTJA KRYESORE */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          px: { xs: 2, md: 4 },
          pb: { xs: 2, md: 4 },
          pt: { xs: 10, md: 4 },
          mt: 0,
          bgcolor: "#f8fafc",
          minHeight: `calc(100vh - ${HEADER_HEIGHT}px)`,
        }}
      >
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "rooms" && <RoomsTab />}
        {activeTab === "reservations" && <ReservationsTab />}
        {activeTab === "payments" && <PaymentsInvoicesTab />}
        {activeTab === "reports" && <ReportsTab />}
        {activeTab === "expenses" && <ExpensesTab />}
        {activeTab === "users" && <UsersTab />}
        {activeTab === "manageRooms" && <ManageRoomsTab />}
        {activeTab === "activityLogsTab" && <ActivityLogsTab />}
        {activeTab === "permissions" && <PermissionsTab />}
      </Box>
    </Box>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <Box className="flex justify-center items-center h-screen">
          <CircularProgress />
        </Box>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}


