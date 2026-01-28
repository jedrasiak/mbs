import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import pl from './locales/pl.json';
import uk from './locales/uk.json';

export const supportedLanguages = ['en', 'pl', 'uk'] as const;
export type SupportedLanguage = typeof supportedLanguages[number];

const resources = {
  en: { translation: en },
  pl: { translation: pl },
  uk: { translation: uk },
};

// Detect browser language
function detectBrowserLanguage(): SupportedLanguage {
  // Check navigator.languages first (array of preferred languages)
  const languages = navigator.languages || [navigator.language];

  for (const lang of languages) {
    const code = lang?.split('-')[0]?.toLowerCase();
    if (code && supportedLanguages.includes(code as SupportedLanguage)) {
      return code as SupportedLanguage;
    }
  }

  return 'en';
}

// Update HTML lang attribute
function updateHtmlLang(lang: string): void {
  document.documentElement.lang = lang;
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: supportedLanguages,
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'bus-schedule-language',
      caches: ['localStorage'],
    },
  });

// Update HTML lang attribute when language changes
i18n.on('languageChanged', (lng) => {
  updateHtmlLang(lng);
});

// Set initial HTML lang
updateHtmlLang(i18n.language);

export default i18n;

export function setLanguage(language: SupportedLanguage | null): void {
  if (language) {
    i18n.changeLanguage(language);
    localStorage.setItem('bus-schedule-language', language);
  } else {
    // Remove the stored language to fall back to browser detection
    localStorage.removeItem('bus-schedule-language');
    // Re-detect the language from browser
    const detectedLang = detectBrowserLanguage();
    i18n.changeLanguage(detectedLang);
  }
}

export function getStoredLanguage(): SupportedLanguage | null {
  const stored = localStorage.getItem('bus-schedule-language');
  if (stored && supportedLanguages.includes(stored as SupportedLanguage)) {
    return stored as SupportedLanguage;
  }
  return null;
}

export { detectBrowserLanguage };
