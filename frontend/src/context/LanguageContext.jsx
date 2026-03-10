import React, { createContext, useContext, useState } from 'react';
import en from '../locales/en';
import de from '../locales/de';
import ru from '../locales/ru';

const translations = { en, de, ru };

const LANGUAGES = ['en', 'de', 'ru'];

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'en';
  });

  const cycleLanguage = () => {
    const idx = LANGUAGES.indexOf(language);
    const next = LANGUAGES[(idx + 1) % LANGUAGES.length];
    setLanguage(next);
    localStorage.setItem('language', next);
  };

  const t = (key, vars = {}) => {
    const keys = key.split('.');
    let value = translations[language];
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) break;
    }
    if (typeof value !== 'string') return key;
    return Object.entries(vars).reduce(
      (str, [k, v]) => str.replace(`{${k}}`, v),
      value
    );
  };

  return (
    <LanguageContext.Provider value={{ language, cycleLanguage, t, translations: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  );
};
