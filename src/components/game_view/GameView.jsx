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
// +++ FIX: Fehlender Import hinzugefügt +++
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
  onCombatDefeat
}) {

  const [activeCharacterId, setActiveCharacterId] = useState(character?.id || 'player');
  const [showRestMenu, setShowRestMenu] = useState(false);

  const { 
    combatState, 
    startCombat, 
    nextTurn, 
    endCombatSession,
    selectedAction,
    setSelectedAction,
    handleCombatTileClick
  } = useCombat(character);

  // +++ FIX: Loot-Logik integriert (verursachte vorher den Fehler ohne Import) +++
  useEffect(() => {
      if (combatState.result === 'victory') {
          console.log("GameView: Sieg - Berechne XP und Loot...");
          
          // 1. XP berechnen
          const enemies = combatState.combatants.filter(c => c.type === 'enemy');
          const totalXp = enemies.reduce((sum, enemy) => sum + (enemy.xp || 0), 0);

          // 2. LOOT BERECHNEN
          let totalGold = 0;
          let droppedItems = [];

          enemies.forEach(enemy => {
              // A) Gold würfeln
              if (enemy.loot && enemy.loot.gold_dice) {
                  const diceStr = enemy.loot.gold_dice.replace(/W/gi, 'd');
                  try {
                      // Hier trat der Fehler auf: rollDiceString war nicht definiert
                      const roll = rollDiceString(diceStr);
                      const goldAmount = (typeof roll === 'object') ? roll.total : roll;
                      totalGold += goldAmount;
                  } catch (e) {
                      console.warn("Fehler beim Goldwürfeln:", e);
                  }
              }

              // B) Items würfeln (40% Chance)
              if (enemy.loot && enemy.loot.items && Array.isArray(enemy.loot.items)) {
                  enemy.loot.items.forEach(itemId => {
                      if (Math.random() <= 0.4) {
                          droppedItems.push(itemId);
                      }
                  });
              }
          });

          // 3. HP holen
          const playerCombatant = combatState.combatants.find(c => c.type === 'player');
          const remainingHp = playerCombatant ? playerCombatant.hp : 0;

          const timer = setTimeout(() => {
              if (onCombatVictory) {
                  // Übergabe: XP, HP, Loot-Objekt
                  onCombatVictory(totalXp, remainingHp, { gold: totalGold, items: droppedItems });
              }
              endCombatSession();
          }, 2000);

          return () => clearTimeout(timer);
      }
  }, [combatState.result]);

  if (!character) {
    return <div className="game-view-container">Lädt Charakter...</div>;
  }

  const activeCharacter = character;

  const handleStartLocationCombat = () => {
      const currentLocationId = character.currentLocation;
      const locationData = locationsData.find(loc => loc.id === currentLocationId);

      if (!locationData || !locationData.enemies || locationData.enemies.length === 0) {
          console.log("Keine Gegner an diesem Ort definiert.");
          return;
      }

      const combatEnemies = [];
      locationData.enemies.forEach((enemyConfig) => {
          const enemyTemplate = enemiesData[enemyConfig.id];
          if (enemyTemplate) {
              for (let i = 0; i < enemyConfig.count; i++) {
                  combatEnemies.push({
                      ...enemyTemplate,
                      instanceId: `${enemyConfig.id}_${i}_${Date.now()}` 
                  });
              }
          }
      });

      if (combatEnemies.length > 0) {
          startCombat(combatEnemies);
      }
  };

  const handleEndCombat = () => {
      if (combatState.result === 'victory' && onCombatVictory) onCombatVictory();
      if (combatState.result === 'defeat' && onCombatDefeat) onCombatDefeat();
      endCombatSession();
  };

  const handleActionSlotClick = (action) => {
      if (combatState.isActive) {
          if (selectedAction && selectedAction.name === action.name) {
              setSelectedAction(null); 
          } else {
              console.log("Waffe ausgewählt:", action.name);
              setSelectedAction(action); 
          }
      }
  };

  const isPlayerTurn = combatState.isActive && combatState.combatants[combatState.turnIndex]?.type === 'player';

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
                   display: 'flex',
                   justifyContent: 'center',
                   alignItems: 'center',
                   overflow: 'auto',
                   background: '#222'
               }}>
                 <CombatGrid 
                   width={12}
                   height={8}
                   combatants={combatState.combatants}
                   activeCombatantId={combatState.combatants[combatState.turnIndex]?.id}
                   selectedAction={selectedAction}
                   movementLeft={combatState.turnResources.movementLeft}
                   onTileClick={(x, y) => handleCombatTileClick(x, y)}
                 />
               </div>
               
               {!combatState.result && (
                 <>
                   <div className="combat-log-overlay" style={{ 
                       position: 'absolute', top: 10, right: 10, width: '300px', 
                       background: 'rgba(0,0,0,0.8)', color: '#eee', 
                       padding: '10px', fontSize: '0.85rem', pointerEvents: 'none', borderRadius: '4px',
                       maxHeight: '200px', overflowY: 'auto'
                   }}>
                      {combatState.log.slice(-6).map((l, i) => <div key={i} style={{marginBottom:'4px', borderBottom:'1px solid #444'}}>{l}</div>)}
                   </div>

                   <div style={{ position: 'absolute', bottom: 20, right: 20, pointerEvents: 'auto' }}>
                       <button 
                           onClick={nextTurn}
                           disabled={!isPlayerTurn} 
                           style={{ 
                               padding: '12px 24px', 
                               fontSize: '1.1rem', 
                               cursor: isPlayerTurn ? 'pointer' : 'not-allowed',
                               backgroundColor: isPlayerTurn ? '#d4af37' : '#555',
                               color: isPlayerTurn ? '#000' : '#888',
                               border: '2px solid #222',
                               borderRadius: '5px',
                               fontWeight: 'bold',
                               boxShadow: '0 4px 6px rgba(0,0,0,0.5)'
                           }}
                       >
                           {isPlayerTurn ? "Runde beenden ⌛" : `Gegnerzug...`}
                       </button>
                   </div>
                 </>
               )}
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

      <div className="bottom-section">
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