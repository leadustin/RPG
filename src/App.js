// src/App.js
import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import CharacterCreationScreen from './components/character_creation/CharacterCreationScreen.js';
import { WorldMap } from './components/worldmap/WorldMap.js';
import { StartScreen } from './components/start_screen/StartScreen.js'; // Importieren
import { loadCharacter, saveCharacter } from './utils/persistence';

const MainGame = ({ character }) => {
  // ... (bestehender MainGame Code bleibt unverändert)
};

function App() {
  const [gameState, setGameState] = useState('start'); // Startzustand ist jetzt 'start'
  const [character, setCharacter] = useState(null);

  const handleNewGame = () => {
    setCharacter(null); // Charakter zurücksetzen
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
                  isGameLoaded={character !== null} 
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
