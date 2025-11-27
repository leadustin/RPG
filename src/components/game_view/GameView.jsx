// src/components/game_view/GameView.jsx
import React, { useState, useEffect } from "react";
import { PartyPortraits } from "./PartyPortraits";
import ActionBar from "./ActionBar";
import { WorldMap } from "../worldmap/WorldMap";
import RestMenu from "./RestMenu";
import LocationView from "../location_view/LocationView";
import locationsData from "../../data/locations.json";
import enemiesData from "../../data/enemies.json";
import { CombatGrid } from "../combat/CombatGrid";
import { CombatResultScreen } from "../combat/CombatResultScreen";
import { useCombat } from "../../hooks/useCombat";
import "./GameView.css";

function GameView({
  character,
  onToggleCharacterSheet,
  onEnterLocation,
  onSaveGame,
  onLoadGame,
  onUpdatePosition,
  onDiscoverLocation,
  saveFileExists,
  onShortRest,
  onLongRest,
  onShopTransaction,
  onCombatVictory, 
  onCombatDefeat
}) {

  const [activeCharacterId, setActiveCharacterId] = useState(character?.id || 'player');
  const [showRestMenu, setShowRestMenu] = useState(false);

  // +++ KAMPF-SYSTEM HOOK +++
  // WICHTIG: Hook IMMER aufrufen, auch wenn character null ist
  const { 
    combatState, 
    startCombat, 
    nextTurn, 
    endCombatSession,
    // Neue Variablen aus useCombat
    selectedAction,
    setSelectedAction,
    handleCombatTileClick
  } = useCombat(character);

  const activeCharacter = character;

  // Early return NACH den Hooks, falls kein Charakter
  if (!character) {
    return <div className="game-view-container">Lädt Charakter...</div>;
  } 

  const handleStartTestCombat = () => {
      const goblins = [enemiesData.enemies[0]]; 
      startCombat(goblins);
  };

  const handleEndCombat = () => {
      if (combatState.result === 'victory' && onCombatVictory) onCombatVictory();
      if (combatState.result === 'defeat' && onCombatDefeat) onCombatDefeat();
      endCombatSession();
  };

  // Handler, wenn ein Slot in der ActionBar geklickt wird
  const handleActionSlotClick = (action) => {
      if (combatState.isActive) {
          // Im Kampf: Aktion auswählen/abwählen
          if (selectedAction && selectedAction.name === action.name) {
              setSelectedAction(null); // Abwählen
          } else {
              setSelectedAction(action); // Auswählen
          }
      } else {
          // Außerhalb des Kampfes: Inventar oder Details anzeigen
          console.log("Außerhalb des Kampfes geklickt:", action);
          // Optional: Hier könntest du Tooltips öffnen, Inventar anzeigen, etc.
      }
  };

  return (
    <div className="game-view-container">
      <div className="top-section">
        <PartyPortraits 
            party={[activeCharacter]} 
            activeCharacterId={activeCharacterId}
            onSelectCharacter={setActiveCharacterId}
        />
        <div className="system-menu-buttons">
           {/* ... Buttons ... */}
        </div>
      </div>

      <div className="middle-section">
        <div className="main-window">
           {combatState.isActive ? (
               <>
                 <CombatGrid 
                    combatState={combatState} 
                    // Hier übergeben wir den neuen Klick-Handler
                    onTileClick={handleCombatTileClick}
                 />
                 {combatState.result && (
                     <CombatResultScreen 
                        result={combatState.result} 
                        onClose={handleEndCombat} 
                     />
                 )}
               </>
           ) : character.location && character.location !== "worldmap" ? (
              <LocationView 
                  locationId={character.location}
                  character={character}
                  onLeaveLocation={() => onEnterLocation("worldmap", character.worldMapPosition)}
                  onShopTransaction={onShopTransaction}
                  onStartCombat={handleStartTestCombat}
              />
           ) : (
              <WorldMap
                character={character}
                onEnterLocation={onEnterLocation}
                onUpdatePosition={onUpdatePosition}
                onDiscoverLocation={onDiscoverLocation}
              />
           )}
        </div>
      </div>

      <div className="bottom-section">
        <div className="action-bar-area">
          <ActionBar
            character={activeCharacter}
            onToggleCharacterSheet={onToggleCharacterSheet}
            onSaveGame={onSaveGame}
            onLoadGame={onLoadGame}
            saveFileExists={saveFileExists}
            onRestClick={() => setShowRestMenu(true)} 
            disabled={!combatState.isActive} // Nur im Kampf voll funktional
            onSlotClick={handleActionSlotClick}
            selectedAction={selectedAction}
          />
        </div>
      </div>

      {showRestMenu && (
        <RestMenu
          character={activeCharacter}
          onShortRest={onShortRest}
          onLongRest={() => { onLongRest(); setShowRestMenu(false); }}
          onClose={() => setShowRestMenu(false)}
        />
      )}
    </div>
  );
}

export default GameView;