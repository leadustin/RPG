import React, { useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useGameState } from './hooks/useGameState'; 
import { StartScreen } from './components/start_screen/StartScreen';
import { CharacterCreationScreen } from './components/character_creation/CharacterCreationScreen';
import GameView from './components/game_view/GameView';
import CharacterSheet from './components/character_sheet/CharacterSheet';
import './App.css';

function App() {
  const {
    gameState,
    handleNewGame,
    handleLoadGame,
    handleSaveGame,
    handleDeleteGame,
    handleCharacterCreation,
  } = useGameState();

  const [showCharacterSheet, setShowCharacterSheet] = useState(false);

  const toggleCharacterSheet = () => {
    setShowCharacterSheet(prevState => !prevState);
  };

  const renderScreen = () => {
    switch (gameState.screen) {
      case 'start':
        return (
          <StartScreen
            onNewGame={handleNewGame}
            onLoadGame={handleLoadGame}
            onSaveGame={handleSaveGame}
            onDeleteGame={handleDeleteGame}
            isGameLoaded={!!gameState.character}
            saveFileExists={localStorage.getItem('gameState') !== null}
          />
        );
      case 'character-creation':
        // KORREKTUR HIER: 'onCharacterFinalized' statt 'onFinish'
        return <CharacterCreationScreen onCharacterFinalized={handleCharacterCreation} />;
      case 'game':
        return (
          <GameView
            character={gameState.character}
            onToggleCharacterSheet={toggleCharacterSheet}
          />
        );
      default:
        return (
            <StartScreen
              onNewGame={handleNewGame}
              onLoadGame={handleLoadGame}
              onSaveGame={handleSaveGame}
              onDeleteGame={handleDeleteGame}
              isGameLoaded={!!gameState.character}
              saveFileExists={localStorage.getItem('gameState') !== null}
            />
          );
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      {/* Dieser .App Container zentriert alles */}
      <div className="App">
        {/* Dieser .game-container begrenzt die Breite */}
        <div className="game-container">
          {renderScreen()}
          {showCharacterSheet && <CharacterSheet onClose={toggleCharacterSheet} />}
        </div>
      </div>
    </DndProvider>
  );
}

export default App;