// src/components/game_view/ActionBar.js

import React, { useState } from 'react';
import './ActionBar.css';

function ActionBar({ 
  character, 
  onToggleCharacterSheet, 
  onSaveGame, 
  onLoadGame,
  saveFileExists // <--- 1. PROP HIER EMPFANGEN
}) {
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  // showLoadConfirmation wird nicht mehr gebraucht, da der Manager sich öffnet
  // const [showLoadConfirmation, setShowLoadConfirmation] = useState(false);

  const handleCharacterClick = () => {
    console.log('Character button clicked', character);
    onToggleCharacterSheet();
  };

  const handleSaveClick = () => {
    if (onSaveGame) {
      onSaveGame(); 
    }
  };

  const handleLoadClick = () => {
    if (onLoadGame) {
      onLoadGame();
      // Diese Bestätigung ist FALSCH, da wir nur den Manager öffnen.
      // Wir entfernen sie, um Verwirrung zu vermeiden.
      // setShowLoadConfirmation(true);
      // setTimeout(() => setShowLoadConfirmation(false), 2000);
    }
  };

  // 2. DIESE ZEILE LÖSCHEN:
  // const saveExists = localStorage.getItem('rpg_character') !== null;

  return (
    <div className="action-bar">
      {/* Dieser Button öffnet jetzt den SaveSlotManager */}
      <button onClick={handleSaveClick} title="Spiel speichern">
        💾 Speichern
      </button>
      <button 
        onClick={handleLoadClick} 
        disabled={!saveFileExists} // <--- 3. KORRIGIERTE PROP VERWENDEN
        title={saveFileExists ? "Spiel laden" : "Kein Spielstand vorhanden"}
      >
        📂 Laden
      </button>
      <button onClick={handleCharacterClick} title="Charakterbogen öffnen">
        👤 Charakter
      </button>
      <button disabled title="Noch nicht implementiert">
        📚 Zauberbuch
      </button>
      <button disabled title="Noch nicht implementiert">
        🎒 Inventar
      </button>
      
      {showSaveConfirmation && (
        <div className="confirmation-message save-confirmation">
          ✅ Spiel gespeichert!
        </div>
      )}
      {/* {showLoadConfirmation && (
        <div className="confirmation-message load-confirmation">
          ✅ Spiel geladen!
        </div>
      )}
      */}
    </div>
  );
}

export default ActionBar;