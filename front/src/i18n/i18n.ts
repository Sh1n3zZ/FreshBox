import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';
import { getMemory, setMemory } from '@/lib/utils';

import zh from './locales/zh.json';
import en from './locales/en.json';

const resources = {
  zh: { translation: zh },
  en: { translation: en },
};

export const supportedLanguages = Object.keys(resources);
export const defaultLanguage = 'zh';

export const languageNames: Record<string, string> = {
  zh: '简体中文',
  en: 'English',
};

export function getLanguage(): string {
  const storedLanguage = getMemory('language');
  if (storedLanguage && supportedLanguages.includes(storedLanguage)) {
    return storedLanguage;
  }
  
  const browserLang = navigator.language.split('-')[0];
  if (supportedLanguages.includes(browserLang)) {
    return browserLang;
  }
  
  return defaultLanguage;
}

export function setLanguage(lang: string): void {
  if (supportedLanguages.includes(lang)) {
    i18n.changeLanguage(lang)
      .then(() => console.debug(`[i18n] Language changed to: ${i18n.language}`));
    setMemory('language', lang);
    return;
  }
  
  console.warn(`[i18n] Language ${lang} is not supported`);
}

function normalizeLanguage(lng: string | undefined): string {
  if (!lng) return defaultLanguage;
  return lng.toLowerCase().split('-')[0];
}

// 初始化i18n
i18n
  .use(LanguageDetector)
  .use(Backend)
  .use(initReactI18next)
  .init({
    resources,
    lng: normalizeLanguage(getLanguage()),
    fallbackLng: defaultLanguage,
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
    react: {
      useSuspense: false,
    }
  })
  .then(() => console.debug(`[i18n] Initialized with language: ${i18n.language}`));

export default i18n;
