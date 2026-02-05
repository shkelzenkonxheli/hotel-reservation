import { Box } from "@mui/material";

const toneMap = {
  success: "success",
  warning: "warning",
  danger: "danger",
  neutral: "neutral",
};

export default function StatusBadge({ label, tone = "neutral" }) {
  const cls = toneMap[tone] || "neutral";
  return <Box component="span" className={`admin-badge ${cls}`}>{label}</Box>;
}
