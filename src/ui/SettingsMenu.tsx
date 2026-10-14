import SettingsIcon from "@mui/icons-material/Settings";
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useI18n } from "../i18n/useI18n";
import type { Locale, MessageKey } from "../i18n/messages";

interface SettingsMenuProps {
  theme: "dark" | "light";
  onThemeChange: (theme: "dark" | "light") => void;
}

const locales: Locale[] = ["en", "pl", "ru"];

const localeLabelKey: Record<Locale, MessageKey> = {
  en: "header.lang_en",
  pl: "header.lang_pl",
  ru: "header.lang_ru",
};

/** Keep in sync with package.json version. */
const APP_VERSION = "0.0.0";
const APP_AUTHOR = "@andreikaniushok";
const APP_YEAR = 2026;

export function SettingsMenu({ theme, onThemeChange }: SettingsMenuProps) {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <>
      <IconButton
        size="small"
        onClick={() => setOpen(true)}
        aria-label={t("settings.aria")}
        color="inherit"
      >
        <SettingsIcon fontSize="small" />
      </IconButton>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="xs"
        aria-labelledby="settings-dialog-title"
      >
        <DialogTitle id="settings-dialog-title">{t("settings.title")}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.25 }}>
                {t("settings.section_interface")}
              </Typography>
              <Stack spacing={2}>
                <FormControl fullWidth size="small">
                  <InputLabel id="settings-locale-label">{t("header.language_aria")}</InputLabel>
                  <Select
                    labelId="settings-locale-label"
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
                  sx={{ ml: 0, mr: 0, justifyContent: "space-between" }}
                  labelPlacement="start"
                  control={
                    <Switch
                      checked={theme === "light"}
                      onChange={(e) => onThemeChange(e.target.checked ? "light" : "dark")}
                      slotProps={{ input: { "aria-label": t("header.theme_aria") } }}
                    />
                  }
                  label={theme === "light" ? t("header.theme_light") : t("header.theme_dark")}
                />
              </Stack>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                {t("settings.section_about")}
              </Typography>
              <Stack spacing={0.75}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {t("header.brand")}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("settings.about_version", { version: APP_VERSION })}
                </Typography>
                <Typography variant="body2">{t("settings.about_desc")}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {t("settings.about_stack")}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ pt: 0.5 }}>
                  {t("common.footer_copyright", { year: APP_YEAR, author: APP_AUTHOR })}
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}
