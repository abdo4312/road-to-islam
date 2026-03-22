import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import ar from './locales/ar.json';
import fr from './locales/fr.json';
import tr from './locales/tr.json';
import ur from './locales/ur.json';

export type AppLanguage = 'en' | 'ar' | 'fr' | 'tr' | 'ur';

const SUPPORTED_LANGUAGES: AppLanguage[] = ['en', 'ar', 'fr', 'tr', 'ur'];
const RTL_LANGUAGES = new Set<AppLanguage>(['ar', 'ur']);

const LEGACY_LANGUAGE_MAP: Record<string, AppLanguage> = {
  english: 'en',
  arabic: 'ar',
  french: 'fr',
  turkish: 'tr',
  urdu: 'ur',
  'français': 'fr',
  'türkçe': 'tr',
  'العربية': 'ar',
  'اردو': 'ur',
};

export const normalizeLanguageCode = (value?: string | null): AppLanguage => {
  if (!value) return 'en';

  const normalized = value.trim().toLowerCase();
  const shortCode = normalized.split('-')[0] as AppLanguage;

  if (SUPPORTED_LANGUAGES.includes(shortCode)) {
    return shortCode;
  }

  if (LEGACY_LANGUAGE_MAP[normalized]) {
    return LEGACY_LANGUAGE_MAP[normalized];
  }

  return 'en';
};

export const applyLanguageAttributes = (value: string) => {
  if (typeof document === 'undefined') return;

  const langCode = normalizeLanguageCode(value);
  document.documentElement.dir = RTL_LANGUAGES.has(langCode) ? 'rtl' : 'ltr';
  document.documentElement.lang = langCode;
  localStorage.setItem('user_language', langCode);
};

const initialLanguage =
  typeof window === 'undefined'
    ? 'en'
    : normalizeLanguageCode(localStorage.getItem('user_language') || navigator.language);

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
      fr: { translation: fr },
      tr: { translation: tr },
      ur: { translation: ur },
    },
    lng: initialLanguage,
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'user_language',
      caches: ['localStorage'],
      convertDetectedLanguage: (lng) => normalizeLanguageCode(lng),
    },
  });

if (typeof window !== 'undefined') {
  applyLanguageAttributes(i18n.language);
  i18n.on('languageChanged', (lng) => applyLanguageAttributes(lng));
}

export default i18n;
