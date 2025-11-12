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
import { ManageAccounts, Edit } from "@mui/icons-material";

export default function UsersTab() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newRole, setNewRole] = useState("");

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

  if (loading)
    return (
      <Box className="flex justify-center items-center h-64">
        <CircularProgress />
      </Box>
    );

  return (
    <Box className="p-6">
      <Box className="flex items-center gap-2 mb-6">
        <ManageAccounts color="primary" fontSize="large" />
        <Typography variant="h5" fontWeight="bold">
          User Management
        </Typography>
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
            <TableHead sx={{ bgcolor: "grey.100" }}>
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
    </Box>
  );
}
