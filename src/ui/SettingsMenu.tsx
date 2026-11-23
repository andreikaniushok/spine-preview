import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { APP_AUTHOR, APP_VERSION, APP_YEAR } from "../app/version";
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

export function SettingsMenu({ theme, onThemeChange }: SettingsMenuProps) {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outlined"
        onClick={() => setOpen(true)}
        aria-label={t("settings.aria")}
        startIcon={<SettingsOutlinedIcon aria-hidden />}
        sx={{ minHeight: 44 }}
      >
        {t("settings.title")}
      </Button>

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

                <Box>
                  <Typography variant="body2" id="settings-theme-label" sx={{ mb: 1 }}>
                    {t("header.theme_choice")}
                  </Typography>
                  <ToggleButtonGroup
                    exclusive
                    fullWidth
                    value={theme}
                    aria-labelledby="settings-theme-label"
                    onChange={(_, value: "dark" | "light" | null) => {
                      if (value) onThemeChange(value);
                    }}
                  >
                    <ToggleButton value="light" sx={{ flex: 1, gap: 0.75 }}>
                      <LightModeOutlinedIcon aria-hidden fontSize="small" />
                      {t("header.theme_light")}
                    </ToggleButton>
                    <ToggleButton value="dark" sx={{ flex: 1, gap: 0.75 }}>
                      <DarkModeOutlinedIcon aria-hidden fontSize="small" />
                      {t("header.theme_dark")}
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>
              </Stack>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                {t("settings.section_about")}
              </Typography>
              <Stack spacing={0.75}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  <Box
                    component="img"
                    src="/logo.png"
                    alt=""
                    width={28}
                    height={28}
                    sx={{ width: 28, height: 28, display: "block", flexShrink: 0 }}
                  />
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {t("header.brand")}
                  </Typography>
                </Stack>
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
