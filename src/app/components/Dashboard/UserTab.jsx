"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  TextField,
} from "@mui/material";
import { ManageAccounts, Edit, Password, Delete } from "@mui/icons-material";

export default function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "client",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await fetch("/api/user");
      const data = await res.json();
      if (res.ok) setUsers(data);
      else console.error("Error fetching users:", data.error);
    } catch (error) {
      console.error("Network error:", error);
    } finally {
      setLoading(false);
    }
  }

  const getRoleColor = (role) => {
    switch (role.toLowerCase()) {
      case "admin":
        return "primary";
      case "worker":
        return "warning";
      case "client":
        return "default";
      default:
        return "secondary";
    }
  };

  async function handleRoleUpdate() {
    if (!selectedUser || !newRole) return;
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUser.id, newRole }),
      });
      if (res.ok) {
        const updated = await res.json();
        setUsers((prev) =>
          prev.map((u) => (u.id === updated.id ? updated : u))
        );
        setSelectedUser(null);
      } else {
        alert("Failed to update role");
      }
    } catch (err) {
      console.error(err);
    }
  }
  async function handleAddUser() {
    const { name, email, password, role } = newUser;

    if (!name || !email || !password) {
      alert("Please fill all required fields");
      return;
    }
    try {
      const res = await fetch("/api/user/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      if (res.ok) {
        setAddOpen(false);
        setNewUser({ name: "", email: "", password: "", role: "client" });
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create User");
      }
    } catch (err) {
      console.log(err);
    }
  }
  async function handleDeleteUser(userId) {
    const confirm = window.confirm(
      "Are you sure you want to delete this user?"
    );
    if (!confirm) return;

    try {
      const res = await fetch("/api/user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to delete user");
        return;
      }

      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  }

  if (loading)
    return (
      <Box className="flex justify-center items-center h-64">
        <CircularProgress />
      </Box>
    );

  return (
    <Box className="p-6">
      <Box className="flex items-center justify-between mb-6">
        <Box className="flex items-center gap-2">
          <ManageAccounts color="primary" fontSize="large" />
          <Typography variant="h5" fontWeight="bold">
            User Management
          </Typography>
        </Box>

        <Button variant="contained" onClick={() => setAddOpen(true)}>
          + Add User
        </Button>
      </Box>

      {users.length === 0 ? (
        <Typography color="text.secondary" align="center">
          No users found.
        </Typography>
      ) : (
        <TableContainer
          component={Paper}
          elevation={3}
          sx={{ borderRadius: 3, overflow: "hidden" }}
        >
          <Table>
            <TableHead sx={{ bgcolor: "#d6c9c6" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>Name</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Email</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Role</TableCell>
                <TableCell sx={{ fontWeight: "bold" }} align="center">
                  Created At
                </TableCell>
                <TableCell sx={{ fontWeight: "bold" }} align="center">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {users.map((u) => (
                <TableRow
                  key={u.id}
                  hover
                  sx={{
                    "&:hover": { bgcolor: "rgba(25, 118, 210, 0.05)" },
                    bgcolor: "#eae1df",
                  }}
                >
                  <TableCell>{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={u.role}
                      color={getRoleColor(u.role)}
                      variant="filled"
                    />
                  </TableCell>
                  <TableCell align="center">
                    {u.created_at
                      ? new Date(u.created_at).toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Edit />}
                      onClick={() => {
                        setSelectedUser(u);
                        setNewRole(u.role);
                      }}
                    >
                      Change Role
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      color="error"
                      startIcon={<Delete />}
                      disabled={u.role === "admin"}
                      onClick={() => handleDeleteUser(u.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog për ndërrimin e rolit */}
      {selectedUser && (
        <Dialog open={!!selectedUser} onClose={() => setSelectedUser(null)}>
          <DialogTitle>Change Role</DialogTitle>
          <DialogContent dividers>
            <Typography mb={2}>
              Update role for <strong>{selectedUser.name}</strong> (
              {selectedUser.email})
            </Typography>
            <TextField
              select
              fullWidth
              label="Select new role"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
            >
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="worker">Worker</MenuItem>
              <MenuItem value="client">Client</MenuItem>
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedUser(null)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleRoleUpdate}
              color="primary"
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>
      )}
      <Dialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent dividers>
          <Box display="flex" flexDirection={"column"} gap={2}>
            <TextField
              label="Name"
              value={newUser.name}
              type="email"
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Email"
              value={newUser.email}
              onChange={(e) =>
                setNewUser({ ...newUser, email: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="Passord"
              type="password"
              value={newUser.password}
              onChange={(e) =>
                setNewUser({ ...newUser, password: e.target.value })
              }
              fullWidth
            />
            <TextField
              label="Role"
              value={newUser.role}
              select
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              fullWidth
            >
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="worker">Worker</MenuItem>
              <MenuItem value="client">Client</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}> Cancel</Button>
          <Button variant="contained" onClick={handleAddUser}>
            {" "}
            Create User
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
