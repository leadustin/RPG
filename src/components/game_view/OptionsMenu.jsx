// src/components/game_view/OptionsMenu.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import './OptionsMenu.css'; 

/**
 * A modal menu for game options, specifically for language selection.
 * @param {object} props - Component properties.
 * @param {Function} props.onClose - Function to call to close the menu.
 */
const OptionsMenu = ({ onClose }) => {
  const { t, i18n } = useTranslation(); 

  const handleLanguageChange = (lng) => {
    i18n.changeLanguage(lng);
    // Optional: Logeintrag oder Rückmeldung hinzufügen
  };

  // The outer div handles closing the menu when clicking the background.
  // The inner div stops that click from propagating, so clicking the menu itself doesn't close it.
  return (
    <div className="options-menu-overlay" onClick={onClose}>
      <div className="options-menu" onClick={(e) => e.stopPropagation()}>
        <h2>{t("optionsMenu.title")}</h2>
        
        {/* --- SPRACHAUSWAHL --- */}
        <div className="language-selector-section">
          <h3>{t("optionsMenu.languageSelection")}</h3>
          <button 
            onClick={() => handleLanguageChange('de')} 
            disabled={i18n.language.startsWith('de')}
          >
            {t("optionsMenu.languageDe")}
          </button>
          <button 
            onClick={() => handleLanguageChange('en')}
            disabled={i18n.language.startsWith('en')}
          >
            {t("optionsMenu.languageEn")}
          </button>
        </div>
        {/* --- ENDE SPRACHAUSWAHL --- */}

        <button onClick={onClose}>{t("optionsMenu.close")}</button>
      </div>
    </div>
  );
};

export default OptionsMenu;