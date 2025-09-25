import React, { useState } from 'react';
import './ActionBar.css';

function ActionBar({ character, onToggleCharacterSheet, onSaveGame, onLoadGame }) {
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [showLoadConfirmation, setShowLoadConfirmation] = useState(false);

  const handleCharacterClick = () => {
    console.log('Character button clicked', character);
    onToggleCharacterSheet();
  };

  const handleSaveClick = () => {
    if (onSaveGame) {
      onSaveGame();
      setShowSaveConfirmation(true);
      setTimeout(() => setShowSaveConfirmation(false), 2000); // 2 Sekunden anzeigen
    }
  };

  const handleLoadClick = () => {
    if (onLoadGame) {
      onLoadGame();
      setShowLoadConfirmation(true);
      setTimeout(() => setShowLoadConfirmation(false), 2000); // 2 Sekunden anzeigen
    }
  };

  // Prüfen ob ein Spielstand existiert
  const saveExists = localStorage.getItem('rpg_character') !== null;

  return (
    <div className="action-bar">
      <button onClick={handleSaveClick} title="Spiel speichern">
        💾 Speichern
      </button>
      <button 
        onClick={handleLoadClick} 
        disabled={!saveExists}
        title={saveExists ? "Spiel laden" : "Kein Spielstand vorhanden"}
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
      
      {/* Bestätigungsmeldungen */}
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