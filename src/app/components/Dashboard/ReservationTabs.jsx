import { Box, Button } from "@mui/material";

export default function ReservationTabs({ activeTab, onChange }) {
  return (
    <Box
      sx={{
        display: "flex",
        gap: 1.5,
        mb: 3,
        p: 1,
        backgroundColor: "#eae1df",
        borderRadius: 2,
      }}
    >
      <Button
        variant={activeTab === "all" ? "contained" : "outlined"}
        onClick={() => onChange("all")}
      >
        All
      </Button>
      <Button
        variant={activeTab === "upcoming" ? "contained" : "outlined"}
        onClick={() => onChange("upcoming")}
      >
        Upcoming
      </Button>
      <Button
        variant={activeTab === "today" ? "contained" : "outlined"}
        onClick={() => onChange("today")}
      >
        Today
      </Button>
      <Button
        variant={activeTab === "past" ? "contained" : "outlined"}
        onClick={() => onChange("past")}
      >
        Past
      </Button>
    </Box>
  );
}
