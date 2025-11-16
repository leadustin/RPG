// src/components/start_screen/StartScreen.jsx
import React, { useState, useCallback } from "react"; 
import "./StartScreen.css";
import { useTranslation } from "react-i18next";
import OptionsMenu from "../game_view/OptionsMenu"; // Importiere das OptionsMenu

export const StartScreen = ({
  onNewGame,
  onContinueGame,
  onLoadGame,
  onSaveGame,
  onDeleteGame,
  isGameLoaded,
  autoSaveExists,
  saveFileExists,
}) => {
  const { t } = useTranslation();

  // *** Zustand für Optionsmenü ***
  const [showOptionsMenu, setShowOptionsMenu] = useState(false); //

  const handleOpenOptions = useCallback(() => {
    setShowOptionsMenu(true);
  }, []);

  const handleCloseOptions = useCallback(() => {
    setShowOptionsMenu(false); //
  }, []);
  // *************************************

  return (
    <div className="start-screen-container">
      <div className="menu-box">
        <h1>{t("startScreen.title")}</h1>
        <button onClick={onContinueGame} disabled={!autoSaveExists}>
          {t("startScreen.continue")}
        </button>
        <button onClick={onNewGame}>{t("startScreen.newGame")}</button>
        <button onClick={onLoadGame} disabled={!saveFileExists}>
          {t("startScreen.loadGame")}
        </button>
        <button onClick={onSaveGame} disabled={!isGameLoaded}>
          {t("startScreen.saveGame")}
        </button>
        <button
          onClick={onDeleteGame}
          disabled={!autoSaveExists}
          className="delete-button"
        >
          {t("startScreen.deleteAutosave")}
        </button>
        {/* GEÄNDERT: Options-Button aktiviert und mit Handler versehen */}
        <button onClick={handleOpenOptions}>
          {t("startScreen.options")}
        </button>
      </div>

      {/* NEU: OptionsMenu rendern */}
      {showOptionsMenu && (
        <OptionsMenu
          onClose={handleCloseOptions}
        />
      )}
    </div>
  );
};