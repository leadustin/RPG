// src/components/start_screen/StartScreen.js
import React from 'react';
import './StartScreen.css';

export const StartScreen = ({ onNewGame, onLoadGame, onSaveGame, isGameLoaded }) => {
  return (
    <div className="start-screen-container">
      <div className="menu-box">
        <h1>Mein RPG</h1>
        <button onClick={onNewGame}>Neues Spiel</button>
        <button onClick={onLoadGame}>Spiel laden</button>
        <button onClick={onSaveGame} disabled={!isGameLoaded}>Spiel speichern</button>
        <button disabled>Optionen</button>
      </div>
    </div>
  );
};
