"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
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
  Snackbar,
  Alert,
} from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";
import PageHeader from "./ui/PageHeader";
import SectionCard from "./ui/SectionCard";
import StatusBadge from "./ui/StatusBadge";
import EmptyState from "./ui/EmptyState";

export default function UsersTab() {
  const t = useTranslations("dashboard.users");
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
  const [feedback, setFeedback] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const notify = (message, severity = "success") => {
    setFeedback({ open: true, message, severity });
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await fetch("/api/user");
      const data = await res.json();
      if (res.ok) setUsers(data);
      else notify(data?.error || t("messages.loadFailed"), "error");
    } catch (error) {
      console.error("Network error:", error);
      notify(t("messages.loadNetworkError"), "error");
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

  const getRoleLabel = (role) => {
    const normalized = String(role || "").toLowerCase();
    return t.has(`roles.${normalized}`) ? t(`roles.${normalized}`) : role;
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
        notify(t("messages.roleUpdated"));
      } else {
        notify(t("messages.roleUpdateFailed"), "error");
      }
    } catch (err) {
      console.error(err);
      notify(t("messages.roleUpdateNetworkError"), "error");
    }
  }
  async function handleAddUser() {
    const { name, email, password } = newUser;

    if (!name || !email || !password) {
      notify(t("messages.requiredFields"), "warning");
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
        notify(t("messages.created"));
      } else {
        const data = await res.json();
        notify(data.error || t("messages.createFailed"), "error");
      }
    } catch (err) {
      console.log(err);
      notify(t("messages.createNetworkError"), "error");
    }
  }
  async function handleDeleteUser(userId) {
    const confirm = window.confirm(t("messages.confirmDelete"));
    if (!confirm) return;

    try {
      const res = await fetch("/api/user", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();

      if (!res.ok) {
        notify(data.error || t("messages.deleteFailed"), "error");
        return;
      }

      fetchUsers();
      notify(t("messages.deleted"));
    } catch (err) {
      console.error(err);
      notify(t("messages.deleteNetworkError"), "error");
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
        title={t("title")}
        subtitle={t("subtitle")}
        actions={
          <Button
            variant="contained"
            onClick={() => setAddOpen(true)}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            {t("actions.addUser")}
          </Button>
        }
      />

      {users.length === 0 ? (
        <EmptyState
          title={t("empty.title")}
          subtitle={t("empty.subtitle")}
        />
      ) : (
        <SectionCard>
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
                    <StatusBadge
                      label={getRoleLabel(u.role)}
                      tone={getRoleTone(u.role)}
                    />
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
                    {t("fields.createdAt")}:{" "}
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
                      {t("actions.changeRole")}
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
                      {t("actions.delete")}
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
                    <TableCell sx={{ fontWeight: "bold" }}>
                      {t("fields.name")}
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      {t("fields.email")}
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      {t("fields.role")}
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }} align="center">
                      {t("fields.createdAt")}
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        width: 250,
                        whiteSpace: "nowrap",
                      }}
                      align="right"
                    >
                      {t("fields.actions")}
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
                          label={getRoleLabel(u.role)}
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
                      <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                        <Box
                          display="flex"
                          justifyContent="flex-end"
                          gap={1}
                          flexWrap="nowrap"
                        >
                          <Button
                            variant="outlined"
                            size="small"
                            startIcon={<Edit />}
                            onClick={() => {
                              setSelectedUser(u);
                              setNewRole(u.role);
                            }}
                            sx={{ minWidth: 132 }}
                          >
                            {t("actions.changeRole")}
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            color="error"
                            startIcon={<Delete />}
                            disabled={u.role === "admin"}
                            onClick={() => handleDeleteUser(u.id)}
                            sx={{ minWidth: 100 }}
                          >
                            {t("actions.delete")}
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
          <DialogTitle>{t("roleDialog.title")}</DialogTitle>
          <DialogContent dividers>
            <Typography mb={2}>
              {t("roleDialog.description")} <strong>{selectedUser.name}</strong> (
              {selectedUser.email})
            </Typography>
            <TextField
              select
              fullWidth
              label={t("roleDialog.select")}
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
            >
              <MenuItem value="admin">{t("roles.admin")}</MenuItem>
              <MenuItem value="worker">{t("roles.worker")}</MenuItem>
              <MenuItem value="client">{t("roles.client")}</MenuItem>
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSelectedUser(null)}>
              {t("actions.cancel")}
            </Button>
            <Button
              variant="contained"
              onClick={handleRoleUpdate}
              color="primary"
            >
              {t("actions.save")}
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
        <DialogTitle>{t("addDialog.title")}</DialogTitle>
        <DialogContent dividers>
          <Box display="flex" flexDirection={"column"} gap={2}>
            <TextField
              label={t("fields.name")}
              value={newUser.name}
              type="email"
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              fullWidth
            />
            <TextField
              label={t("fields.email")}
              value={newUser.email}
              onChange={(e) =>
                setNewUser({ ...newUser, email: e.target.value })
              }
              fullWidth
            />
            <TextField
              label={t("fields.password")}
              type="password"
              value={newUser.password}
              onChange={(e) =>
                setNewUser({ ...newUser, password: e.target.value })
              }
              fullWidth
            />
            <TextField
              label={t("fields.role")}
              value={newUser.role}
              select
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              fullWidth
            >
              <MenuItem value="admin">{t("roles.admin")}</MenuItem>
              <MenuItem value="worker">{t("roles.worker")}</MenuItem>
              <MenuItem value="client">{t("roles.client")}</MenuItem>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddOpen(false)}>{t("actions.cancel")}</Button>
          <Button variant="contained" onClick={handleAddUser}>
            {t("actions.create")}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={feedback.open}
        autoHideDuration={3500}
        onClose={() => setFeedback((f) => ({ ...f, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          severity={feedback.severity}
          variant="filled"
          onClose={() => setFeedback((f) => ({ ...f, open: false }))}
        >
          {feedback.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
