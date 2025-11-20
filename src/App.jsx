// src/App.jsx
import React, { useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useGameState } from "./hooks/useGameState";
import { StartScreen } from "./components/start_screen/StartScreen";
import { CharacterCreationScreen } from "./components/character_creation/CharacterCreationScreen";
import GameView from "./components/game_view/GameView";
import { LevelUpScreen } from "./components/level_up/LevelUpScreen";
import CharacterSheet from "./components/character_sheet/CharacterSheet";
import { TileMap } from "./components/maps/TileMap";
import { SaveSlotManager } from "./components/game_view/SaveSlotManager";
import { loadAutoSave, getSaveSlots } from "./utils/persistence";
import locationsData from "./data/locations.json";
import { EventLog } from "./components/event_log/EventLog";
import "./App.css";

function App() {
  const {
    gameState,
    handleNewGame,
    handleLoadAutoSaveGame,
    handleDeleteGame,
    handleSaveToSlot,
    handleLoadFromSlot,
    handleCharacterCreation,
    handleEquipItem,
    handleUnequipItem,
    handleToggleTwoHanded,
    // +++ NEU: Köcher-Handler importieren +++
    handleFillQuiver,
    handleUnloadQuiver,
    // +++ ENDE NEU +++
    handleEnterLocation,
    handleLeaveLocation,
    handleUpdatePosition,
    handleDiscoverLocation,
    handleConfirmLevelUp
  } = useGameState();

  const [showCharacterSheet, setShowCharacterSheet] = useState(false);
  const [saveManagerMode, setSaveManagerMode] = useState(null);

  const toggleCharacterSheet = () => {
    setShowCharacterSheet((prevState) => !prevState);
  };

  const autoSaveExists = loadAutoSave() !== undefined;
  const manualSaveExists = getSaveSlots().some((slot) => slot !== null);
  const saveFileExists = autoSaveExists || manualSaveExists;

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
            onContinueGame={handleLoadAutoSaveGame}
            onLoadGame={() => setSaveManagerMode("load")}
            onSaveGame={() => setSaveManagerMode("save")}
            onDeleteGame={handleDeleteGame}
            isGameLoaded={!!gameState.character}
            autoSaveExists={autoSaveExists}
            saveFileExists={saveFileExists}
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
            onSaveGame={() => setSaveManagerMode("save")}
            onLoadGame={() => setSaveManagerMode("load")}
            onUpdatePosition={handleUpdatePosition}
            onDiscoverLocation={handleDiscoverLocation}
            saveFileExists={saveFileExists}
          />
        );
      default:
        return (
          <StartScreen
            onNewGame={handleNewGame}
            onContinueGame={handleLoadAutoSaveGame}
            onLoadGame={() => setSaveManagerMode("load")}
            onSaveGame={() => setSaveManagerMode("save")}
            onDeleteGame={handleDeleteGame}
            isGameLoaded={!!gameState.character}
            autoSaveExists={autoSaveExists}
            saveFileExists={saveFileExists}
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
              // +++ NEU: Handler an CharacterSheet übergeben +++
              handleFillQuiver={handleFillQuiver}
              handleUnloadQuiver={handleUnloadQuiver}
              // +++ ENDE NEU +++
            />
          )}

          {gameState.character && gameState.character.pendingLevelUp && (
          <LevelUpScreen
            character={gameState.character}
            onConfirm={handleConfirmLevelUp}
          />
        )}

          {saveManagerMode && (
            <SaveSlotManager
              mode={saveManagerMode}
              character={gameState.character}
              onClose={() => setSaveManagerMode(null)}
              onSave={(slotId, saveName) => {
                handleSaveToSlot(slotId, saveName);
                setSaveManagerMode(null);
              }}
              onLoad={(slotData, slotId) => {
                handleLoadFromSlot(slotData);
                setSaveManagerMode(null);
              }}
            />
          )}
        </div>

        {/* --- LOG-SYSTEM --- */}
        {gameState.screen === "game" && (
          <EventLog entries={gameState.logEntries} />
        )}
        
      </div>
    </DndProvider>
  );
}

export default App;