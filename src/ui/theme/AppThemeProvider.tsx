import { CssBaseline, ThemeProvider } from "@mui/material";
import { useMemo, type ReactNode } from "react";
import { createAppTheme, type AppColorMode } from "./createAppTheme";

export function AppThemeProvider({
  mode,
  children,
}: {
  mode: AppColorMode;
  children: ReactNode;
}) {
  const theme = useMemo(() => createAppTheme(mode), [mode]);
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
