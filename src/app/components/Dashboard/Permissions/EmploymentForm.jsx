import { Box, Grid, MenuItem, Paper, TextField, Typography } from "@mui/material";

function FieldLabel({ text }) {
  return (
    <Typography
      variant="caption"
      sx={{ fontSize: 11, letterSpacing: 0.5, textTransform: "uppercase", color: "#64748b", fontWeight: 700 }}
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
  if (!selected) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid #e2e8f0",
        borderRadius: 3,
        p: 2,
      }}
    >
      <Typography fontWeight={800} mb={1.5}>
        Employment Details
      </Typography>
      <Grid container spacing={1.5}>
        <Grid item xs={12} sm={6}>
          <FieldLabel text="Position" />
          <TextField
            select
            size="small"
            fullWidth
            value={selected.staff_position || ""}
            onChange={(e) => updateSelectedField("staff_position", e.target.value)}
            sx={{ mt: 0.6 }}
          >
            <MenuItem value="receptionist">Receptionist</MenuItem>
            <MenuItem value="cleaner">Cleaner</MenuItem>
            <MenuItem value="manager">Manager</MenuItem>
            <MenuItem value="maintenance">Maintenance</MenuItem>
            <MenuItem value="accountant">Accountant</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FieldLabel text="Start Date" />
          <TextField
            type="date"
            size="small"
            fullWidth
            value={toDateInput(selected.employment_start_date)}
            onChange={(e) =>
              updateSelectedField("employment_start_date", e.target.value || null)
            }
            sx={{ mt: 0.6 }}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <FieldLabel text="Employment Status" />
          <TextField
            select
            size="small"
            fullWidth
            value={selected.employment_status || "active"}
            onChange={(e) => updateSelectedField("employment_status", e.target.value)}
            sx={{ mt: 0.6 }}
          >
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FieldLabel text="Salary Type" />
          <TextField
            select
            size="small"
            fullWidth
            value={selected.salary_type || "monthly"}
            onChange={(e) => updateSelectedField("salary_type", e.target.value)}
            sx={{ mt: 0.6 }}
          >
            <MenuItem value="monthly">Monthly</MenuItem>
            <MenuItem value="hourly">Hourly</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FieldLabel text="Base Salary" />
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
    </Paper>
  );
}
