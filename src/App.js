import React, { useState } from 'react';
import './App.css';
import { StartScreen } from './components/start_screen/StartScreen';
import { CharacterCreationScreen } from './components/character_creation/CharacterCreationScreen';
import { GameView } from './components/game_view/GameView';

function App() {
  const [gameState, setGameState] = useState('START_SCREEN');
  const [character, setCharacter] = useState(null);

  const handleCharacterFinalized = (finalizedCharacter) => {
    setCharacter(finalizedCharacter);
    setGameState('WORLD_MAP');
  };
  
  const handleLoadGame = (loadedCharacter) => {
    setCharacter(loadedCharacter);
    setGameState('WORLD_MAP');
  };

  // Die Wrapper-Divs wurden entfernt
  return (
    <div className="App"> 
      {gameState === 'START_SCREEN' && <StartScreen onNewGame={() => setGameState('CHARACTER_CREATION')} onLoadGame={handleLoadGame} />}
      {gameState === 'CHARACTER_CREATION' && <CharacterCreationScreen onCharacterFinalized={handleCharacterFinalized} />}
      {gameState === 'WORLD_MAP' && character && <GameView character={character} />}
    </div>
  );
}

export default App;