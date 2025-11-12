"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import BookOnlineIcon from "@mui/icons-material/BookOnline";
import LoginIcon from "@mui/icons-material/Login";
import PersonAddIcon from "@mui/icons-material/PersonAdd";

export default function Header() {
  const [user, setUser] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchUser();
  }, []);

  async function fetchUser() {
    try {
      const res = await fetch("/api/me", {
        method: "GET",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      setUser(null);
    }
  }
  useEffect(() => {
    const handleUserChange = async () => {
      await fetchUser();
    };

    window.addEventListener("userChanged", handleUserChange);

    return () => window.removeEventListener("userChanged", handleUserChange);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    await fetchUser();
    router.push("/");
  };

  // Për mobile menu
  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  return (
    <AppBar
      position="sticky"
      color="primary"
      sx={{ backgroundColor: "#1f2937" }}
    >
      <Toolbar className="flex justify-between">
        {/* Logo / Title */}
        <Typography
          variant="h6"
          component={Link}
          href="/"
          sx={{
            textDecoration: "none",
            color: "white",
            fontWeight: "bold",
            "&:hover": { color: "#93c5fd" },
          }}
        >
          🏨 Hotel Management
        </Typography>

        {/* Desktop Navigation */}
        <Box className="hidden md:flex items-center gap-3">
          <Button
            component={Link}
            href="/"
            startIcon={<HomeIcon />}
            sx={{ color: "white", "&:hover": { color: "#93c5fd" } }}
          >
            Home
          </Button>

          <Button
            component={Link}
            href="/contact"
            sx={{ color: "white", "&:hover": { color: "#93c5fd" } }}
          >
            Contact
          </Button>

          {!user && (
            <>
              <Button
                component={Link}
                href="/login"
                startIcon={<LoginIcon />}
                sx={{ color: "white", "&:hover": { color: "#93c5fd" } }}
              >
                Login
              </Button>
              <Button
                component={Link}
                href="/register"
                startIcon={<PersonAddIcon />}
                sx={{ color: "white", "&:hover": { color: "#93c5fd" } }}
              >
                Register
              </Button>
            </>
          )}

          {user && (
            <>
              {user.role !== "client" && (
                <Button
                  component={Link}
                  href="/dashboard"
                  startIcon={<DashboardIcon />}
                  sx={{ color: "white", "&:hover": { color: "#93c5fd" } }}
                >
                  Dashboard
                </Button>
              )}

              {user.role === "client" && (
                <Button
                  component={Link}
                  href="/reservations"
                  startIcon={<BookOnlineIcon />}
                  sx={{ color: "white", "&:hover": { color: "#93c5fd" } }}
                >
                  Reservations
                </Button>
              )}

              <Button
                onClick={handleLogout}
                startIcon={<LogoutIcon />}
                sx={{
                  color: "white",
                  "&:hover": { color: "#f87171" },
                }}
              >
                Logout
              </Button>
            </>
          )}
        </Box>

        {/* Mobile Menu Button */}
        <IconButton
          color="inherit"
          edge="end"
          onClick={handleMenuOpen}
          className="md:hidden"
        >
          <MenuIcon />
        </IconButton>

        {/* Mobile Dropdown Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            sx: {
              backgroundColor: "#1f2937",
              color: "white",
              minWidth: "180px",
            },
          }}
        >
          <MenuItem component={Link} href="/" onClick={handleMenuClose}>
            Home
          </MenuItem>
          <MenuItem component={Link} href="/contact" onClick={handleMenuClose}>
            Contact
          </MenuItem>

          {!user && [
            <MenuItem
              key="login"
              component={Link}
              href="/login"
              onClick={handleMenuClose}
            >
              Login
            </MenuItem>,
            <MenuItem
              key="register"
              component={Link}
              href="/register"
              onClick={handleMenuClose}
            >
              Register
            </MenuItem>,
          ]}
          {user && [
            user.role !== "client" && (
              <MenuItem
                key="dashboard"
                component={Link}
                href="/dashboard"
                onClick={handleMenuClose}
              >
                Dashboard
              </MenuItem>
            ),
            user.role === "client" && (
              <MenuItem
                key="reservations"
                component={Link}
                href="/reservations"
                onClick={handleMenuClose}
              >
                Reservations
              </MenuItem>
            ),
            <MenuItem
              key="logout"
              onClick={() => {
                handleLogout();
                handleMenuClose();
              }}
            >
              Logout
            </MenuItem>,
          ]}
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
