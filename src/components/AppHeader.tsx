import { useI18n } from "../i18n/useI18n";
import type { Locale, MessageKey } from "../i18n/messages";

interface AppHeaderProps {
  theme: "dark" | "light";
  onThemeChange: (theme: "dark" | "light") => void;
}

const locales: Locale[] = ["en", "pl", "ru"];

const localeLabelKey: Record<Locale, MessageKey> = {
  en: "header.lang_en",
  pl: "header.lang_pl",
  ru: "header.lang_ru",
};

export function AppHeader({ theme, onThemeChange }: AppHeaderProps) {
  const { locale, setLocale, t } = useI18n();

  return (
    <header className="app-header">
      <div className="app-header-brand">
        <span className="app-header-title">{t("header.brand")}</span>
      </div>
      <div className="app-header-actions">
        <label className="app-header-field">
          <span className="app-header-label">{t("header.language_aria")}</span>
          <select
            className="app-header-select"
            aria-label={t("header.language_aria")}
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
          >
            {locales.map((code) => (
              <option key={code} value={code}>
                {t(localeLabelKey[code])}
              </option>
            ))}
          </select>
        </label>
        <div className="app-header-field app-header-theme">
          <span className="app-header-label" id="theme-header-label">
            {theme === "light" ? t("header.theme_light") : t("header.theme_dark")}
          </span>
          <label className="theme-toggle" htmlFor="app-theme-switch">
            <input
              id="app-theme-switch"
              className="theme-toggle-input"
              type="checkbox"
              aria-label={t("header.theme_aria")}
              aria-labelledby="theme-header-label"
              checked={theme === "light"}
              onChange={(e) => onThemeChange(e.target.checked ? "light" : "dark")}
            />
            <span className="theme-toggle-track">
              <span className="theme-toggle-thumb" />
            </span>
          </label>
        </div>
      </div>
    </header>
  );
}
