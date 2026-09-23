import { Box, Typography } from "@mui/material";

export default function PageHeader({ title, subtitle, actions }) {
  return (
    <Box
      className="admin-page-header"
      sx={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: 2,
        flexWrap: "wrap",
        mb: 1,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography
          component="h1"
          sx={{
            fontFamily: "var(--font-display, 'Instrument Serif', serif)",
            fontSize: { xs: 28, md: 36 },
            lineHeight: 1.1,
            fontWeight: 400,
            color: "var(--admin-text)",
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </Typography>
        {subtitle ? (
          <Typography sx={{ mt: 0.75, fontSize: 14, color: "var(--admin-muted)", maxWidth: 640 }}>
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      {actions ? <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>{actions}</Box> : null}
    </Box>
  );
}
