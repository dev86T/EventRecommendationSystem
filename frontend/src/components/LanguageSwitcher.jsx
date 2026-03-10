import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'de', label: 'DE' },
  { code: 'ru', label: 'RU' },
];

const LanguageSwitcher = () => {
  const { language, selectLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="lang-switcher-wrapper" ref={wrapperRef}>
      {open && (
        <div className="lang-dropdown">
          {LANGUAGES.map(({ code, label }) => (
            <button
              key={code}
              className={`lang-option ${language === code ? 'active' : ''}`}
              onClick={() => { selectLanguage(code); setOpen(false); }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
      <button
        className="lang-switcher"
        onClick={() => setOpen(o => !o)}
        title="Switch language"
      >
        {language.toUpperCase()}
      </button>
    </div>
  );
};

export default LanguageSwitcher;
