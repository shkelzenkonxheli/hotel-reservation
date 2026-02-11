import {
  Box,
  Checkbox,
  FormControlLabel,
  Grid,
  Paper,
  Typography,
} from "@mui/material";

const TAB_DESCRIPTIONS = {
  overview: "Access dashboard overview metrics",
  rooms: "View and manage room status",
  reservations: "Create and update reservations",
  users: "Manage staff users",
  manageRooms: "Edit room details and images",
  activityLogsTab: "View activity history",
  permissions: "Manage staff permissions",
};

export default function PermissionsGrid({ tabs, selectedTabs, onToggle }) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid #e2e8f0",
        borderRadius: 3,
        p: 2,
      }}
    >
      <Typography fontWeight={800} mb={1.5}>
        Access Permissions
      </Typography>
      <Grid container spacing={1.2}>
        {tabs.map((t) => (
          <Grid item xs={12} md={6} key={t.key}>
            <Box
              sx={{
                border: "1px solid #e2e8f0",
                borderRadius: 2,
                px: 1.2,
                py: 0.8,
                transition: "all 140ms ease",
                "&:hover": { borderColor: "#94a3b8", bgcolor: "#f8fafc" },
              }}
            >
              <FormControlLabel
                sx={{ m: 0, width: "100%", alignItems: "flex-start" }}
                control={
                  <Checkbox
                    checked={selectedTabs.includes(t.key)}
                    onChange={() => onToggle(t.key)}
                    sx={{
                      mt: 0.1,
                      "&.Mui-checked": { color: "#0284c7" },
                    }}
                  />
                }
                label={
                  <Box>
                    <Typography fontWeight={700} fontSize={14}>
                      {t.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {TAB_DESCRIPTIONS[t.key] || "Access this section"}
                    </Typography>
                  </Box>
                }
              />
            </Box>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
}
