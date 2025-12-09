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

  const openMenu = (e) => setMenuAnchor(e.currentTarget);
  const closeMenu = () => setMenuAnchor(null);

  const openAlerts = (e) => setAlertsAnchor(e.currentTarget);
  const closeAlerts = () => setAlertsAnchor(null);

  const logout = () => {
    localStorage.removeItem("activeTab");
    signOut();
  };

  useEffect(() => {
    async function loadSummary() {
      const res = await fetch("/api/houseKeeping/summary");
      const data = await res.json();
      setSummary(data);
    }
    loadSummary();
  }, []);

  return (
    <AppBar position="sticky" sx={{ backgroundColor: "#1f2937" }}>
      <Toolbar
        sx={{
          display: "flex",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        {/* LEFT — LOGO */}
        <Typography
          variant="h6"
          component={Link}
          href="/"
          sx={{
            textDecoration: "none",
            color: "white",
            fontWeight: "bold",
          }}
        >
          🏨 Hotel Management
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
        <Box className="hidden md:flex items-center gap-3">
          {user && user.role !== "client" && (
            <>
              <IconButton color="inherit" onClick={openAlerts}>
                <NotificationsIcon />
              </IconButton>

              {/* Notifications dropdown */}
              <Menu
                anchorEl={alertsAnchor}
                open={Boolean(alertsAnchor)}
                onClose={closeAlerts}
              >
                <Box sx={{ p: 2, width: 250 }}>
                  <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                    🧹 Housekeeping Alerts
                  </Typography>

                  <Typography>
                    🚪 Checkouts Today: {summary?.checkout_today}
                  </Typography>
                  <Typography>
                    🧼 Needs Cleaning: {summary?.needs_cleaning}
                  </Typography>
                  <Typography>
                    ⚠️ Out of Order: {summary?.out_of_order}
                  </Typography>
                </Box>
              </Menu>
            </>
          )}

          {user ? (
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
                {session?.user.name}
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
