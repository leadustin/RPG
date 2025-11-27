// src/components/game_view/GameView.jsx
import React, { useState, useEffect } from "react";
import { PartyPortraits } from "./PartyPortraits";
import ActionBar from "./ActionBar";
import { WorldMap } from "../worldmap/WorldMap";
import RestMenu from "./RestMenu";
import LocationView from "../location_view/LocationView";
// Daten & Kampf-Komponenten importieren
import locationsData from "../../data/locations.json";
import enemiesData from "../../data/enemies.json";
import { CombatGrid } from "../combat/CombatGrid";
import { CombatActions } from "../combat/CombatActions";
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
  // Neue Props für Kampf-Belohnungen
  onCombatVictory, 
  onCombatDefeat
}) {

  const [activeCharacterId, setActiveCharacterId] = useState(character?.id || 'player');
  const [showRestMenu, setShowRestMenu] = useState(false);

  // +++ KAMPF-SYSTEM HOOK +++
  const { 
    combatState, 
    startCombat, 
    moveCombatant, 
    attack, 
    dash, 
    nextTurn, 
    endCombatSession 
  } = useCombat(character);
  
  // Lokaler State für Interaktionen im Kampf
  const [selectedAction, setSelectedAction] = useState(null); // 'attack' | null
  const [selectedWeapon, setSelectedWeapon] = useState(null);

  useEffect(() => {
    const mainCharacterId = character?.id || 'player';
    setActiveCharacterId(mainCharacterId);
  }, [character?.id]);

  // --- KAMPF-LOGIK ---

  // Startet einen Testkampf (wird an LocationView gegeben)
  const handleStartTestCombat = () => {
    // Beispiel: Ein Goblin und ein Ork aus enemies.json
    startCombat([enemiesData.goblin, enemiesData.orc]);
  };

  // Hilfsfunktion: Waffen aus dem Inventar holen
  const getEquippedWeapons = () => {
    const weapons = [];
    if (character.equipment?.mainHand) weapons.push(character.equipment.mainHand);
    if (character.equipment?.offHand) weapons.push(character.equipment.offHand);
    
    // Fallback falls leer (zum Testen)
    if (weapons.length === 0) {
        weapons.push({ name: "Waffenloser Schlag", damage: "1", type: "bludgeoning" });
    }
    return weapons;
  };

  const handlePrepareAttack = (weapon) => {
    setSelectedAction('attack');
    setSelectedWeapon(weapon);
  };

  const handleTileClick = (pos) => {
    if (combatState.result) return; // Blockiert wenn Ergebnis da ist

    const activeC = combatState.combatants[combatState.turnIndex];
    if (activeC && activeC.type === 'player') {
      if (selectedAction === 'attack') {
          // Abbruch bei Klick auf leeres Feld im Angriffsmodus
          setSelectedAction(null);
          setSelectedWeapon(null);
          return;
      }
      moveCombatant(activeC.id, pos);
    }
  };

  const handleCombatantClick = (target) => {
    if (combatState.result) return;

    const activeC = combatState.combatants[combatState.turnIndex];
    if (activeC && activeC.type === 'player' && target.type === 'enemy') {
        if (selectedAction === 'attack') {
            attack(activeC.id, target.id, selectedWeapon);
            // Reset nach Angriff
            setSelectedAction(null);
            setSelectedWeapon(null);
        } else {
            console.log("Bitte wähle zuerst eine Waffe aus.");
        }
    }
  };

  // Kampfende bestätigen (Button im Result Screen)
  const handleConfirmCombatEnd = () => {
    const result = combatState.result;
    
    if (result?.type === 'victory') {
        if (onCombatVictory) {
            onCombatVictory(result.xp, result.loot);
        }
    } else if (result?.type === 'defeat') {
        if (onCombatDefeat) {
            onCombatDefeat();
        }
    }
    endCombatSession();
  };

  // --- RENDER LOGIK ---

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
           {/* +++ KAMPF-MODUS +++ */}
           {combatState.isActive ? (
             <div className="combat-view" style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
               
               {/* Ergebnis Screen (Sieg/Niederlage) */}
               {combatState.result && (
                 <CombatResultScreen 
                    result={combatState.result}
                    onConfirm={handleConfirmCombatEnd}
                 />
               )}

               {/* Das Grid */}
               <div style={{ 
                   flex: 1, 
                   position: 'relative', 
                   cursor: selectedAction === 'attack' ? 'crosshair' : 'default' 
               }}>
                 <CombatGrid 
                   width={12} 
                   height={10}
                   backgroundImg="/src/assets/images/map/map_12x10.webp" 
                   combatants={combatState.combatants}
                   activeCombatantId={combatState.combatants[combatState.turnIndex]?.id}
                   onTileClick={handleTileClick}
                   onCombatantClick={handleCombatantClick}
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

                   {/* Aktionsleiste */}
                   <CombatActions 
                      combatState={combatState}
                      onAttack={handlePrepareAttack}
                      onDash={dash}
                      onEndTurn={() => { setSelectedAction(null); nextTurn(); }}
                      playerWeapons={getEquippedWeapons()}
                   />
                 </>
               )}
             </div>
           ) : isAtLocation ? (
              /* +++ ORTS-ANSICHT +++ */
              <LocationView 
                  locationId={character.currentLocation}
                  character={character}
                  onLeaveLocation={() => onEnterLocation("worldmap", character.worldMapPosition)}
                  onShopTransaction={onShopTransaction}
                  onStartCombat={handleStartTestCombat} // Hier wird die Funktion übergeben
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
          {/* ActionBar im Kampf deaktivieren */}
          <ActionBar
            character={activeCharacter}
            onToggleCharacterSheet={onToggleCharacterSheet}
            onSaveGame={onSaveGame}
            onLoadGame={onLoadGame}
            saveFileExists={saveFileExists}
            onRestClick={() => setShowRestMenu(true)} 
            disabled={combatState.isActive}
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