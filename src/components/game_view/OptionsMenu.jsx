// src/components/game_view/OptionsMenu.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import './OptionsMenu.css'; 

/**
 * A modal menu for game options.
 * @param {object} props - Component properties.
 * @param {Function} props.onClose - Function to call to close the menu.
 * @param {Function} [props.onSave] - Optional: Function to trigger the save process.
 * @param {Function} [props.onLoad] - Optional: Function to trigger the load process.
 * @param {boolean} [props.showSaveLoadControls] - Optional: Show save/load buttons if true.
 */
const OptionsMenu = ({ onClose, onSave, onLoad, showSaveLoadControls }) => {
  const { t, i18n } = useTranslation(); 

  const handleLanguageChange = (lng) => {
    i18n.changeLanguage(lng);
  };

  // NEU: Handler, die das Menü nach der Aktion schließen
  const handleSaveClick = () => {
    if (onSave) onSave();
    onClose(); // Schließe das Optionsmenü
  };

  const handleLoadClick = () => {
    if (onLoad) onLoad();
    onClose(); // Schließe das Optionsmenü
  };

  return (
    <div className="options-menu-overlay" onClick={onClose}>
      <div className="options-menu" onClick={(e) => e.stopPropagation()}>
        <h2>{t("optionsMenu.title")}</h2>
        
        {/* --- SPRACHAUSWAHL (bleibt gleich) --- */}
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

        {/* --- NEU: SPIELVERWALTUNG (Konditionell) --- */}
        {showSaveLoadControls && (
          <div className="gamemenu-section">
            <h3>{t("optionsMenu.gameManagement", "Spielverwaltung")}</h3>
            <button onClick={handleSaveClick}>
              {t("optionsMenu.saveGame", "Spiel speichern")}
            </button>
            <button onClick={handleLoadClick}>
              {t("optionsMenu.loadGame", "Spiel laden")}
            </button>
          </div>
        )}
        {/* --- ENDE SPIELVERWALTUNG --- */}


        <button onClick={onClose}>{t("optionsMenu.close")}</button>
      </div>
    </div>
  );
};

export default OptionsMenu;