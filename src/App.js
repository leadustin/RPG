// src/App.js

import React, { useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useGameState } from "./hooks/useGameState";
import { StartScreen } from "./components/start_screen/StartScreen";
import { CharacterCreationScreen } from "./components/character_creation/CharacterCreationScreen";
import GameView from "./components/game_view/GameView";
import CharacterSheet from "./components/character_sheet/CharacterSheet";
import { TileMap } from "./components/maps/TileMap";
import locationsData from "./data/locations.json";
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
    handleUpdatePosition,
  } = useGameState();

  const [showCharacterSheet, setShowCharacterSheet] = useState(false);

  const toggleCharacterSheet = () => {
    setShowCharacterSheet((prevState) => !prevState);
  };

  const renderScreen = () => {
    const currentLocationId = gameState.character?.currentLocation;
    if (currentLocationId && currentLocationId !== "worldmap") {
      const location = locationsData.find(
        (loc) => loc.id === currentLocationId
      );

      if (location && location.mapFile) {
        return (
          <TileMap
            mapFile={location.mapFile}
            character={gameState.character}
            onLeaveLocation={handleLeaveLocation}
            onUpdatePosition={handleUpdatePosition}
          />
        );
      }

      return (
        <div>
          <h1>{location?.name || "Unbekannter Ort"}</h1>
          <p>{location?.description || "Keine Beschreibung verfügbar."}</p>
          <button onClick={handleLeaveLocation}>Zurück zur Weltkarte</button>
        </div>
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
            saveFileExists={localStorage.getItem("rpg_character") !== null}
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
            onSaveGame={handleSaveGame}
            onLoadGame={handleLoadGame}
            onUpdatePosition={handleUpdatePosition}
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
            saveFileExists={localStorage.getItem("rpg_character") !== null}
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
