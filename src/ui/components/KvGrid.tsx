import { Box, Typography } from "@mui/material";
import type { ReactNode } from "react";

export interface KvItem {
  label: ReactNode;
  value: ReactNode;
}

export function KvGrid({ items }: { items: readonly KvItem[] }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        columnGap: 1.5,
        rowGap: 0.75,
        alignItems: "baseline",
      }}
    >
      {items.map((item, index) => (
        <Box key={index} sx={{ display: "contents" }}>
          <Typography variant="caption" color="text.secondary">
            {item.label}
          </Typography>
          <Typography variant="body2" sx={{ fontVariantNumeric: "tabular-nums" }}>
            {item.value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
