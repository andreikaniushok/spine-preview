import { AppBar, Box, FormControlLabel, Switch, Toolbar, Typography } from "@mui/material";
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
        variant="dense"
        sx={{
          gap: { xs: 1, md: 2 },
          flexWrap: "wrap",
          py: { xs: 0.75, md: 1 },
          px: { xs: 1, md: 2 },
          minHeight: { xs: 44, md: 48 },
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography
          variant="h5"
          component="span"
          sx={{
            fontSize: { xs: "1.15rem", sm: "1.4rem", md: "1.5rem" },
            fontWeight: 650,
            letterSpacing: "-0.02em",
            background: "linear-gradient(90deg, #6a1bb1 0%, #1f4fd6 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            lineHeight: 1.2,
          }}
        >
          {t("header.brand")}
        </Typography>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: { xs: 0.25, sm: 1.5 },
            flexWrap: "nowrap",
            justifyContent: "flex-end",
            flex: { xs: "1 1 auto", sm: "0 1 auto" },
            minWidth: 0,
            overflowX: "auto",
          }}
        >
          <FormControlLabel
            sx={{ mr: { xs: 0, sm: 1 }, ml: 0 }}
            control={
              <Switch
                checked={analyticsVisible}
                onChange={(e) => onAnalyticsVisibleChange(e.target.checked)}
                slotProps={{ input: { "aria-label": t("header.analytics_aria") } }}
              />
            }
            label={analyticsVisible ? t("header.analytics_on") : t("header.analytics_off")}
          />
          <FormControlLabel
            sx={{ mr: { xs: 0, sm: 1 }, ml: 0 }}
            control={
              <Switch
                checked={metricsVisible}
                onChange={(e) => onMetricsVisibleChange(e.target.checked)}
                slotProps={{ input: { "aria-label": t("header.metrics_aria") } }}
              />
            }
            label={metricsVisible ? t("header.metrics_on") : t("header.metrics_off")}
          />
          <SettingsMenu theme={theme} onThemeChange={onThemeChange} />
        </Box>
      </Toolbar>
    </AppBar>
  );
}
