import {
  Box,
  Grid,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslations } from "next-intl";

function FieldLabel({ text }) {
  return (
    <Typography
      variant="caption"
      sx={{
        fontSize: 11,
        letterSpacing: 0.5,
        textTransform: "uppercase",
        color: "#64748b",
        fontWeight: 700,
      }}
    >
      {text}
    </Typography>
  );
}

export default function EmploymentForm({
  selected,
  toDateInput,
  updateSelectedField,
}) {
  const t = useTranslations("dashboard.permissions");
  if (!selected) return null;

  return (
    <Box>
      <Grid container spacing={1.5}>
        <Grid item xs={12} sm={6}>
          <FieldLabel text={t("employment.position")} />
          <TextField
            select
            size="small"
            fullWidth
            value={selected.staff_position || ""}
            onChange={(e) =>
              updateSelectedField("staff_position", e.target.value)
            }
            sx={{ mt: 0.6 }}
          >
            <MenuItem value="receptionist">{t("positions.receptionist")}</MenuItem>
            <MenuItem value="cleaner">{t("positions.cleaner")}</MenuItem>
            <MenuItem value="manager">{t("positions.manager")}</MenuItem>
            <MenuItem value="maintenance">{t("positions.maintenance")}</MenuItem>
            <MenuItem value="accountant">{t("positions.accountant")}</MenuItem>
            <MenuItem value="other">{t("positions.other")}</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FieldLabel text={t("employment.startDate")} />
          <TextField
            type="date"
            size="small"
            fullWidth
            value={toDateInput(selected.employment_start_date)}
            onChange={(e) =>
              updateSelectedField(
                "employment_start_date",
                e.target.value || null,
              )
            }
            sx={{ mt: 0.6 }}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <FieldLabel text={t("employment.employmentStatus")} />
          <TextField
            select
            size="small"
            fullWidth
            value={selected.employment_status || "active"}
            onChange={(e) =>
              updateSelectedField("employment_status", e.target.value)
            }
            sx={{ mt: 0.6 }}
          >
            <MenuItem value="active">{t("employment.active")}</MenuItem>
            <MenuItem value="inactive">{t("employment.inactive")}</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FieldLabel text={t("employment.salaryType")} />
          <TextField
            select
            size="small"
            fullWidth
            value={selected.salary_type || "monthly"}
            onChange={(e) => updateSelectedField("salary_type", e.target.value)}
            sx={{ mt: 0.6 }}
          >
            <MenuItem value="monthly">{t("employment.monthly")}</MenuItem>
            <MenuItem value="hourly">{t("employment.hourly")}</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FieldLabel text={t("employment.baseSalary")} />
          <TextField
            type="number"
            size="small"
            fullWidth
            value={selected.base_salary ?? ""}
            onChange={(e) =>
              updateSelectedField(
                "base_salary",
                e.target.value === "" ? "" : Number(e.target.value),
              )
            }
            sx={{ mt: 0.6 }}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
