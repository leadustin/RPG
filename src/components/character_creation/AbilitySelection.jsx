// src/components/AbilitySelection.jsx
import React, { useState, useEffect, useRef } from 'react';
import DiceBox from "@3d-dice/dice-box";
import './AbilitySelection.css';
import './PanelDetails.css';
import { getRacialAbilityBonus } from '../../engine/characterEngine';

const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
const POINT_COST = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];
const BASE_SCORES = { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 };

// Empfohlene Standard-Array-Zuweisungen (PHB 2024-Logik)
const CLASS_STANDARD_ARRAY_ASSIGNMENTS = {
  // STR-Basiert
  fighter:   { str: 15, dex: 13, con: 14, int: 10, wis: 12, cha: 8 },
  barbarian: { str: 15, dex: 13, con: 14, int: 8,  wis: 12, cha: 10 },
  paladin:   { str: 15, dex: 10, con: 13, int: 8,  wis: 12, cha: 14 },
  
  // DEX-Basiert
  rogue:     { str: 8,  dex: 15, con: 13, int: 14, wis: 10, cha: 12 },
  ranger:    { str: 10, dex: 15, con: 13, int: 8,  wis: 14, cha: 12 },
  monk:      { str: 8,  dex: 15, con: 13, int: 10, wis: 14, cha: 12 },
  
  // INT-Basiert
  wizard:    { str: 8,  dex: 14, con: 13, int: 15, wis: 12, cha: 10 },
  
  // WIS-Basiert
  cleric:    { str: 13, dex: 10, con: 14, int: 8,  wis: 15, cha: 12 },
  druid:     { str: 8,  dex: 13, con: 14, int: 12, wis: 15, cha: 10 },
  
  // CHA-Basiert
  sorcerer:  { str: 8,  dex: 13, con: 14, int: 10, wis: 12, cha: 15 },
  warlock:   { str: 8,  dex: 13, con: 14, int: 12, wis: 10, cha: 15 },
  bard:      { str: 8,  dex: 14, con: 13, int: 10, wis: 12, cha: 15 },

  // Fallback (falls Klasse nicht gefunden wird, z.B. "default")
  default:   { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
};

// Fallback-Hilfsfunktion für manuelle Würfe
const roll4d6DropLowest = () => {
  const rolls = [];
  for (let i = 0; i < 4; i++) {
    rolls.push(Math.floor(Math.random() * 6) + 1); 
  }
  
  const allRolls = [...rolls];
  rolls.sort((a, b) => a - b); 
  const dropped = rolls.shift();
  const total = rolls.reduce((sum, val) => sum + val, 0);
  
  console.log(`FALLBACK Wurf (4d6): [${allRolls.join(', ')}] -> Verworfen: ${dropped} -> Summe: ${total}`);
  
  return total; 
};

export const AbilitySelection = ({ character, updateCharacter }) => {
  const [scores, setScores] = useState(character.abilities);
  const [points, setPoints] = useState(27);
  const [generationMethod, setGenerationMethod] = useState('pointBuy');
  const [scoresToAssign, setScoresToAssign] = useState([]);

  // --- NEUER STATE FÜR 2024-REGELN ---
  const [bonusMode, setBonusMode] = useState('plus2plus1'); // 'plus2plus1' ODER 'plus1plus1plus1'
  // State für +2/+1
  const [plus2Ability, setPlus2Ability] = useState('');
  const [plus1Ability, setPlus1Ability] = useState('');
  // State für +1/+1/+1
  const [triPlus1A, setTriPlus1A] = useState('');
  const [triPlus1B, setTriPlus1B] = useState('');
  const [triPlus1C, setTriPlus1C] = useState('');
  // --- ENDE NEUER STATE ---

  // useRef für die DiceBox-Instanz und useState für den Ladezustand
  const diceBoxRef = useRef(null);
  const [isRolling, setIsRolling] = useState(false);
  const [diceBoxReady, setDiceBoxReady] = useState(false);

  // Effekt zum Initialisieren von DiceBox (mit v1.1.0 API)
  useEffect(() => {
    if (generationMethod === 'roll' && !diceBoxRef.current) {
      console.log("Initializing DiceBox for AbilitySelection...");
      
      // FIX: Verwende die neue v1.1.0 API mit Config-Objekt
      const db = new DiceBox({ 
        id: "ability-dice-box",
        assetPath: "/assets/dice-box/", 
        theme: "default",
        themeColor: "#999999",
        offscreen: false, // Auf false setzen, damit Canvas sichtbar ist
        scale: 11,
        enableShadows: true,
        delay: 10,
        mass: 2,
        // Zusätzliche Styling-Optionen
        container: "#ability-dice-box"
      });

      db.init().then(() => {
        console.log("DiceBox initialized.");
        diceBoxRef.current = db;
        setDiceBoxReady(true);
      }).catch(err => {
        console.error("DiceBox initialization failed: ", err);
      });
    }

    // CLEANUP-Funktion
    return () => {
      if (diceBoxRef.current) {
        console.log("Cleaning up DiceBox instance...");
        // DiceBox v1.1.0 verwendet clear() statt cleanup()
        try {
          if (typeof diceBoxRef.current.clear === 'function') {
            diceBoxRef.current.clear();
          }
          // Entferne das Canvas-Element manuell
          const canvas = document.querySelector('#ability-dice-box canvas');
          if (canvas) {
            canvas.remove();
          }
        } catch (err) {
          console.warn("Fehler beim Cleanup:", err);
        }
        diceBoxRef.current = null;
      }
      setDiceBoxReady(false);
    };
  }, [generationMethod]);

  // Effekt für Point Buy
  useEffect(() => {
    if (generationMethod === 'pointBuy') {
      const spentPoints = ABILITIES.reduce((total, abi) => total + POINT_COST[scores[abi]], 0);
      setPoints(27 - spentPoints);
      updateCharacter({ abilities: scores });
    } else {
      setPoints(0);
      updateCharacter({ abilities: scores });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scores, generationMethod]); 

  // --- NEUER EFFEKT FÜR 2024-BONI ---
  // Aktualisiert das ability_bonus_assignments-Objekt, wenn sich die Boni-Auswahl ändert
  useEffect(() => {
    const newBonusAssignments = {};

    if (bonusMode === 'plus2plus1') {
      if (plus2Ability) newBonusAssignments[plus2Ability] = 2;
      if (plus1Ability) newBonusAssignments[plus1Ability] = (newBonusAssignments[plus1Ability] || 0) + 1;
    } 
    else if (bonusMode === 'plus1plus1plus1') {
      if (triPlus1A) newBonusAssignments[triPlus1A] = (newBonusAssignments[triPlus1A] || 0) + 1;
      if (triPlus1B) newBonusAssignments[triPlus1B] = (newBonusAssignments[triPlus1B] || 0) + 1;
      if (triPlus1C) newBonusAssignments[triPlus1C] = (newBonusAssignments[triPlus1C] || 0) + 1;
    }

    // Rufe updateCharacter nur auf, wenn sich die Zuweisungen tatsächlich ändern
    // (um unnötige Re-Render zu vermeiden)
    if (JSON.stringify(character.ability_bonus_assignments) !== JSON.stringify(newBonusAssignments)) {
      updateCharacter({ ability_bonus_assignments: newBonusAssignments });
    }
  }, [bonusMode, plus2Ability, plus1Ability, triPlus1A, triPlus1B, triPlus1C, updateCharacter, character.ability_bonus_assignments]);

  // Setzt die Boni zurück, wenn der Modus wechselt
  const handleBonusModeChange = (mode) => {
    setBonusMode(mode);
    setPlus2Ability('');
    setPlus1Ability('');
    setTriPlus1A('');
    setTriPlus1B('');
    setTriPlus1C('');
  };
  // --- ENDE NEUER EFFEKT ---

  // Handler für Point Buy
  const handleScoreChange = (ability, delta) => {
    const currentScore = scores[ability];
    const newScore = currentScore + delta;
    if (newScore < 8 || newScore > 15) return;
    const costChange = POINT_COST[newScore] - POINT_COST[newScore - delta];
    if (points - costChange >= 0) {
      setScores({ ...scores, [ability]: newScore });
    }
  };
  
  // Handler für den Wechsel der Generierungsmethode
  const handleMethodChange = (method) => {
    setGenerationMethod(method);
    setScores(BASE_SCORES); 
    if (method === 'standardArray') {
      const classKey = character.class.key;
      const recommendedScores = CLASS_STANDARD_ARRAY_ASSIGNMENTS[classKey] || CLASS_STANDARD_ARRAY_ASSIGNMENTS.default;
      setScores(recommendedScores);
      setScoresToAssign([]); 
    } 
    else if (method === 'roll') {
      setScoresToAssign([]);
      setScores(BASE_SCORES);
    } 
    else { 
      setScoresToAssign([]);
    }
  };

  // Handler für Zuweisung (Modus: 'roll')
  const handleAssignScore = (ability, selectedValueStr) => {
    const selectedValue = Number(selectedValueStr);
    const currentScore = scores[ability]; 
    setScores(prevScores => ({ ...prevScores, [ability]: selectedValue === 0 ? 8 : selectedValue }));
    setScoresToAssign(prevToAssign => {
      let newToAssign = [...prevToAssign];
      if (selectedValue !== 0) {
        const indexToRemove = newToAssign.indexOf(selectedValue);
        if (indexToRemove > -1) { newToAssign.splice(indexToRemove, 1); }
      }
      if (currentScore > 8 && !newToAssign.includes(currentScore)) {
         newToAssign.push(currentScore);
      }
      newToAssign.sort((a,b) => b - a);
      return newToAssign;
    });
  };
  
  // Handler für Tauschen (Modus: 'standardArray')
  const handleSwapScore = (ability, selectedValueStr) => {
    const selectedValue = Number(selectedValueStr);
    const currentScore = scores[ability]; 
    if (selectedValue === currentScore) return;
    const otherAbility = ABILITIES.find(abi => scores[abi] === selectedValue);
    setScores(prevScores => ({
        ...prevScores,
        [ability]: selectedValue,
        [otherAbility]: currentScore
    }));
  };
  
  // Handler für Dropdown-Optionen
  const getDropdownOptions = (ability) => {
    if (generationMethod === 'roll') {
        const currentScore = scores[ability];
        const options = new Set(scoresToAssign); 
        if (currentScore > 8) { options.add(currentScore); }
        return Array.from(options).sort((a, b) => b - a);
    }
    if (generationMethod === 'standardArray') {
        return STANDARD_ARRAY; 
    }
    return [];
  };

  // Überarbeiteter handleRoll-Handler mit korrigierter DiceBox-Logik
  const handleRoll = async () => {
    if (isRolling || !diceBoxReady || !diceBoxRef.current) return;
    
    setIsRolling(true);
    setScores(BASE_SCORES); 
    setScoresToAssign([]);  
    const newRolls = [];

    // Hilfsfunktion für einen einzelnen Wurf
    const performSingleRoll = async () => {
      const notation = '4d6'; // Würfle einfach 4d6, wir berechnen selbst
      try {
        // Warte auf das Roll-Ergebnis mit einem Promise-Wrapper
        const rollResult = await new Promise((resolve, reject) => {
          // Timeout als Fallback
          const timeout = setTimeout(() => {
            console.warn("Roll-Timeout nach 5 Sekunden");
            reject(new Error('timeout'));
          }, 5000);

          // Setze den onRollComplete Handler
          const originalHandler = diceBoxRef.current.onRollComplete;
          diceBoxRef.current.onRollComplete = (results) => {
            clearTimeout(timeout);
            // Stelle den originalen Handler wieder her
            diceBoxRef.current.onRollComplete = originalHandler;
            resolve(results);
          };

          // Starte den Wurf
          diceBoxRef.current.roll(notation);
        });
        
        // --- MANUELLE "KEEP HIGHEST 3" LOGIK ---
        let allRolls = [];
        
        console.log("Raw rollResult:", rollResult); // Debug-Log
        
        // Extrahiere die Würfelwerte aus dem Ergebnis
        if (Array.isArray(rollResult) && rollResult.length > 0) {
          const firstRoll = rollResult[0];
          if (firstRoll.rolls && Array.isArray(firstRoll.rolls)) {
            allRolls = firstRoll.rolls.map(r => r.value);
          }
        } else if (rollResult && rollResult.rolls && Array.isArray(rollResult.rolls)) {
          allRolls = rollResult.rolls.map(r => r.value);
        }
        
        // Fallback: Wenn wir keine Würfel extrahieren konnten
        if (allRolls.length !== 4) {
          console.warn("❌ Konnte keine 4 Würfel extrahieren. Verwende Fallback.");
          return roll4d6DropLowest();
        }
        
        // Sortiere die Würfel und nimm die höchsten 3
        const sortedRolls = [...allRolls].sort((a, b) => b - a);
        const keptRolls = sortedRolls.slice(0, 3);
        const droppedRoll = sortedRolls[3];
        const total = keptRolls.reduce((sum, val) => sum + val, 0);
        
        // Detailliertes Logging - zeige Würfel in Original-Reihenfolge
        console.log(`🎲 DiceBox Wurf (4d6, keep highest 3):`);
        console.log(`   Gewürfelt: [${allRolls.join(', ')}]`);
        console.log(`   Behalten: [${keptRolls.join(', ')}] (sortiert)`);
        console.log(`   Verworfen: ${droppedRoll}`);
        console.log(`   ➡️ Summe: ${total}`);
        
        // Validierung: 4d6kh3 muss zwischen 3 und 18 liegen
        if (total < 3 || total > 18) {
          console.warn(`❌ Berechneter Wert ${total} ist ungültig. Verwende Fallback.`);
          return roll4d6DropLowest();
        }
        
        return total;

      } catch (err) {
        console.error("❌ DiceBox.roll() ist fehlgeschlagen, verwende Fallback:", err);
        return roll4d6DropLowest();
      }
    };

    // Führe 6-mal die robuste Würfelfunktion aus
    for (let i = 0; i < 6; i++) { 
      console.log(`\n--- Wurf ${i + 1} von 6 ---`);
      newRolls.push(await performSingleRoll());
      // Kurze Pause zwischen den Würfen für bessere Animation
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`\n✅ Alle Würfe abgeschlossen (in Wurfreihenfolge): [${newRolls.join(', ')}]`);
    
    
    setScoresToAssign(newRolls);
    setIsRolling(false); 
  };

  // --- RETURN-BLOCK ---
  return (
    <div className="ability-selection-container">
      <div className="ability-panel-layout">
        
        {/* === LINKE SPALTE: Steuerung === */}
        <div className="ability-column-left">
          
          <div className="ability-box">
            <h3>Generierungsmethode</h3>
            <div className="method-selection">
              <button 
                onClick={() => handleMethodChange('pointBuy')} 
                className={generationMethod === 'pointBuy' ? 'active' : ''}
              >
                Point Buy
              </button>
              <button 
                onClick={() => handleMethodChange('standardArray')}
                className={generationMethod === 'standardArray' ? 'active' : ''}
              >
                Standard Array
              </button>
              <button 
                onClick={() => handleMethodChange('roll')}
                className={generationMethod === 'roll' ? 'active' : ''}
              >
                Auswürfeln (4W6)
              </button>
            </div>
          </div>

          <div className="ability-box">
            <h3>Details</h3>
            {/* A: Point Buy UI */}
            {generationMethod === 'pointBuy' && (
              <div className="points-display">
                Verbleibende Punkte: <span>{points}</span>
              </div>
            )}

            {/* B: Roll UI */}
            {generationMethod === 'roll' && (
              <div className="assignment-info">
                  <div 
                    id="ability-dice-box" 
                    style={{
                      width: '100%',
                      height: '200px',
                      position: 'relative',
                      marginBottom: '10px',
                      border: '1px solid var(--theme-panel-border-color)',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      background: 'rgba(0, 0, 0, 0.3)'
                    }}
                  ></div> 
                  
                  <button 
                    onClick={handleRoll} 
                    className="ability-roll-button" 
                    disabled={isRolling || !diceBoxReady}
                  >
                    {isRolling ? 'Würfeln...' : (!diceBoxReady ? 'Lade Würfel...' : 'Werte erneut würfeln')}
                  </button>
                  
                <div className="scores-to-assign">
                  Gewürfelte Werte: 
                  <strong>{scoresToAssign.length > 0 ? scoresToAssign.join(', ') : ' (Klicke auf "Würfeln")'}</strong>
                </div>
              </div>
            )}
            
            {/* C: Standard Array Info */}
            {generationMethod === 'standardArray' && (
              <div className="assignment-info">
                 <div className="scores-to-assign">
                  Werte voreingestellt für 
                  <strong>{character.class.name}</strong>. 
                  Tausche sie bei Bedarf.
                </div>
              </div>
            )}
          </div>

          {/* === NEUER BLOCK FÜR 2024-BONI === */}
          <div className="ability-box">
            <h3>Attributsboni (Herkunft)</h3>
            <p className="bonus-description">
              Wähle deine Attributsboni (PHB 2024).
            </p>
            <div className="method-selection">
              <button
                onClick={() => handleBonusModeChange('plus2plus1')}
                className={bonusMode === 'plus2plus1' ? 'active' : ''}
              >
                Stärken (+2 / +1)
              </button>
              <button
                onClick={() => handleBonusModeChange('plus1plus1plus1')}
                className={bonusMode === 'plus1plus1plus1' ? 'active' : ''}
              >
                Ausgeglichen (+1 / +1 / +1)
              </button>
            </div>

            {/* --- Bonus-Auswahl-Dropdowns --- */}
            <div className="bonus-selection-dropdowns">
              {bonusMode === 'plus2plus1' && (
                <>
                  <div className="bonus-select-wrap">
                    <label>+2 Bonus</label>
                    <select value={plus2Ability} onChange={(e) => setPlus2Ability(e.target.value)}>
                      <option value="">Wähle...</option>
                      {ABILITIES.map(abi => (
                        <option key={abi} value={abi} disabled={abi === plus1Ability}>{abi.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                  <div className="bonus-select-wrap">
                    <label>+1 Bonus</label>
                    <select value={plus1Ability} onChange={(e) => setPlus1Ability(e.target.value)}>
                      <option value="">Wähle...</option>
                      {ABILITIES.map(abi => (
                        <option key={abi} value={abi} disabled={abi === plus2Ability}>{abi.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {bonusMode === 'plus1plus1plus1' && (
                <>
                  <div className="bonus-select-wrap">
                    <label>+1 Bonus (A)</label>
                    <select value={triPlus1A} onChange={(e) => setTriPlus1A(e.target.value)}>
                      <option value="">Wähle...</option>
                      {ABILITIES.map(abi => (
                        <option key={abi} value={abi} disabled={abi === triPlus1B || abi === triPlus1C}>{abi.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                  <div className="bonus-select-wrap">
                    <label>+1 Bonus (B)</label>
                    <select value={triPlus1B} onChange={(e) => setTriPlus1B(e.target.value)}>
                      <option value="">Wähle...</option>
                      {ABILITIES.map(abi => (
                        <option key={abi} value={abi} disabled={abi === triPlus1A || abi === triPlus1C}>{abi.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                  <div className="bonus-select-wrap">
                    <label>+1 Bonus (C)</label>
                    <select value={triPlus1C} onChange={(e) => setTriPlus1C(e.target.value)}>
                      <option value="">Wähle...</option>
                      {ABILITIES.map(abi => (
                        <option key={abi} value={abi} disabled={abi === triPlus1A || abi === triPlus1B}>{abi.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
            {/* --- ENDE Bonus-Auswahl --- */}
          </div>
        </div>
        
        {/* === RECHTE SPALTE: Attributliste === */}
        <div className="ability-column-right">
          <div className="ability-box">
            <h3>Attribute</h3>
            <ul className="ability-list features-list">
              {ABILITIES.map(abi => {
                const racialBonus = getRacialAbilityBonus(character, abi);
                const finalScore = scores[abi] + racialBonus;
                
                return (
                  <li key={abi} className="ability-item">
                    <strong>{abi.toUpperCase()}</strong>
                    
                    {/* === Point Buy Steuerung === */}
                    {generationMethod === 'pointBuy' && (
                      <div className="ability-controls">
                        <button onClick={() => handleScoreChange(abi, -1)} disabled={scores[abi] <= 8}>-</button>
                        <span className="base-score">{scores[abi]}</span>
                        <button onClick={() => handleScoreChange(abi, 1)} disabled={scores[abi] >= 15 || points < (POINT_COST[scores[abi] + 1] - POINT_COST[scores[abi]])}>+</button>
                      </div>
                    )}
                    
                    {/* === Standard Array / Roll Steuerung (Kombiniert) === */}
                    {(generationMethod === 'standardArray' || generationMethod === 'roll') && (
                      <div className="ability-controls-select">
                          <select 
                            value={generationMethod === 'standardArray' ? scores[abi] : (scores[abi] === 8 ? 0 : scores[abi])}
                            onChange={(e) => generationMethod === 'standardArray' 
                                ? handleSwapScore(abi, e.target.value) 
                                : handleAssignScore(abi, e.target.value) 
                            }
                            disabled={generationMethod === 'roll' && (scoresToAssign.length === 0 && scores[abi] === 8)}
                          >
                            {generationMethod === 'roll' && (
                              <option value={0}>Basis (8)</option>
                            )}
                            {getDropdownOptions(abi).map(scoreVal => (
                              <option key={scoreVal} value={scoreVal}>{scoreVal}</option>
                            ))}
                          </select>
                      </div>
                    )}

                    <div className="ability-modifier">
                      (Bonus: {racialBonus > 0 ? `+${racialBonus}` : racialBonus})
                    </div>
                    <div className="final-score">
                      {finalScore}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
};