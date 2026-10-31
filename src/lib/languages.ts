export type LanguageCode = "en" | "fr" | "ar" | "es" | "de" | "it" | "zh";

export interface Language {
  code: LanguageCode;
  name: string;
  native: string;
  bcp47: string;
  rtl?: boolean;
}

export const LANGUAGES: Language[] = [
  { code: "en", name: "English", native: "English", bcp47: "en-US" },
  { code: "fr", name: "French", native: "Français", bcp47: "fr-FR" },
  { code: "ar", name: "Arabic", native: "العربية", bcp47: "ar-SA", rtl: true },
  { code: "es", name: "Spanish", native: "Español", bcp47: "es-ES" },
  { code: "de", name: "German", native: "Deutsch", bcp47: "de-DE" },
  { code: "it", name: "Italian", native: "Italiano", bcp47: "it-IT" },
  { code: "zh", name: "Chinese (Simplified)", native: "简体中文", bcp47: "zh-CN" },
];

export const getLanguage = (code: LanguageCode) =>
  LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0]!;

export const dirFor = (code: LanguageCode) => (getLanguage(code).rtl ? "rtl" : "ltr");
