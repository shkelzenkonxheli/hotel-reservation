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
} from "@mui/material";
import HistoryIcon from "@mui/icons-material/History";

export default function activityLogTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const getActionColor = (action) => {
    if (!action) return "default";
    if (action.includes("CREATE")) return "success";
    if (action.includes("UPDATE")) return "warning";
    if (action.includes("DELETE")) return "error";
    return "default";
  };

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
      <Box className="flex items-center gap-2 mb-6">
        <HistoryIcon color="primary" fontSize="large" />
        <Typography variant="h5" fontWeight="bold">
          Activity Logs
        </Typography>
      </Box>

      {logs.length === 0 ? (
        <Typography color="text.secondary" align="center">
          No activity logs found.
        </Typography>
      ) : (
        <Paper elevation={3} sx={{ borderRadius: 3, overflow: "hidden" }}>
          <Table>
            <TableHead sx={{ bgcolor: "grey.100" }}>
              <TableRow>
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
              {logs.map((log) => (
                <TableRow
                  key={log.id}
                  hover
                  sx={{
                    "&:hover": { bgcolor: "rgba(25, 118, 210, 0.05)" },
                  }}
                >
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
