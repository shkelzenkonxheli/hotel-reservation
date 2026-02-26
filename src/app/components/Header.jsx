"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
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
  Avatar,
  Tooltip,
} from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";

import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import DashboardIcon from "@mui/icons-material/Dashboard";
import LoginIcon from "@mui/icons-material/Login";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import NotificationsIcon from "@mui/icons-material/Notifications";

export default function Header() {
  const { data: session } = useSession();
  const user = session?.user;
  const router = useRouter();
  const pathname = usePathname();
  const isMobileView = useMediaQuery("(max-width:767px)");

  const [menuAnchor, setMenuAnchor] = useState(null);
  const [alertsAnchor, setAlertsAnchor] = useState(null);
  const [userAnchor, setUserAnchor] = useState(null);

  const [summary, setSummary] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);

  const openMenu = (e) => setMenuAnchor(e.currentTarget);
  const closeMenu = () => setMenuAnchor(null);
  const closeUserMenu = () => setUserAnchor(null);

  const closeAlerts = async () => {
    setAlertsAnchor(null);

    try {
      await fetch("/api/notifications", { method: "PATCH" });

      // ✅ update UI menjëherë
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark notifications as read", err);
    }
  };

  const logout = () => {
    localStorage.removeItem("activeTab");
    signOut();
  };

  // fix for hydration — detect real client
  const isClient = typeof window !== "undefined";

  async function loadNotifications() {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      const arr = Array.isArray(data) ? data : [];
      setNotifications(arr);
      setUnreadCount(arr.filter((n) => !n.is_read).length);
      setHasNewNotifications(false);
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  }

  // SSE unread count (only worker/admin)
  useEffect(() => {
    if (!isClient || !user || user.role === "client") return;

    const es = new EventSource("/api/notifications/stream");
    es.addEventListener("unread", (event) => {
      const count = Number(event.data ?? 0);
      setUnreadCount(count);
      if (count > 0) setHasNewNotifications(true);
      if (Boolean(alertsAnchor) && count > 0) {
        loadNotifications();
      }
    });
    es.onerror = () => {
      es.close();
    };

    return () => {
      es.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, user?.role, alertsAnchor]);

  const openAlerts = async (e) => {
    setAlertsAnchor(e.currentTarget);

    if (!summary) {
      try {
        const res = await fetch("/api/houseKeeping/summary");
        const data = await res.json();
        setSummary(data);
      } catch (err) {
        console.error("Failed to load summary", err);
      }
    }

    if (notifications.length === 0 || hasNewNotifications) {
      await loadNotifications();
    }
  };

  const showDashboard = user && user.role !== "client";
  const isDashboard = pathname?.startsWith("/dashboard");
  const isLoggedIn = Boolean(user);

  const navSurface = isLoggedIn
    ? "linear-gradient(90deg, #eef6ff 0%, #f8fbff 100%)"
    : "#f8fafc";
  const navBorder = isLoggedIn ? "#bfdbfe" : "#e2e8f0";

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        background: navSurface,
        color: "#0f172a",
        borderBottom: `1px solid ${navBorder}`,
      }}
    >
      <Toolbar
        sx={{
          minHeight: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        {/* LEFT — LOGO */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Link
            href="/"
            aria-label="Go to home"
            style={{ display: "inline-flex", textDecoration: "none" }}
          >
            <Box
              component="img"
              src="/hotel-images/Logo.png"
              alt="Dijari Premium"
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                objectFit: "contain",
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                p: 0.5,
                cursor: "pointer",
              }}
            />
          </Link>
          <Box>
            <Typography variant="subtitle1" fontWeight={800} lineHeight={1}>
              <Link
                href="/"
                style={{ color: "inherit", textDecoration: "none" }}
              >
                Dijari Premium
              </Link>
            </Typography>
            {isDashboard ? (
              <Typography variant="caption" color="text.secondary">
                Dashboard
              </Typography>
            ) : null}
          </Box>
        </Box>
        {/* RIGHT — PROFILE, NOTIFICATIONS, LOGOUT */}
        <Box
          className="hidden md:flex items-center gap-2"
          sx={{ marginLeft: "auto" }}
        >
          {!user && (
            <Button
              component={Link}
              href="/contact"
              sx={{
                color: "#0f172a",
                textTransform: "none",
                fontWeight: 600,
                "&:hover": { backgroundColor: "#f1f5f9" },
              }}
            >
              Contact
            </Button>
          )}
          {/* Notifications (only worker/admin) */}
          {isClient && user && user.role !== "client" && (
            <>
              <Tooltip title="Notifications">
                <IconButton
                  onClick={openAlerts}
                  sx={{
                    color: "#0f172a",
                    border: "1px solid #e2e8f0",
                    borderRadius: 2,
                    width: 40,
                    height: 40,
                    "&:hover": { backgroundColor: "#f1f5f9" },
                  }}
                >
                  <Badge
                    badgeContent={unreadCount}
                    color="error"
                    overlap="circular"
                  >
                    <NotificationsIcon sx={{ fontSize: 20 }} />
                  </Badge>
                </IconButton>
              </Tooltip>

              <Menu
                anchorEl={alertsAnchor}
                open={Boolean(alertsAnchor) && !isMobileView}
                onClose={closeAlerts}
                PaperProps={{
                  sx: {
                    borderRadius: 2,
                    mt: 1,
                    minWidth: 340,
                    boxShadow: "0 8px 24px rgba(15,23,42,0.12)",
                  },
                }}
              >
                <Box sx={{ p: 2, width: 320 }}>
                  {/* Housekeeping */}
                  <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                    🧹 Housekeeping Alerts
                  </Typography>
                  <Typography>
                    🚪 Checkin Today: {summary?.checkin_today ?? 0}
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
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            closeAlerts();
                            if (n.reservation_id) {
                              router.push(
                                `/dashboard?reservationId=${n.reservation_id}`,
                              );
                            }
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
              <Button
                onClick={(e) => setUserAnchor(e.currentTarget)}
                startIcon={
                  <Avatar
                    sx={{
                      width: 28,
                      height: 28,
                      bgcolor: "#e2e8f0",
                      color: "#0f172a",
                      fontWeight: 700,
                      fontSize: 13,
                    }}
                    src={user.avatar_url || undefined}
                  >
                    {(user.name || user.email || "?").slice(0, 1).toUpperCase()}
                  </Avatar>
                }
                endIcon={<PersonOutlineIcon sx={{ fontSize: 18 }} />}
                sx={{
                  textTransform: "none",
                  color: "#0f172a",
                  fontWeight: 600,
                  border: "1px solid #e2e8f0",
                  borderRadius: 2,
                  px: 1.5,
                  "&:hover": { backgroundColor: "#f1f5f9" },
                }}
              >
                {user.name || "Account"}
              </Button>

              <Menu
                anchorEl={userAnchor}
                open={Boolean(userAnchor)}
                onClose={closeUserMenu}
                PaperProps={{
                  sx: {
                    borderRadius: 2,
                    mt: 1,
                    minWidth: 200,
                    boxShadow: "0 8px 24px rgba(15,23,42,0.12)",
                  },
                }}
              >
                {showDashboard && (
                  <MenuItem
                    onClick={() => {
                      closeUserMenu();
                      router.push("/dashboard");
                    }}
                  >
                    <DashboardIcon sx={{ fontSize: 18, mr: 1 }} />
                    Dashboard
                  </MenuItem>
                )}
                <MenuItem
                  onClick={() => {
                    closeUserMenu();
                    router.push("/profile");
                  }}
                >
                  <PersonOutlineIcon sx={{ fontSize: 18, mr: 1 }} />
                  Profile
                </MenuItem>
                <Divider />
                <MenuItem
                  onClick={() => {
                    closeUserMenu();
                    logout();
                  }}
                  sx={{ color: "#b91c1c" }}
                >
                  <LogoutIcon sx={{ fontSize: 18, mr: 1 }} />
                  Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button
                component={Link}
                href="/login"
                startIcon={<LoginIcon />}
                sx={{
                  color: "#0f172a",
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                Login
              </Button>
              <Button
                component={Link}
                href="/register"
                startIcon={<PersonAddIcon />}
                sx={{
                  color: "#0f172a",
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                Register
              </Button>
            </>
          )}
        </Box>

        {/* MOBILE MENU BUTTON */}
        <Box
          sx={{
            display: { xs: "flex", md: "none" },
            alignItems: "center",
            gap: 1,
          }}
        >
          {isClient && user && user.role !== "client" && (
            <>
              <Tooltip title="Notifications">
                <IconButton
                  onClick={openAlerts}
                  sx={{
                    color: "#0f172a",
                    border: "1px solid #e2e8f0",
                    borderRadius: 2,
                    width: 40,
                    height: 40,
                    "&:hover": { backgroundColor: "#f1f5f9" },
                  }}
                >
                  <Badge
                    badgeContent={unreadCount}
                    color="error"
                    overlap="circular"
                  >
                    <NotificationsIcon sx={{ fontSize: 20 }} />
                  </Badge>
                </IconButton>
              </Tooltip>

              <Menu
                anchorEl={alertsAnchor}
                open={Boolean(alertsAnchor) && isMobileView}
                onClose={closeAlerts}
                PaperProps={{
                  sx: {
                    borderRadius: 2,
                    mt: 1,
                    minWidth: 300,
                    maxWidth: "92vw",
                    boxShadow: "0 8px 24px rgba(15,23,42,0.12)",
                  },
                }}
              >
                <Box sx={{ p: 2, width: { xs: 280, sm: 320 } }}>
                  <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                    Housekeeping Alerts
                  </Typography>
                  <Typography>
                    Checkin Today: {summary?.checkin_today ?? 0}
                  </Typography>
                  <Typography>
                    Checkouts Today: {summary?.checkout_today ?? 0}
                  </Typography>
                  <Typography>
                    Needs Cleaning: {summary?.needs_cleaning ?? 0}
                  </Typography>
                  <Typography>
                    Out of Order: {summary?.out_of_order ?? 0}
                  </Typography>

                  <Divider sx={{ my: 1.5 }} />

                  <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                    Reservation Notifications
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
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            closeAlerts();
                            if (n.reservation_id) {
                              router.push(
                                `/dashboard?reservationId=${n.reservation_id}`,
                              );
                            }
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

          <IconButton
            color="inherit"
            edge="end"
            onClick={openMenu}
            sx={{
              color: "#0f172a",
              border: "1px solid #e2e8f0",
              borderRadius: 2,
              width: 40,
              height: 40,
              "&:hover": { backgroundColor: "#f1f5f9" },
            }}
          >
            <MenuIcon />
          </IconButton>
        </Box>

        {/* MOBILE DROPDOWN MENU */}
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={closeMenu}
          PaperProps={{
            sx: {
              borderRadius: 2,
              mt: 1,
              minWidth: 200,
              boxShadow: "0 8px 24px rgba(15,23,42,0.12)",
            },
          }}
        >
          {[
            !user && (
              <MenuItem
                key="contact"
                component={Link}
                href="/contact"
                onClick={closeMenu}
              >
                Contact
              </MenuItem>
            ),

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


