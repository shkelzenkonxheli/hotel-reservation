import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from "@mui/material";

export default function ReservationFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  onAddNew,
}) {
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
          label="Search (Name or Email)"
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          sx={{ minWidth: { xs: "100%", sm: 220 }, flex: 1 }}
        />

        <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 140 } }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => onStatusFilterChange(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="confirmed">Confirmed</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 140 } }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={typeFilter}
            label="Type"
            onChange={(e) => onTypeFilterChange(e.target.value)}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="hotel">Hotel</MenuItem>
            <MenuItem value="apartment">Apartment</MenuItem>
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
        + Add New
      </Button>
    </Box>
  );
}
