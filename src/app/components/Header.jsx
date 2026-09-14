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
  Drawer,
} from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useLocale, useTranslations } from "next-intl";

import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import LogoutIcon from "@mui/icons-material/Logout";
import LoginIcon from "@mui/icons-material/Login";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import NotificationsIcon from "@mui/icons-material/Notifications";
import LanguageIcon from "@mui/icons-material/Language";
import BedOutlinedIcon from "@mui/icons-material/BedOutlined";
import ContactMailOutlinedIcon from "@mui/icons-material/ContactMailOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import EventNoteOutlinedIcon from "@mui/icons-material/EventNoteOutlined";

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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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

    try {
      const res = await fetch("/api/houseKeeping/summary", {
        cache: "no-store",
      });
      const data = await res.json();
      setSummary(data);
    } catch (err) {
      console.error("Failed to load summary", err);
    }

    if (notifications.length === 0 || hasNewNotifications) {
      await loadNotifications();
    }
  };

  const showDashboard = user && user.role !== "client";
  const isDashboard = pathname?.startsWith("/dashboard");
  const isPublicShell = !isDashboard;
  const isLoggedIn = Boolean(user);
  const isHome = pathname === "/";

  // Transparent-over-hero only on home route, before scrolling past 40px.
  useEffect(() => {
    if (!isPublicShell) return;
    if (!isHome) {
      setScrolled(true);
      return;
    }
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isPublicShell, isHome]);

  const transparentActive = isPublicShell && isHome && !scrolled;

  const publicNavLinks = [
    { key: "home", labelKey: "navHome", href: "/", icon: HomeOutlinedIcon },
    { key: "rooms", labelKey: "roomsLink", href: "/rooms", icon: BedOutlinedIcon },
    { key: "contact", labelKey: "contact", href: "/contact", icon: ContactMailOutlinedIcon },
    ...(user
      ? [
          {
            key: "reservations",
            labelKey: "navReservations",
            href: "/reservations",
            icon: EventNoteOutlinedIcon,
          },
          { key: "profile", labelKey: "profile", href: "/profile", icon: PersonOutlineIcon },
        ]
      : []),
    ...(showDashboard
      ? [{ key: "dashboard", labelKey: "dashboard", href: "/dashboard", icon: DashboardOutlinedIcon }]
      : []),
  ];

  const navLabel = (item) => {
    if (item.labelKey === "navHome") return locale === "sq" ? "Kryefaqja" : "Home";
    if (item.labelKey === "navReservations")
      return locale === "sq" ? "Rezervimet e Mia" : "My Reservations";
    return t(item.labelKey);
  };

  /* ================= DASHBOARD HEADER (behavior/logic unchanged) ================= */
  if (isDashboard) {
    return (
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          background: isLoggedIn
            ? "linear-gradient(90deg, #eef6ff 0%, #f8fbff 100%)"
            : "#faf7f1",
          color: "#0f172a",
          borderBottom: `1px solid ${isLoggedIn ? "#e2cda9" : "#e2e8f0"}`,
        }}
      >
        <Toolbar sx={{ minHeight: 64, display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <Link href="/" aria-label="Go to home" style={{ display: "inline-flex", textDecoration: "none" }}>
              <Box
                component="img"
                src="/hotel-images/Logo.png"
                alt="Dijari Premium"
                sx={{
                  width: 42,
                  height: 42,
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
              <Typography variant="subtitle1" fontWeight={800} lineHeight={1}>
                <Link href="/" style={{ color: "inherit", textDecoration: "none" }}>
                  Dijari Premium
                </Link>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t("dashboard")}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 2 }}>
            <IconButton
              onClick={(e) => setLanguageAnchor(e.currentTarget)}
              aria-label={t("language")}
              sx={{ width: 40, height: 40, borderRadius: 2, color: "#334155", "&:hover": { backgroundColor: "#f1f5f9" } }}
            >
              <LanguageIcon sx={{ fontSize: 18 }} />
            </IconButton>

            <Menu
              anchorEl={languageAnchor}
              open={Boolean(languageAnchor)}
              onClose={closeLanguageMenu}
              PaperProps={{ sx: { borderRadius: 2, mt: 1, minWidth: 150, boxShadow: "0 8px 24px rgba(15,23,42,0.12)" } }}
            >
              <MenuItem selected={locale === "sq"} onClick={() => changeLocale("sq")}>Shqip</MenuItem>
              <MenuItem selected={locale === "en"} onClick={() => changeLocale("en")}>English</MenuItem>
            </Menu>

            {!user && (
              <Button component={Link} href="/contact" sx={{ color: "#0f172a", textTransform: "none", fontWeight: 600, "&:hover": { backgroundColor: "#f1f5f9" } }}>
                {t("contact")}
              </Button>
            )}

            {mounted && user && user.role !== "client" && (
              <>
                <Tooltip title={t("notifications")}>
                  <IconButton onClick={openAlerts} sx={{ color: "#0f172a", width: 40, height: 40, borderRadius: 2, "&:hover": { backgroundColor: "#f1f5f9" } }}>
                    <Badge badgeContent={unreadCount} color="error" overlap="circular">
                      <NotificationsIcon sx={{ fontSize: 20 }} />
                    </Badge>
                  </IconButton>
                </Tooltip>

                <Menu
                  anchorEl={alertsAnchor}
                  open={Boolean(alertsAnchor)}
                  onClose={closeAlerts}
                  PaperProps={{ sx: { borderRadius: 2, mt: 1, minWidth: 340, maxWidth: "92vw", boxShadow: "0 8px 24px rgba(15,23,42,0.12)" } }}
                >
                  <Box sx={{ p: 2, width: { xs: 280, sm: 320 } }}>
                    <Typography variant="subtitle1" fontWeight="bold" mb={1}>{t("housekeeping.title")}</Typography>
                    <Typography>{t("housekeeping.checkinToday")}: {summary?.checkin_today ?? 0}</Typography>
                    <Typography>{t("housekeeping.checkoutsToday")}: {summary?.checkout_today ?? 0}</Typography>
                    <Typography>{t("housekeeping.outOfOrder")}: {summary?.out_of_order ?? 0}</Typography>
                    <Divider sx={{ my: 1.5 }} />
                    <Typography variant="subtitle1" fontWeight="bold" mb={1}>{t("reservationNotifications")}</Typography>
                    {notifications.length === 0 ? (
                      <Typography variant="body2" color="text.secondary">{t("noNotifications")}</Typography>
                    ) : (
                      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                        {notifications.slice(0, 6).map((n) => (
                          <Box
                            key={n.id}
                            sx={{
                              p: 1,
                              borderRadius: 2,
                              bgcolor: n.is_read ? "transparent" : "rgba(212,163,115,0.18)",
                              borderLeft: n.is_read ? "0px solid transparent" : "4px solid #d4a373",
                              cursor: "pointer",
                            }}
                            onClick={() => {
                              closeAlerts();
                              if (n.reservation_id) {
                                router.push(`/dashboard?reservationId=${n.reservation_id}`);
                              }
                            }}
                          >
                            <Typography fontWeight={n.is_read ? 700 : 950} fontSize={14}>{n.title}</Typography>
                            <Typography variant="body2" sx={{ lineHeight: 1.25 }}>{n.message}</Typography>
                            <Typography variant="caption" color="text.secondary">{new Date(n.created_at).toLocaleString()}</Typography>
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
                    <Avatar sx={{ width: 28, height: 28, bgcolor: "#e2e8f0", color: "#0f172a", fontWeight: 700, fontSize: 13 }} src={user.avatar_url || undefined}>
                      {(user.name || user.email || "?").slice(0, 1).toUpperCase()}
                    </Avatar>
                  }
                  endIcon={<PersonOutlineIcon sx={{ fontSize: 18 }} />}
                  sx={{ textTransform: "none", color: "#0f172a", fontWeight: 600, border: "1px solid #e2e8f0", borderRadius: 2, px: 1.5, minHeight: 40, "&:hover": { backgroundColor: "#f1f5f9" } }}
                >
                  {user.name || t("account")}
                </Button>

                <Menu
                  anchorEl={userAnchor}
                  open={Boolean(userAnchor)}
                  onClose={closeUserMenu}
                  PaperProps={{ sx: { borderRadius: 2, mt: 1, minWidth: 200, boxShadow: "0 8px 24px rgba(15,23,42,0.12)" } }}
                >
                  <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center", gap: 1.25 }}>
                    <Avatar sx={{ width: 40, height: 40, bgcolor: "#e2e8f0", color: "#0f172a", fontWeight: 700 }} src={user.avatar_url || undefined}>
                      {(user.name || user.email || "?").slice(0, 1).toUpperCase()}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#0f172a", lineHeight: 1.2 }}>{user.name || t("account")}</Typography>
                      <Typography sx={{ fontSize: 12, color: "#64748b", lineHeight: 1.2, wordBreak: "break-word" }}>{user.email}</Typography>
                    </Box>
                  </Box>
                  <Divider />
                  <MenuItem onClick={() => { closeUserMenu(); logout(); }} sx={{ color: "#b91c1c" }}>
                    <LogoutIcon sx={{ fontSize: 18, mr: 1 }} />
                    {t("logout")}
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <>
                <Button component={Link} href="/login" startIcon={<LoginIcon />} sx={{ color: "#0f172a", textTransform: "none", fontWeight: 600 }}>{t("login")}</Button>
                <Button component={Link} href="/register" startIcon={<PersonAddIcon />} sx={{ color: "#0f172a", textTransform: "none", fontWeight: 600 }}>{t("register")}</Button>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>
    );
  }

  /* ================= PUBLIC HEADER ================= */
  return (
    <header className={`nav-shell ${transparentActive ? "transparent" : "solid"}`}>
      <div className="u-wide flex items-center gap-4" style={{ minHeight: 76 }}>
        <Link href="/" aria-label="Go to home" className="flex items-center gap-3 shrink-0">
          <img
            src="/hotel-images/Logo-round.svg"
            alt="Dijari Premium"
            style={{ width: 42, height: 42, borderRadius: "50%" }}
          />
          <span
            className="display"
            style={{
              fontSize: "1.3rem",
              color: transparentActive ? "#fff" : "var(--ink)",
              lineHeight: 1,
            }}
          >
            Dijari Premium
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-7" style={{ marginLeft: 28 }}>
          {publicNavLinks
            .filter((item) => item.key !== "dashboard")
            .map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={`nav-link ${pathname === item.href ? "active" : ""}`}
                style={{ color: transparentActive ? "#fff" : "inherit" }}
              >
                {navLabel(item)}
              </Link>
            ))}
          {showDashboard && (
            <Link
              href="/dashboard"
              className={`nav-link ${pathname === "/dashboard" ? "active" : ""}`}
              style={{ color: transparentActive ? "#fff" : "inherit" }}
            >
              {t("dashboard")}
            </Link>
          )}
        </nav>

        <div className="hidden md:flex items-center gap-3" style={{ marginLeft: "auto" }}>
          <IconButton
            onClick={(e) => setLanguageAnchor(e.currentTarget)}
            aria-label={t("language")}
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              color: transparentActive ? "#fff" : "#334155",
              "&:hover": { backgroundColor: transparentActive ? "rgba(255,255,255,0.15)" : "#f1f5f9" },
            }}
          >
            <LanguageIcon sx={{ fontSize: 19 }} />
          </IconButton>

          <Menu
            anchorEl={languageAnchor}
            open={Boolean(languageAnchor)}
            onClose={closeLanguageMenu}
            PaperProps={{ sx: { borderRadius: 2, mt: 1, minWidth: 150, boxShadow: "0 8px 24px rgba(15,23,42,0.12)" } }}
          >
            <MenuItem selected={locale === "sq"} onClick={() => changeLocale("sq")}>Shqip</MenuItem>
            <MenuItem selected={locale === "en"} onClick={() => changeLocale("en")}>English</MenuItem>
          </Menu>

          {mounted && user && user.role !== "client" && (
            <>
              <Tooltip title={t("notifications")}>
                <IconButton
                  onClick={openAlerts}
                  sx={{
                    color: transparentActive ? "#fff" : "#0f172a",
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    "&:hover": { backgroundColor: transparentActive ? "rgba(255,255,255,0.15)" : "#f1f5f9" },
                  }}
                >
                  <Badge badgeContent={unreadCount} color="error" overlap="circular">
                    <NotificationsIcon sx={{ fontSize: 20 }} />
                  </Badge>
                </IconButton>
              </Tooltip>

              <Menu
                anchorEl={alertsAnchor}
                open={Boolean(alertsAnchor) && !isMobileView}
                onClose={closeAlerts}
                PaperProps={{ sx: { borderRadius: 2, mt: 1, minWidth: 340, boxShadow: "0 8px 24px rgba(15,23,42,0.12)" } }}
              >
                <Box sx={{ p: 2, width: 320 }}>
                  <Typography variant="subtitle1" fontWeight="bold" mb={1}>{t("housekeeping.title")}</Typography>
                  <Typography>{t("housekeeping.checkinToday")}: {summary?.checkin_today ?? 0}</Typography>
                  <Typography>{t("housekeeping.checkoutsToday")}: {summary?.checkout_today ?? 0}</Typography>
                  <Typography>{t("housekeeping.outOfOrder")}: {summary?.out_of_order ?? 0}</Typography>
                  <Divider sx={{ my: 1.5 }} />
                  <Typography variant="subtitle1" fontWeight="bold" mb={1}>{t("reservationNotifications")}</Typography>
                  {notifications.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">{t("noNotifications")}</Typography>
                  ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                      {notifications.slice(0, 6).map((n) => (
                        <Box
                          key={n.id}
                          sx={{
                            p: 1,
                            borderRadius: 2,
                            bgcolor: n.is_read ? "transparent" : "rgba(212,163,115,0.18)",
                            borderLeft: n.is_read ? "0px solid transparent" : "4px solid #d4a373",
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            closeAlerts();
                            if (n.reservation_id) {
                              router.push(`/dashboard?reservationId=${n.reservation_id}`);
                            }
                          }}
                        >
                          <Typography fontWeight={n.is_read ? 700 : 950} fontSize={14}>{n.title}</Typography>
                          <Typography variant="body2" sx={{ lineHeight: 1.25 }}>{n.message}</Typography>
                          <Typography variant="caption" color="text.secondary">{new Date(n.created_at).toLocaleString()}</Typography>
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
              <button
                onClick={(e) => setUserAnchor(e.currentTarget)}
                className="flex items-center gap-2"
                style={{
                  border: `1px solid ${transparentActive ? "rgba(255,255,255,0.4)" : "var(--public-border)"}`,
                  borderRadius: 999,
                  padding: "6px 14px 6px 6px",
                  background: "transparent",
                  cursor: "pointer",
                  color: transparentActive ? "#fff" : "var(--ink)",
                }}
              >
                <Avatar sx={{ width: 30, height: 30, bgcolor: "#e2e8f0", color: "#0f172a", fontWeight: 700, fontSize: 13 }} src={user.avatar_url || undefined}>
                  {(user.name || user.email || "?").slice(0, 1).toUpperCase()}
                </Avatar>
                <span style={{ fontSize: 14, fontWeight: 600 }}>{user.name || t("account")}</span>
              </button>

              <Menu
                anchorEl={userAnchor}
                open={Boolean(userAnchor)}
                onClose={closeUserMenu}
                PaperProps={{ sx: { borderRadius: 2, mt: 1, minWidth: 200, boxShadow: "0 8px 24px rgba(15,23,42,0.12)" } }}
              >
                <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center", gap: 1.25 }}>
                  <Avatar sx={{ width: 40, height: 40, bgcolor: "#e2e8f0", color: "#0f172a", fontWeight: 700 }} src={user.avatar_url || undefined}>
                    {(user.name || user.email || "?").slice(0, 1).toUpperCase()}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontSize: 14, fontWeight: 700, color: "#0f172a", lineHeight: 1.2 }}>{user.name || t("account")}</Typography>
                    <Typography sx={{ fontSize: 12, color: "#64748b", lineHeight: 1.2, wordBreak: "break-word" }}>{user.email}</Typography>
                  </Box>
                </Box>
                <Divider />
                <MenuItem component={Link} href="/profile" onClick={closeUserMenu}>
                  <PersonOutlineIcon sx={{ fontSize: 18, mr: 1 }} />
                  {t("profile")}
                </MenuItem>
                <MenuItem onClick={() => { closeUserMenu(); logout(); }} sx={{ color: "#b91c1c" }}>
                  <LogoutIcon sx={{ fontSize: 18, mr: 1 }} />
                  {t("logout")}
                </MenuItem>
              </Menu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="nav-link"
                style={{ color: transparentActive ? "#fff" : "inherit" }}
              >
                {t("signIn")}
              </Link>
              <Link href="/rooms" className="btn btn-primary btn-sm">
                {t("bookNow")}
              </Link>
            </div>
          )}
        </div>

        {/* Book Now CTA visible on all sizes for logged users too */}
        {mounted && user && (
          <Link href="/rooms" className="btn btn-primary btn-sm hidden md:inline-flex">
            {t("bookNow")}
          </Link>
        )}

        {/* Mobile controls */}
        <div className="flex md:hidden items-center gap-1" style={{ marginLeft: "auto" }}>
          {mounted && user && user.role !== "client" && (
            <IconButton
              onClick={openAlerts}
              sx={{
                color: transparentActive ? "#fff" : "#0f172a",
                width: 44,
                height: 44,
              }}
            >
              <Badge badgeContent={unreadCount} color="error" overlap="circular">
                <NotificationsIcon sx={{ fontSize: 20 }} />
              </Badge>
            </IconButton>
          )}
          {mounted && user && user.role !== "client" && (
            <Menu
              anchorEl={alertsAnchor}
              open={Boolean(alertsAnchor) && isMobileView}
              onClose={closeAlerts}
              PaperProps={{ sx: { borderRadius: 2, mt: 1, minWidth: 300, maxWidth: "92vw", boxShadow: "0 8px 24px rgba(15,23,42,0.12)" } }}
            >
              <Box sx={{ p: 2, width: { xs: 280, sm: 320 } }}>
                <Typography variant="subtitle1" fontWeight="bold" mb={1}>{t("housekeeping.title")}</Typography>
                <Typography>{t("housekeeping.checkinToday")}: {summary?.checkin_today ?? 0}</Typography>
                <Typography>{t("housekeeping.checkoutsToday")}: {summary?.checkout_today ?? 0}</Typography>
                <Typography>{t("housekeeping.outOfOrder")}: {summary?.out_of_order ?? 0}</Typography>
                <Divider sx={{ my: 1.5 }} />
                <Typography variant="subtitle1" fontWeight="bold" mb={1}>{t("reservationNotifications")}</Typography>
                {notifications.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">{t("noNotifications")}</Typography>
                ) : (
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    {notifications.slice(0, 6).map((n) => (
                      <Box
                        key={n.id}
                        sx={{
                          p: 1,
                          borderRadius: 2,
                          bgcolor: n.is_read ? "transparent" : "rgba(212,163,115,0.18)",
                          borderLeft: n.is_read ? "0px solid transparent" : "4px solid #d4a373",
                          cursor: "pointer",
                        }}
                        onClick={() => {
                          closeAlerts();
                          if (n.reservation_id) {
                            router.push(`/dashboard?reservationId=${n.reservation_id}`);
                          }
                        }}
                      >
                        <Typography fontWeight={n.is_read ? 700 : 950} fontSize={14}>{n.title}</Typography>
                        <Typography variant="body2" sx={{ lineHeight: 1.25 }}>{n.message}</Typography>
                        <Typography variant="caption" color="text.secondary">{new Date(n.created_at).toLocaleString()}</Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Menu>
          )}

          <IconButton
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            sx={{
              color: transparentActive ? "#fff" : "#0f172a",
              width: 44,
              height: 44,
            }}
          >
            <MenuIcon />
          </IconButton>
        </div>
      </div>

      {/* Mobile drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{ sx: { width: "min(88vw, 360px)", background: "var(--sand, #fbf8f3)" } }}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--public-border)" }}>
            <Link href="/" onClick={() => setDrawerOpen(false)} className="flex items-center gap-2.5">
              <img src="/hotel-images/Logo-round.svg" alt="Dijari Premium" style={{ width: 34, height: 34, borderRadius: "50%" }} />
              <span className="display" style={{ fontSize: "1.1rem" }}>Dijari Premium</span>
            </Link>
            <IconButton onClick={() => setDrawerOpen(false)} aria-label="Close menu" sx={{ width: 44, height: 44 }}>
              <CloseIcon />
            </IconButton>
          </div>

          <nav className="flex flex-col px-3 py-3">
            {publicNavLinks
              .filter((item) => item.key !== "dashboard")
              .map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className="flex items-center gap-3 rounded-2xl px-3"
                    style={{ minHeight: 52, color: "var(--ink)", fontWeight: 600, fontSize: 16 }}
                  >
                    <Icon sx={{ fontSize: 20, color: "var(--brass-deep)" }} />
                    {navLabel(item)}
                  </Link>
                );
              })}
            {showDashboard && (
              <Link
                href="/dashboard"
                onClick={() => setDrawerOpen(false)}
                className="flex items-center gap-3 rounded-2xl px-3"
                style={{ minHeight: 52, color: "var(--ink)", fontWeight: 600, fontSize: 16 }}
              >
                <DashboardOutlinedIcon sx={{ fontSize: 20, color: "var(--brass-deep)" }} />
                {t("dashboard")}
              </Link>
            )}
          </nav>

          <div className="divider-soft mx-5" />

          <div className="px-5 py-4">
            <p className="eyebrow" style={{ marginBottom: 10 }}>{t("language")}</p>
            <div className="flex gap-2">
              <button
                onClick={() => changeLocale("sq")}
                className={`chip ${locale === "sq" ? "active" : ""}`}
                style={{ minHeight: 44 }}
              >
                Shqip
              </button>
              <button
                onClick={() => changeLocale("en")}
                className={`chip ${locale === "en" ? "active" : ""}`}
                style={{ minHeight: 44 }}
              >
                English
              </button>
            </div>
          </div>

          <div className="divider-soft mx-5" />

          <div className="px-5 py-4 flex flex-col gap-2">
            {mounted && user ? (
              <>
                <div className="flex items-center gap-3 mb-1">
                  <Avatar sx={{ width: 40, height: 40 }} src={user.avatar_url || undefined}>
                    {(user.name || user.email || "?").slice(0, 1).toUpperCase()}
                  </Avatar>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: 14 }}>{user.name || t("account")}</p>
                    <p style={{ fontSize: 12, color: "var(--public-muted)", wordBreak: "break-word" }}>{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setDrawerOpen(false); logout(); }}
                  className="btn btn-outline btn-block"
                  style={{ color: "#b91c1c", borderColor: "#f3c9c9" }}
                >
                  <LogoutIcon sx={{ fontSize: 18, mr: 1 }} />
                  {t("logout")}
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setDrawerOpen(false)} className="btn btn-outline btn-block">
                  {t("login")}
                </Link>
                <Link href="/register" onClick={() => setDrawerOpen(false)} className="btn btn-quiet btn-block">
                  {t("register")}
                </Link>
              </>
            )}
            <Link href="/rooms" onClick={() => setDrawerOpen(false)} className="btn btn-primary btn-block mt-2">
              {t("bookNow")}
            </Link>
          </div>
        </div>
      </Drawer>
    </header>
  );
}
