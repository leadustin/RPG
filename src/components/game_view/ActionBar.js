// src/components/game_view/ActionBar.js

import React, { useState } from 'react';
import './ActionBar.css';

function ActionBar({ character, onToggleCharacterSheet, onSaveGame, onLoadGame }) {
  // Die confirmation states könnten später entfernt werden, wenn alles über den Manager läuft.
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [showLoadConfirmation, setShowLoadConfirmation] = useState(false);

  const handleCharacterClick = () => {
    console.log('Character button clicked', character);
    onToggleCharacterSheet();
  };

  // Diese Funktion ruft jetzt direkt die Prop auf, die den SaveSlotManager öffnet.
  const handleSaveClick = () => {
    if (onSaveGame) {
      onSaveGame(); 
    }
  };

  const handleLoadClick = () => {
    if (onLoadGame) {
      onLoadGame();
      setShowLoadConfirmation(true);
      setTimeout(() => setShowLoadConfirmation(false), 2000);
    }
  };

  const saveExists = localStorage.getItem('rpg_character') !== null;

  return (
    <div className="action-bar">
      {/* Dieser Button öffnet jetzt den SaveSlotManager */}
      <button onClick={handleSaveClick} title="Spiel speichern">
        💾 Speichern
      </button>
      <button 
        onClick={handleLoadClick} 
        disabled={!saveExists}
        title={saveExists ? "Spiel laden (Schnellladen)" : "Kein Spielstand vorhanden"}
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
      {showLoadConfirmation && (
        <div className="confirmation-message load-confirmation">
          ✅ Spiel geladen!
        </div>
      )}
    </div>
  );
}

export default ActionBar;