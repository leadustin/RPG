// src/components/character_creation/AbilitySelection.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from "react-i18next";
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

  // --- STATE FÜR 2024-REGELN (BONI) ---
  const [bonusMode, setBonusMode] = useState('plus2plus1');
  const [plus2Ability, setPlus2Ability] = useState('');
  const [plus1Ability, setPlus1Ability] = useState('');
  const [triPlus1A, setTriPlus1A] = useState('');
  const [triPlus1B, setTriPlus1B] = useState('');
  const [triPlus1C, setTriPlus1C] = useState('');

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

  // 2024 Boni Aktualisierung
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

    if (JSON.stringify(character.ability_bonus_assignments) !== JSON.stringify(newBonusAssignments)) {
      updateCharacter({ ability_bonus_assignments: newBonusAssignments });
    }
  }, [bonusMode, plus2Ability, plus1Ability, triPlus1A, triPlus1B, triPlus1C, updateCharacter, character.ability_bonus_assignments]);

  const handleBonusModeChange = (mode) => {
    setBonusMode(mode);
    setPlus2Ability('');
    setPlus1Ability('');
    setTriPlus1A('');
    setTriPlus1B('');
    setTriPlus1C('');
  };

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

          {/* === BONUS BLOCK === */}
          <div className="ability-box">
            <h3>{t("characterCreation.attributeBonuses")}</h3>
            <p className="bonus-description">
              {t("characterCreation.chooseAttributeBonuses")}
            </p>
            <div className="method-selection">
              <button
                onClick={() => handleBonusModeChange('plus2plus1')}
                className={bonusMode === 'plus2plus1' ? 'active' : ''}
              >
                {t("characterCreation.strengthsFocused")}
              </button>
              <button
                onClick={() => handleBonusModeChange('plus1plus1plus1')}
                className={bonusMode === 'plus1plus1plus1' ? 'active' : ''}
              >
                {t("characterCreation.balanced")}
              </button>
            </div>

            <div className="bonus-selection-dropdowns">
              {bonusMode === 'plus2plus1' && (
                <>
                  <div className="bonus-select-wrap">
                    <label>{t("characterCreation.plus2Bonus")}</label>
                    <select value={plus2Ability} onChange={(e) => setPlus2Ability(e.target.value)}>
                      <option value="">{t("characterCreation.choose")}</option>
                      {ABILITIES.map(abi => (
                        <option key={abi} value={abi} disabled={abi === plus1Ability}>{abi.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                  <div className="bonus-select-wrap">
                    <label>{t("characterCreation.plus1Bonus")}</label>
                    <select value={plus1Ability} onChange={(e) => setPlus1Ability(e.target.value)}>
                      <option value="">{t("characterCreation.choose")}</option>
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
                    <label>{t("characterCreation.plus1BonusA")}</label>
                    <select value={triPlus1A} onChange={(e) => setTriPlus1A(e.target.value)}>
                      <option value="">{t("characterCreation.choose")}</option>
                      {ABILITIES.map(abi => (
                        <option key={abi} value={abi} disabled={abi === triPlus1B || abi === triPlus1C}>{abi.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                  <div className="bonus-select-wrap">
                    <label>{t("characterCreation.plus1BonusB")}</label>
                    <select value={triPlus1B} onChange={(e) => setTriPlus1B(e.target.value)}>
                      <option value="">{t("characterCreation.choose")}</option>
                      {ABILITIES.map(abi => (
                        <option key={abi} value={abi} disabled={abi === triPlus1A || abi === triPlus1C}>{abi.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                  <div className="bonus-select-wrap">
                    <label>{t("characterCreation.plus1BonusC")}</label>
                    <select value={triPlus1C} onChange={(e) => setTriPlus1C(e.target.value)}>
                      <option value="">{t("characterCreation.choose")}</option>
                      {ABILITIES.map(abi => (
                        <option key={abi} value={abi} disabled={abi === triPlus1A || abi === triPlus1B}>{abi.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* === RECHTE SPALTE === */}
        <div className="ability-column-right">
          <div className="ability-box">
            <h3>{t("characterCreation.attributes")}</h3>
            <ul className="ability-list features-list">
              {ABILITIES.map(abi => {
                const racialBonus = getRacialAbilityBonus(character, abi);
                const finalScore = scores[abi] + racialBonus;
                
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
                      ({t("characterCreation.bonus")}: {racialBonus > 0 ? `+${racialBonus}` : racialBonus})
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