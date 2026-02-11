import {
  Avatar,
  Box,
  Chip,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Skeleton,
  TextField,
  Typography,
} from "@mui/material";

function roleChipStyle(role) {
  if (role === "admin") {
    return { bgcolor: "rgba(127,29,29,0.14)", color: "#7f1d1d" };
  }
  return { bgcolor: "rgba(30,64,175,0.12)", color: "#1d4ed8" };
}

export default function StaffList({
  loadingUsers,
  filteredUsers,
  selectedId,
  search,
  onSearchChange,
  onPickUser,
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid #e2e8f0",
        borderRadius: 3,
        overflow: "hidden",
      }}
    >
      <Box px={2} py={1.5} borderBottom="1px solid #edf2f7">
        <Typography fontWeight={800}>Staff</Typography>
        <Typography variant="caption" color="text.secondary">
          Select a member to manage access and employment details
        </Typography>
        <TextField
          size="small"
          fullWidth
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search staff"
          sx={{ mt: 1.2 }}
        />
      </Box>

      <List
        dense
        sx={{
          maxHeight: { xs: 280, md: 620 },
          overflowY: "auto",
          p: 1,
          "&::-webkit-scrollbar": { width: 8 },
          "&::-webkit-scrollbar-thumb": {
            borderRadius: 8,
            backgroundColor: "rgba(148,163,184,0.45)",
          },
        }}
      >
        {loadingUsers ? (
          <Box p={1}>
            {[...Array(6)].map((_, i) => (
              <Skeleton
                key={i}
                variant="rectangular"
                height={44}
                sx={{ borderRadius: 2, mb: 1 }}
              />
            ))}
          </Box>
        ) : filteredUsers.length === 0 ? (
          <Box px={2} py={3}>
            <Typography variant="body2" color="text.secondary">
              No staff found.
            </Typography>
          </Box>
        ) : (
          filteredUsers.map((u) => (
            <ListItemButton
              key={u.id}
              selected={selectedId === u.id}
              onClick={() => onPickUser(u)}
              sx={{
                borderRadius: 2,
                mb: 0.6,
                border: "1px solid transparent",
                transition: "all 160ms ease",
                "&.Mui-selected": {
                  bgcolor: "rgba(14,165,233,0.10)",
                  borderColor: "rgba(14,165,233,0.35)",
                },
                "&:hover": { bgcolor: "rgba(15,23,42,0.04)" },
              }}
            >
              <Avatar
                src={u.avatar_url || undefined}
                sx={{ width: 30, height: 30, mr: 1.1 }}
              >
                {(u.name || u.email || "?").slice(0, 1).toUpperCase()}
              </Avatar>
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography fontWeight={700} fontSize={14}>
                      {u.name || u.email}
                    </Typography>
                    <Chip
                      size="small"
                      label={u.role}
                      sx={{
                        height: 20,
                        fontSize: 11,
                        fontWeight: 700,
                        ...roleChipStyle(u.role),
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
  );
}
