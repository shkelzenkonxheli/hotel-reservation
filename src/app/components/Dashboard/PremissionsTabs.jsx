"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  List,
  ListItemButton,
  ListItemText,
  Divider,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Button,
  TextField,
  Chip,
  Avatar,
  Stack,
  Skeleton,
  Alert,
} from "@mui/material";
import { DASHBOARD_TABS } from "@/lib/dashboardTabs";
import PageHeader from "./ui/PageHeader";

export default function PermissionsTab() {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);

  const [saving, setSaving] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  // për me dit a ka ndryshime para Save
  const [initialTabs, setInitialTabs] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        setLoadingUsers(true);
        setError("");

        // ✅ kujdes: /api/users jo /api/user
        const res = await fetch("/api/user?roles=admin,worker");
        const data = await res.json();

        if (!res.ok) throw new Error(data?.error || "Failed to load users");
        setUsers(Array.isArray(data) ? data : []);
      } catch (e) {
        setError(e.message || "Failed to load users");
      } finally {
        setLoadingUsers(false);
      }
    })();
  }, []);

  const selectedTabs = selected?.allowed_tabs || [];

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const name = (u.name || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      const role = (u.role || "").toLowerCase();
      return name.includes(q) || email.includes(q) || role.includes(q);
    });
  }, [users, search]);

  const pickUser = (u) => {
    setSelected(u);
    const tabs = Array.isArray(u.allowed_tabs) ? u.allowed_tabs : [];
    setInitialTabs(tabs);
  };

  const toggleTab = (tabKey) => {
    if (!selected) return;

    const has = selectedTabs.includes(tabKey);
    const next = has
      ? selectedTabs.filter((t) => t !== tabKey)
      : [...selectedTabs, tabKey];

    setSelected({ ...selected, allowed_tabs: next });
  };

  const hasChanges = useMemo(() => {
    const a = [...new Set(initialTabs)].sort();
    const b = [...new Set(selectedTabs)].sort();
    return JSON.stringify(a) !== JSON.stringify(b);
  }, [initialTabs, selectedTabs]);

  const save = async () => {
    if (!selected) return;

    setSaving(true);
    setError("");

    try {
      // ✅ kujdes: /api/users jo /api/user
      const res = await fetch(`/api/user/${selected.id}/allowed-tabs`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allowed_tabs: selectedTabs }),
      });

      const updated = await res.json();
      if (!res.ok) throw new Error(updated?.error || "Failed to save");

      // update list
      setUsers((prev) =>
        prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)),
      );

      // update selected + initial
      const mergedSelected = { ...selected, ...updated };
      setSelected(mergedSelected);
      setInitialTabs(updated.allowed_tabs || []);
    } catch (e) {
      setError(e.message || "Failed to save permissions");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box className="admin-page">
      <PageHeader
        title="Permissions"
        subtitle="Manage dashboard access for staff."
        actions={
          <Chip
            label={`${users.length} staff`}
            sx={{ bgcolor: "rgba(212,163,115,0.25)", fontWeight: 700 }}
          />
        }
      />

      {error && (
        <Box mt={2}>
          <Alert severity="error">{error}</Alert>
        </Box>
      )}

      <Box
        display="grid"
        gridTemplateColumns={{ xs: "1fr", md: "360px 1fr" }}
        gap={2}
      >
        {/* LEFT: staff list */}
        <Paper
          sx={{
            p: 1.5,
            borderRadius: 3,
            boxShadow: 1,
          }}
        >
          <Box px={1} pb={1}>
            <Typography fontWeight={800}>Staff</Typography>
            <Typography variant="caption" color="text.secondary">
              Select a user to edit permissions
            </Typography>

            <TextField
              size="small"
              placeholder="Search by name, email, role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              fullWidth
              sx={{ mt: 1.2 }}
            />
          </Box>

          <Divider />

          <List dense sx={{ maxHeight: 420, overflow: "auto" }}>
            {loadingUsers ? (
              <Box p={1}>
                {[...Array(6)].map((_, i) => (
                  <Box key={i} py={1}>
                    <Skeleton
                      variant="rectangular"
                      height={38}
                      sx={{ borderRadius: 2 }}
                    />
                  </Box>
                ))}
              </Box>
            ) : filteredUsers.length === 0 ? (
              <Box p={2}>
                <Typography variant="body2" color="text.secondary">
                  No staff found.
                </Typography>
              </Box>
            ) : (
              filteredUsers.map((u) => (
                <ListItemButton
                  key={u.id}
                  selected={selected?.id === u.id}
                  onClick={() => pickUser(u)}
                  sx={{
                    borderRadius: 2,
                    mx: 1,
                    my: 0.5,
                    "&.Mui-selected": {
                      bgcolor: "rgba(54,73,88,0.12)",
                    },
                  }}
                >
                  <Avatar sx={{ width: 30, height: 30, mr: 1.2 }}>
                    {(u.name || u.email || "?").slice(0, 1).toUpperCase()}
                  </Avatar>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography fontWeight={750} fontSize={14}>
                          {u.name || u.email}
                        </Typography>
                        <Chip
                          size="small"
                          label={u.role}
                          sx={{
                            height: 20,
                            fontSize: 11,
                            fontWeight: 700,
                            bgcolor:
                              u.role === "admin"
                                ? "rgba(59,130,246,0.18)"
                                : "rgba(34,197,94,0.16)",
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {u.email}
                      </Typography>
                    }
                  />
                </ListItemButton>
              ))
            )}
          </List>
        </Paper>

        {/* RIGHT: permissions panel */}
        <Paper
          sx={{
            p: 2.2,
            borderRadius: 3,
            boxShadow: 1,
          }}
        >
          {!selected ? (
            <Box
              sx={{
                height: "100%",
                minHeight: 260,
                display: "grid",
                placeItems: "center",
              }}
            >
              <Box textAlign="center">
                <Typography fontWeight={800}>No user selected</Typography>
                <Typography variant="body2" color="text.secondary" mt={0.5}>
                  Pick a staff member from the left to edit allowed tabs.
                </Typography>
              </Box>
            </Box>
          ) : (
            <>
              {/* Selected user header */}
              <Box
                sx={{
                  p: 2,
                  borderRadius: 3,
                  bgcolor: "rgba(234,225,223,0.65)",
                  border: "1px solid rgba(0,0,0,0.06)",
                }}
              >
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Avatar sx={{ width: 44, height: 44 }}>
                    {(selected.name || selected.email || "?")
                      .slice(0, 1)
                      .toUpperCase()}
                  </Avatar>

                  <Box flex={1}>
                    <Typography fontWeight={900} lineHeight={1.1}>
                      {selected.name || "No name"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selected.email}
                    </Typography>
                  </Box>

                  <Chip
                    label={selected.role}
                    sx={{
                      fontWeight: 800,
                      bgcolor:
                        selected.role === "admin"
                          ? "rgba(59,130,246,0.18)"
                          : "rgba(34,197,94,0.16)",
                    }}
                  />
                </Box>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  mt={1}
                  display="block"
                >
                  Select which tabs this user can access.
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Tabs grid */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 0.5,
                }}
              >
                <FormGroup>
                  {DASHBOARD_TABS.map((t) => (
                    <FormControlLabel
                      key={t.key}
                      sx={{
                        m: 0,
                        px: 1,
                        py: 0.6,
                        borderRadius: 2,
                        "&:hover": { bgcolor: "rgba(0,0,0,0.04)" },
                      }}
                      control={
                        <Checkbox
                          checked={selectedTabs.includes(t.key)}
                          onChange={() => toggleTab(t.key)}
                        />
                      }
                      label={
                        <Typography fontWeight={650} fontSize={14}>
                          {t.label}
                        </Typography>
                      }
                    />
                  ))}
                </FormGroup>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Actions */}
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                gap={2}
              >
                <Typography variant="caption" color="text.secondary">
                  Selected: {selectedTabs.length} tab(s)
                </Typography>

                <Button
                  variant="contained"
                  onClick={save}
                  disabled={saving || !hasChanges}
                  sx={{ borderRadius: 2, fontWeight: 800 }}
                >
                  {saving ? "Saving..." : hasChanges ? "Save Changes" : "Saved"}
                </Button>
              </Box>
            </>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
