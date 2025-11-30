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

  // 1. HIER FEHLTEN DIE DRAG-HANDLER
  const { 
    combatState, 
    startCombat, 
    nextTurn, 
    endCombatSession,
    selectedAction,
    setSelectedAction,
    handleCombatTileClick,
    queuedAction,
    cancelAction,
    executeTurn,
    // NEU: Drag State & Handler müssen hier rausgeholt werden!
    dragState,
    handleTokenDragStart,
    handleGridDragMove,
    handleGridDragEnd
  } = useCombat(character);

  // --- KAMPF-LOG ---
  const lastLogLength = useRef(0);
  useEffect(() => {
      if (combatState.isActive) {
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
  }, [combatState.log, combatState.isActive, onAddLogEntry]);

  // --- SIEG LOGIK ---
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
  const isPlayerTurn = combatState.isActive && combatState.combatants[combatState.turnIndex]?.type === 'player';

  const currentLocation = locationsData.find(l => l.id === character.currentLocation);
  const currentMapId = currentLocation?.mapId || "cave_entrance"; 

  const handleStartLocationCombat = () => {
      if (!currentLocation || !currentLocation.enemies || currentLocation.enemies.length === 0) return;
      const combatEnemies = [];
      currentLocation.enemies.forEach((enemyConfig) => {
          const enemyTemplate = enemiesData[enemyConfig.id];
          if (enemyTemplate) {
              for (let i = 0; i < enemyConfig.count; i++) {
                  combatEnemies.push({ ...enemyTemplate, instanceId: `${enemyConfig.id}_${i}_${Date.now()}` });
              }
          }
      });
      if (combatEnemies.length > 0) startCombat(combatEnemies);
  };

  const handleEndCombat = () => {
      if (combatState.result === 'victory' && onCombatVictory) onCombatVictory();
      if (combatState.result === 'defeat' && onCombatDefeat) onCombatDefeat();
      endCombatSession();
  };

  const handleActionSlotClick = (action) => {
      if (combatState.isActive && isPlayerTurn) {
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
           {combatState.isActive ? (
             <div className="combat-view" style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
               
               <TurnOrderBar 
                   combatants={combatState.combatants} 
                   activeIndex={combatState.turnIndex} 
               />

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
                 <CombatGrid 
                   mapId={currentMapId} 
                   width={20} 
                   height={15}
                   combatants={combatState.combatants}
                   activeCombatantId={combatState.combatants[combatState.turnIndex]?.id}
                   selectedAction={selectedAction}
                   movementLeft={combatState.turnResources.movementLeft}
                   onTileClick={(x, y) => handleCombatTileClick(x, y)}
                   queuedAction={queuedAction}
                   onContextMenu={cancelAction}
                   
                   // 2. HIER WERDEN DIE NEUEN PROPS ÜBERGEBEN
                   dragState={dragState}
                   onTokenDragStart={handleTokenDragStart}
                   onGridDragMove={handleGridDragMove}
                   onGridDragEnd={handleGridDragEnd}
                 />
               </div>
               
             </div>
           ) : character.currentLocation && character.currentLocation !== "worldmap" ? (
              <LocationView 
                  locationId={character.currentLocation}
                  character={character}
                  onLeaveLocation={() => onEnterLocation("worldmap", character.worldMapPosition)}
                  onShopTransaction={onShopTransaction}
                  onStartCombat={handleStartLocationCombat}
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
            disabled={!combatState.isActive || !isPlayerTurn}
            onSlotClick={handleActionSlotClick}
            selectedAction={selectedAction}
          />
        </div>

        {combatState.isActive && !combatState.result && (
            <div style={{ 
                position: 'absolute', 
                right: '30px', 
                bottom: '25px', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'flex-end',
                gap: '5px',
                zIndex: 100
            }}>
               <button 
                   onClick={queuedAction ? executeTurn : nextTurn}
                   disabled={!isPlayerTurn} 
                   style={{ 
                       padding: '12px 30px', 
                       fontSize: '1.1rem', 
                       backgroundColor: queuedAction ? '#2ecc71' : '#d4af37',
                       color: queuedAction ? '#fff' : '#000',
                       border: '2px solid #111',
                       borderRadius: '6px',
                       fontWeight: 'bold',
                       cursor: isPlayerTurn ? 'pointer' : 'not-allowed',
                       boxShadow: '0 4px 8px rgba(0,0,0,0.6)',
                       whiteSpace: 'nowrap',
                       transition: 'all 0.2s'
                   }}
               >
                   {queuedAction ? "Ausführen" : "Zug beenden"}
               </button>
               
               {queuedAction && (
                   <div style={{
                       fontSize:'0.75rem', color:'#ccc', 
                       textShadow:'1px 1px 2px black',
                       pointerEvents: 'none'
                   }}>
                       (Rechtsklick Abbruch)
                   </div>
               )}
            </div>
        )}
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