import {
  AppBar,
  Box,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  Toolbar,
  Typography,
} from "@mui/material";
import { useI18n } from "../i18n/useI18n";
import type { Locale, MessageKey } from "../i18n/messages";

interface AppHeaderProps {
  theme: "dark" | "light";
  onThemeChange: (theme: "dark" | "light") => void;
  analyticsVisible: boolean;
  onAnalyticsVisibleChange: (visible: boolean) => void;
  metricsVisible: boolean;
  onMetricsVisibleChange: (visible: boolean) => void;
}

const locales: Locale[] = ["en", "pl", "ru"];

const localeLabelKey: Record<Locale, MessageKey> = {
  en: "header.lang_en",
  pl: "header.lang_pl",
  ru: "header.lang_ru",
};

export function AppHeader({
  theme,
  onThemeChange,
  analyticsVisible,
  onAnalyticsVisibleChange,
  metricsVisible,
  onMetricsVisibleChange,
}: AppHeaderProps) {
  const { locale, setLocale, t } = useI18n();

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
            gap: { xs: 0.5, sm: 1.5 },
            flexWrap: "wrap",
            justifyContent: "flex-end",
            flex: { xs: "1 1 100%", sm: "0 1 auto" },
          }}
        >
          <FormControl sx={{ minWidth: { xs: 96, sm: 120 }, flex: { xs: "1 1 auto", sm: "0 0 auto" } }} size="small">
            <InputLabel id="app-locale-label">{t("header.language_aria")}</InputLabel>
            <Select
              labelId="app-locale-label"
              label={t("header.language_aria")}
              value={locale}
              onChange={(e) => setLocale(e.target.value as Locale)}
            >
              {locales.map((code) => (
                <MenuItem key={code} value={code}>
                  {t(localeLabelKey[code])}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControlLabel
            sx={{ mr: { xs: 0, sm: 1 }, ml: 0 }}
            control={
              <Switch
                checked={theme === "light"}
                onChange={(e) => onThemeChange(e.target.checked ? "light" : "dark")}
                slotProps={{ input: { "aria-label": t("header.theme_aria") } }}
              />
            }
            label={theme === "light" ? t("header.theme_light") : t("header.theme_dark")}
          />
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
            sx={{ mr: 0, ml: 0 }}
            control={
              <Switch
                checked={metricsVisible}
                onChange={(e) => onMetricsVisibleChange(e.target.checked)}
                slotProps={{ input: { "aria-label": t("header.metrics_aria") } }}
              />
            }
            label={metricsVisible ? t("header.metrics_on") : t("header.metrics_off")}
          />
        </Box>
      </Toolbar>
    </AppBar>
  );
}
