// src/App.js
import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import CharacterCreationScreen from './components/character_creation/CharacterCreationScreen.js';
import { WorldMap } from './components/worldmap/WorldMap.js';
import { StartScreen } from './components/start_screen/StartScreen.js';
import { loadCharacter, saveCharacter, deleteCharacter } from './utils/persistence';

const MainGame = ({ character }) => {
  // Dieser Teil bleibt unverändert und enthält die Spiellogik nach der Charaktererstellung.
  // Hier würde z.B. die Weltkarte oder die Kampfansicht gerendert.
  return (
    <div>
      <h1>Willkommen im Spiel, {character.name}!</h1>
      <WorldMap />
    </div>
  );
};

function App() {
  const [gameState, setGameState] = useState('start');
  const [character, setCharacter] = useState(null);

  useEffect(() => {
    // Diese Funktion wird einmal beim Laden der App ausgeführt.
    // Hier könnte man z.B. prüfen, ob ein Spielstand vorhanden ist.
    const savedCharacter = loadCharacter();
    if (savedCharacter) {
      // Man könnte den Spieler fragen, ob er das Spiel fortsetzen möchte,
      // oder ihn direkt ins Spiel laden. Aktuell wird auf eine Aktion
      // im Startbildschirm gewartet.
    }
  }, []);

  const handleNewGame = () => {
    setCharacter(null); // Setzt den Charakter zurück
    setGameState('creation');
  };

  const handleLoadGame = () => {
    const savedCharacter = loadCharacter();
    if (savedCharacter) {
      setCharacter(savedCharacter);
      setGameState('ingame');
    } else {
      alert("Kein Spielstand gefunden!");
    }
  };

  const handleSaveGame = () => {
    if (character) {
      saveCharacter(character);
      alert("Spiel gespeichert!");
    }
  };
  
  const handleDeleteGame = () => {
    if (window.confirm("Bist du sicher, dass du den Spielstand löschen möchtest?")) {
      deleteCharacter();
      setCharacter(null); // Setzt den Charakter im aktuellen State zurück
      alert("Spielstand gelöscht!");
    }
  };

  const startGame = (createdCharacter) => {
    setCharacter(createdCharacter);
    setGameState('ingame');
  };

  const renderGameState = () => {
    switch (gameState) {
      case 'start':
        return <StartScreen 
                  onNewGame={handleNewGame} 
                  onLoadGame={handleLoadGame}
                  onSaveGame={handleSaveGame}
                  onDeleteGame={handleDeleteGame}
                  isGameLoaded={character !== null} 
                  saveFileExists={loadCharacter() !== undefined} // Prüft, ob eine Speicherdatei existiert
               />;
      case 'creation':
        return <CharacterCreationScreen onCharacterFinalized={startGame} />;
      case 'ingame':
        return <MainGame character={character} />;
      default:
        return <div>Lade...</div>;
    }
  }

  return (
    <div className="game-wrapper">
      {renderGameState()}
    </div>
  );
}

export default App;
