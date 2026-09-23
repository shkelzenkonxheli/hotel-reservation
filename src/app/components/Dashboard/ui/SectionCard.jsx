import { Box, Paper, Typography } from "@mui/material";

export default function SectionCard({ title, action, children }) {
  return (
    <Paper className="admin-card" elevation={0}>
      {title ? (
        <Box className="admin-card-header">
          <Typography
            sx={{
              fontFamily: "var(--font-display, 'Instrument Serif', serif)",
              fontSize: 21,
              fontWeight: 400,
              color: "var(--admin-text)",
            }}
          >
            {title}
          </Typography>
          {action ? <Box>{action}</Box> : null}
        </Box>
      ) : null}
      <Box className="admin-card-body">{children}</Box>
    </Paper>
  );
}
