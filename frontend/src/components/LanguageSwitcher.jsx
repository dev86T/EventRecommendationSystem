import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const LANGUAGE_LABELS = { en: 'EN', de: 'DE', ru: 'RU' };

const LanguageSwitcher = () => {
  const { language, cycleLanguage, t } = useLanguage();

  return (
    <button
      className="lang-switcher"
      onClick={cycleLanguage}
      title={t('language.switch')}
    >
      {LANGUAGE_LABELS[language]}
    </button>
  );
};

export default LanguageSwitcher;
