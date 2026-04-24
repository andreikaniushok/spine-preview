import { enMessages, type MessageKey } from "./en";
import { plMessages } from "./pl";
import { ruMessages } from "./ru";

export type Locale = "en" | "pl" | "ru";

export type { MessageKey } from "./en";

export const MESSAGES: Record<Locale, Record<MessageKey, string>> = {
  en: enMessages,
  pl: plMessages,
  ru: ruMessages,
};
