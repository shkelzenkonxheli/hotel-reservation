import { Box, Paper, Typography } from "@mui/material";

export default function StatCard({ title, value, icon, tone = "#0ea5e9" }) {
  return (
    <Paper
      className="admin-card"
      elevation={0}
      sx={{
        height: "100%",
        transition: "transform 160ms ease, box-shadow 160ms ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 10px 20px rgba(15,23,42,0.08)",
        },
      }}
    >
      <Box
        className="admin-card-body"
        sx={{ display: "flex", gap: 2, minHeight: 98, alignItems: "center" }}
      >
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
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ letterSpacing: 0.3, textTransform: "uppercase", fontWeight: 700 }}
          >
            {title}
          </Typography>
          <Typography variant="h5" fontWeight={900} sx={{ lineHeight: 1.2, mt: 0.3 }}>
            {value}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}
