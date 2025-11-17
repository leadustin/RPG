// src/components/level_up/LevelUpScreen.jsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import DiceBox from "@3d-dice/dice-box";
import { getRacialAbilityBonus } from '../../engine/characterEngine';
import allClassData from '../../data/classes.json'; 
import './LevelUpScreen.css';

// Import der wiederverwendeten Komponente
import { WeaponMasterySelection } from '../character_creation/WeaponMasterySelection';
// Import der CSS-Dateien für die wiederverwendeten Komponenten
import '../character_creation/SkillSelection.css'; 
import '../character_creation/PanelDetails.css'; 

const getRacialHpBonus = (character) => {
  if (character.subrace?.key === 'hill-dwarf') return 1;
  return 0;
};

// +++ WIEDERHERGESTELLTE HILFSFUNKTION +++
const rollDiceFormula = (formula, results) => {
  let bonus = 0;
  if (formula.includes('+')) {
    bonus = parseInt(formula.split('+')[1] || 0);
  } else if (formula.includes('-')) {
    bonus = -parseInt(formula.split('-')[1] || 0);
  }
  
  const diceValues = results.map(r => r.value);
  const diceSum = diceValues.reduce((a, b) => a + b, 0);

  return {
    total: diceSum + bonus,
    dice: diceValues,
    bonus: bonus
  };
};
// +++ ENDE WIEDERHERGESTELLTE HILFSFUNKTION +++


const AbilityScoreImprovement = ({ finalAbilities, points, choices, onChange }) => {
  const handleIncrease = (key) => {
    if (points > 0 && (choices[key] || 0) < 2) {
      const currentPointsUsed = Object.values(choices).reduce((a, b) => a + b, 0);
      if (currentPointsUsed < 2) {
        const newChoices = { ...choices, [key]: (choices[key] || 0) + 1 };
        onChange(newChoices, points - 1);
      }
    }
  };

  const handleDecrease = (key) => {
    if (choices[key] > 0) {
      const newChoices = { ...choices, [key]: choices[key] - 1 };
      onChange(newChoices, points + 1);
    }
  };

  return (
    <div className="asi-selection">
      <h4>Attributswerte erhöhen ({points} Punkte übrig)</h4>
      <p>Verteile +2 auf ein Attribut oder +1 auf zwei Attribute.</p>
      {Object.keys(finalAbilities).map((key) => (
        <div key={key} className="asi-row">
          <span className="asi-label">{key.toUpperCase()} ({finalAbilities[key]})</span>
          <button onClick={() => handleDecrease(key)} disabled={!choices[key]}>-</button>
          <span className="asi-choice">{choices[key] || 0}</span>
          <button onClick={() => handleIncrease(key)} disabled={points === 0 || choices[key] >= 2}>+</button>
        </div>
      ))}
    </div>
  );
};

const SubclassSelection = ({ classKey, onSelect, selectedKey }) => {
  const classData = allClassData.find(c => c.key === classKey);
  if (!classData || !classData.subclasses) return <p>Fehler: Klassendaten nicht gefunden.</p>;

  return (
    <div className="subclass-selection">
      <h4>Wähle deinen Archetyp</h4>
      {classData.subclasses.map(sc => (
        <div 
          key={sc.key} 
          className={`subclass-option ${selectedKey === sc.key ? 'selected' : ''}`}
          onClick={() => onSelect(sc.key)}
        >
          <strong>{sc.name}</strong>
          <p>{sc.description}</p>
        </div>
      ))}
    </div>
  );
};


export const LevelUpScreen = ({ character, onConfirm }) => {
  const { newLevel } = character.pendingLevelUp;
  // KEIN 'step' state
  const [rollResult, setRollResult] = useState(null);
  const [asiPoints, setAsiPoints] = useState(2);
  const [asiChoices, setAsiChoices] = useState({});
  const [selectedSubclass, setSelectedSubclass] = useState(null);
  
  const [masteryChoices, setMasteryChoices] = useState(character.weapon_mastery_choices || []);

  const diceContainerRef = useRef(null);
  const diceInstanceRef = useRef(null);

  const { 
    hpRollFormula, 
    isAbilityIncrease, 
    isSubclassChoice,
    isMasteryIncrease,
    newMasteryCount
  } = character.pendingLevelUp;

  const racialHpBonus = getRacialHpBonus(character);

  const finalAbilities = useMemo(() => {
    const final = {};
    for (const key in character.abilities) {
      final[key] = character.abilities[key] + getRacialAbilityBonus(character, key);
    }
    return final;
  }, [character]);

  // Initialisiere DiceBox beim Mounten
  useEffect(() => {
    if (diceContainerRef.current && !diceInstanceRef.current) {
      new DiceBox("#dice-box", {
        assetPath: "/assets/dice-box/",
        theme: "default",
        offscreen: true,
      }).init().then((dice) => {
        diceInstanceRef.current = dice;
      });
    }
    
    // Cleanup beim Unmounten
    return () => {
      if (diceInstanceRef.current && diceContainerRef.current) {
        diceContainerRef.current.innerHTML = '';
      }
      diceInstanceRef.current = null;
    }
  }, []); // Leeres Array sorgt für Ausführung nur bei Mount/Unmount

  const handleRollHP = async () => {
    if (diceInstanceRef.current) {
      const results = await diceInstanceRef.current.roll(hpRollFormula);
      const formulaResult = rollDiceFormula(hpRollFormula, results); 
      setRollResult({ ...formulaResult, racialBonus: racialHpBonus });
    } else {
      console.warn("DiceBox nicht initialisiert. Nutze Fallback-Wurf.");
      const fallbackRoll = Math.floor(Math.random() * parseInt(hpRollFormula.split('d')[1] || 8)) + 1;
      let bonus = 0;
      if (hpRollFormula.includes('+')) bonus = parseInt(hpRollFormula.split('+')[1] || 0);
      setRollResult({ 
        total: fallbackRoll + bonus, 
        dice: [fallbackRoll],
        bonus: bonus, 
        racialBonus: racialHpBonus 
      });
    }
  };

  const handleConfirmAll = () => {
    const choices = {
      asi: asiChoices,
      subclassKey: selectedSubclass,
      weapon_mastery_choices: masteryChoices
    };
    onConfirm(rollResult.total + (rollResult.racialBonus || 0), choices);
  };

  const handleAsiChange = (newChoices, newPoints) => {
    setAsiChoices(newChoices);
    setAsiPoints(newPoints);
  };

  // --- VALIDIERUNGS-LOGIK ---
  const hpDone = !!rollResult;
  const asiDone = !isAbilityIncrease || (isAbilityIncrease && asiPoints === 0);
  const subclassDone = !isSubclassChoice || (isSubclassChoice && !!selectedSubclass);
  const masteryDone = !isMasteryIncrease || (isMasteryIncrease && masteryChoices.length >= newMasteryCount);
  
  const allChoicesValid = hpDone && asiDone && subclassDone && masteryDone;

  return (
    <div className="levelup-screen">
      
      {/* Linke Spalte (Info) */}
      <div className="levelup-sidebar">
        <h2>Stufenaufstieg!</h2>
        <p className="levelup-subtitle">{character.name} steigt auf Stufe {newLevel} auf!</p>
        
        <div className="levelup-summary-preview">
          <h4>Charakterübersicht</h4>
          <p>Klasse: {character.class.name}</p>
          <p>Trefferpunkte: {character.stats.hp} / {character.stats.maxHp}
             {rollResult && ` (+${rollResult.total + (rollResult.racialBonus || 0)})`}
          </p>
          <p>Rüstungsklasse: {character.stats.ac}</p>
        </div>
        
        {/* --- NEUE CHECKLISTE --- */}
        <div className="levelup-steps">
          <h4>Aktions-Checkliste</h4>
          <div className={`step-item ${hpDone ? 'complete' : 'active'}`}>
             Trefferpunkte würfeln
          </div>
          {isAbilityIncrease && (
            <div className={`step-item ${asiDone ? 'complete' : 'active'}`}>
               Attribute verteilen
            </div>
          )}
          {isSubclassChoice && (
             <div className={`step-item ${subclassDone ? 'complete' : 'active'}`}>
               Archetyp wählen
            </div>
          )}
           {isMasteryIncrease && (
             <div className={`step-item ${masteryDone ? 'complete' : 'active'}`}>
               Waffenmeisterschaft
            </div>
          )}
        </div>
      </div>

      {/* Rechte Spalte (Aktionen) */}
      <div className="levelup-main-panel">
        
        {/* --- NEUES CHARSHEET-LAYOUT --- */}
        <div className="charsheet-layout">

          {/* HP-SEKTION */}
          <div className={`charsheet-section hp-section ${!hpDone ? 'action-required' : ''}`}>
            <h3>Trefferpunkte (Stufe {newLevel})</h3>
            <div 
              ref={diceContainerRef} 
              id="dice-box" 
              style={{ width: '100%', height: '200px', display: hpDone ? 'none' : 'block' }}
            ></div>
            
            {!rollResult ? (
              <button onClick={handleRollHP} className="roll-button">
                Würfeln ({hpRollFormula}{racialHpBonus > 0 ? ` + ${racialHpBonus}` : ''})
              </button>
            ) : (
              <div className="hp-result">
                <p>Gewürfelt: {rollResult.dice.join(' + ')} + {rollResult.bonus} (KON) {racialHpBonus > 0 ? `+ ${racialHpBonus} (Rasse)` : ''}</p>
                <p className="hp-total">Gesamt-Zuwachs: {rollResult.total + racialHpBonus}</p>
              </div>
            )}
          </div>
          
          {/* ASI-SEKTION */}
          {isAbilityIncrease && (
            <div className={`charsheet-section asi-section ${!asiDone ? 'action-required' : ''}`}>
              <AbilityScoreImprovement
                finalAbilities={finalAbilities}
                points={asiPoints}
                choices={asiChoices}
                onChange={handleAsiChange}
              />
            </div>
          )}

          {/* SUBCLASS-SEKTION */}
          {isSubclassChoice && (
            <div className={`charsheet-section subclass-section ${!subclassDone ? 'action-required' : ''}`}>
              <SubclassSelection
                classKey={character.class.key}
                selectedKey={selectedSubclass}
                onSelect={setSelectedSubclass}
              />
            </div>
          )}

          {/* MASTERY-SEKTION */}
          {isMasteryIncrease && (
            <div className={`charsheet-section mastery-section ${!masteryDone ? 'action-required' : ''}`}>
              <h4>Waffenmeisterschaft (Wähle {newMasteryCount})</h4>
              <WeaponMasterySelection
                character={{ 
                  ...character, 
                  level: newLevel, 
                  weapon_mastery_choices: masteryChoices 
                }}
                updateCharacter={(updates) => setMasteryChoices(updates.weapon_mastery_choices)}
              />
            </div>
          )}

        </div>
        
        {/* FOOTER-BUTTON */}
        <div className="levelup-footer">
          <button 
            onClick={handleConfirmAll} 
            className="confirm-button final-confirm"
            disabled={!allChoicesValid}
          >
            Aufstieg bestätigen
          </button>
        </div>

      </div>
    </div>
  );
};