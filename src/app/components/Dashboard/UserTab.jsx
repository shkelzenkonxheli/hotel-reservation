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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  TextField,
  useMediaQuery,
} from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";
import PageHeader from "./ui/PageHeader";
import SectionCard from "./ui/SectionCard";
import StatusBadge from "./ui/StatusBadge";
import EmptyState from "./ui/EmptyState";

export default function UsersTab() {
  const isMobile = useMediaQuery("(max-width:900px)");
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

  const getRoleTone = (role) => {
    switch (role.toLowerCase()) {
      case "admin":
        return "danger";
      case "worker":
        return "warning";
      case "client":
        return "neutral";
      default:
        return "neutral";
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
          prev.map((u) => (u.id === updated.id ? updated : u)),
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
      "Are you sure you want to delete this user?",
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
    <Box className="admin-page">
      <PageHeader
        title="Users"
        subtitle="Manage staff and access levels."
        actions={
          <Button
            variant="contained"
            onClick={() => setAddOpen(true)}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            + Add User
          </Button>
        }
      />

      {users.length === 0 ? (
        <EmptyState
          title="No users found"
          subtitle="Create a user to get started."
        />
      ) : (
        <SectionCard title="Users">
          {isMobile ? (
            <Box display="grid" gap={1.5}>
              {users.map((u) => (
                <Paper
                  key={u.id}
                  elevation={0}
                  sx={{ p: 1.5, border: "1px solid #e2e8f0", borderRadius: 2 }}
                >
                  <Box display="flex" justifyContent="space-between" gap={1}>
                    <Typography fontWeight={700}>{u.name}</Typography>
                    <StatusBadge label={u.role} tone={getRoleTone(u.role)} />
                  </Box>
                  <Typography variant="body2" color="text.secondary" mt={0.4}>
                    {u.email}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    mt={0.6}
                    display="block"
                  >
                    Created:{" "}
                    {u.created_at
                      ? new Date(u.created_at).toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </Typography>
                  <Box display="flex" gap={1} mt={1.2}>
                    <Button
                      fullWidth
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
                      fullWidth
                      variant="outlined"
                      size="small"
                      color="error"
                      startIcon={<Delete />}
                      disabled={u.role === "admin"}
                      onClick={() => handleDeleteUser(u.id)}
                    >
                      Delete
                    </Button>
                  </Box>
                </Paper>
              ))}
            </Box>
          ) : (
            <TableContainer
              component={Paper}
              elevation={0}
              sx={{ overflowX: "auto" }}
            >
              <Table className="admin-table">
                <TableHead>
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
                    <TableRow key={u.id} hover>
                      <TableCell>{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <StatusBadge
                          label={u.role}
                          tone={getRoleTone(u.role)}
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
                        <Box
                          display="flex"
                          justifyContent="center"
                          gap={1}
                          flexWrap="wrap"
                        >
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
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </SectionCard>
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
