import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import { AppBar, Box, ToggleButton, Toolbar, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { useI18n } from "../i18n/useI18n";
import { SettingsMenu } from "./SettingsMenu";

interface AppHeaderProps {
  theme: "dark" | "light";
  onThemeChange: (theme: "dark" | "light") => void;
  analyticsVisible: boolean;
  onAnalyticsVisibleChange: (visible: boolean) => void;
  metricsVisible: boolean;
  onMetricsVisibleChange: (visible: boolean) => void;
}

export function AppHeader({
  theme,
  onThemeChange,
  analyticsVisible,
  onAnalyticsVisibleChange,
  metricsVisible,
  onMetricsVisibleChange,
}: AppHeaderProps) {
  const { t } = useI18n();

  return (
    <AppBar
      position="static"
      color="transparent"
      elevation={0}
      sx={{
        gridArea: "header",
        borderBottom: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <Toolbar
        sx={{
          gap: 1,
          flexWrap: "wrap",
          py: 1,
          px: { xs: 1.5, md: 2 },
          minHeight: 56,
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography
          component="h1"
          variant="h5"
          sx={{
            m: 0,
            minWidth: 0,
            fontSize: { xs: "1.15rem", md: "1.4rem" },
            fontWeight: 650,
            letterSpacing: "-0.02em",
            color: "text.primary",
            lineHeight: 1.2,
          }}
        >
          {t("header.brand")}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          <ViewToggle
            pressed={analyticsVisible}
            label={t("header.analytics_on")}
            ariaLabel={t("header.analytics_aria")}
            onChange={onAnalyticsVisibleChange}
            icon={<InsightsOutlinedIcon aria-hidden fontSize="small" />}
          />
          <ViewToggle
            pressed={metricsVisible}
            label={t("header.metrics_on")}
            ariaLabel={t("header.metrics_aria")}
            onChange={onMetricsVisibleChange}
            icon={<SpeedOutlinedIcon aria-hidden fontSize="small" />}
          />
          <SettingsMenu theme={theme} onThemeChange={onThemeChange} />
        </Box>
      </Toolbar>
    </AppBar>
  );
}

function ViewToggle({
  pressed,
  label,
  ariaLabel,
  onChange,
  icon,
}: {
  pressed: boolean;
  label: string;
  ariaLabel: string;
  onChange: (pressed: boolean) => void;
  icon: ReactNode;
}) {
  return (
    <ToggleButton
      value={label}
      selected={pressed}
      aria-label={ariaLabel}
      onChange={() => onChange(!pressed)}
      sx={(muiTheme) => {
        const dark = muiTheme.palette.mode === "dark";
        const labelColor = "primary.main";
        const borderColor = dark ? "#8AA0B2" : "#6A8094";
        return {
          gap: 0.75,
          px: 1.5,
          color: labelColor,
          borderColor,
          "&:hover": {
            color: labelColor,
            borderColor,
            backgroundColor: dark ? "rgba(213, 222, 232, 0.08)" : "rgba(62, 83, 104, 0.06)",
          },
          "&&.Mui-selected, &&.Mui-selected:hover": {
            color: labelColor,
            borderColor: labelColor,
            backgroundColor: dark ? "rgba(213, 222, 232, 0.18)" : "rgba(62, 83, 104, 0.12)",
          },
        };
      }}
    >
      {icon}
      {label}
    </ToggleButton>
  );
}
