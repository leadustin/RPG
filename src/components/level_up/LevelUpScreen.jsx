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
  
  // Bedeutung der Schritte: 0=HP, 1=ASI, 2=Subclass, 3=Mastery, 4=Summary
  const [step, setStep] = useState(0); 
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

  useEffect(() => {
    // 1. Initialisiere DiceBox nur im HP-Schritt (step 0)
    if (step === 0 && diceContainerRef.current && !diceInstanceRef.current) {
      new DiceBox("#dice-box", {
        assetPath: "/assets/dice-box/",
        theme: "default",
        offscreen: true,
      }).init().then((dice) => {
        diceInstanceRef.current = dice;
      });
    } 
    // 2. Bereinige beim Verlassen des HP-Schritts
    else if (step !== 0 && diceInstanceRef.current) {
      if (diceContainerRef.current) {
        diceContainerRef.current.innerHTML = ''; // Canvas leeren
      }
      diceInstanceRef.current = null;
    }
  }, [step]); // Abhängig von 'step'

  const handleRollHP = async () => {
    if (diceInstanceRef.current) {
      const results = await diceInstanceRef.current.roll(hpRollFormula);
      const formulaResult = rollDiceFormula(hpRollFormula, results); 
      setRollResult({ ...formulaResult, racialBonus: racialHpBonus });
    } else {
      console.warn("DiceBox nicht initialisiert. Nutze Fallback-Wurf.");
      // ... (Fallback-Logik) ...
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

  // --- NEUE STEP-LOGIK ---

  const navigateToNextStep = (currentStep) => {
    if (currentStep < 1 && isAbilityIncrease) {
      setStep(1); // Gehe zu ASI
    } else if (currentStep < 2 && isSubclassChoice) {
      setStep(2); // Gehe zu Subclass
    } else if (currentStep < 3 && isMasteryIncrease) {
      setStep(3); // Gehe zu Mastery
    } else {
      setStep(4); // Gehe zur Zusammenfassung
    }
  };

  const handleConfirmHP = () => {
    navigateToNextStep(0);
  };
  
  const handleConfirmASI = () => {
    if (isAbilityIncrease && asiPoints > 0) {
      alert("Bitte verteile alle Attributspunkte.");
      return;
    }
    navigateToNextStep(1);
  };
  
  const handleConfirmSubclass = () => {
    if (isSubclassChoice && !selectedSubclass) {
      alert("Bitte wähle einen Archetyp.");
      return;
    }
    navigateToNextStep(2);
  };

  const handleConfirmMastery = () => {
     if (isMasteryIncrease && masteryChoices.length < newMasteryCount) {
       alert(`Bitte wähle deine ${newMasteryCount}. Waffenmeisterschaft aus.`);
       return;
    }
    navigateToNextStep(3);
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
  
  // Logik für die Sidebar-Anzeige
  const showChoicesStep = isAbilityIncrease || isSubclassChoice || isMasteryIncrease;
  const isChoiceStepActive = (step === 1 || step === 2 || step === 3);
  const isChoiceStepComplete = step > 3;


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
        
        <div className="levelup-steps">
          <div className={`step-item ${step === 0 ? 'active' : step > 0 ? 'complete' : ''}`}>
             Trefferpunkte
          </div>
          {/* Zeigt "Klassen-Wahl" an, wenn es überhaupt Wahlen gibt */}
          {showChoicesStep && (
            <div className={`step-item ${isChoiceStepActive ? 'active' : isChoiceStepComplete ? 'complete' : ''}`}>
               Klassen-Wahl
            </div>
          )}
          <div className={`step-item ${step === 4 ? 'active' : ''}`}>
             Zusammenfassung
          </div>
        </div>
      </div>

      {/* Rechte Spalte (Aktionen) */}
      <div className="levelup-main-panel">
        <div className="levelup-container">
          
          {/* Schritt 0: HP-Wurf */}
          {step === 0 && (
            <div className="levelup-section hp-roll-section">
              <h3>1. Trefferpunkte auswürfeln</h3>
              <div 
                ref={diceContainerRef} 
                id="dice-box" 
                style={{ width: '100%', height: '300px' }} // Größer für Fokus
              ></div>
              
              {!rollResult ? (
                <button onClick={handleRollHP} className="roll-button">
                  Würfeln ({hpRollFormula}{racialHpBonus > 0 ? ` + ${racialHpBonus}` : ''})
                </button>
              ) : (
                <div className="hp-result">
                  <p>Gewürfelt: {rollResult.dice.join(' + ')}</p>
                  <p>Modifikator: {rollResult.bonus}</p>
                  {racialHpBonus > 0 && <p>Rassenbonus (Hügelzwerg): {racialHpBonus}</p>}
                  <p className="hp-total">Gesamt-Zuwachs: {rollResult.total + racialHpBonus}</p>
                  <button onClick={handleConfirmHP} className="confirm-button">Weiter</button>
                </div>
              )}
            </div>
          )}
          
          {/* Schritt 1: ASI */}
          {step === 1 && isAbilityIncrease && (
            <div className="levelup-section choices-section">
              <h3>2. Attributswerte</h3>
              <div className="choice-block">
                <AbilityScoreImprovement
                  finalAbilities={finalAbilities}
                  points={asiPoints}
                  choices={asiChoices}
                  onChange={handleAsiChange}
                />
              </div>
              <button onClick={handleConfirmASI} className="confirm-button">Weiter</button>
            </div>
          )}

          {/* Schritt 2: Subclass */}
          {step === 2 && isSubclassChoice && (
             <div className="levelup-section choices-section">
              <h3>{isAbilityIncrease ? '3.' : '2.'} Archetyp</h3>
              <div className="choice-block">
                <SubclassSelection
                  classKey={character.class.key}
                  selectedKey={selectedSubclass}
                  onSelect={setSelectedSubclass}
                />
              </div>
              <button onClick={handleConfirmSubclass} className="confirm-button">Weiter</button>
            </div>
          )}
          
          {/* Schritt 3: Mastery */}
          {step === 3 && isMasteryIncrease && (
             <div className="levelup-section choices-section">
              <h3>Waffenmeisterschaft</h3>
               <div className="choice-block">
                  <h4>Waffenmeisterschaft (Wähle {newMasteryCount})</h4>
                  <p>Du hast eine neue Waffenmeisterschaft gelernt.</p>
                  
                  <WeaponMasterySelection
                    character={{ 
                      ...character, 
                      level: newLevel, 
                      weapon_mastery_choices: masteryChoices 
                    }}
                    updateCharacter={(updates) => setMasteryChoices(updates.weapon_mastery_choices)}
                  />
                </div>
              <button onClick={handleConfirmMastery} className="confirm-button">Weiter</button>
            </div>
          )}


          {/* Schritt 4: Zusammenfassung */}
          {step === 4 && (
            <div className="levelup-section summary-section">
              <h3>Zusammenfassung (Stufe {newLevel})</h3>
              
              {rollResult && (
                <p>
                  Neue Trefferpunkte: +{rollResult.dice.join(' + ')} (Wurf) + {rollResult.bonus} (KON)
                  {rollResult.racialBonus ? ` + ${rollResult.racialBonus} (Rasse)` : ""}
                  = <strong>{rollResult.total + (rollResult.racialBonus || 0)} TP</strong>
                </p>
              )}

              {isAbilityIncrease && Object.values(asiChoices).some(v => v > 0) && (
                <div>
                  <p>Attributserhöhungen:</p>
                  <ul>
                    {Object.keys(asiChoices).map(key => 
                      asiChoices[key] > 0 && <li key={key}>{key.toUpperCase()}: +{asiChoices[key]}</li>
                    )}
                  </ul>
                </div>
              )}

              {isSubclassChoice && selectedSubclass && (
                <p>
                  Neuer Archetyp: {
                    allClassData
                      .find(c => c.key === character.class.key)
                      ?.subclasses.find(sc => sc.key === selectedSubclass)
                      ?.name
                  }
                </p>
              )}

              {isMasteryIncrease && masteryChoices.length > (character.weapon_mastery_choices?.length || 0) && (
                <div>
                  <p>Neue Waffenmeisterschaften:</p>
                  <ul>
                    {masteryChoices
                      .filter(m => !(character.weapon_mastery_choices || []).includes(m))
                      .map(key => (
                        <li key={key}>{key} (Neu)</li>
                      ))}
                  </ul>
                </div>
              )}

              <button onClick={handleConfirmAll} className="confirm-button final-confirm">
                Aufstieg bestätigen
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};