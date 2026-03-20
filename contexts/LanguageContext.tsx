
import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ne';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType>({ 
    language: 'en', 
    setLanguage: () => {},
    toggleLanguage: () => {}
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  // Persist language preference
  useEffect(() => {
    const saved = localStorage.getItem('sunshine_lang');
    if (saved === 'ne' || saved === 'en') {
        setLanguage(saved);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
      setLanguage(lang);
      localStorage.setItem('sunshine_lang', lang);
  };

  const toggleLanguage = () => {
      handleSetLanguage(language === 'en' ? 'ne' : 'en');
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
