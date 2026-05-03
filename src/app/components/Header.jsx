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
import { useLocale, useTranslations } from "next-intl";

import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import LoginIcon from "@mui/icons-material/Login";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import NotificationsIcon from "@mui/icons-material/Notifications";
import LanguageIcon from "@mui/icons-material/Language";

export default function Header() {
  const t = useTranslations("header");
  const { data: session } = useSession();
  const user = session?.user;
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const isMobileView = useMediaQuery("(max-width:767px)", { noSsr: true });
  const [mounted, setMounted] = useState(false);

  const [menuAnchor, setMenuAnchor] = useState(null);
  const [alertsAnchor, setAlertsAnchor] = useState(null);
  const [userAnchor, setUserAnchor] = useState(null);
  const [languageAnchor, setLanguageAnchor] = useState(null);

  const [summary, setSummary] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);

  const openMenu = (e) => setMenuAnchor(e.currentTarget);
  const closeMenu = () => setMenuAnchor(null);
  const closeUserMenu = () => setUserAnchor(null);
  const closeLanguageMenu = () => setLanguageAnchor(null);

  const closeAlerts = async () => {
    setAlertsAnchor(null);
    try {
      await fetch("/api/notifications", { method: "PATCH" });
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

  const changeLocale = (nextLocale) => {
    if (!nextLocale || nextLocale === locale) return;
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    closeLanguageMenu();
    router.refresh();
  };

  useEffect(() => {
    setMounted(true);
  }, []);

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

  useEffect(() => {
    if (!mounted || !user || user.role === "client") return;

    const es = new EventSource("/api/notifications/stream");
    es.addEventListener("unread", (event) => {
      const count = Number(event.data ?? 0);
      setUnreadCount(count);
      if (count > 0) setHasNewNotifications(true);
      if (Boolean(alertsAnchor) && count > 0) {
        loadNotifications();
      }
    });
    es.onerror = () => es.close();
    return () => es.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, user?.role, alertsAnchor]);

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
  const isPublicShell = !isDashboard;
  const isLoggedIn = Boolean(user);

  const publicNavLinks = [
    { key: "roomsLink", href: "/rooms" },
    { key: "contact", href: "/contact" },
    ...(user ? [{ key: "profile", href: "/profile" }] : []),
    ...(showDashboard ? [{ key: "dashboard", href: "/dashboard" }] : []),
  ];

  const navSurface = isPublicShell
    ? "rgba(248, 250, 252, 0.92)"
    : isLoggedIn
      ? "linear-gradient(90deg, #eef6ff 0%, #f8fbff 100%)"
      : "#f8fafc";
  const navBorder = isPublicShell
    ? "rgba(226,232,240,0.95)"
    : isLoggedIn
      ? "#bfdbfe"
      : "#e2e8f0";

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        background: navSurface,
        color: "#0f172a",
        borderBottom: `1px solid ${navBorder}`,
        backdropFilter: isPublicShell ? "blur(16px)" : "none",
      }}
    >
      <Toolbar
        sx={{
          minHeight: isPublicShell ? 58 : 64,
          display: "flex",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            minWidth: { md: isPublicShell ? 180 : "auto" },
          }}
        >
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
                width: isPublicShell ? 34 : 42,
                height: isPublicShell ? 34 : 42,
                borderRadius: "50%",
                objectFit: "cover",
                backgroundColor: "#ffffff",
                border: "1px solid rgba(15,23,42,0.08)",
                boxShadow: "0 2px 10px rgba(15,23,42,0.08)",
                p: 0.25,
                cursor: "pointer",
              }}
            />
          </Link>
          <Box>
            <Typography
              variant="subtitle1"
              fontWeight={isPublicShell ? 700 : 800}
              lineHeight={1}
              sx={{ fontSize: isPublicShell ? 17 : undefined }}
            >
              <Link
                href="/"
                style={{ color: "inherit", textDecoration: "none" }}
              >
                Dijari Premium
              </Link>
            </Typography>
            {isDashboard ? (
              <Typography variant="caption" color="text.secondary">
                {t("dashboard")}
              </Typography>
            ) : null}
          </Box>
        </Box>

        {isPublicShell && (
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              flex: 1,
              justifyContent: "center",
              gap: 0.5,
            }}
          >
            {publicNavLinks.map((item) => (
              <Button
                key={item.key}
                component={Link}
                href={item.href}
                sx={{
                  px: 1.4,
                  minWidth: "auto",
                  color: "#64748b",
                  textTransform: "none",
                  fontWeight: 500,
                  fontSize: 13,
                  borderRadius: 2,
                  "&:hover": {
                    backgroundColor: "rgba(226,232,240,0.45)",
                    color: "#0f172a",
                  },
                }}
              >
                {t(item.key)}
              </Button>
            ))}
          </Box>
        )}

        <Box
          className="hidden md:flex items-center gap-2"
          sx={{
            marginLeft: isPublicShell ? 0 : "auto",
            justifyContent: "flex-end",
            flex: isPublicShell ? 1 : undefined,
            minWidth: { md: isPublicShell ? 220 : "auto" },
            gap: isPublicShell ? 1 : 2,
          }}
        >
          <Box
            sx={{
              display: "inline-flex",
              mr: 0.5,
            }}
          >
            <IconButton
              onClick={(e) => setLanguageAnchor(e.currentTarget)}
              aria-label={t("language")}
              sx={{
                width: isPublicShell ? 36 : 40,
                height: isPublicShell ? 36 : 40,
                borderRadius: 2,
                color: "#334155",
                "&:hover": {
                  backgroundColor: "#f1f5f9",
                },
              }}
            >
              <LanguageIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>

          <Menu
            anchorEl={languageAnchor}
            open={Boolean(languageAnchor)}
            onClose={closeLanguageMenu}
            PaperProps={{
              sx: {
                borderRadius: 2,
                mt: 1,
                minWidth: 150,
                boxShadow: "0 8px 24px rgba(15,23,42,0.12)",
              },
            }}
          >
            <MenuItem
              selected={locale === "sq"}
              onClick={() => changeLocale("sq")}
            >
              Shqip
            </MenuItem>
            <MenuItem
              selected={locale === "en"}
              onClick={() => changeLocale("en")}
            >
              English
            </MenuItem>
          </Menu>

          {!user && !isPublicShell && (
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
              {t("contact")}
            </Button>
          )}

          {mounted && user && user.role !== "client" && (
            <>
              <Tooltip title={t("notifications")}>
                <IconButton
                  onClick={openAlerts}
                  sx={{
                    color: "#0f172a",
                    width: 40,
                    height: 40,
                    borderRadius: 2,
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
                  <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                    {t("housekeeping.title")}
                  </Typography>
                  <Typography>
                    {t("housekeeping.checkinToday")}: {summary?.checkin_today ?? 0}
                  </Typography>
                  <Typography>
                    {t("housekeeping.checkoutsToday")}: {summary?.checkout_today ?? 0}
                  </Typography>
                  <Typography>
                    {t("housekeeping.needsCleaning")}: {summary?.needs_cleaning ?? 0}
                  </Typography>
                  <Typography>
                    {t("housekeeping.outOfOrder")}: {summary?.out_of_order ?? 0}
                  </Typography>

                  <Divider sx={{ my: 1.5 }} />

                  <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                    {t("reservationNotifications")}
                  </Typography>

                  {notifications.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      {t("noNotifications")}
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

          {mounted && user ? (
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
                  px: isPublicShell ? 1.2 : 1.5,
                  minHeight: isPublicShell ? 36 : 40,
                  "&:hover": { backgroundColor: "#f1f5f9" },
                }}
              >
                {user.name || t("account")}
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
                <Box
                  sx={{
                    px: 2,
                    py: 1.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 1.25,
                  }}
                >
                  <Avatar
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: "#e2e8f0",
                      color: "#0f172a",
                      fontWeight: 700,
                    }}
                    src={user.avatar_url || undefined}
                  >
                    {(user.name || user.email || "?").slice(0, 1).toUpperCase()}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#0f172a",
                        lineHeight: 1.2,
                      }}
                    >
                      {user.name || t("account")}
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: 12,
                        color: "#64748b",
                        lineHeight: 1.2,
                        wordBreak: "break-word",
                      }}
                    >
                      {user.email}
                    </Typography>
                  </Box>
                </Box>
                <Divider />
                <MenuItem
                  onClick={() => {
                    closeUserMenu();
                    logout();
                  }}
                  sx={{ color: "#b91c1c" }}
                >
                  <LogoutIcon sx={{ fontSize: 18, mr: 1 }} />
                  {t("logout")}
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              {isPublicShell ? (
                <>
                  <Button
                    component={Link}
                    href="/login"
                    sx={{
                      color: "#475569",
                      textTransform: "none",
                      fontWeight: 500,
                      fontSize: 13,
                      minWidth: "auto",
                      px: 1.25,
                    }}
                  >
                    {t("signIn")}
                  </Button>
                  <Button
                    component={Link}
                    href="/rooms"
                    sx={{
                      backgroundColor: "#1f6feb",
                      color: "#ffffff",
                      textTransform: "none",
                      fontWeight: 700,
                      fontSize: 13,
                      borderRadius: 2,
                      minHeight: 34,
                      px: 1.8,
                      "&:hover": {
                        backgroundColor: "#195fd0",
                      },
                    }}
                  >
                    {t("bookNow")}
                  </Button>
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
                    {t("login")}
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
                    {t("register")}
                  </Button>
                </>
              )}
            </>
          )}
        </Box>

        <Box
          sx={{
            display: { xs: "flex", md: "none" },
            alignItems: "center",
            gap: 1,
            ml: "auto",
          }}
        >
          {mounted && user && user.role !== "client" && (
            <>
              <Tooltip title={t("notifications")}>
                <IconButton
                  onClick={openAlerts}
                  sx={{
                    color: "#0f172a",
                    width: 40,
                    height: 40,
                    borderRadius: 2,
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
                    {t("housekeeping.title")}
                  </Typography>
                  <Typography>
                    {t("housekeeping.checkinToday")}: {summary?.checkin_today ?? 0}
                  </Typography>
                  <Typography>
                    {t("housekeeping.checkoutsToday")}: {summary?.checkout_today ?? 0}
                  </Typography>
                  <Typography>
                    {t("housekeeping.needsCleaning")}: {summary?.needs_cleaning ?? 0}
                  </Typography>
                  <Typography>
                    {t("housekeeping.outOfOrder")}: {summary?.out_of_order ?? 0}
                  </Typography>

                  <Divider sx={{ my: 1.5 }} />

                  <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                    {t("reservationNotifications")}
                  </Typography>

                  {notifications.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      {t("noNotifications")}
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
          <MenuItem
            onClick={(e) => {
              closeMenu();
              setLanguageAnchor(e.currentTarget);
            }}
            sx={{ justifyContent: "space-between" }}
          >
            {t("language")}
            <LanguageIcon sx={{ fontSize: 18, color: "#64748b" }} />
          </MenuItem>
          <Divider />

          {[
            isPublicShell && (
              <MenuItem
                key="rooms-link"
                component={Link}
                href="/rooms"
                onClick={closeMenu}
              >
                {t("roomsLink")}
              </MenuItem>
            ),
            isPublicShell && (
              <MenuItem
                key="contact"
                component={Link}
                href="/contact"
                onClick={closeMenu}
              >
                {t("contact")}
              </MenuItem>
            ),
            isPublicShell && user && (
              <MenuItem
                key="profile"
                component={Link}
                href="/profile"
                onClick={closeMenu}
              >
                {t("profile")}
              </MenuItem>
            ),
            isPublicShell && showDashboard && (
              <MenuItem
                key="dashboard"
                component={Link}
                href="/dashboard"
                onClick={closeMenu}
              >
                {t("dashboard")}
              </MenuItem>
            ),
            !user && (
              <MenuItem
                key="login"
                component={Link}
                href="/login"
                onClick={closeMenu}
              >
                {t("login")}
              </MenuItem>
            ),
            !user && (
              <MenuItem
                key="register"
                component={Link}
                href="/register"
                onClick={closeMenu}
              >
                {t("register")}
              </MenuItem>
            ),
            user && !isPublicShell && (
              <MenuItem
                key="profile"
                component={Link}
                href="/profile"
                onClick={closeMenu}
              >
                {t("profile")}
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
                {t("logout")}
              </MenuItem>
            ),
          ].filter(Boolean)}
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
