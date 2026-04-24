import { Box, Button } from "@mui/material";
import { useTranslations } from "next-intl";

export default function ReservationTabs({ activeTab, onChange }) {
  const t = useTranslations("dashboard.reservations.tabs");
  const tabs = [
    { key: "all", label: t("all") },
    { key: "upcoming", label: t("upcoming") },
    { key: "today", label: t("today") },
    { key: "present", label: t("present") },
    { key: "past", label: t("past") },
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
