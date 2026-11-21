import { createTheme, type Theme } from "@mui/material/styles";

export type AppColorMode = "dark" | "light";

/** Scene clear color. Matches `background.default`. */
export const sceneBackgroundByTheme: Record<AppColorMode, string> = {
  dark: "#121A22",
  light: "#E7F2F8",
};

export function createAppTheme(mode: AppColorMode): Theme {
  const dark = mode === "dark";
  const accent = dark ? "#B7E4F7" : "#1A4F73";
  const onAccent = dark ? "#0B2540" : "#FFFFFF";
  const pastel = "#87CEEB";
  const onPastel = "#0B2540";

  const theme = createTheme({
    palette: {
      mode,
      primary: { main: accent, contrastText: onAccent },
      secondary: { main: dark ? "#C5D4E0" : "#3E4C63", contrastText: dark ? "#0B2540" : "#FFFFFF" },
      background: {
        default: sceneBackgroundByTheme[mode],
        paper: dark ? "#1C2833" : "#FFFFFF",
      },
      text: {
        primary: dark ? "#F4F8FB" : "#122033",
        secondary: dark ? "#C5D4E0" : "#3E4C63",
      },
      divider: dark ? "#314556" : "#C5D7E4",
      error: { main: dark ? "#FCA5A5" : "#B91C1C", contrastText: dark ? "#2A0A0A" : "#FFFFFF" },
      action: {
        hover: dark ? "rgba(183, 228, 247, 0.08)" : "rgba(26, 79, 115, 0.06)",
        selected: dark ? "rgba(183, 228, 247, 0.16)" : "rgba(135, 206, 235, 0.35)",
      },
    },
    typography: {
      fontFamily: 'system-ui, "Segoe UI", sans-serif',
      h6: { fontWeight: 650, letterSpacing: "-0.02em" },
      subtitle2: { fontWeight: 600 },
      body1: { fontSize: "1rem", lineHeight: 1.5 },
      body2: { fontSize: "0.875rem", lineHeight: 1.5 },
      caption: { fontSize: "0.75rem", lineHeight: 1.45 },
      button: { fontWeight: 600, letterSpacing: "0" },
    },
    shape: { borderRadius: 0 },
    transitions: {
      duration: { shortest: 200, shorter: 220, short: 240, standard: 280 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          "html, body, #root": { height: "100%", margin: 0 },
          body: {
            overflowX: "hidden",
            lineHeight: 1.5,
            backgroundColor: sceneBackgroundByTheme[mode],
            color: dark ? "#F4F8FB" : "#122033",
          },
          "@media (prefers-reduced-motion: reduce)": {
            "*, *::before, *::after": {
              animationDuration: "0.01ms !important",
              animationIterationCount: "1 !important",
              transitionDuration: "0.01ms !important",
              scrollBehavior: "auto !important",
            },
          },
        },
      },
      MuiButtonBase: {
        styleOverrides: {
          root: ({ theme: muiTheme }) => ({
            "@media (hover: hover)": {
              transition: muiTheme.transitions.create(
                ["background-color", "color", "border-color", "box-shadow"],
                { duration: 240 },
              ),
            },
            "&.Mui-focusVisible": {
              outline: `3px solid ${dark ? "#D6F1FB" : "#1A4F73"}`,
              outlineOffset: 2,
            },
          }),
        },
      },
      MuiButton: {
        defaultProps: { size: "small", variant: "outlined" },
        styleOverrides: {
          root: { textTransform: "none" },
          outlined: {
            borderColor: dark ? "#5E8CA8" : "#8EB8D4",
          },
        },
        variants: [
          {
            props: { variant: "contained" },
            style: {
              backgroundColor: pastel,
              color: onPastel,
              "&:hover": { backgroundColor: "#6FBFDF", color: onPastel },
            },
          },
        ],
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            minHeight: 44,
            textTransform: "none",
            fontWeight: 600,
            "&.Mui-selected": {
              backgroundColor: pastel,
              color: onPastel,
              borderColor: pastel,
              "&:hover": { backgroundColor: "#6FBFDF", color: onPastel },
            },
          },
        },
      },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: { backgroundImage: "none" },
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
          root: { fontSize: "0.875rem", padding: "8px 10px" },
          head: { fontWeight: 600, whiteSpace: "nowrap" },
        },
      },
    },
  });

  const lifted = dark
    ? "0 2px 4px rgba(0, 0, 0, 0.28), 0 10px 24px rgba(0, 0, 0, 0.24)"
    : "0 2px 4px rgba(20, 40, 70, 0.08), 0 10px 24px rgba(20, 40, 70, 0.06)";
  theme.shadows = theme.shadows.map((_, index) => (index === 0 ? "none" : lifted)) as Theme["shadows"];

  return theme;
}
