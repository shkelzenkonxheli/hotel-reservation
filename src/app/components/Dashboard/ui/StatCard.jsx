import { Box, Paper, Typography } from "@mui/material";

export default function StatCard({ title, value, icon, tone = "#14524f" }) {
  return (
    <Paper
      className="admin-card admin-stat"
      elevation={0}
      sx={{
        height: "100%",
        position: "relative",
        overflow: "hidden",
        transition: "transform 180ms ease, box-shadow 180ms ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "var(--admin-shadow-md)",
        },
      }}
    >
      <Box className="admin-card-body" sx={{ display: "flex", flexDirection: "column", gap: 2, minHeight: 124, p: 2.75 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
          <Typography
            sx={{
              fontSize: 11.5,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              fontWeight: 600,
              color: "var(--admin-muted)",
            }}
          >
            {title}
          </Typography>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: "8px",
              display: "grid",
              placeItems: "center",
              background: `${tone}14`,
              color: tone,
              "& .MuiSvgIcon-root": { fontSize: 20 },
            }}
          >
            {icon}
          </Box>
        </Box>
        <Typography
          sx={{
            fontFamily: "var(--font-display, 'Instrument Serif', serif)",
            fontSize: 34,
            lineHeight: 1,
            color: "var(--admin-text)",
          }}
        >
          {value}
        </Typography>
      </Box>
    </Paper>
  );
}
