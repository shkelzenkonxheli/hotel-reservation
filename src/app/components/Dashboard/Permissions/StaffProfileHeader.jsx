import { Avatar, Box, Chip, Typography } from "@mui/material";

function roleChipStyle(role) {
  if (role === "admin") {
    return { bgcolor: "rgba(127,29,29,0.14)", color: "#7f1d1d" };
  }
  return { bgcolor: "rgba(30,64,175,0.12)", color: "#1d4ed8" };
}

export default function StaffProfileHeader({ selected }) {
  if (!selected) return null;

  return (
    <Box
      sx={{
        pb: 2.25,
      }}
    >
      <Box textAlign="center">
        <Avatar
          src={selected.avatar_url || undefined}
          sx={{ width: 68, height: 68, mx: "auto", mb: 1.25 }}
        >
          {(selected.name || selected.email || "?").slice(0, 1).toUpperCase()}
        </Avatar>
        <Typography fontWeight={800} fontSize={16} lineHeight={1.15}>
          {selected.name || "No name"}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          fontSize={13}
          mt={0.4}
        >
          {selected.email}
        </Typography>
        <Chip
          label={selected.role}
          size="small"
          sx={{ mt: 1.25, fontWeight: 800, ...roleChipStyle(selected.role) }}
        />
      </Box>
    </Box>
  );
}
