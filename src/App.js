import React, { useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useGameState } from "./hooks/useGameState";
import { StartScreen } from "./components/start_screen/StartScreen";
import { CharacterCreationScreen } from "./components/character_creation/CharacterCreationScreen";
import GameView from "./components/game_view/GameView";
import CharacterSheet from "./components/character_sheet/CharacterSheet";
import LocationView from "./components/location_view/LocationView";
import "./App.css";

function App() {
  const {
    gameState,
    handleNewGame,
    handleLoadGame,
    handleSaveGame,
    handleDeleteGame,
    handleCharacterCreation,
    handleEquipItem,
    handleUnequipItem,
    handleToggleTwoHanded,
    handleEnterLocation,
    handleLeaveLocation,
  } = useGameState();

  const [showCharacterSheet, setShowCharacterSheet] = useState(false);

  const toggleCharacterSheet = () => {
    setShowCharacterSheet((prevState) => !prevState);
  };

  const renderScreen = () => {
    // --- NEU: Prüfen, ob der Spieler an einem Ort ist ---
    if (gameState.character && gameState.character.currentLocation !== 'worldmap') {
      return (
        <LocationView
          locationId={gameState.character.currentLocation}
          onLeaveLocation={handleLeaveLocation}
        />
      );
    }

    switch (gameState.screen) {
      case "start":
        return (
          <StartScreen
            onNewGame={handleNewGame}
            onLoadGame={handleLoadGame}
            onSaveGame={handleSaveGame}
            onDeleteGame={handleDeleteGame}
            isGameLoaded={!!gameState.character}
            saveFileExists={localStorage.getItem("character") !== null}
          />
        );
      case "character-creation":
        return (
          <CharacterCreationScreen
            onCharacterFinalized={handleCharacterCreation}
          />
        );
      case "game":
        return (
          <GameView
            character={gameState.character}
            onToggleCharacterSheet={toggleCharacterSheet}
            onEnterLocation={handleEnterLocation} 
          />
        );
      default:
        return (
          <StartScreen
            onNewGame={handleNewGame}
            onLoadGame={handleLoadGame}
            isGameLoaded={!!gameState.character}
            saveFileExists={localStorage.getItem("character") !== null}
          />
        );
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="App">
        <div className="game-container">
          {renderScreen()}
          {showCharacterSheet && (
            <CharacterSheet
              character={gameState.character}
              onClose={toggleCharacterSheet}
              handleEquipItem={handleEquipItem}
              handleUnequipItem={handleUnequipItem}
              handleToggleTwoHanded={handleToggleTwoHanded}
            />
          )}
        </div>
      </div>
    </DndProvider>
  );
}

export default App;
