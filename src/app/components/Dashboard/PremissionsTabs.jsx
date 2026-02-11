"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  Paper,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import { DASHBOARD_TABS } from "@/lib/dashboardTabs";
import PageHeader from "./ui/PageHeader";
import StaffList from "./Permissions/StaffList";
import StaffProfileHeader from "./Permissions/StaffProfileHeader";
import EmploymentForm from "./Permissions/EmploymentForm";
import PermissionsGrid from "./Permissions/PermissionsGrid";

export default function PermissionsTab() {
  const toDateInput = (value) => {
    if (!value) return "";
    if (typeof value === "string") return value.slice(0, 10);
    return new Date(value).toISOString().slice(0, 10);
  };

  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [mobileStaffOpen, setMobileStaffOpen] = useState(true);
  const [showPermissions, setShowPermissions] = useState(false);

  const [initialTabs, setInitialTabs] = useState([]);
  const [initialProfile, setInitialProfile] = useState({
    staff_position: "",
    employment_start_date: "",
    employment_status: "active",
    salary_type: "monthly",
    base_salary: "",
  });

  useEffect(() => {
    (async () => {
      try {
        setLoadingUsers(true);
        setError("");

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
    setMobileStaffOpen(false);
    const tabs = Array.isArray(u.allowed_tabs) ? u.allowed_tabs : [];
    setInitialTabs(tabs);
    setInitialProfile({
      staff_position: u.staff_position || "",
      employment_start_date: toDateInput(u.employment_start_date),
      employment_status: u.employment_status || "active",
      salary_type: u.salary_type || "monthly",
      base_salary:
        u.base_salary !== null && u.base_salary !== undefined
          ? String(u.base_salary)
          : "",
    });
  };

  const toggleTab = (tabKey) => {
    if (!selected) return;
    const has = selectedTabs.includes(tabKey);
    const next = has
      ? selectedTabs.filter((t) => t !== tabKey)
      : [...selectedTabs, tabKey];
    setSelected({ ...selected, allowed_tabs: next });
  };

  const updateSelectedField = (field, value) => {
    if (!selected) return;
    setSelected({ ...selected, [field]: value });
  };

  const selectedProfile = useMemo(
    () => ({
      staff_position: selected?.staff_position || "",
      employment_start_date: toDateInput(selected?.employment_start_date),
      employment_status: selected?.employment_status || "active",
      salary_type: selected?.salary_type || "monthly",
      base_salary:
        selected?.base_salary !== null && selected?.base_salary !== undefined
          ? String(selected.base_salary)
          : "",
    }),
    [selected],
  );

  const hasChanges = useMemo(() => {
    const a = [...new Set(initialTabs)].sort();
    const b = [...new Set(selectedTabs)].sort();
    if (JSON.stringify(a) !== JSON.stringify(b)) return true;
    return (
      initialProfile.staff_position !== selectedProfile.staff_position ||
      initialProfile.employment_start_date !==
        selectedProfile.employment_start_date ||
      initialProfile.employment_status !== selectedProfile.employment_status ||
      initialProfile.salary_type !== selectedProfile.salary_type ||
      initialProfile.base_salary !== selectedProfile.base_salary
    );
  }, [initialTabs, selectedTabs, initialProfile, selectedProfile]);

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/user/${selected.id}/allowed-tabs`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allowed_tabs: selectedTabs,
          staff_position: selected.staff_position || "",
          employment_start_date: toDateInput(selected.employment_start_date) || null,
          employment_status: selected.employment_status || "active",
          salary_type: selected.salary_type || "monthly",
          base_salary:
            selected.base_salary === "" || selected.base_salary === null
              ? null
              : selected.base_salary,
        }),
      });

      const updated = await res.json();
      if (!res.ok) throw new Error(updated?.error || "Failed to save");

      setUsers((prev) =>
        prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)),
      );

      const mergedSelected = { ...selected, ...updated };
      setSelected(mergedSelected);
      setInitialTabs(updated.allowed_tabs || []);
      setInitialProfile({
        staff_position: updated.staff_position || "",
        employment_start_date: toDateInput(updated.employment_start_date),
        employment_status: updated.employment_status || "active",
        salary_type: updated.salary_type || "monthly",
        base_salary:
          updated.base_salary !== null && updated.base_salary !== undefined
            ? String(updated.base_salary)
            : "",
      });
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
        subtitle="Manage staff access and employment profile in one place."
        actions={
          <Chip
            label={`${users.length} staff`}
            sx={{ bgcolor: "rgba(14,165,233,0.14)", fontWeight: 700 }}
          />
        }
      />

      {error ? (
        <Box mt={1}>
          <Alert severity="error">{error}</Alert>
        </Box>
      ) : null}

      <Box display={{ xs: "block", md: "none" }} mb={2}>
        <Accordion
          expanded={mobileStaffOpen}
          onChange={(_, expanded) => setMobileStaffOpen(expanded)}
          elevation={0}
          sx={{ border: "1px solid #e2e8f0", borderRadius: 3 }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography fontWeight={800}>Staff</Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            <StaffList
              loadingUsers={loadingUsers}
              filteredUsers={filteredUsers}
              selectedId={selected?.id || null}
              search={search}
              onSearchChange={setSearch}
              onPickUser={pickUser}
            />
          </AccordionDetails>
        </Accordion>
      </Box>

      <Box
        display="grid"
        gridTemplateColumns={{ xs: "1fr", md: "320px minmax(0,1fr)" }}
        gap={{ xs: 2, md: 3 }}
      >
        <Box display={{ xs: "none", md: "block" }}>
          <StaffList
            loadingUsers={loadingUsers}
            filteredUsers={filteredUsers}
            selectedId={selected?.id || null}
            search={search}
            onSearchChange={setSearch}
            onPickUser={pickUser}
          />
        </Box>

        <Box display="grid" gap={2.4}>
          {!selected ? (
            <Paper
              elevation={0}
              sx={{
                border: "1px solid #e2e8f0",
                borderRadius: 3,
                minHeight: 320,
                display: "grid",
                placeItems: "center",
                p: 3,
              }}
            >
              <Box textAlign="center">
                <Typography fontWeight={800}>No user selected</Typography>
                <Typography variant="body2" color="text.secondary" mt={0.5}>
                  Select a staff member to edit employment details and access
                  permissions.
                </Typography>
              </Box>
            </Paper>
          ) : (
            <>
              <StaffProfileHeader selected={selected} />
              <EmploymentForm
                selected={selected}
                toDateInput={toDateInput}
                updateSelectedField={updateSelectedField}
              />
              <Paper
                elevation={0}
                sx={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 3,
                  p: 1.4,
                }}
              >
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  gap={1}
                >
                  <Typography fontWeight={800}>Access Permissions</Typography>
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => setShowPermissions((prev) => !prev)}
                    startIcon={
                      showPermissions ? (
                        <KeyboardArrowDownIcon />
                      ) : (
                        <KeyboardArrowRightIcon />
                      )
                    }
                    sx={{ textTransform: "none", fontWeight: 700 }}
                  >
                    {showPermissions ? "Hide" : "Show"}
                  </Button>
                </Box>
                <Collapse in={showPermissions}>
                  <Box mt={1.2}>
                    <PermissionsGrid
                      tabs={DASHBOARD_TABS}
                      selectedTabs={selectedTabs}
                      onToggle={toggleTab}
                    />
                  </Box>
                </Collapse>
              </Paper>
              <Paper
                elevation={0}
                sx={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 3,
                  p: 1.6,
                  position: { md: "sticky" },
                  bottom: { md: 16 },
                  zIndex: 2,
                  bgcolor: "white",
                }}
              >
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  gap={2}
                >
                  <Typography variant="caption" color="text.secondary">
                    Selected: {selectedTabs.length} permission(s)
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={save}
                    disabled={saving || !hasChanges}
                    sx={{ borderRadius: 2, fontWeight: 800, minWidth: 140 }}
                  >
                    {saving ? "Saving..." : hasChanges ? "Save Changes" : "Saved"}
                  </Button>
                </Box>
              </Paper>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}
