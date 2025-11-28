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
  const { 
    combatState, 
    startCombat, 
    nextTurn, 
    endCombatSession,
    selectedAction,
    setSelectedAction,
    handleCombatTileClick
  } = useCombat(character);

  // Early return NACH den Hooks, falls kein Charakter
  if (!character) {
    return <div className="game-view-container">Lädt Charakter...</div>;
  }

  const activeCharacter = character;

  // --- NEU: Dynamischer Kampfstart basierend auf Location-Daten ---
  const handleStartLocationCombat = () => {
      const currentLocationId = character.currentLocation;
      const locationData = locationsData.find(loc => loc.id === currentLocationId);

      // Prüfen, ob der Ort existiert und Gegner hat
      if (!locationData || !locationData.enemies || locationData.enemies.length === 0) {
          console.log("Keine Gegner an diesem Ort definiert.");
          return;
      }

      const combatEnemies = [];

      // Über die Gegner-Konfiguration des Ortes iterieren
      locationData.enemies.forEach((enemyConfig) => {
          // Daten aus enemies.json holen (z.B. enemiesData["goblin"])
          const enemyTemplate = enemiesData[enemyConfig.id];

          if (enemyTemplate) {
              // So viele Gegner erstellen, wie 'count' angibt
              for (let i = 0; i < enemyConfig.count; i++) {
                  // WICHTIG: Kopie erstellen, damit jeder Gegner eigene HP hat
                  combatEnemies.push({
                      ...enemyTemplate,
                      instanceId: `${enemyConfig.id}_${i}_${Date.now()}` // Einzigartige ID für interne Logik
                  });
              }
          } else {
              console.warn(`Gegner-ID "${enemyConfig.id}" nicht in enemies.json gefunden!`);
          }
      });

      if (combatEnemies.length > 0) {
          startCombat(combatEnemies);
      } else {
          console.log("Keine gültigen Gegnerdaten gefunden.");
      }
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
           {/* +++ KAMPF-MODUS +++ */}
           {combatState.isActive ? (
             <div className="combat-view" style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
               
               {/* Ergebnis Screen (Sieg/Niederlage) */}
               {combatState.result && (
                 <CombatResultScreen 
                    result={combatState.result}
                    onClose={handleEndCombat}
                 />
               )}

               {/* Das Grid */}
               <div style={{ 
                   flex: 1, 
                   position: 'relative', 
                   cursor: selectedAction ? 'crosshair' : 'default',
                   display: 'flex',            // Zentrierung
                   justifyContent: 'center',   // Zentrierung
                   alignItems: 'center',       // Zentrierung
                   overflow: 'auto'
               }}>
                 <CombatGrid 
                   width={12}  // Optional: Breite anpassen
                   height={8}  // Optional: Höhe anpassen
                   
                   // KORREKTUR: Daten explizit aus combatState holen
                   combatants={combatState.combatants}
                   activeCombatantId={combatState.combatants[combatState.turnIndex]?.id}
                   
                   onTileClick={(x, y) => handleCombatTileClick(x, y)}
                 />
               </div>
               
               {/* UI (nur wenn kein Ergebnis angezeigt wird) */}
               {!combatState.result && (
                 <>
                   {/* Mini-Log */}
                   <div className="combat-log-overlay" style={{ 
                       position: 'absolute', top: 10, right: 10, width: '250px', 
                       background: 'rgba(0,0,0,0.6)', color: '#eee', 
                       padding: '10px', fontSize: '0.85rem', pointerEvents: 'none', borderRadius: '4px'
                   }}>
                      {combatState.log.slice(-4).map((l, i) => <div key={i} style={{marginBottom:'4px'}}>{l}</div>)}
                   </div>
                 </>
               )}
             </div>
           ) : character.currentLocation && character.currentLocation !== "worldmap" ? (
              /* +++ ORTS-ANSICHT +++ */
              <LocationView 
                  locationId={character.currentLocation}
                  character={character}
                  onLeaveLocation={() => onEnterLocation("worldmap", character.worldMapPosition)}
                  onShopTransaction={onShopTransaction}
                  onStartCombat={handleStartLocationCombat} // Hier die neue Funktion nutzen
              />
           ) : (
              /* +++ WELTKARTE +++ */
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
            disabled={!combatState.isActive}
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