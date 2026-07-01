import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Collapse,
  Menu,
} from "@mui/material";
import { useState } from "react";
import useMediaQuery from "@mui/material/useMediaQuery";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { useTranslations } from "next-intl";

export default function ReservationFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  dateRange,
  onDateRangeChange,
  pageSize,
  onPageSizeChange,
  onAddNew,
}) {
  const t = useTranslations("dashboard.reservations.filters");
  const isMobile = useMediaQuery("(max-width:768px)");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const filterControls = (
    <>
      <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 140 } }}>
        <InputLabel shrink>{t("status")}</InputLabel>
        <Select
          value={statusFilter}
          notched
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
        <InputLabel shrink>{t("type")}</InputLabel>
        <Select
          value={typeFilter}
          notched
          label={t("type")}
          onChange={(e) => onTypeFilterChange(e.target.value)}
        >
          <MenuItem value="all">{t("options.all")}</MenuItem>
          <MenuItem value="hotel">{t("options.hotel")}</MenuItem>
          <MenuItem value="apartment">{t("options.apartment")}</MenuItem>
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 180 } }}>
        <InputLabel shrink>{t("dateRange")}</InputLabel>
        <Select
          value={dateRange}
          notched
          label={t("dateRange")}
          onChange={(e) => onDateRangeChange(e.target.value)}
        >
          <MenuItem value="last30">{t("ranges.last30")}</MenuItem>
          <MenuItem value="thisMonth">{t("ranges.thisMonth")}</MenuItem>
          <MenuItem value="last90">{t("ranges.last90")}</MenuItem>
          <MenuItem value="all">{t("ranges.allTime")}</MenuItem>
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 130 } }}>
        <InputLabel shrink>{t("pageSize")}</InputLabel>
        <Select
          value={pageSize}
          notched
          label={t("pageSize")}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
        >
          {[20, 50, 100].map((size) => (
            <MenuItem key={size} value={size}>
              {t("pageSizeOption", { count: size })}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </>
  );

  return (
    <Box
      sx={{
        display: "grid",
        gap: 1.5,
        mb: 3,
        p: 2,
        borderRadius: 3,
        backgroundColor: "#f8fafc",
        border: "1px solid #e2e8f0",
      }}
    >
      <Box
        sx={{
          display: "grid",
          gap: 1.25,
          gridTemplateColumns: { xs: "1fr", md: "minmax(220px,1fr) auto auto" },
          alignItems: "start",
        }}
      >
        <TextField
          label={t("search")}
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={{ minWidth: { xs: "100%", sm: 220 } }}
        />

        {isMobile ? (
          <>
            <Button
              variant="outlined"
              onClick={() => setShowMobileFilters((prev) => !prev)}
              startIcon={<FilterListRoundedIcon />}
              endIcon={
                <ExpandMoreRoundedIcon
                  sx={{
                    transform: showMobileFilters ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                  }}
                />
              }
              sx={{
                textTransform: "none",
                fontWeight: 700,
                minHeight: 40,
                justifyContent: "space-between",
              }}
            >
              {t("moreFilters")}
            </Button>

            <Button
              variant="contained"
              color="primary"
              sx={{
                borderRadius: 2,
                fontWeight: "bold",
                minHeight: 40,
              }}
              onClick={onAddNew}
            >
              {t("addNew")}
            </Button>
          </>
        ) : null}
      </Box>

      {isMobile ? (
        <Collapse in={showMobileFilters}>
          <Box
            sx={{
              display: "grid",
              gap: 1.25,
              gridTemplateColumns: "1fr",
              mt: 0.5,
            }}
          >
            {filterControls}
          </Box>
        </Collapse>
      ) : (
        <Box
          sx={{
            display: "flex",
            gap: 1.25,
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", gap: 1.25, flexWrap: "wrap" }}>
            {filterControls}
          </Box>

          <Button
            variant="contained"
            color="primary"
            sx={{
              borderRadius: 2,
              fontWeight: "bold",
              minHeight: 40,
            }}
            onClick={onAddNew}
          >
            {t("addNew")}
          </Button>
        </Box>
      )}
    </Box>
  );
}
