import { Avatar, Box, Chip, Paper, Typography } from "@mui/material";

function roleChipStyle(role) {
  if (role === "admin") {
    return { bgcolor: "rgba(127,29,29,0.14)", color: "#7f1d1d" };
  }
  return { bgcolor: "rgba(30,64,175,0.12)", color: "#1d4ed8" };
}

export default function StaffProfileHeader({ selected }) {
  if (!selected) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid #e2e8f0",
        borderRadius: 3,
        p: 2,
      }}
    >
      <Box display="flex" alignItems="center" gap={1.5}>
        <Avatar src={selected.avatar_url || undefined} sx={{ width: 56, height: 56 }}>
          {(selected.name || selected.email || "?").slice(0, 1).toUpperCase()}
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
          sx={{ fontWeight: 800, ...roleChipStyle(selected.role) }}
        />
      </Box>
    </Paper>
  );
}
