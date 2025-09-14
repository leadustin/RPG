// src/components/start_screen/StartScreen.js
import React from 'react';
import './StartScreen.css';

export const StartScreen = ({ onNewGame, onLoadGame, onSaveGame, onDeleteGame, isGameLoaded, saveFileExists }) => {
  return (
    <div className="start-screen-container">
      <div className="menu-box">
        <h1>Mein RPG</h1>
        <button onClick={onNewGame}>Neues Spiel</button>
        <button onClick={onLoadGame} disabled={!saveFileExists}>Spiel laden</button>
        <button onClick={onSaveGame} disabled={!isGameLoaded}>Spiel speichern</button>
        <button onClick={onDeleteGame} disabled={!saveFileExists} className="delete-button">Spielstand löschen</button>
        <button disabled>Optionen</button>
      </div>
    </div>
  );
};
