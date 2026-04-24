import {
  Box,
  Checkbox,
  FormControlLabel,
  Grid,
  Typography,
} from "@mui/material";
import { useTranslations } from "next-intl";

const TAB_DESCRIPTIONS = {
  overview: "overview",
  rooms: "rooms",
  reservations: "reservations",
  users: "users",
  manageRooms: "manageRooms",
  activityLogsTab: "activityLogsTab",
  permissions: "permissions",
  payments: "payments",
  reports: "reports",
  expenses: "expenses",
};

export default function PermissionsGrid({ tabs, selectedTabs, onToggle }) {
  const translate = useTranslations("dashboard.permissions");
  return (
    <Box>
      <Grid container spacing={1.2}>
        {tabs.map((tab) => (
          <Grid item xs={12} md={6} key={tab.key}>
            <Box
              sx={{
                border: "1px solid #e2e8f0",
                borderRadius: 2,
                px: 1.2,
                py: 0.8,
                transition: "all 140ms ease",
                "&:hover": { borderColor: "#94a3b8", bgcolor: "#f8fafc" },
              }}
            >
              <FormControlLabel
                sx={{ m: 0, width: "100%", alignItems: "flex-start" }}
                control={
                  <Checkbox
                    checked={selectedTabs.includes(tab.key)}
                    onChange={() => onToggle(tab.key)}
                    sx={{
                      mt: 0.1,
                      "&.Mui-checked": { color: "#0284c7" },
                    }}
                  />
                }
                label={
                  <Box>
                    <Typography fontWeight={700} fontSize={14}>
                      {translate(`tabLabels.${tab.labelKey}`)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {TAB_DESCRIPTIONS[tab.key]
                        ? translate(`tabDescriptions.${TAB_DESCRIPTIONS[tab.key]}`)
                        : translate("accessThisSection")}
                    </Typography>
                  </Box>
                }
              />
            </Box>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
