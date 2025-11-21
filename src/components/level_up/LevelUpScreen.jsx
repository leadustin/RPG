// src/components/level_up/LevelUpScreen.jsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import DiceBox from "@3d-dice/dice-box"; // <--- 3D Würfel wieder da!
import { getRacialAbilityBonus } from '../../engine/characterEngine';
import allClassData from '../../data/classes.json'; 
import featuresData from '../../data/features.json'; 
import spellsData from '../../data/spells.json'; 
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

// Hilfsfunktion für DiceBox Ergebnisse
const rollDiceFormula = (formula, results) => {
  let bonus = 0;
  if (formula.includes('+')) {
    bonus = parseInt(formula.split('+')[1] || 0);
  } else if (formula.includes('-')) {
    bonus = -parseInt(formula.split('-')[1] || 0);
  }
  
  // DiceBox gibt ein Array von Objekten zurück: [{ value: 4, ... }, { value: 2, ... }]
  const diceValues = results.map(r => r.value);
  const diceSum = diceValues.reduce((a, b) => a + b, 0);

  return {
    total: diceSum + bonus,
    dice: diceValues,
    bonus: bonus
  };
};

// +++ NEUE KOMPONENTE: Lokale Zauberauswahl +++
const LevelUpSpellSelection = ({ character, cantripsCount, spellsCount, onSelectionChange }) => {
    const [selectedCantrips, setSelectedCantrips] = useState([]);
    const [selectedSpells, setSelectedSpells] = useState([]);
    const classKey = character.class.key;
    const newLevel = character.pendingLevelUp.newLevel;

    // Maximale Spruchstufe berechnen (Heuristik für Level Up)
    let maxSpellLevel = 1;
    if (['wizard', 'sorcerer', 'bard', 'cleric', 'druid'].includes(classKey)) {
        maxSpellLevel = Math.ceil(newLevel / 2);
    } else if (['ranger', 'paladin'].includes(classKey)) {
        maxSpellLevel = Math.ceil(newLevel / 2); 
        if (newLevel < 2) maxSpellLevel = 0; 
    } else if (classKey === 'warlock') {
        maxSpellLevel = Math.ceil(newLevel / 2); 
        if (maxSpellLevel > 5) maxSpellLevel = 5; 
    }

    // Verfügbare Zauber filtern
    const availableCantrips = spellsData.filter(s => 
        s.level === 0 && 
        s.classes.includes(classKey) && 
        !(character.cantrips_known || []).includes(s.key)
    );
    
    const availableSpells = spellsData.filter(s => 
        s.level > 0 && 
        s.level <= maxSpellLevel && 
        s.classes.includes(classKey) && 
        !(character.spells_known || []).includes(s.key) &&
        !(character.spellbook || []).includes(s.key)
    );

    const handleCantripToggle = (key) => {
        if (selectedCantrips.includes(key)) {
            setSelectedCantrips(selectedCantrips.filter(k => k !== key));
        } else if (selectedCantrips.length < cantripsCount) {
            setSelectedCantrips([...selectedCantrips, key]);
        }
    };

    const handleSpellToggle = (key) => {
        if (selectedSpells.includes(key)) {
            setSelectedSpells(selectedSpells.filter(k => k !== key));
        } else if (selectedSpells.length < spellsCount) {
            setSelectedSpells([...selectedSpells, key]);
        }
    };

    // Melde Änderungen nach oben
    useEffect(() => {
        onSelectionChange({ cantrips: selectedCantrips, spells: selectedSpells });
    }, [selectedCantrips, selectedSpells]);

    return (
        <div className="feat-sub-selection">
            {cantripsCount > 0 && (
                <div style={{marginBottom: '20px'}}>
                    <h4>Wähle {cantripsCount} neue Zaubertricks</h4>
                    <div className="skill-grid">
                        {availableCantrips.map(spell => (
                            <div 
                                key={spell.key} 
                                className={`skill-choice ${selectedCantrips.includes(spell.key) ? 'selected' : ''}`}
                                onClick={() => handleCantripToggle(spell.key)}
                            >
                                {spell.name}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {spellsCount > 0 && (
                <div>
                    <h4>Wähle {spellsCount} neue Zauber (bis Grad {maxSpellLevel})</h4>
                    <div className="skill-grid" style={{maxHeight: '300px', overflowY: 'auto'}}>
                        {availableSpells.map(spell => (
                            <div 
                                key={spell.key} 
                                className={`skill-choice ${selectedSpells.includes(spell.key) ? 'selected' : ''}`}
                                onClick={() => handleSpellToggle(spell.key)}
                            >
                                <span style={{marginRight:'auto'}}>{spell.name}</span>
                                <span style={{fontSize:'0.8em', color:'#aaa'}}>Grad {spell.level}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
// +++ ENDE NEUE KOMPONENTE +++


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
      <h4>Attributswerte erhöhen</h4>
      <p className="small-text">Verteile +2 auf ein Attribut oder +1 auf zwei Attribute.</p>
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
  
  // Schritte: 0=HP, 1=ASI/Feat, 2=Subclass, 3=Spells, 4=Mastery, 5=Summary
  const [step, setStep] = useState(0); 
  const [rollResult, setRollResult] = useState(null);
  
  // State für ASI vs Feat
  const [levelUpMode, setLevelUpMode] = useState('asi'); 
  const [asiPoints, setAsiPoints] = useState(2);
  const [asiChoices, setAsiChoices] = useState({});
  
  // State für Feats
  const [selectedFeatKey, setSelectedFeatKey] = useState(null);
  const [featSelections, setFeatSelections] = useState({}); 

  const [selectedSubclass, setSelectedSubclass] = useState(null);
  const [masteryChoices, setMasteryChoices] = useState(character.weapon_mastery_choices || []);
  
  // +++ NEU: Zauber State +++
  const [spellChoices, setSpellChoices] = useState({ cantrips: [], spells: [] });

  const [narratorText, setNarratorText] = useState("");

  // Refs für 3D Würfel
  const diceContainerRef = useRef(null);
  const diceInstanceRef = useRef(null);

  const { 
    hpRollFormula, 
    isAbilityIncrease, 
    isSubclassChoice,
    isMasteryIncrease,
    newMasteryCount,
    newCantripsToLearn,
    newSpellsToLearn
  } = character.pendingLevelUp;

  const hasSpellChoice = newCantripsToLearn > 0 || newSpellsToLearn > 0;
  const racialHpBonus = getRacialHpBonus(character);

  const finalAbilities = useMemo(() => {
    const final = {};
    for (const key in character.abilities) {
      final[key] = character.abilities[key] + getRacialAbilityBonus(character, key);
    }
    return final;
  }, [character]);

  const availableFeats = useMemo(() => {
      const existingFeats = [character.background?.feat, ...(character.feats || [])];
      return featuresData.filter(f => !existingFeats.includes(f.key) && f.feature_type === "feat");
  }, [character]);

  // +++ FIX: Robuste DiceBox Initialisierung +++
  useEffect(() => {
    if (step === 0) {
      // Timer verhindert Rendering-Konflikte
      const timer = setTimeout(() => {
        if (diceContainerRef.current) {
          // Container leeren, um doppelte Canvas zu verhindern
          diceContainerRef.current.innerHTML = '';
          
          // WICHTIG: Config Objekt als einziges Argument (v1.1)
          const box = new DiceBox({
            container: "#dice-box",
            assetPath: "/assets/dice-box/",
            theme: "default",
            scale: 6, // Skalierung für bessere Sichtbarkeit
          });

          box.init().then(() => {
            diceInstanceRef.current = box;
          });
        }
      }, 100);
      return () => clearTimeout(timer);
    } else {
      // Aufräumen, wenn Schritt verlassen wird
      diceInstanceRef.current = null;
    }
  }, [step]);
  // +++ ENDE FIX +++

  useEffect(() => {
    switch(step) {
      case 0: setNarratorText(`Du fühlst dich stärker, ${character.name}. Stelle fest, wie viel zäher du geworden bist.`); break;
      case 1: setNarratorText("Dein Körper und Geist entwickeln sich. Wählst du Attribute oder ein neues Talent?"); break;
      case 2: setNarratorText("Wähle den Pfad, dem du folgen wirst."); break;
      case 3: setNarratorText("Dein arkanes Wissen wächst."); break;
      case 4: setNarratorText("Deine Waffenkunst verfeinert sich."); break;
      case 5: setNarratorText("Bestätige deinen Aufstieg."); break;
      default: setNarratorText("");
    }
  }, [step, character.name]);


  const handleRollHP = async () => {
    if (diceInstanceRef.current) {
      try {
        // 3D Würfel nutzen
        const results = await diceInstanceRef.current.roll(hpRollFormula);
        const formulaResult = rollDiceFormula(hpRollFormula, results); 
        setRollResult({ ...formulaResult, racialBonus: racialHpBonus });
      } catch (e) {
        console.error("Dice roll error:", e);
        // Fallback falls 3D fehlschlägt
        const fallbackRoll = Math.floor(Math.random() * parseInt(hpRollFormula.split('d')[1] || 8)) + 1;
        setRollResult({ total: fallbackRoll, dice: [fallbackRoll], bonus: 0, racialBonus: racialHpBonus });
      }
    } else {
      console.warn("DiceBox nicht bereit. Nutze Fallback.");
      const fallbackRoll = Math.floor(Math.random() * parseInt(hpRollFormula.split('d')[1] || 8)) + 1;
      let bonus = 0;
      if (hpRollFormula.includes('+')) bonus = parseInt(hpRollFormula.split('+')[1] || 0);
      setRollResult({ total: fallbackRoll + bonus, dice: [fallbackRoll], bonus, racialBonus: racialHpBonus });
    }
  };

  // --- LOGIK ZUM SCHRITTWEISEN VORRÜCKEN ---
  const navigateToNextStep = (currentStep) => {
    if (currentStep < 1 && isAbilityIncrease) setStep(1);
    else if (currentStep < 2 && isSubclassChoice) setStep(2);
    else if (currentStep < 3 && hasSpellChoice) setStep(3); 
    else if (currentStep < 4 && isMasteryIncrease) setStep(4);
    else setStep(5);
  };

  const handleConfirmHP = () => navigateToNextStep(0);
  
  const handleConfirmDecision = () => {
    if (levelUpMode === 'asi') {
        if (asiPoints > 0) return alert("Bitte verteile alle Attributspunkte.");
    } else {
        if (!selectedFeatKey) return alert("Bitte wähle ein Talent.");
    }
    navigateToNextStep(1);
  };
  
  const handleConfirmSubclass = () => {
    if (!selectedSubclass) return alert("Bitte wähle einen Archetyp.");
    navigateToNextStep(2);
  };

  const handleConfirmSpells = () => {
      if (spellChoices.cantrips.length < newCantripsToLearn) return alert(`Bitte wähle ${newCantripsToLearn} Zaubertricks.`);
      if (spellChoices.spells.length < newSpellsToLearn) return alert(`Bitte wähle ${newSpellsToLearn} Zauber.`);
      navigateToNextStep(3);
  };

  const handleConfirmMastery = () => {
     if (masteryChoices.length < newMasteryCount) return alert(`Bitte wähle deine ${newMasteryCount}. Waffenmeisterschaft aus.`);
    navigateToNextStep(4);
  };

  const handleConfirmAll = () => {
    const choices = {
      asi: levelUpMode === 'asi' ? asiChoices : null,
      feat: levelUpMode === 'feat' ? { key: selectedFeatKey, selections: featSelections[selectedFeatKey] } : null,
      subclassKey: selectedSubclass,
      weapon_mastery_choices: masteryChoices,
      newSpells: spellChoices
    };
    onConfirm(rollResult.total, choices);
  };

  const handleAsiChange = (newChoices, newPoints) => {
    setAsiChoices(newChoices);
    setAsiPoints(newPoints);
  };
  
  const handleFeatSelectionUpdate = (updates) => {
      if (updates.feat_choices) {
          setFeatSelections(prev => ({ ...prev, ...updates.feat_choices }));
      }
  };

  const selectedFeat = featuresData.find(f => f.key === selectedFeatKey);

  return (
    <div className="levelup-screen">
      <div className="levelup-sidebar">
        <h2>Stufenaufstieg!</h2>
        <p className="levelup-subtitle">{character.name} &rarr; Stufe {newLevel}</p>
        
        <div className="levelup-summary-preview">
            <p>TP: {character.stats.hp} {rollResult && ` + ${rollResult.total + (rollResult.racialBonus || 0)}`}</p>
            <div className="ability-grid-preview">
                {Object.keys(finalAbilities).map((key) => {
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
          <div className={`step-item ${step === 0 ? 'active' : step > 0 ? 'complete' : ''}`}>Trefferpunkte</div>
          {isAbilityIncrease && <div className={`step-item ${step === 1 ? 'active' : step > 1 ? 'complete' : ''}`}>Attribute / Talent</div>}
          {isSubclassChoice && <div className={`step-item ${step === 2 ? 'active' : step > 2 ? 'complete' : ''}`}>Archetyp</div>}
          {hasSpellChoice && <div className={`step-item ${step === 3 ? 'active' : step > 3 ? 'complete' : ''}`}>Zauber</div>}
          {isMasteryIncrease && <div className={`step-item ${step === 4 ? 'active' : step > 4 ? 'complete' : ''}`}>Meisterschaft</div>}
          <div className={`step-item ${step === 5 ? 'active' : ''}`}>Zusammenfassung</div>
        </div>
      </div>

      <div className="levelup-main-panel">
        <div className="narrator-box"><p>{narratorText}</p></div>
        <div className="levelup-container">
          
          {/* 0: HP - MIT 3D WÜRFELN */}
          {step === 0 && (
            <div className="levelup-section hp-roll-section">
              {/* WICHTIG: ID dice-box muss existieren */}
              <div 
                id="dice-box" 
                ref={diceContainerRef} 
                style={{ width: '100%', height: '300px', position: 'relative', background: 'rgba(0,0,0,0.5)', borderRadius: '8px' }}
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
          
          {/* 1: ASI oder FEAT */}
          {step === 1 && isAbilityIncrease && (
            <div className="levelup-section choices-section">
                <div className="toggle-group">
                    <button className={levelUpMode === 'asi' ? 'active' : ''} onClick={() => setLevelUpMode('asi')}>Attribute verbessern</button>
                    <button className={levelUpMode === 'feat' ? 'active' : ''} onClick={() => setLevelUpMode('feat')}>Talent wählen</button>
                </div>

                <div className="choice-block">
                    {levelUpMode === 'asi' ? (
                        <AbilityScoreImprovement finalAbilities={finalAbilities} points={asiPoints} choices={asiChoices} onChange={handleAsiChange} />
                    ) : (
                        <div className="feat-picker">
                            <select className="panel-select" onChange={(e) => setSelectedFeatKey(e.target.value)} value={selectedFeatKey || ""}>
                                <option value="" disabled>Wähle ein Talent...</option>
                                {availableFeats.map(f => <option key={f.key} value={f.key}>{f.name}</option>)}
                            </select>
                            {selectedFeat && (
                                <div className="feat-details-box">
                                    <p><strong>{selectedFeat.name}</strong></p>
                                    <p className="small-text">{selectedFeat.description}</p>
                                    <div className="feat-sub-selection">
                                        <FeatSelection feat={selectedFeat} character={{ ...character, feat_choices: featSelections }} updateCharacter={handleFeatSelectionUpdate} />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <button onClick={handleConfirmDecision} className="confirm-button">Weiter</button>
            </div>
          )}

          {/* 2: Subclass */}
          {step === 2 && isSubclassChoice && (
             <div className="levelup-section choices-section">
              <div className="choice-block">
                <SubclassSelection classKey={character.class.key} selectedKey={selectedSubclass} onSelect={setSelectedSubclass} />
              </div>
              <button onClick={handleConfirmSubclass} className="confirm-button">Weiter</button>
            </div>
          )}

          {/* 3: Zauber */}
          {step === 3 && hasSpellChoice && (
             <div className="levelup-section choices-section">
               <div className="choice-block">
                  <h3>Magisches Wissen erweitert</h3>
                  <LevelUpSpellSelection character={character} cantripsCount={newCantripsToLearn} spellsCount={newSpellsToLearn} onSelectionChange={setSpellChoices} />
                </div>
              <button onClick={handleConfirmSpells} className="confirm-button">Weiter</button>
            </div>
          )}
          
          {/* 4: Mastery */}
          {step === 4 && isMasteryIncrease && (
             <div className="levelup-section choices-section">
               <div className="choice-block">
                  <h4>Waffenmeisterschaft (Wähle {newMasteryCount})</h4>
                  <WeaponMasterySelection character={{ ...character, level: newLevel, weapon_mastery_choices: masteryChoices }} updateCharacter={(updates) => setMasteryChoices(updates.weapon_mastery_choices)} />
                </div>
              <button onClick={handleConfirmMastery} className="confirm-button">Weiter</button>
            </div>
          )}

          {/* 5: Summary */}
          {step === 5 && (
            <div className="levelup-section summary-section">
              <h3>Zusammenfassung</h3>
              <p>TP +{rollResult.total + (rollResult.racialBonus || 0)}</p>
              {isAbilityIncrease && levelUpMode === 'asi' && <p>Attribute erhöht.</p>}
              {isAbilityIncrease && levelUpMode === 'feat' && selectedFeat && <p>Neues Talent: <strong>{selectedFeat.name}</strong></p>}
              {isSubclassChoice && selectedSubclass && <p>Archetyp gewählt.</p>}
              {hasSpellChoice && <p>Neue Zauber gelernt.</p>}
              <button onClick={handleConfirmAll} className="confirm-button final-confirm">Aufstieg bestätigen</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};