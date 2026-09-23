import { Box, Typography } from "@mui/material";

export default function EmptyState({ title = "Nothing here", subtitle }) {
  return (
    <Box className="admin-empty">
      <Box sx={{ width: 44, height: 1, bgcolor: "var(--admin-border)", mx: "auto", mb: 2 }} />
      <Typography sx={{ fontFamily: "var(--font-display, serif)", fontSize: 22, color: "var(--admin-text)" }}>
        {title}
      </Typography>
      {subtitle ? (
        <Typography variant="body2" sx={{ color: "var(--admin-muted)", mt: 0.5 }}>
          {subtitle}
        </Typography>
      ) : null}
    </Box>
  );
}
