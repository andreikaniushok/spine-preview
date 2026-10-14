import { createTheme, type Theme } from "@mui/material/styles";

export type AppColorMode = "dark" | "light";

export function createAppTheme(mode: AppColorMode): Theme {
  const dark = mode === "dark";

  return createTheme({
    palette: {
      mode,
      primary: { main: dark ? "#60a5fa" : "#2563eb" },
      background: {
        default: dark ? "#0d111a" : "#f5f7fb",
        paper: dark ? "#131a29" : "#ffffff",
      },
      text: {
        primary: dark ? "#e5ebfa" : "#16203a",
        secondary: dark ? "#90a0c2" : "#576280",
      },
      divider: dark ? "#293248" : "#d6dce8",
      error: { main: dark ? "#f87171" : "#dc2626" },
    },
    typography: {
      fontFamily: "Inter, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
      h6: { fontWeight: 650, letterSpacing: "-0.02em" },
      subtitle2: { fontWeight: 600 },
      body2: { fontSize: "0.8125rem" },
      caption: { fontSize: "0.75rem" },
    },
    shape: { borderRadius: 8 },
    components: {
      MuiButton: {
        defaultProps: { size: "small", variant: "outlined" },
        styleOverrides: {
          root: { textTransform: "none" },
        },
      },
      MuiFormControl: { defaultProps: { size: "small", fullWidth: true } },
      MuiTextField: { defaultProps: { size: "small", fullWidth: true } },
      MuiSelect: { defaultProps: { size: "small" } },
      MuiSwitch: { defaultProps: { size: "small" } },
      MuiSlider: { defaultProps: { size: "small" } },
      MuiChip: { defaultProps: { size: "small" } },
      MuiTableCell: {
        styleOverrides: {
          root: { fontSize: "0.75rem", padding: "6px 8px" },
          head: { fontWeight: 600, whiteSpace: "nowrap" },
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: { backgroundImage: "none" },
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          "html, body, #root": {
            height: "100%",
            margin: 0,
          },
          body: {
            overflowX: "hidden",
          },
        },
      },
    },
  });
}
