// src/components/character_creation/AbilitySelection.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from "react-i18next";
import DiceBox from "@3d-dice/dice-box";
import './AbilitySelection.css';
import './PanelDetails.css';
// getRacialAbilityBonus wird nicht mehr benötigt für 2024, 
// da Boni jetzt aus dem Hintergrund kommen.

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

  // Fallback
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
  const { t } = useTranslation();
  const [scores, setScores] = useState(character.abilities);
  const [points, setPoints] = useState(27);
  const [generationMethod, setGenerationMethod] = useState('pointBuy');
  const [scoresToAssign, setScoresToAssign] = useState([]);

  // --- STATES FÜR ALTE BONI ENTFERNT ---

  // DiceBox Refs & State
  const diceBoxRef = useRef(null);
  const [isRolling, setIsRolling] = useState(false);
  const [diceBoxReady, setDiceBoxReady] = useState(false);

  // DiceBox Initialisierung
  useEffect(() => {
    if (generationMethod === 'roll' && !diceBoxRef.current) {
      console.log("Initializing DiceBox for AbilitySelection...");
      
      const db = new DiceBox({ 
        id: "ability-dice-box",
        assetPath: "/assets/dice-box/", 
        theme: "default",
        themeColor: "#999999",
        offscreen: false,
        scale: 11,
        enableShadows: true,
        delay: 10,
        mass: 2,
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

    return () => {
      if (diceBoxRef.current) {
        try {
          if (typeof diceBoxRef.current.clear === 'function') {
            diceBoxRef.current.clear();
          }
          const canvas = document.querySelector('#ability-dice-box canvas');
          if (canvas) canvas.remove();
        } catch (err) {
          console.warn("Fehler beim Cleanup:", err);
        }
        diceBoxRef.current = null;
      }
      setDiceBoxReady(false);
    };
  }, [generationMethod]);

  // Point Buy Berechnung
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

  // --- EFFECT FÜR ALTE BONI ENTFERNT ---

  const handleScoreChange = (ability, delta) => {
    const currentScore = scores[ability];
    const newScore = currentScore + delta;
    if (newScore < 8 || newScore > 15) return;
    const costChange = POINT_COST[newScore] - POINT_COST[newScore - delta];
    if (points - costChange >= 0) {
      setScores({ ...scores, [ability]: newScore });
    }
  };
  
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

  const handleRoll = async () => {
    if (isRolling || !diceBoxReady || !diceBoxRef.current) return;
    
    setIsRolling(true);
    setScores(BASE_SCORES); 
    setScoresToAssign([]);  
    const newRolls = [];

    const performSingleRoll = async () => {
      const notation = '4d6';
      try {
        const rollResult = await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            console.warn("Roll-Timeout");
            reject(new Error('timeout'));
          }, 5000);

          const originalHandler = diceBoxRef.current.onRollComplete;
          diceBoxRef.current.onRollComplete = (results) => {
            clearTimeout(timeout);
            diceBoxRef.current.onRollComplete = originalHandler;
            resolve(results);
          };

          diceBoxRef.current.roll(notation);
        });
        
        let allRolls = [];
        if (Array.isArray(rollResult) && rollResult.length > 0) {
          const firstRoll = rollResult[0];
          if (firstRoll.rolls && Array.isArray(firstRoll.rolls)) {
            allRolls = firstRoll.rolls.map(r => r.value);
          }
        } else if (rollResult && rollResult.rolls && Array.isArray(rollResult.rolls)) {
          allRolls = rollResult.rolls.map(r => r.value);
        }
        
        if (allRolls.length !== 4) return roll4d6DropLowest();
        
        const sortedRolls = [...allRolls].sort((a, b) => b - a);
        const keptRolls = sortedRolls.slice(0, 3);
        const total = keptRolls.reduce((sum, val) => sum + val, 0);
        
        if (total < 3 || total > 18) return roll4d6DropLowest();
        
        return total;

      } catch (err) {
        return roll4d6DropLowest();
      }
    };

    for (let i = 0; i < 6; i++) { 
      newRolls.push(await performSingleRoll());
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setScoresToAssign(newRolls);
    setIsRolling(false); 
  };

  return (
    <div className="ability-selection-container">
      <div className="ability-panel-layout">
        
        {/* === LINKE SPALTE === */}
        <div className="ability-column-left">
          
          <div className="ability-box">
            <h3>{t("characterCreation.generationMethod")}</h3>
            <div className="method-selection">
              <button 
                onClick={() => handleMethodChange('pointBuy')} 
                className={generationMethod === 'pointBuy' ? 'active' : ''}
              >
                {t("characterCreation.pointBuy")}
              </button>
              <button 
                onClick={() => handleMethodChange('standardArray')}
                className={generationMethod === 'standardArray' ? 'active' : ''}
              >
                {t("characterCreation.standardArray")}
              </button>
              <button 
                onClick={() => handleMethodChange('roll')}
                className={generationMethod === 'roll' ? 'active' : ''}
              >
              {t("characterCreation.rollMethodWithDice")}
              </button>
            </div>
          </div>

          <div className="ability-box">
            <h3>{t("characterCreation.details")}</h3>
            {generationMethod === 'pointBuy' && (
              <div className="points-display">
                {t("characterCreation.remainingPoints")}: <span>{points}</span>
              </div>
            )}

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
            
            {generationMethod === 'standardArray' && (
              <div className="assignment-info">
                 <div className="scores-to-assign">
                  {t("characterCreation.valuesPresetFor")} 
                  <strong>{character.class.name}</strong>. 
                  {t("characterCreation.swapIfNeeded")}
                </div>
              </div>
            )}
          </div>

          {/* === INFO BLOCK STATT BONUS WAHL (PHB 2024) === */}
          <div className="ability-box">
            <h3>{t("characterCreation.attributeBonuses")}</h3>
            <p className="bonus-description">
                In PHB 2024 erhalten Sie Attributsboni durch Ihren <strong>Hintergrund</strong>.
            </p>
            {character.background ? (
                <p style={{color: 'var(--color-text-light)', fontSize: '0.9rem', marginTop: '10px'}}>
                    Aktueller Hintergrund: <strong>{character.background.name}</strong><br/>
                    (Boni werden rechts automatisch addiert)
                </p>
            ) : (
                <p style={{color: '#ff6b6b', fontSize: '0.9rem', marginTop: '10px'}}>
                    Bitte wählen Sie zuerst einen Hintergrund.
                </p>
            )}
          </div>
        </div>
        
        {/* === RECHTE SPALTE === */}
        <div className="ability-column-right">
          <div className="ability-box">
            <h3>{t("characterCreation.attributes")}</h3>
            <ul className="ability-list features-list">
              {ABILITIES.map(abi => {
                // ÄNDERUNG für 2024: Boni vom Hintergrund statt Rasse
                const bgBonuses = character.background_options?.bonuses || {};
                const bonusVal = bgBonuses[abi] || 0;
                const finalScore = scores[abi] + bonusVal;
                
                return (
                  <li key={abi} className="ability-item">
                    <strong>{abi.toUpperCase()}</strong>
                    
                    {generationMethod === 'pointBuy' && (
                      <div className="ability-controls">
                        <button onClick={() => handleScoreChange(abi, -1)} disabled={scores[abi] <= 8}>-</button>
                        <span className="base-score">{scores[abi]}</span>
                        <button onClick={() => handleScoreChange(abi, 1)} disabled={scores[abi] >= 15 || points < (POINT_COST[scores[abi] + 1] - POINT_COST[scores[abi]])}>+</button>
                      </div>
                    )}
                    
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
                              <option value={0}>{t("characterCreation.base")} (8)</option>
                            )}
                            {getDropdownOptions(abi).map(scoreVal => (
                              <option key={scoreVal} value={scoreVal}>{scoreVal}</option>
                            ))}
                          </select>
                      </div>
                    )}

                    <div className="ability-modifier">
                      ({t("characterCreation.bonus")}: {bonusVal > 0 ? `+${bonusVal}` : bonusVal})
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