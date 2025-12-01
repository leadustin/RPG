// src/components/game_view/GameView.jsx
import React, { useState, useEffect, useRef } from "react";
import { PartyPortraits } from "./PartyPortraits";
import ActionBar from "./ActionBar";
import { WorldMap } from "../worldmap/WorldMap";
import RestMenu from "./RestMenu";
import LocationView from "../location_view/LocationView";
import locationsData from "../../data/locations.json";
import enemiesData from "../../data/enemies.json";
import { CombatGrid } from "../combat/CombatGrid";
import { CombatResultScreen } from "../combat/CombatResultScreen";
import { TurnOrderBar } from "../combat/TurnOrderBar"; 
import { useCombat } from "../../hooks/useCombat";
import { rollDiceString } from "../../utils/dice"; 
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
  onCombatDefeat,
  onAddLogEntry
}) {

  const [activeCharacterId, setActiveCharacterId] = useState(character?.id || 'player');
  const [showRestMenu, setShowRestMenu] = useState(false);

  const { 
    combatState, 
    initializeMap, 
    nextTurn, 
    endCombatSession,
    selectedAction,
    setSelectedAction,
    handleCombatTileClick,
    queuedAction,
    cancelAction,
    executeTurn,
    dragState,
    handleTokenDragStart,
    handleGridDragMove,
    handleGridDragEnd,
    handleDragCancel
  } = useCombat(character);

  // --- ORT & MAP LADEN (STRIKT) ---
  const currentLocationId = character?.currentLocation;
  const locationData = locationsData.find(l => l.id === currentLocationId);
  
  // Wir nutzen strikt die ID aus der JSON. Kein Fallback.
  const currentMapId = locationData?.mapId;

  useEffect(() => {
      // Nur laden, wenn mapId in den Daten existiert
      if (!combatState.isMapLoaded && locationData && locationData.mapId) {
          const combatEnemies = [];
          if (locationData.enemies) {
              locationData.enemies.forEach((enemyConfig) => {
                  const template = enemiesData[enemyConfig.id];
                  if (template) {
                      for (let i = 0; i < enemyConfig.count; i++) {
                          combatEnemies.push({ 
                              ...template, 
                              instanceId: `${enemyConfig.id}_${i}_${Date.now()}` 
                          });
                      }
                  }
              });
          }
          initializeMap(combatEnemies);
      }
  }, [locationData, combatState.isMapLoaded, initializeMap]);


  // --- LOGGING ---
  const lastLogLength = useRef(0);
  useEffect(() => {
      if (combatState.isMapLoaded) { 
          const newLogs = combatState.log.slice(lastLogLength.current);
          if (newLogs.length > 0) {
              newLogs.forEach(msg => {
                  if (onAddLogEntry) onAddLogEntry(msg, 'combat');
              });
              lastLogLength.current = combatState.log.length;
          }
      } else {
          lastLogLength.current = 0;
      }
  }, [combatState.log, combatState.isMapLoaded, onAddLogEntry]);

  // --- SIEG ---
  useEffect(() => {
      if (combatState.result === 'victory') {
          const enemies = combatState.combatants.filter(c => c.type === 'enemy');
          const totalXp = enemies.reduce((sum, enemy) => sum + (enemy.xp || 0), 0);
          let totalGold = 0;
          let droppedItems = [];

          enemies.forEach(enemy => {
              if (enemy.loot && enemy.loot.gold_dice) {
                  const diceStr = enemy.loot.gold_dice.replace(/W/gi, 'd');
                  try {
                      const roll = rollDiceString(diceStr);
                      const goldAmount = (typeof roll === 'object') ? roll.total : roll;
                      totalGold += goldAmount;
                  } catch (e) { console.warn("Fehler Gold:", e); }
              }
              if (enemy.loot && enemy.loot.items && Array.isArray(enemy.loot.items)) {
                  enemy.loot.items.forEach(itemId => {
                      if (Math.random() <= 0.4) droppedItems.push(itemId);
                  });
              }
          });

          const playerCombatant = combatState.combatants.find(c => c.type === 'player');
          const remainingHp = playerCombatant ? playerCombatant.hp : 0;

          const timer = setTimeout(() => {
              if (onCombatVictory) {
                  onCombatVictory(totalXp, remainingHp, { gold: totalGold, items: droppedItems });
              }
              endCombatSession();
          }, 2000);
          return () => clearTimeout(timer);
      }
  }, [combatState.result]);

  if (!character) return <div>Lädt...</div>;

  const activeCharacter = character;
  const isPlayerTurn = !combatState.isActive || (combatState.isActive && combatState.combatants[combatState.turnIndex]?.type === 'player');
  const showMapMode = combatState.isMapLoaded;

  const handleEndCombat = () => {
      if (combatState.result === 'victory' && onCombatVictory) onCombatVictory();
      if (combatState.result === 'defeat' && onCombatDefeat) onCombatDefeat();
      endCombatSession();
  };

  const handleActionSlotClick = (action) => {
      if (showMapMode && isPlayerTurn) {
          if (queuedAction) cancelAction(); 
          if (selectedAction && selectedAction.name === action.name) {
              setSelectedAction(null); 
          } else {
              setSelectedAction(action); 
          }
      }
  };

  return (
    <div className="game-view-container">
      <div className="top-section">
        <div className="party-portraits-area">
          <PartyPortraits
            party={[activeCharacter]}
            activeCharacterId={activeCharacterId}
            onSelectCharacter={setActiveCharacterId}
          />
        </div>
        
        <div className="world-map-area">
           {showMapMode ? (
             <div className="combat-view" style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
               
               {combatState.isActive && (
                   <TurnOrderBar 
                       combatants={combatState.combatants} 
                       activeIndex={combatState.turnIndex} 
                   />
               )}

               {combatState.result && (
                 <CombatResultScreen 
                    result={combatState.result}
                    onClose={handleEndCombat}
                 />
               )}

               <div style={{ 
                   flex: 1, 
                   position: 'relative', 
                   cursor: selectedAction ? 'crosshair' : 'default',
                   overflow: 'hidden',
                   background: '#222'
               }}>
                 {/* Hier übergeben wir strikt die mapId aus der JSON */}
                 <CombatGrid 
                   mapId={currentMapId} 
                   width={20} 
                   height={15}
                   combatants={combatState.combatants}
                   activeCombatantId={combatState.combatants[combatState.turnIndex]?.id}
                   selectedAction={selectedAction}
                   movementLeft={combatState.isActive ? combatState.turnResources.movementLeft : 999}
                   onTileClick={(x, y) => handleCombatTileClick(x, y)}
                   queuedAction={queuedAction}
                   onContextMenu={cancelAction}
                   dragState={dragState}
                   onTokenDragStart={handleTokenDragStart}
                   onGridDragMove={handleGridDragMove}
                   onGridDragEnd={handleGridDragEnd}
                 />
               </div>
               
               <div style={{ position: 'absolute', bottom: 20, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'auto', gap: '5px' }}>
                   {(combatState.isActive || queuedAction) && (
                       <button 
                           onClick={queuedAction ? executeTurn : nextTurn}
                           disabled={!isPlayerTurn} 
                           style={{ 
                               padding: '15px 50px', 
                               fontSize: '1.2rem', 
                               backgroundColor: queuedAction ? '#2ecc71' : '#d4af37',
                               color: queuedAction ? '#fff' : '#000',
                               border: '2px solid #222',
                               borderRadius: '8px',
                               fontWeight: 'bold',
                               cursor: isPlayerTurn ? 'pointer' : 'not-allowed',
                               boxShadow: '0 4px 6px rgba(0,0,0,0.5)',
                               transition: 'all 0.2s'
                           }}
                       >
                           {queuedAction ? "Aktion ausführen" : "Zug beenden"} ⌛
                       </button>
                   )}
                   
                   {queuedAction && (
                       <div style={{
                           color: '#fff', fontSize:'0.8rem', 
                           textShadow: '1px 1px 2px black', 
                           backgroundColor: 'rgba(0,0,0,0.5)', padding: '2px 8px', borderRadius: '4px'
                       }}>
                           Rechtsklick zum Abbrechen
                       </div>
                   )}
               </div>
             </div>
           ) : character.currentLocation && character.currentLocation !== "worldmap" ? (
              <LocationView 
                  locationId={character.currentLocation}
                  character={character}
                  onLeaveLocation={() => onEnterLocation("worldmap", character.worldMapPosition)}
                  onShopTransaction={onShopTransaction}
                  onStartCombat={() => {}} 
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

      <div className="bottom-section" style={{ position: 'relative' }}>
        <div className="action-bar-area">
          <ActionBar
            character={activeCharacter}
            onToggleCharacterSheet={onToggleCharacterSheet}
            onSaveGame={onSaveGame}
            onLoadGame={onLoadGame}
            saveFileExists={saveFileExists}
            onRestClick={() => setShowRestMenu(true)} 
            disabled={!showMapMode || !isPlayerTurn}
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