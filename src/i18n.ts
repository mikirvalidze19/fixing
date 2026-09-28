import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ka from './locales/ka.json';

export const SUPPORTED_LANGS = ['en', 'ka'] as const;
export type AppLang = (typeof SUPPORTED_LANGS)[number];
const STORAGE_KEY = 'fixing-lang';

function initialLang(): AppLang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'ka' || saved === 'en') return saved;
  } catch {
    /* private mode — fall through */
  }
  return 'en';
}

const lng = initialLang();
if (typeof document !== 'undefined') {
  document.documentElement.lang = lng === 'ka' ? 'ka' : 'en';
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ka: { translation: ka },
  },
  lng,
  fallbackLng: 'en',
  returnEmptyString: false,
  interpolation: { escapeValue: false },
});

if (typeof window !== 'undefined') {
  i18n.on('languageChanged', (code) => {
    document.documentElement.lang = code === 'ka' ? 'ka' : 'en';
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      /* ignore */
    }
  });
}

export default i18n;
