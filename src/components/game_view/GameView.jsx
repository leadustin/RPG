// src/components/game_view/GameView.jsx
import React, { useState, useEffect } from "react";
import { PartyPortraits } from "./PartyPortraits";
import ActionBar from "./ActionBar";
import { WorldMap } from "../worldmap/WorldMap";
import RestMenu from "./RestMenu";
import LocationView from "../location_view/LocationView";
import { CombatGrid } from "../combat/CombatGrid";
import { CombatActions } from "../combat/CombatActions";
import { CombatResultScreen } from "../combat/CombatResultScreen"; 
import { useCombat } from "../../hooks/useCombat";
import enemiesData from "../../data/enemies.json";
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

  // +++ KAMPF-SYSTEM STATE & HOOK +++
  const { 
    combatState, 
    startCombat, 
    moveCombatant, 
    attack, 
    dash, 
    nextTurn, 
    endCombatSession 
  } = useCombat(character);
  
  // State für die Interaktion im Kampf (z.B. "Ich will angreifen, auf wen?")
  const [selectedAction, setSelectedAction] = useState(null); // 'attack' | null
  const [selectedWeapon, setSelectedWeapon] = useState(null);

  useEffect(() => {
    const mainCharacterId = character?.id || 'player';
    setActiveCharacterId(mainCharacterId);
  }, [character?.id]);

  // --- KAMPF-HELPER ---

  // Funktion zum Starten eines Testkampfes (wird an LocationView übergeben)
  const handleStartTestCombat = () => {
    // Beispiel: Ein Goblin und ein Ork
    startCombat([enemiesData.goblin, enemiesData.orc]);
  };

  // Hilfsfunktion: Waffen aus dem Inventar des Charakters holen
  const getEquippedWeapons = () => {
    const weapons = [];
    // Prüfen, ob Equipment-Daten vorhanden sind
    if (character.equipment?.mainHand) weapons.push(character.equipment.mainHand);
    if (character.equipment?.offHand) weapons.push(character.equipment.offHand);
    
    // Fallback Mockdaten, falls Inventar leer ist:
    if (weapons.length === 0) {
        weapons.push({ name: "Kurzschwert", damage: "1d6", attackBonus: 4, type: "piercing" });
        weapons.push({ name: "Langbogen", damage: "1d8", attackBonus: 4, type: "piercing", range: "150/600" });
    }
    return weapons;
  };

  // UI-Handler: Spieler klickt auf eine Waffe in der CombatActions-Leiste
  const handlePrepareAttack = (weapon) => {
    setSelectedAction('attack');
    setSelectedWeapon(weapon);
  };

  // Grid-Handler: Spieler klickt auf ein Feld (Bewegung)
  const handleTileClick = (pos) => {
    // Wenn Ergebnis-Screen da ist, keine Interaktion
    if (combatState.result) return;

    const activeC = combatState.combatants[combatState.turnIndex];
    
    // Nur reagieren, wenn der Spieler am Zug ist
    if (activeC && activeC.type === 'player') {
      // Wenn wir im Attack-Modus sind, bricht ein Klick auf den leeren Boden den Angriff ab
      if (selectedAction === 'attack') {
          setSelectedAction(null);
          setSelectedWeapon(null);
          return;
      }
      // Ansonsten: Bewegung versuchen
      moveCombatant(activeC.id, pos);
    }
  };

  // Grid-Handler: Spieler klickt auf eine Figur (Angriff)
  const handleCombatantClick = (target) => {
    // Wenn Ergebnis-Screen da ist, keine Interaktion
    if (combatState.result) return;

    const activeC = combatState.combatants[combatState.turnIndex];
    
    // Sicherheitscheck: Ist Spieler dran? Ist Ziel ein Gegner?
    if (activeC && activeC.type === 'player' && target.type === 'enemy') {
        if (selectedAction === 'attack') {
            // Angriff ausführen!
            attack(activeC.id, target.id, selectedWeapon);
            
            // Nach dem Angriff den Modus zurücksetzen
            setSelectedAction(null);
            setSelectedWeapon(null);
        } else {
            console.log("Bitte wähle zuerst eine Aktion (Waffe) unten aus!");
        }
    }
  };

  // Handler für das Bestätigen des Kampfendes (Sieg/Niederlage Screen)
  const handleCombatEnd = () => {
    if (combatState.result?.type === 'victory') {
        console.log(`Kampf gewonnen! Füge ${combatState.result.xp} XP und Items hinzu.`);
        // TODO: Hier müsste onShopTransaction oder eine neue onUpdateCharacter Prop genutzt werden,
        // um XP und Loot tatsächlich in den Charakter-State zu speichern.
    }
    // Kampfmodus beenden
    endCombatSession();
  };

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
           {/* +++ KAMPF ANSICHT +++ */}
           {combatState.isActive ? (
             <div className="combat-view" style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
               
               {/* Ergebnis Overlay (Sieg/Niederlage) */}
               {combatState.result && (
                 <CombatResultScreen 
                    result={combatState.result}
                    onConfirm={handleCombatEnd}
                 />
               )}

               {/* Grid Bereich */}
               <div style={{ 
                   flex: 1, 
                   position: 'relative', 
                   // Mauszeiger ändern, wenn Angriff bereit ist
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
               
               {/* UI nur anzeigen, wenn Kampf noch läuft (kein Ergebnis) */}
               {!combatState.result && (
                 <>
                   {/* Kleines Log Overlay oben rechts */}
                   <div className="combat-log-overlay" style={{ 
                       position: 'absolute', 
                       top: 10, 
                       right: 10, 
                       width: '250px', 
                       background: 'rgba(0,0,0,0.6)', 
                       color: '#eee', 
                       padding: '10px', 
                       fontSize: '0.85rem', 
                       pointerEvents: 'none',
                       borderRadius: '4px'
                   }}>
                      {combatState.log.slice(-4).map((l, i) => <div key={i} style={{marginBottom:'4px'}}>{l}</div>)}
                   </div>

                   {/* Kampf-Aktionsleiste */}
                   <CombatActions 
                      combatState={combatState}
                      onAttack={handlePrepareAttack}
                      onDash={dash}
                      onEndTurn={() => {
                          setSelectedAction(null); // Modus Reset bei Zugende
                          nextTurn();
                      }}
                      playerWeapons={getEquippedWeapons()}
                   />
                 </>
               )}

             </div>
           ) : isAtLocation ? (
              /* LOCATION ANSICHT */
              <LocationView 
                  locationId={character.currentLocation}
                  character={character}
                  onLeaveLocation={() => onEnterLocation("worldmap", character.worldMapPosition)}
                  onShopTransaction={onShopTransaction}
                  // Übergabe der Kampf-Start Funktion
                  onStartCombat={handleStartTestCombat} 
              />
           ) : (
              /* WELTKARTE ANSICHT */
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
          {/* Die normale ActionBar wird im Kampf deaktiviert */}
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