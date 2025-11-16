// src/i18n.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Importieren Sie Ihre Übersetzungsdateien
import deTranslation from "./locales/de/translation.json";
import enTranslation from "./locales/en/translation.json";

const resources = {
  de: {
    translation: deTranslation,
  },
  en: {
    translation: enTranslation,
  },
};

i18n
  .use(LanguageDetector) // Erkennt die Browsersprache
  .use(initReactI18next) // Übergibt i18n an react-i18next
  .init({
    resources,
    lng: "de", // Standardsprache, falls die Erkennung fehlschlägt
    fallbackLng: "de", // Fallback-Sprache
    interpolation: {
      escapeValue: false, // React übernimmt bereits das Escaping
    },
  });

export default i18n;