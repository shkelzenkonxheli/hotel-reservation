"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Icon,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import DashboardIcon from "@mui/icons-material/Dashboard";
import HomeIcon from "@mui/icons-material/Home";
import BookOnlineIcon from "@mui/icons-material/BookOnline";
import LoginIcon from "@mui/icons-material/Login";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";

export default function Header() {
  const { data: session } = useSession();
  const user = session?.user;
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleLogut = () => {
    localStorage.removeItem("activeTab");
    signOut();
  };

  return (
    <AppBar position="sticky" sx={{ backgroundColor: "#1f2937" }}>
      <Toolbar className="flex justify-between">
        {/* Logo */}
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

        {/* Desktop Navigation */}
        <Box className="hidden md:flex items-center gap-3">
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

          {!user && (
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

          {user && (
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

              {user && (
                <Button
                  component={Link}
                  href="/profile"
                  startIcon={<PersonOutlineIcon />}
                  sx={{ color: "white" }}
                >
                  Profile
                </Button>
              )}

              <Button
                onClick={handleLogut}
                startIcon={<LogoutIcon />}
                sx={{ color: "white" }}
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
                handleLogut();
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
