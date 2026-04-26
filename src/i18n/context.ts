import { createContext } from "react";
import type { Locale, MessageKey } from "./messages";
import type { MessageVars } from "./types";

export type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, vars?: MessageVars) => string;
};

export const I18nContext = createContext<I18nContextValue | null>(null);
