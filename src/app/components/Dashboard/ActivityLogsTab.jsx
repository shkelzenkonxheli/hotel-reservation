import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Box,
  Typography,
  CircularProgress,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Chip,
  Checkbox,
  Button,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useMediaQuery,
  Snackbar,
  Alert,
} from "@mui/material";
import { Delete } from "@mui/icons-material";
import { useMemo } from "react";
import PageHeader from "./ui/PageHeader";
import SectionCard from "./ui/SectionCard";
import StatusBadge from "./ui/StatusBadge";
import EmptyState from "./ui/EmptyState";

export default function activityLogTab() {
  const t = useTranslations("dashboard.activityLogs");
  const isMobile = useMediaQuery("(max-width:900px)");
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [actionFilter, setActionFilter] = useState("all");
  const [feedback, setFeedback] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const notify = (message, severity = "success") =>
    setFeedback({ open: true, message, severity });
  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    try {
      const res = await fetch("/api/activity-log");
      const data = await res.json();
      if (res.ok) {
        setLogs(data);
      } else {
        console.error("Failed to fetch logs");
      }
    } catch (err) {
      console.error("Network error:", err);
    } finally {
      setLoading(false);
    }
  }
  async function handleBulkDelete() {
    if (!confirm(t("messages.confirmDelete", { count: selectedIds.length }))) return;

    const res = await fetch("/api/activity-log", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selectedIds }),
    });

    if (res.ok) {
      setSelectedIds([]);
      notify(t("messages.deleted"));
      fetchLogs();
    } else {
      notify(t("messages.deleteFailed"), "error");
    }
  }

  const getActionColor = (action) => {
    if (!action) return "default";
    if (action.includes("CREATE")) return "success";
    if (action.includes("CLEAN")) return "success";
    if (action.includes("UPDATE")) return "warning";
    if (action.includes("DELETE")) return "error";
    return "default";
  };

  const filteredLogs = useMemo(() => {
    if (actionFilter === "all") return logs;

    return logs.filter((log) =>
      log.action?.toLowerCase().includes(actionFilter.toLowerCase()),
    );
  }, [logs, actionFilter]);
  if (loading) {
    return (
      <Box className="flex justify-center items-center h-64">
        <CircularProgress />
      </Box>
    );
  }
  return (
    <Box className="admin-page">
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle")}
        actions={
          <Box
            display="flex"
            gap={1.2}
            alignItems="center"
            flexWrap="wrap"
            justifyContent="flex-end"
          >
            <FormControl
              size="small"
              sx={{ minWidth: { xs: "100%", sm: 180 } }}
            >
              <InputLabel>{t("filters.action")}</InputLabel>
              <Select
                label={t("filters.action")}
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
              >
                <MenuItem value="all">{t("filters.all")}</MenuItem>
                <MenuItem value="CREATE">{t("filters.create")}</MenuItem>
                <MenuItem value="UPDATE">{t("filters.update")}</MenuItem>
                <MenuItem value="DELETE">{t("filters.delete")}</MenuItem>
                <MenuItem value="CLEAN">{t("filters.clean")}</MenuItem>
              </Select>
            </FormControl>
            {selectedIds.length > 0 && (
              <Button
                color="error"
                variant="contained"
                onClick={handleBulkDelete}
                startIcon={<Delete />}
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                {t("deleteSelected", { count: selectedIds.length })}
              </Button>
            )}
          </Box>
        }
      />

      {filteredLogs.length === 0 ? (
        <EmptyState title={t("empty")} />
      ) : (
        <SectionCard>
          {isMobile ? (
            <Box display="grid" gap={1.5}>
              {filteredLogs.map((log) => (
                <Paper
                  key={log.id}
                  elevation={0}
                  sx={{ p: 1.5, border: "1px solid #e2e8f0", borderRadius: 2 }}
                >
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    gap={1}
                  >
                    <Typography fontWeight={700}>{log.performed_by}</Typography>
                    <Checkbox
                      size="small"
                      checked={selectedIds.includes(log.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds((prev) => [...prev, log.id]);
                        } else {
                          setSelectedIds((prev) =>
                            prev.filter((id) => id !== log.id),
                          );
                        }
                      }}
                    />
                  </Box>
                  <Box display="flex" gap={1} flexWrap="wrap" mt={0.5}>
                    <StatusBadge
                      label={log.action}
                      tone={
                        getActionColor(log.action) === "success"
                          ? "success"
                          : getActionColor(log.action) === "warning"
                            ? "warning"
                            : getActionColor(log.action) === "error"
                              ? "danger"
                              : "neutral"
                      }
                    />
                    <StatusBadge label={log.entity} tone="neutral" />
                  </Box>
                  <Typography variant="body2" color="text.secondary" mt={0.8}>
                    {log.description || t("table.emptyDescription")}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    mt={0.8}
                    display="block"
                  >
                    {new Date(log.created_at).toLocaleString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Typography>
                </Paper>
              ))}
            </Box>
          ) : (
            <Paper elevation={0} sx={{ overflowX: "auto" }}>
              <Table className="admin-table">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Tooltip title={t("table.selectAll")}>
                        <Checkbox
                          indeterminate={
                            selectedIds.length > 0 &&
                            selectedIds.length < logs.length
                          }
                          checked={
                            logs.length > 0 &&
                            selectedIds.length === logs.length
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds(filteredLogs.map((l) => l.id));
                            } else {
                              setSelectedIds([]);
                            }
                          }}
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      {t("table.user")}
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      {t("table.action")}
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      {t("table.entity")}
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>
                      {t("table.description")}
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }} align="center">
                      {t("table.date")}
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedIds.includes(log.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds((prev) => [...prev, log.id]);
                            } else {
                              setSelectedIds((prev) =>
                                prev.filter((id) => id !== log.id),
                              );
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight={600}>
                          {log.performed_by}
                        </Typography>
                      </TableCell>

                      <TableCell>
                        <StatusBadge
                          label={log.action}
                          tone={
                            getActionColor(log.action) === "success"
                              ? "success"
                              : getActionColor(log.action) === "warning"
                                ? "warning"
                                : getActionColor(log.action) === "error"
                                  ? "danger"
                                  : "neutral"
                          }
                        />
                      </TableCell>

                      <TableCell>
                        <StatusBadge label={log.entity} tone="neutral" />
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2">
                          {log.description || t("table.emptyDescription")}
                        </Typography>
                      </TableCell>

                      <TableCell align="center">
                        {new Date(log.created_at).toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          )}
        </SectionCard>
      )}
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

