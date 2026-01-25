"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Divider,
  Badge,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import DashboardIcon from "@mui/icons-material/Dashboard";
import HomeIcon from "@mui/icons-material/Home";
import LoginIcon from "@mui/icons-material/Login";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import NotificationsIcon from "@mui/icons-material/Notifications";

export default function Header() {
  const { data: session } = useSession();
  const user = session?.user;

  const [menuAnchor, setMenuAnchor] = useState(null);
  const [alertsAnchor, setAlertsAnchor] = useState(null);

  const [summary, setSummary] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const openMenu = (e) => setMenuAnchor(e.currentTarget);
  const closeMenu = () => setMenuAnchor(null);

  const closeAlerts = () => setAlertsAnchor(null);

  const logout = () => {
    localStorage.removeItem("activeTab");
    signOut();
  };

  // fix for hydration — detect real client
  const isClient = typeof window !== "undefined";

  async function loadUnreadCount() {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      const arr = Array.isArray(data) ? data : [];
      setUnreadCount(arr.filter((n) => !n.is_read).length);
    } catch (e) {
      console.error("Failed to load unread count", e);
    }
  }

  // Poll unread count (only worker/admin)
  useEffect(() => {
    if (!isClient || !user || user.role === "client") return;

    loadUnreadCount();
    const t = setInterval(loadUnreadCount, 30000); // çdo 30 sekonda
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, user?.role]);

  const openAlerts = async (e) => {
    setAlertsAnchor(e.currentTarget);

    // Housekeeping summary (load once)
    if (!summary) {
      try {
        const res = await fetch("/api/houseKeeping/summary");
        const data = await res.json();
        setSummary(data);
      } catch (err) {
        console.error("Failed to load summary", err);
      }
    }

    // Notifications (admin/worker)
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      const arr = Array.isArray(data) ? data : [];
      setNotifications(arr);

      // Mark as read when opened
      await fetch("/api/notifications", { method: "PATCH" });

      // Update UI immediately
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  };

  return (
    <AppBar position="sticky" sx={{ backgroundColor: "#364958" }}>
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        {/* LEFT — LOGO */}
        <Typography
          variant="h6"
          component="div"
          sx={{ fontWeight: "bold", display: "flex", alignItems: "center" }}
        >
          <Link href="/" style={{ color: "white", textDecoration: "none" }}>
            🏨 Hotel Management
          </Link>
        </Typography>

        {/* CENTER — DESKTOP NAVIGATION */}
        <Box className="hidden md:flex items-center gap-4">
          <Button
            component={Link}
            href="/"
            startIcon={<HomeIcon />}
            sx={{ color: "white" }}
          >
            Home
          </Button>

          <Button component={Link} href="/contact" sx={{ color: "white" }}>
            Contact
          </Button>
        </Box>

        {/* RIGHT — PROFILE, NOTIFICATIONS, LOGOUT */}
        <Box
          className="hidden md:flex items-center gap-3"
          sx={{ marginLeft: "auto" }}
        >
          {/* Notifications (only worker/admin) */}
          {isClient && user && user.role !== "client" && (
            <>
              <IconButton color="inherit" onClick={openAlerts}>
                <Badge
                  badgeContent={unreadCount}
                  color="error"
                  overlap="circular"
                >
                  <NotificationsIcon />
                </Badge>
              </IconButton>

              <Menu
                anchorEl={alertsAnchor}
                open={Boolean(alertsAnchor)}
                onClose={closeAlerts}
              >
                <Box sx={{ p: 2, width: 320 }}>
                  {/* Housekeeping */}
                  <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                    🧹 Housekeeping Alerts
                  </Typography>

                  <Typography>
                    🚪 Checkouts Today: {summary?.checkout_today ?? 0}
                  </Typography>
                  <Typography>
                    🧼 Needs Cleaning: {summary?.needs_cleaning ?? 0}
                  </Typography>
                  <Typography>
                    ⚠️ Out of Order: {summary?.out_of_order ?? 0}
                  </Typography>

                  <Divider sx={{ my: 1.5 }} />

                  {/* Reservation Notifications */}
                  <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                    🔔 Reservation Notifications
                  </Typography>

                  {notifications.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No notifications
                    </Typography>
                  ) : (
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                    >
                      {notifications.slice(0, 6).map((n) => (
                        <Box
                          key={n.id}
                          sx={{
                            p: 1,
                            borderRadius: 2,
                            bgcolor: n.is_read
                              ? "transparent"
                              : "rgba(212,163,115,0.18)",
                            borderLeft: n.is_read
                              ? "0px solid transparent"
                              : "4px solid #d4a373",
                          }}
                        >
                          <Typography
                            fontWeight={n.is_read ? 700 : 950}
                            fontSize={14}
                          >
                            {n.title}
                          </Typography>
                          <Typography variant="body2" sx={{ lineHeight: 1.25 }}>
                            {n.message}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(n.created_at).toLocaleString()}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              </Menu>
            </>
          )}

          {/* User section */}
          {isClient && user ? (
            <>
              {user.role !== "client" && (
                <Button
                  component={Link}
                  href="/dashboard"
                  startIcon={<DashboardIcon />}
                  sx={{ color: "white" }}
                >
                  Dashboard
                </Button>
              )}

              <Button
                component={Link}
                href="/profile"
                startIcon={<PersonOutlineIcon />}
                sx={{ color: "white" }}
              >
                {user.name}
              </Button>

              <Button
                onClick={logout}
                startIcon={<LogoutIcon />}
                sx={{ color: "white" }}
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button
                component={Link}
                href="/login"
                startIcon={<LoginIcon />}
                sx={{ color: "white" }}
              >
                Login
              </Button>
              <Button
                component={Link}
                href="/register"
                startIcon={<PersonAddIcon />}
                sx={{ color: "white" }}
              >
                Register
              </Button>
            </>
          )}
        </Box>

        {/* MOBILE MENU BUTTON */}
        <IconButton
          color="inherit"
          edge="end"
          onClick={openMenu}
          className="md:hidden"
        >
          <MenuIcon />
        </IconButton>

        {/* MOBILE DROPDOWN MENU */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={closeMenu}
        >
          {[
            <MenuItem key="home" component={Link} href="/" onClick={closeMenu}>
              Home
            </MenuItem>,

            <MenuItem
              key="contact"
              component={Link}
              href="/contact"
              onClick={closeMenu}
            >
              Contact
            </MenuItem>,

            !user && (
              <MenuItem
                key="login"
                component={Link}
                href="/login"
                onClick={closeMenu}
              >
                Login
              </MenuItem>
            ),

            !user && (
              <MenuItem
                key="register"
                component={Link}
                href="/register"
                onClick={closeMenu}
              >
                Register
              </MenuItem>
            ),

            user && user.role !== "client" && (
              <MenuItem
                key="dashboard"
                component={Link}
                href="/dashboard"
                onClick={closeMenu}
              >
                Dashboard
              </MenuItem>
            ),

            user && (
              <MenuItem
                key="profile"
                component={Link}
                href="/profile"
                onClick={closeMenu}
              >
                Profile
              </MenuItem>
            ),

            user && (
              <MenuItem
                key="logout"
                onClick={() => {
                  closeMenu();
                  logout();
                }}
              >
                Logout
              </MenuItem>
            ),
          ].filter(Boolean)}
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
