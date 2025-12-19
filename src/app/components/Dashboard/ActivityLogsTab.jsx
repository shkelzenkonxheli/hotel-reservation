import { useEffect, useState } from "react";
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
} from "@mui/material";
import HistoryIcon from "@mui/icons-material/History";
import { Delete } from "@mui/icons-material";
import { useMemo } from "react";

export default function activityLogTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [actionFilter, setActionFilter] = useState("all");
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
    if (!confirm(`Delete ${selectedIds.length} logs`)) return;

    const res = await fetch("/api/activity-log", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selectedIds }),
    });

    if (res.ok) {
      setSelectedIds([]);
      alert("Successfully deleted");
      fetchLogs();
    } else {
      alert("Failed to delete logs");
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
      log.action?.toLowerCase().includes(actionFilter.toLowerCase())
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
    <Box className="p-6">
      {/* HEADER */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
        }}
      >
        {/* LEFT SIDE */}
        <Box className="flex items-center gap-2">
          <HistoryIcon color="primary" fontSize="large" />
          <Typography variant="h5" fontWeight="bold">
            Activity Logs
          </Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Action</InputLabel>
          <Select
            label="Action"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="CREATE">Create</MenuItem>
            <MenuItem value="UPDATE">Update</MenuItem>
            <MenuItem value="DELETE">Delete</MenuItem>
            <MenuItem value="CLEAN">Clean</MenuItem>
          </Select>
        </FormControl>

        {/* RIGHT SIDE */}
        {selectedIds.length > 0 && (
          <Button
            color="error"
            variant="contained"
            onClick={handleBulkDelete}
            startIcon={<Delete />}
          >
            Delete ({selectedIds.length})
          </Button>
        )}
      </Box>

      {filteredLogs.length === 0 ? (
        <Typography color="text.secondary" align="center">
          No activity logs found.
        </Typography>
      ) : (
        <Paper elevation={3} sx={{ borderRadius: 3, overflow: "hidden" }}>
          <Table>
            <TableHead sx={{ bgcolor: "grey.100" }}>
              <TableRow>
                <TableCell padding="checkbox">
                  <Tooltip title="Select all">
                    <Checkbox
                      indeterminate={
                        selectedIds.length > 0 &&
                        selectedIds.length < logs.length
                      }
                      checked={
                        logs.length > 0 && selectedIds.length === logs.length
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
                <TableCell sx={{ fontWeight: "bold" }}>User</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Action</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Entity</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Description</TableCell>
                <TableCell sx={{ fontWeight: "bold" }} align="center">
                  Date
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow
                  key={log.id}
                  hover
                  sx={{
                    "&:hover": { bgcolor: "rgba(25, 118, 210, 0.05)" },
                  }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedIds.includes(log.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds((prev) => [...prev, log.id]);
                        } else {
                          setSelectedIds((prev) =>
                            prev.filter((id) => id !== log.id)
                          );
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight={600}>{log.performed_by}</Typography>
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={log.action}
                      color={getActionColor(log.action)}
                      size="small"
                    />
                  </TableCell>

                  <TableCell>
                    <Chip label={log.entity} variant="outlined" size="small" />
                  </TableCell>

                  <TableCell>
                    <Typography variant="body2">
                      {log.description || "—"}
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
    </Box>
  );
}
