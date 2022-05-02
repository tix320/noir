import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en_translations from '../ui/locales/en.json';
import ru_translations from '../ui/locales/ru.json';

const resources = {
  en: {
    translation: en_translations
  },
  ru: {
    translation : ru_translations
  },
};
i18next
  .use(initReactI18next)
  .use(LanguageDetector)
  .init({
    resources: resources,
    lng: "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });

export default i18next;