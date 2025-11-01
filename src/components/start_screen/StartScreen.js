// src/components/start_screen/StartScreen.js

import React from "react";
import "./StartScreen.css";

export const StartScreen = ({
  onNewGame,
  onContinueGame, // Neu
  onLoadGame,
  onSaveGame,
  onDeleteGame,
  isGameLoaded,
  autoSaveExists, // Neu
  saveFileExists,
}) => {
  return (
    <div className="start-screen-container">
      <div className="menu-box">
        <h1>Mein RPG</h1>
        {/* Neuer "Fortsetzen"-Button, der den Autosave lädt */}
        <button onClick={onContinueGame} disabled={!autoSaveExists}>
          Fortsetzen
        </button>
        <button onClick={onNewGame}>Neues Spiel</button>
        {/* "Spiel laden" öffnet jetzt den Slot Manager */}
        <button onClick={onLoadGame} disabled={!saveFileExists}>
          Spiel laden
        </button>
        <button onClick={onSaveGame} disabled={!isGameLoaded}>
          Spiel speichern
        </button>
        <button
          onClick={onDeleteGame}
          disabled={!autoSaveExists} // Sollte nur den Autosave löschen
          className="delete-button"
        >
          Autosave löschen
        </button>
        <button disabled>Optionen</button>
      </div>
    </div>
  );
};