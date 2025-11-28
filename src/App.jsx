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
import { SaveSlotManager } from "./components/game_view/SaveSlotManager";
import { loadAutoSave, getSaveSlots } from "./utils/persistence";
import { EventLog } from "./components/event_log/EventLog";
// +++ FIX: Fehlender Import für Item-Datenbank +++
import allItems from "./utils/itemLoader"; 
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
    handleFillQuiver,
    handleUnloadQuiver,
    handleEnterLocation,
    handleLeaveLocation,
    handleUpdatePosition,
    handleDiscoverLocation,
    handleConfirmLevelUp,
    handleShortRest,
    handleLongRest,
    handleShopTransaction,
    handleUpdateCharacter,
    handleCastSpell,
    handleUnpackItem,
    handleDestroyItem
  } = useGameState();

  const [showCharacterSheet, setShowCharacterSheet] = useState(false);
  const [saveManagerMode, setSaveManagerMode] = useState(null);

  const toggleCharacterSheet = () => {
    setShowCharacterSheet((prevState) => !prevState);
  };

  // +++ FIX: Funktion aktualisiert, um Loot entgegenzunehmen +++
  const handleCombatVictory = (earnedXp, remainingHp, lootResult) => {
    console.log(`App: Sieg verarbeitet.`, { earnedXp, remainingHp, lootResult });

    if (gameState.character) {
      const currentStats = gameState.character.stats || {};
      const safeHp = (typeof remainingHp === 'number') ? remainingHp : currentStats.hp;
      
      let updatedCharacter = {
        ...gameState.character,
        // Erfahrung aktualisieren (experience statt xp)
        experience: (gameState.character.experience || 0) + earnedXp,
        stats: {
          ...currentStats,
          hp: safeHp
        }
      };

      // --- LOOT VERARBEITEN ---
      if (lootResult) {
          // 1. Gold hinzufügen
          if (lootResult.gold > 0) {
              const currentGold = updatedCharacter.wallet?.gold || 0;
              updatedCharacter.wallet = {
                  ...updatedCharacter.wallet,
                  gold: currentGold + lootResult.gold
              };
          }

          // 2. Items hinzufügen
          if (lootResult.items && lootResult.items.length > 0) {
              const newInventory = [...(updatedCharacter.inventory || [])];
              
              lootResult.items.forEach(itemId => {
                  // Hier trat der Fehler auf: allItems war nicht definiert
                  const itemDef = allItems.find(i => i.id === itemId);
                  
                  if (itemDef) {
                      newInventory.push({
                          ...itemDef,
                          instanceId: crypto.randomUUID(), 
                          quantity: 1
                      });
                      console.log(`Loot erhalten: ${itemDef.name}`);
                  } else {
                      console.warn(`Loot-Item nicht gefunden in Datenbank: ${itemId}`);
                  }
              });
              
              updatedCharacter.inventory = newInventory;
          }
      }

      handleUpdateCharacter(updatedCharacter);
    }
  };

  const handleCombatDefeat = () => {
    console.log("App: Niederlage registriert.");
  };

  const autoSaveExists = loadAutoSave() !== undefined;
  const manualSaveExists = getSaveSlots().some((slot) => slot !== null);
  const saveFileExists = autoSaveExists || manualSaveExists;

  const party = gameState.character ? [gameState.character] : [];

  const renderScreen = () => {
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
            onShortRest={handleShortRest}
            onLongRest={handleLongRest}
            onShopTransaction={handleShopTransaction}
            onCombatVictory={handleCombatVictory}
            onCombatDefeat={handleCombatDefeat}
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
              party={party}
              onClose={toggleCharacterSheet}
              onUpdateCharacter={handleUpdateCharacter}
              onCastSpell={handleCastSpell}
              handleEquipItem={handleEquipItem}
              handleUnequipItem={handleUnequipItem}
              handleToggleTwoHanded={handleToggleTwoHanded}
              handleFillQuiver={handleFillQuiver}
              handleUnloadQuiver={handleUnloadQuiver}
              handleUnpackItem={handleUnpackItem}
              handleDestroyItem={handleDestroyItem}
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

        {gameState.screen === "game" && (
          <EventLog entries={gameState.logEntries} />
        )}
      </div>
    </DndProvider>
  );
}

export default App;