import { Box, Paper, Typography } from "@mui/material";

export default function StatCard({ title, value, icon, tone = "#0ea5e9" }) {
  return (
    <Paper className="admin-card" elevation={0}>
      <Box className="admin-card-body" sx={{ display: "flex", gap: 2 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            display: "grid",
            placeItems: "center",
            background: `${tone}22`,
            color: tone,
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
          <Typography variant="h6" fontWeight={800}>
            {value}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}
