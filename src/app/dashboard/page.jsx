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
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import ReceiptIcon from "@mui/icons-material/Receipt";
import PeopleIcon from "@mui/icons-material/People";
import BuildCircleIcon from "@mui/icons-material/BuildCircle";
import HistoryIcon from "@mui/icons-material/History";
import OverviewTab from "../components/Dashboard/OverviewTab";
import RoomsTab from "../components/Dashboard/RoomsTab";
import ReservationsTab from "../components/Dashboard/ReservationTab";
import PaymentsInvoicesTab from "../components/Dashboard/PaymentsInvoicesTab";
import ReportsTab from "../components/Dashboard/ReportsTab";
import SpecialRatesTab from "../components/Dashboard/SpecialRatesTab";
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
      ) : tab.key === "specialRates" ? (
        <LocalOfferOutlinedIcon />
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
        background:
          "linear-gradient(180deg, #0b2426 0%, #0e3032 55%, #0b2426 100%)",
        color: "rgba(246,242,234,0.86)",
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
      }}
    >
      <Box sx={{ px: 2.5, pt: 3, pb: 2 }}>
        <Typography
          sx={{
            fontSize: 10.5,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#8fb9ae",
            fontWeight: 600,
          }}
        >
          {t("shell.mobileTitle")}
        </Typography>
        {user?.name || user?.email ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 2 }}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                bgcolor: "rgba(143,185,174,0.16)",
                border: "1px solid rgba(143,185,174,0.35)",
                color: "#f6f2ea",
                fontFamily: "var(--font-display, serif)",
                fontSize: 18,
              }}
            >
              {(user?.name || user?.email || "?").charAt(0).toUpperCase()}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                noWrap
                sx={{ fontSize: 14, fontWeight: 600, color: "#f6f2ea" }}
              >
                {user?.name || user?.email}
              </Typography>
              <Typography
                noWrap
                sx={{ fontSize: 11.5, color: "rgba(246,242,234,0.55)", textTransform: "capitalize" }}
              >
                {user?.role}
              </Typography>
            </Box>
          </Box>
        ) : null}
      </Box>
      <Divider sx={{ borderColor: "rgba(246,242,234,0.08)", mx: 2 }} />
      <List sx={{ px: 1.5, py: 1.5 }}>
        {visibleTabs.map((tab) => (
          <ListItem key={tab.key} disablePadding>
            <ListItemButton
              selected={activeTab === tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setMobileOpen(false);
              }}
              sx={{
                my: 0.3,
                borderRadius: "10px",
                gap: 1,
                px: 1.6,
                py: 1,
                color: "rgba(246,242,234,0.72)",
                transition: "background-color 160ms ease, color 160ms ease",
                "& .MuiSvgIcon-root": { fontSize: 20, opacity: 0.85 },
                "&.Mui-selected, &.Mui-selected:hover": {
                  bgcolor: "rgba(246,242,234,0.10)",
                  color: "#ffffff",
                  "&::before": {
                    content: '""',
                    position: "absolute",
                    left: 0,
                    top: 8,
                    bottom: 8,
                    width: 3,
                    borderRadius: 8,
                    backgroundColor: "#c9a86a",
                  },
                },
                "&:hover": {
                  bgcolor: "rgba(246,242,234,0.06)",
                  color: "#ffffff",
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
                  fontWeight: activeTab === tab.key ? 600 : 500,
                  letterSpacing: "0.01em",
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Box sx={{ mt: "auto", px: 2, pb: 2 }}>
        <Divider sx={{ borderColor: "rgba(246,242,234,0.08)", mb: 2 }} />
        <Typography variant="caption" sx={{ color: "rgba(246,242,234,0.45)" }}>
          © {t("shell.copyright")}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box className="admin-shell" sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          display: { xs: "flex", md: "none" },
          top: HEADER_HEIGHT,
          bgcolor: "rgba(251,248,243,0.96)",
          backdropFilter: "blur(8px)",
          color: "#0b2426",
          borderBottom: "1px solid #e7e2d9",
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
              color: "#0b2426",
              border: "1px solid #e7e2d9",
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
            bgcolor: "#0b2426",
            color: "#f6f2ea",
            borderRight: "none",
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
            bgcolor: "#0b2426",
            color: "#f6f2ea",
            borderRight: "none",
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
          minWidth: 0,
          px: { xs: 2, md: 5 },
          pb: { xs: 3, md: 6 },
          pt: { xs: 10, md: 4 },
          mt: 0,
          bgcolor: "var(--admin-bg)",
          minHeight: `calc(100vh - ${HEADER_HEIGHT}px)`,
        }}
      >
        <Box
          sx={{
            display: { xs: "none", md: "flex" },
            alignItems: "center",
            justifyContent: "space-between",
            pb: 2.5,
            mb: 3,
            borderBottom: "1px solid var(--admin-border)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, fontSize: 13, color: "var(--admin-muted)" }}>
            <span>{t("shell.mobileTitle")}</span>
            <span style={{ opacity: 0.5 }}>/</span>
            <span style={{ color: "var(--admin-text)", fontWeight: 600 }}>
              {visibleTabs.find((x) => x.key === activeTab)?.label}
            </span>
          </Box>
          <Typography sx={{ fontSize: 13, color: "var(--admin-muted)" }}>
            {new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </Typography>
        </Box>
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "rooms" && <RoomsTab />}
        {activeTab === "reservations" && <ReservationsTab />}
        {activeTab === "payments" && <PaymentsInvoicesTab />}
        {activeTab === "reports" && <ReportsTab />}
        {activeTab === "specialRates" && <SpecialRatesTab />}
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


