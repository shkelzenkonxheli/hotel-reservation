import { Box, Button } from "@mui/material";

export default function ReservationTabs({ activeTab, onChange }) {
  const tabs = [
    { key: "all", label: "All" },
    { key: "upcoming", label: "Upcoming" },
    { key: "today", label: "Today" },
    { key: "present", label: "Present" },
    { key: "past", label: "Past" },
  ];

  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 1.5,
        mb: 3,
        p: 1,
      }}
    >
      {tabs.map((tab) => (
        <Button
          key={tab.key}
          variant={activeTab === tab.key ? "contained" : "outlined"}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </Button>
      ))}
    </Box>
  );
}
