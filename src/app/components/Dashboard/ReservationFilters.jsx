import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from "@mui/material";
import { useTranslations } from "next-intl";

export default function ReservationFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  onAddNew,
}) {
  const t = useTranslations("dashboard.reservations.filters");
  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 2,
        alignItems: { xs: "stretch", md: "center" },
        justifyContent: "space-between",
        mb: 3,
        p: 2,
      }}
    >
      <Box
        sx={{
          display: "flex",
          gap: 2,
          flexWrap: "wrap",
          width: { xs: "100%", md: "auto" },
        }}
      >
        <TextField
          label={t("search")}
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={{ minWidth: { xs: "100%", sm: 220 }, flex: 1 }}
        />

        <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 140 } }}>
          <InputLabel>{t("status")}</InputLabel>
          <Select
            value={statusFilter}
            label={t("status")}
            onChange={(e) => onStatusFilterChange(e.target.value)}
          >
            <MenuItem value="all">{t("options.all")}</MenuItem>
            <MenuItem value="pending">{t("options.pending")}</MenuItem>
            <MenuItem value="confirmed">{t("options.confirmed")}</MenuItem>
            <MenuItem value="completed">{t("options.completed")}</MenuItem>
            <MenuItem value="cancelled">{t("options.cancelled")}</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 140 } }}>
          <InputLabel>{t("type")}</InputLabel>
          <Select
            value={typeFilter}
            label={t("type")}
            onChange={(e) => onTypeFilterChange(e.target.value)}
          >
            <MenuItem value="all">{t("options.all")}</MenuItem>
            <MenuItem value="hotel">{t("options.hotel")}</MenuItem>
            <MenuItem value="apartment">{t("options.apartment")}</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Button
        variant="contained"
        color="primary"
        sx={{
          borderRadius: 2,
          fontWeight: "bold",
          width: { xs: "100%", md: "auto" },
          minHeight: 40,
        }}
        onClick={onAddNew}
      >
        {t("addNew")}
      </Button>
    </Box>
  );
}
