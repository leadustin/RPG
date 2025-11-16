// src/components/level_up/LevelUpModal.jsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import DiceBox from "@3d-dice/dice-box";
import { getRacialAbilityBonus } from '../../engine/characterEngine';
// rollDiceFormula wird jetzt LOKAL definiert, nicht importiert
import allClassData from '../../data/classes.json'; 
import './LevelUpModal.css';

// Import der wiederverwendeten Komponente
import { WeaponMasterySelection } from '../character_creation/WeaponMasterySelection';

const getRacialHpBonus = (character) => {
  if (character.subrace?.key === 'hill-dwarf') return 1;
  return 0;
};

// +++ START: WIEDERHERGESTELLTE HILFSFUNKTION +++
/**
 * Verarbeitet Würfelergebnisse für eine Formel.
 * (Diese Funktion war vorher lokal in dieser Datei)
 */
const rollDiceFormula = (formula, results) => {
  let bonus = 0;
  if (formula.includes('+')) {
    bonus = parseInt(formula.split('+')[1] || 0);
  } else if (formula.includes('-')) {
    bonus = -parseInt(formula.split('-')[1] || 0);
  }
  
  // 'results' von dice-box ist ein Array von Objekten, z.B. [{ value: 5 }]
  const diceValues = results.map(r => r.value);
  
  const diceSum = diceValues.reduce((a, b) => a + b, 0);

  return {
    total: diceSum + bonus, // Die Endsumme
    dice: diceValues,       // Das Array der Würfe [5]
    bonus: bonus            // Der Modifikator (z.B. 2)
  };
};
// +++ ENDE: WIEDERHERGESTELLTE HILFSFUNKTION +++


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


export const LevelUpModal = ({ character, onConfirm }) => {
  const { newLevel } = character.pendingLevelUp;
  const [step, setStep] = useState(0); // 0: HP, 1: Choices, 2: Summary
  const [rollResult, setRollResult] = useState(null);
  const [asiPoints, setAsiPoints] = useState(2);
  const [asiChoices, setAsiChoices] = useState({});
  const [selectedSubclass, setSelectedSubclass] = useState(null);
  
  const [masteryChoices, setMasteryChoices] = useState(character.weapon_mastery_choices || []);

  const diceBoxRef = useRef(null);

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
    if (diceBoxRef.current) {
      new DiceBox("#dice-box", {
        assetPath: "/assets/dice-box/",
        theme: "default",
		    scale: 20,
        width: 500,
        height: 400
      }).init().then((dice) => {
        diceBoxRef.current = dice;
      });
    }
  }, []);

  const handleRollHP = async () => {
    if (diceBoxRef.current) {
      const results = await diceBoxRef.current.roll(hpRollFormula);
      // Diese Funktion ist jetzt wieder lokal verfügbar
      const formulaResult = rollDiceFormula(hpRollFormula, results); 
      setRollResult({ ...formulaResult, racialBonus: racialHpBonus });
    } else {
      console.warn("DiceBox nicht initialisiert. Nutze Fallback-Wurf.");
      const fallbackRoll = Math.floor(Math.random() * parseInt(hpRollFormula.split('d')[1] || 8)) + 1;
      
      let bonus = 0;
      if (hpRollFormula.includes('+')) {
        bonus = parseInt(hpRollFormula.split('+')[1] || 0);
      } else if (hpRollFormula.includes('-')) {
        bonus = -parseInt(hpRollFormula.split('-')[1] || 0);
      }

      // Dieser Block enthält jetzt den .dice-Fix
      setRollResult({ 
        total: fallbackRoll + bonus, 
        dice: [fallbackRoll],
        bonus: bonus, 
        racialBonus: racialHpBonus 
      });
    }
  };

  const handleConfirmHP = () => {
    if (!isAbilityIncrease && !isSubclassChoice && !isMasteryIncrease) {
      setStep(2); 
    } else {
      setStep(1);
    }
  };

  const handleConfirmChoices = () => {
    if (isAbilityIncrease && asiPoints > 0) {
      alert("Bitte verteile alle Attributspunkte.");
      return;
    }
    if (isSubclassChoice && !selectedSubclass) {
      alert("Bitte wähle einen Archetyp.");
      return;
    }
    if (isMasteryIncrease && masteryChoices.length < newMasteryCount) {
       alert(`Bitte wähle deine ${newMasteryCount}. Waffenmeisterschaft aus.`);
       return;
    }
    setStep(2);
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

  // HP-Wurf-Ansicht
  if (step === 0) {
    return (
      <div className="modal-backdrop">
        <div className="levelup-modal">
          <h2>Stufenaufstieg!</h2>
          <p className="levelup-subtitle">{character.name} steigt auf Stufe {newLevel} auf!</p>
          
          <div className="hp-roll-section">
            <h4>1. Trefferpunkte auswürfeln</h4>
            <div id="dice-box" ref={diceBoxRef} style={{ width: '100%', height: '150px' }}></div>
            
            {!rollResult ? (
              <button onClick={handleRollHP} className="roll-button">
                Würfeln ({hpRollFormula}{racialHpBonus > 0 ? ` + ${racialHpBonus}` : ''})
              </button>
            ) : (
              <div className="hp-result">
                {/* Diese Zeile (rollResult.dice.join) ist die Absturzursache.
                  Sie funktioniert jetzt, da 'dice' in beiden Fällen von handleRollHP gesetzt wird.
                */}
                <p>Gewürfelt: {rollResult.dice.join(' + ')}</p>
                <p>Modifikator: {rollResult.bonus}</p>
                {racialHpBonus > 0 && <p>Rassenbonus (Hügelzwerg): {racialHpBonus}</p>}
                <p className="hp-total">Gesamt-Zuwachs: {rollResult.total + racialHpBonus}</p>
                <button onClick={handleConfirmHP} className="confirm-button">Weiter</button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Auswahl-Ansicht (ASI, Subklasse, Meisterschaften)
  if (step === 1) {
    return (
      <div className="modal-backdrop">
        <div className="levelup-modal" style={{ maxWidth: '700px' }}>
          <h2>Stufe {newLevel}: Entscheidungen</h2>
          
          {isAbilityIncrease && (
            <div className="levelup-section">
              <AbilityScoreImprovement
                finalAbilities={finalAbilities}
                points={asiPoints}
                choices={asiChoices}
                onChange={handleAsiChange}
              />
            </div>
          )}
          
          {isSubclassChoice && (
            <div className="levelup-section">
              <SubclassSelection
                classKey={character.class.key}
                selectedKey={selectedSubclass}
                onSelect={setSelectedSubclass}
              />
            </div>
          )}

          {isMasteryIncrease && (
            <div className="levelup-section">
              <h4>Waffenmeisterschaft (Wähle {newMasteryCount})</h4>
              <p>Du hast eine neue Waffenmeisterschaft gelernt. Wähle deine Auswahl:</p>
              
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

          <button onClick={handleConfirmChoices} className="confirm-button">Zusammenfassung</button>
        </div>
      </div>
    );
  }

  // Zusammenfassungs-Ansicht
  if (step === 2) {
    return (
      <div className="modal-backdrop">
        <div className="levelup-modal">
          <h2>Zusammenfassung (Stufe {newLevel})</h2>
          
          {rollResult && (
            // Diese Zeile (Zeile 201 in deiner Fehlermeldung) ist jetzt sicher.
            <p>
              Neue Trefferpunkte: +{rollResult.dice.join(' + ')} (Wurf) + {rollResult.bonus} (KON)
              {rollResult.racialBonus ? ` + ${rollResult.racialBonus} (Rasse)` : ""}
              = <strong>{rollResult.total + (rollResult.racialBonus || 0)} TP</strong>
            </p>
          )}

          {isAbilityIncrease && (
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

          {isMasteryIncrease && (
            <div>
              <p>Waffenmeisterschaften ({masteryChoices.length}/{newMasteryCount}):</p>
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
      </div>
    );
  }

  return (
    <div className="modal-backdrop">
      <div className="levelup-modal">
        <p>Ein Fehler ist aufgetreten.</p>
      </div>
    </div>
  );
};