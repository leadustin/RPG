// src/components/level_up/LevelUpScreen.jsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import DiceBox from "@3d-dice/dice-box";
import { getRacialAbilityBonus } from '../../engine/characterEngine';
import allClassData from '../../data/classes.json'; 
import featuresData from '../../data/features.json'; 
import './LevelUpScreen.css';

// Import der wiederverwendeten Komponenten
import { WeaponMasterySelection } from '../character_creation/WeaponMasterySelection';
import { FeatSelection } from '../character_creation/FeatSelection'; 
import '../character_creation/SkillSelection.css'; 
import '../character_creation/PanelDetails.css'; 

// KORREKTUR (D&D 2024): Alle Zwerge erhalten +1 HP pro Stufe
const getRacialHpBonus = (character) => {
  if (character.race.key === 'dwarf') return 1;
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
  
  // Schritte: 0=HP, 1=ASI/Feat, 2=Subclass, 3=Mastery, 4=Summary
  const [step, setStep] = useState(0); 
  const [rollResult, setRollResult] = useState(null);
  
  // State für ASI vs Feat
  const [levelUpMode, setLevelUpMode] = useState('asi'); // 'asi' oder 'feat'
  const [asiPoints, setAsiPoints] = useState(2);
  const [asiChoices, setAsiChoices] = useState({});
  
  // State für Feats
  const [selectedFeatKey, setSelectedFeatKey] = useState(null);
  const [featSelections, setFeatSelections] = useState({}); 

  const [selectedSubclass, setSelectedSubclass] = useState(null);
  const [masteryChoices, setMasteryChoices] = useState(character.weapon_mastery_choices || []);
  
  const [narratorText, setNarratorText] = useState("");

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

  // Verfügbare Feats filtern (bereits gewählte ausschließen)
  const availableFeats = useMemo(() => {
      const existingFeats = [character.background?.feat, ...(character.feats || [])];
      return featuresData.filter(f => !existingFeats.includes(f.key) && f.feature_type === "feat");
  }, [character]);

  // +++ FIX: Robuste DiceBox Initialisierung (Neue API) +++
  useEffect(() => {
    if (step === 0) {
      // Kurze Verzögerung, um sicherzustellen, dass das DOM bereit ist
      const timer = setTimeout(() => {
        if (diceContainerRef.current) {
          // Container leeren, um doppelte Canvas zu verhindern
          diceContainerRef.current.innerHTML = '';

          // +++ HIER IST DIE KORREKTUR: Config Objekt als einziges Argument +++
          const box = new DiceBox({
            container: "#dice-box", // Selector kommt hier rein
            assetPath: "/assets/dice-box/",
            theme: "default",
            scale: 6, // WICHTIG: Skalierung
          });
          // +++ ENDE KORREKTUR +++

          box.init().then(() => {
            diceInstanceRef.current = box;
          });
        }
      }, 50);
      return () => clearTimeout(timer);
    } else {
      // Aufräumen, wenn Schritt verlassen wird
      diceInstanceRef.current = null;
    }
  }, [step]);
  // +++ ENDE FIX +++

  // --- USEEFFECT FÜR ERZÄHLER-TEXT ---
  useEffect(() => {
    switch(step) {
      case 0:
        setNarratorText(`Du fühlst dich stärker, ${character.name}. Die Strapazen haben dich gestählt. Stelle fest, wie viel zäher du geworden bist.`);
        break;
      case 1:
        setNarratorText("Dein Körper und Geist entwickeln sich. Wählst du Attribute oder ein neues Talent?");
        break;
      case 2:
        setNarratorText("Mit deiner neuen Kraft musst du dich nun spezialisieren. Wähle den Pfad, dem du folgen wirst.");
        break;
      case 3:
        setNarratorText("Deine Fähigkeiten mit der Waffe sind gewachsen. Wähle eine neue Meisterschaft.");
        break;
      case 4:
        setNarratorText("Deine Entscheidungen sind getroffen. Sieh dir die Zusammenfassung an und bestätige deinen Aufstieg.");
        break;
      default:
        setNarratorText("");
    }
  }, [step, character.name]);


  const handleRollHP = async () => {
    if (diceInstanceRef.current) {
      try {
        const results = await diceInstanceRef.current.roll(hpRollFormula);
        const formulaResult = rollDiceFormula(hpRollFormula, results); 
        setRollResult({ ...formulaResult, racialBonus: racialHpBonus });
      } catch (e) {
        console.error("Dice roll error:", e);
        // Fallback
        const fallbackRoll = Math.floor(Math.random() * parseInt(hpRollFormula.split('d')[1] || 8)) + 1;
        setRollResult({ total: fallbackRoll, dice: [fallbackRoll], bonus: 0, racialBonus: racialHpBonus });
      }
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

  // --- LOGIK ZUM SCHRITTWEISEN VORRÜCKEN ---
  const navigateToNextStep = (currentStep) => {
    if (currentStep < 1 && isAbilityIncrease) {
      setStep(1); // Gehe zu ASI/Feat
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
  
  const handleConfirmDecision = () => {
    // Validierung für den aktuellen Modus (ASI oder Feat)
    if (levelUpMode === 'asi') {
        if (isAbilityIncrease && asiPoints > 0) {
            alert("Bitte verteile alle Attributspunkte.");
            return;
        }
    } else {
        if (!selectedFeatKey) {
            alert("Bitte wähle ein Talent.");
            return;
        }
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
    // Wir übergeben je nach Modus entweder ASI oder FEAT
    const choices = {
      asi: levelUpMode === 'asi' ? asiChoices : null,
      feat: levelUpMode === 'feat' ? { key: selectedFeatKey, selections: featSelections[selectedFeatKey] } : null,
      subclassKey: selectedSubclass,
      weapon_mastery_choices: masteryChoices
    };
    // Der Rest wird in characterEngine.jsx (applyLevelUp) verarbeitet
    onConfirm(rollResult.total, choices);
  };

  const handleAsiChange = (newChoices, newPoints) => {
    setAsiChoices(newChoices);
    setAsiPoints(newPoints);
  };
  
  // Helper für FeatSelection Updates
  const handleFeatSelectionUpdate = (updates) => {
      if (updates.feat_choices) {
          setFeatSelections(prev => ({
              ...prev,
              ...updates.feat_choices
          }));
      }
  };

  const selectedFeat = featuresData.find(f => f.key === selectedFeatKey);

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
  <p>Rüstungsklasse: {character.stats.ac || '?'}</p> 
  
  {/* --- ATTRIBUTS-GRID --- */}
  <div className="ability-grid-preview">
    {finalAbilities && Object.keys(finalAbilities).map((key) => {
      // Vorschau der Erhöhung
      const bonus = levelUpMode === 'asi' ? (asiChoices[key] || 0) : 0;
      return (
        <div key={key} className={`ability-preview-item ${bonus > 0 ? 'boosted' : ''}`}>
            <span className="ability-preview-label">{key.toUpperCase()}</span>
            <span className="ability-preview-value">{finalAbilities[key] + bonus}</span>
        </div>
      );
    })}
  </div>
</div>
        
         <div className="levelup-steps">
          <div className={`step-item ${step === 0 ? 'active' : step > 0 ? 'complete' : ''}`}>
             Trefferpunkte
          </div>
          {isAbilityIncrease && (
            <div className={`step-item ${step === 1 ? 'active' : step > 1 ? 'complete' : ''}`}>
               Attribute / Talent
            </div>
          )}
          {isSubclassChoice && (
            <div className={`step-item ${step === 2 ? 'active' : step > 2 ? 'complete' : ''}`}>
               Archetyp
            </div>
          )}
           {isMasteryIncrease && (
            <div className={`step-item ${step === 3 ? 'active' : step > 3 ? 'complete' : ''}`}>
               Meisterschaft
            </div>
          )}
          <div className={`step-item ${step === 4 ? 'active' : ''}`}>
             Zusammenfassung
          </div>
        </div>
      </div>

      {/* Rechte Spalte (Aktionen) */}
      <div className="levelup-main-panel">
        
        {/* ERZÄHLER-BOX */}
        <div className="narrator-box">
          <p>{narratorText}</p>
        </div>
        
        {/* CONTAINER FÜR DEN AKTIVEN SCHRITT */}
        <div className="levelup-container">
          
          {/* Schritt 0: HP-Wurf */}
          {step === 0 && (
            <div className="levelup-section hp-roll-section">
              {/* Wichtig: ID dice-box muss existieren für 3d-dice */}
              <div 
                ref={diceContainerRef} 
                id="dice-box" 
                style={{ width: '100%', height: '300px', position: 'relative' }}
              ></div>
              
              {!rollResult ? (
                <button onClick={handleRollHP} className="roll-button">
                  Würfeln ({hpRollFormula}{racialHpBonus > 0 ? ` + ${racialHpBonus}` : ''})
                </button>
              ) : (
                <div className="hp-result">
                  <p>Gewürfelt: {rollResult.dice.join(' + ')}</p>
                  <p>Modifikator: {rollResult.bonus}</p>
                  {racialHpBonus > 0 && <p>Rassenbonus (Zwerg): {racialHpBonus}</p>}
                  <p className="hp-total">Gesamt-Zuwachs: {rollResult.total + racialHpBonus}</p>
                  <button onClick={handleConfirmHP} className="confirm-button">Weiter</button>
                </div>
              )}
            </div>
          )}
          
          {/* Schritt 1: ASI oder FEAT */}
          {step === 1 && isAbilityIncrease && (
            <div className="levelup-section choices-section">
              
              {/* Umschalter */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                  <button 
                    className={`toggle-button ${levelUpMode === 'asi' ? 'active' : ''}`}
                    onClick={() => setLevelUpMode('asi')}
                    style={{ flex: 1, padding: '10px', background: levelUpMode === 'asi' ? '#d4af37' : '#333', color: levelUpMode === 'asi' ? '#000' : '#fff', border: '1px solid #555', cursor: 'pointer' }}
                  >
                      Attribute verbessern
                  </button>
                  <button 
                    className={`toggle-button ${levelUpMode === 'feat' ? 'active' : ''}`}
                    onClick={() => setLevelUpMode('feat')}
                    style={{ flex: 1, padding: '10px', background: levelUpMode === 'feat' ? '#d4af37' : '#333', color: levelUpMode === 'feat' ? '#000' : '#fff', border: '1px solid #555', cursor: 'pointer' }}
                  >
                      Talent wählen
                  </button>
              </div>

              {levelUpMode === 'asi' ? (
                  <div className="choice-block">
                    <AbilityScoreImprovement
                      finalAbilities={finalAbilities}
                      points={asiPoints}
                      choices={asiChoices}
                      onChange={handleAsiChange}
                    />
                  </div>
              ) : (
                  <div className="choice-block" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <h4>Wähle ein Talent</h4>
                      <select 
                          style={{ padding: '8px', background: '#222', color: '#fff', border: '1px solid #555' }}
                          onChange={(e) => setSelectedFeatKey(e.target.value)}
                          value={selectedFeatKey || ""}
                      >
                          <option value="" disabled>Wähle ein Talent...</option>
                          {availableFeats.map(f => <option key={f.key} value={f.key}>{f.name}</option>)}
                      </select>
                      
                      {selectedFeat && (
                          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '5px' }}>
                              <p><strong>{selectedFeat.name}</strong></p>
                              <p style={{ fontSize: '0.9em', fontStyle: 'italic' }}>{selectedFeat.description}</p>
                              
                              {/* FEAT SELECTION EINBINDEN */}
                              <div style={{ marginTop: '15px' }}>
                                  <FeatSelection 
                                      feat={selectedFeat}
                                      character={{ ...character, feat_choices: featSelections }}
                                      updateCharacter={handleFeatSelectionUpdate}
                                  />
                              </div>
                          </div>
                      )}
                  </div>
              )}
              
              <button onClick={handleConfirmDecision} className="confirm-button">Weiter</button>
            </div>
          )}

          {/* Schritt 2: Subclass */}
          {step === 2 && isSubclassChoice && (
             <div className="levelup-section choices-section">
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
              <h3>Zusammenfassung</h3>
              <p>TP +{rollResult.total + (rollResult.racialBonus || 0)}</p>
              
              {isAbilityIncrease && levelUpMode === 'asi' && Object.values(asiChoices).some(v => v > 0) && (
                <div>
                  <p>Attributserhöhungen:</p>
                  <ul>
                    {Object.keys(asiChoices).map(key => 
                      asiChoices[key] > 0 && <li key={key}>{key.toUpperCase()}: +{asiChoices[key]}</li>
                    )}
                  </ul>
                </div>
              )}

              {isAbilityIncrease && levelUpMode === 'feat' && selectedFeat && (
                  <p>Neues Talent: <strong>{selectedFeat.name}</strong></p>
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