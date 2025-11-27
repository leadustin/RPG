// src/components/game_view/GameView.jsx
import React, { useState, useEffect } from "react";
import { PartyPortraits } from "./PartyPortraits";
import ActionBar from "./ActionBar";
import { WorldMap } from "../worldmap/WorldMap";
import RestMenu from "./RestMenu";
import LocationView from "../location_view/LocationView";
import { CombatGrid } from "../combat/CombatGrid"; // +++ NEU +++
import { useCombat } from "../../hooks/useCombat"; // +++ NEU +++
import enemiesData from "../../data/enemies.json"; // +++ NEU (für Testdaten) +++
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
  onShopTransaction
}) {

  const [activeCharacterId, setActiveCharacterId] = useState(character?.id || 'player');
  const [showRestMenu, setShowRestMenu] = useState(false);

  // +++ KAMPF-SYSTEM INTEGRATION +++
  const { combatState, startCombat, moveCombatant, attack, nextTurn } = useCombat(character);

  useEffect(() => {
    const mainCharacterId = character?.id || 'player';
    setActiveCharacterId(mainCharacterId);
  }, [character?.id]);

  // Funktion zum Starten eines Testkampfes (wird an LocationView übergeben)
  const handleStartTestCombat = () => {
    // Startet einen Kampf mit einem Goblin und einem Ork aus den Daten
    // Du kannst hier später dynamische Begegnungen übergeben
    startCombat([enemiesData.goblin, enemiesData.orc]);
  };

  // Klick auf ein Feld im Grid (Bewegung)
  const handleTileClick = (pos) => {
    const activeC = combatState.combatants[combatState.turnIndex];
    
    // Nur bewegen, wenn der Spieler am Zug ist
    if (activeC && activeC.type === 'player') {
      // Hier könnte man noch Distanz-Checks einbauen
      moveCombatant(activeC.id, pos);
    }
  };

  // Klick auf einen Gegner (Angriff)
  const handleCombatantClick = (target) => {
    const activeC = combatState.combatants[combatState.turnIndex];
    
    // Nur angreifen, wenn Spieler am Zug ist und das Ziel ein Gegner ist
    if (activeC && activeC.type === 'player' && target.type === 'enemy') {
        // Einfacher Angriff (ohne spezifische Waffe vorerst)
        attack(activeC.id, target.id, null);
        
        // Optional: Zug automatisch beenden oder manuell per Button
        // nextTurn(); 
    }
  };
  // +++ ENDE KAMPF-LOGIK +++

  const isAtLocation = character?.currentLocation && character.currentLocation !== "worldmap";

  const party = character ? [character] : [];
  const activeCharacter = party.find(c => (c.id || 'player') === activeCharacterId) || character;

  return (
    <div className="game-view-container">
      <div className="top-section">
        <div className="party-portraits-area">
          <PartyPortraits
            party={party}
            activeCharacterId={activeCharacterId}
            onSelectCharacter={setActiveCharacterId}
          />
        </div>
        
        <div className="world-map-area">
           {/* +++ KAMPF ANSICHT (Überschreibt alles andere wenn aktiv) +++ */}
           {combatState.isActive ? (
             <div className="combat-view" style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
               <div style={{ flex: 1, position: 'relative' }}>
                 <CombatGrid 
                   width={12} 
                   height={10}
                   // Hier kannst du später das Hintergrundbild der aktuellen Location nutzen
                   backgroundImg="/src/assets/images/map/map_12x10.webp" 
                   combatants={combatState.combatants}
                   activeCombatantId={combatState.combatants[combatState.turnIndex]?.id}
                   onTileClick={handleTileClick}
                   onCombatantClick={handleCombatantClick}
                 />
               </div>
               
               {/* Einfache Kampf-UI Overlay */}
               <div className="combat-ui" style={{ 
                   position: 'absolute', 
                   bottom: 10, 
                   left: 10, 
                   right: 10, 
                   background: 'rgba(0,0,0,0.8)', 
                   color: 'white', 
                   padding: '10px',
                   borderRadius: '5px',
                   zIndex: 100
               }}>
                 <div className="turn-info" style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                    Runde {combatState.round} | Am Zug: {combatState.combatants[combatState.turnIndex]?.name}
                 </div>
                 
                 <div className="combat-log" style={{ maxHeight: '60px', overflowY: 'auto', fontSize: '0.9em', marginBottom: '10px' }}>
                    {combatState.log.slice(-3).map((l, i) => <div key={i}>{l}</div>)}
                 </div>

                 {/* "Zug Beenden" Button nur für Spieler */}
                 {combatState.combatants[combatState.turnIndex]?.type === 'player' && (
                    <button onClick={nextTurn} style={{ padding: '5px 10px', cursor: 'pointer' }}>
                      Zug beenden
                    </button>
                 )}
               </div>
             </div>
           ) : isAtLocation ? (
              <LocationView 
                  locationId={character.currentLocation}
                  character={character}
                  onLeaveLocation={() => onEnterLocation("worldmap", character.worldMapPosition)}
                  onShopTransaction={onShopTransaction}
                  // +++ Übergebe die Funktion zum Starten des Kampfes an LocationView +++
                  // Du musst in LocationView z.B. einen Button "Kämpfen" einbauen, der diese Prop aufruft
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
          {/* ActionBar wird im Kampf evtl. ausgeblendet oder angepasst */}
          <ActionBar
            character={activeCharacter}
            onToggleCharacterSheet={onToggleCharacterSheet}
            onSaveGame={onSaveGame}
            onLoadGame={onLoadGame}
            saveFileExists={saveFileExists}
            onRestClick={() => setShowRestMenu(true)} 
            // Deaktivieren wenn im Kampf
            disabled={combatState.isActive} 
          />
        </div>
      </div>

      {showRestMenu && (
        <RestMenu
          character={activeCharacter}
          onShortRest={(dice) => {
            onShortRest(dice);
          }}
          onLongRest={() => {
            onLongRest();
            setShowRestMenu(false);
          }}
          onClose={() => setShowRestMenu(false)}
        />
      )}
    </div>
  );
}

export default GameView;