import { Box, Typography } from "@mui/material";

export default function EmptyState({ title = "Nothing here", subtitle }) {
  return (
    <Box className="admin-empty">
      <Typography fontWeight={700}>{title}</Typography>
      {subtitle ? (
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          {subtitle}
        </Typography>
      ) : null}
    </Box>
  );
}
