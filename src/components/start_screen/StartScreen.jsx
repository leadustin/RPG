// src/components/start_screen/StartScreen.jsx
import React from "react";
import "./StartScreen.css";
import { useTranslation } from "react-i18next"; // 1. Importieren

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
  const { t } = useTranslation(); // 2. Hook aufrufen

  return (
    <div className="start-screen-container">
      <div className="menu-box">
        {/* 3. Hartcodierte Strings durch t('key') ersetzen */}
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
        <button disabled>{t("startScreen.options")}</button>
      </div>
    </div>
  );
};