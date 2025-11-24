// src/components/level_up/LevelUpScreen.jsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import DiceBox from "@3d-dice/dice-box"; 

// Engines & Data
import { getRacialAbilityBonus } from '../../engine/characterEngine';
import { getAbilityModifier } from '../../engine/rulesEngine';
import { calculateFeatHpBonus } from '../../engine/featsEngine';
import { WarlockLogic } from '../../engine/logic/classes/WarlockLogic';
import allClassData from '../../data/classes.json'; 
import featuresData from '../../data/features.json'; 
import spellsData from '../../data/spells.json'; 
import './LevelUpScreen.css';

// Importe der Komponenten
import { WeaponMasterySelection } from '../character_creation/WeaponMasterySelection';
import { FeatSelection } from '../character_creation/FeatSelection'; 
import { InvocationSelection } from './InvocationSelection';
import { LevelUpSpells } from './LevelUpSpells'; // NEU
import { MysticArcanumSelection } from './MysticArcanumSelection'; // NEU
import '../character_creation/SkillSelection.css'; 
import '../character_creation/PanelDetails.css'; 

// --- HELPER ---
const getWarlockArcanumLevel = (level) => {
    if (level === 11) return 6;
    if (level === 13) return 7;
    if (level === 15) return 8;
    if (level === 17) return 9;
    return 0;
};

const getRacialHpBonus = (character) => character.race.key === 'dwarf' ? 1 : 0;

const rollDiceFormula = (formula, results) => {
  const diceValues = results.map(r => r.value);
  const diceSum = diceValues.reduce((a, b) => a + b, 0);
  return { total: diceSum, dice: diceValues };
};

const getSummaryData = (character, levelUpChoices, hpRollResult, newLevel) => {
  if (!character || !levelUpChoices) return null;

  const raceBonuses = { con: getRacialAbilityBonus(character, 'con') };
  const currentCon = character.abilities.con + (raceBonuses.con || 0);
  const asiCon = levelUpChoices.asi?.con || 0;
  const finalCon = currentCon + asiCon;
  const oldConMod = getAbilityModifier(currentCon);
  const newConMod = getAbilityModifier(finalCon);
  const oldFeatBonus = calculateFeatHpBonus(character);
  let tempFeats = [...(character.feats || [])];
  if (levelUpChoices.feat) tempFeats.push(levelUpChoices.feat.key);
  const tempChar = { ...character, level: newLevel, feats: tempFeats, background: character.background };
  const newFeatBonus = calculateFeatHpBonus(tempChar);
  const featHpGain = newFeatBonus - oldFeatBonus;
  let retroactiveConHp = 0;
  if (newConMod > oldConMod) retroactiveConHp = (newConMod - oldConMod) * (newLevel - 1);
  const dwarfBonus = character.race?.key === 'dwarf' ? 1 : 0;
  const diceRollValue = hpRollResult?.total || 0;
  const totalHpIncrease = diceRollValue + newConMod + featHpGain + retroactiveConHp + dwarfBonus;

  const oldMasteries = character.weapon_mastery_choices || [];
  const selectedMasteries = levelUpChoices.weapon_mastery_choices || [];
  const newMasteriesToShow = selectedMasteries.filter(m => !oldMasteries.includes(m));

  const swapData = levelUpChoices.spellSwap;
  let swapInfo = null;
  if (swapData && swapData.unlearn && swapData.learn) {
      const unlearnSpell = spellsData.find(s => s.key === swapData.unlearn);
      const learnSpell = spellsData.find(s => s.key === swapData.learn);
      if (unlearnSpell && learnSpell) swapInfo = { unlearn: unlearnSpell, learn: learnSpell };
  }

  const arkanumSpell = levelUpChoices.arcanumChoice ? spellsData.find(s => s.key === levelUpChoices.arcanumChoice) : null;
  const newInvocations = levelUpChoices.invocations?.add?.map(key => featuresData.find(f => f.key === key)) || [];
  const removedInvocation = levelUpChoices.invocations?.remove ? featuresData.find(f => f.key === levelUpChoices.invocations.remove) : null;

  return {
    hp: {
      total: totalHpIncrease,
      breakdown: [
        { label: "Trefferwürfel (Basis)", value: diceRollValue },
        { label: "Konstitution", value: newConMod },
        featHpGain > 0 ? { label: "Talente (z.B. Zäh)", value: featHpGain } : null,
        retroactiveConHp > 0 ? { label: "Rückwirkend (CON Anstieg)", value: retroactiveConHp } : null,
        dwarfBonus > 0 ? { label: "Zwergenzähigkeit", value: dwarfBonus } : null,
      ].filter(Boolean)
    },
    newConMod,
    oldConMod,
    asi: levelUpChoices.asi,
    feat: levelUpChoices.feat,
    newSpells: levelUpChoices.newSpells,
    spellSwap: swapInfo,
    arcanumChoice: arkanumSpell,
    newMasteries: newMasteriesToShow,
    subclass: levelUpChoices.subclassKey ? allClassData.find(c => c.key === character.class.key)?.subclasses.find(s => s.key === levelUpChoices.subclassKey) : null,
    invocations: { added: newInvocations, removed: removedInvocation }
  };
};

// +++ ASI & SUBCLASS (Kurzfassung für Übersicht) +++
const AbilityScoreImprovement = ({ finalAbilities, points, choices, onChange }) => {
  const handleIncrease = (key) => {
    const val = finalAbilities[key] + (choices[key] || 0);
    if (val >= 20) return;
    if (points > 0 && (choices[key] || 0) < 2 && Object.values(choices).reduce((a,b)=>a+b,0) < 2) onChange({ ...choices, [key]: (choices[key] || 0) + 1 }, points - 1);
  };
  const handleDecrease = (key) => { if (choices[key] > 0) onChange({ ...choices, [key]: choices[key] - 1 }, points + 1); };
  return (
    <div className="asi-selection"><h4>Attributswerte erhöhen</h4><p className="small-text">Verteile +2 auf ein Attribut oder +1 auf zwei Attribute (Max. 20).</p>
      {Object.keys(finalAbilities).map((key) => {
        const bonus = choices[key] || 0;
        return (<div key={key} className="asi-row"><span className="asi-label">{key.toUpperCase()} ({finalAbilities[key]})</span><button onClick={() => handleDecrease(key)} disabled={!bonus}>-</button><span className="asi-choice">{finalAbilities[key] + bonus} {bonus > 0 && <span style={{fontSize:'0.8em', color:'#d4af37'}}>(+{bonus})</span>}</span><button onClick={() => handleIncrease(key)} disabled={points === 0 || bonus >= 2 || (finalAbilities[key]+bonus) >= 20}>+</button></div>);
      })}
    </div>
  );
};

const SubclassSelection = ({ classKey, onSelect, selectedKey }) => {
  const classData = allClassData.find(c => c.key === classKey);
  return <div className="subclass-selection"><h4>Wähle deinen Archetyp</h4>{classData?.subclasses.map(sc => (<div key={sc.key} className={`subclass-option ${selectedKey === sc.key ? 'selected' : ''}`} onClick={() => onSelect(sc.key)}><strong>{sc.name}</strong><p>{sc.description}</p></div>))}</div>;
};


// --- HAUPTKOMPONENTE ---
export const LevelUpScreen = ({ character, onConfirm }) => {
  const { t } = useTranslation();
  const { newLevel } = character.pendingLevelUp;
  
  const [step, setStep] = useState(0); 
  const [rollResult, setRollResult] = useState(null);
  
  // Choices States
  const [levelUpMode, setLevelUpMode] = useState('asi'); 
  const [asiPoints, setAsiPoints] = useState(2);
  const [asiChoices, setAsiChoices] = useState({});
  const [selectedFeatKey, setSelectedFeatKey] = useState(null);
  const [featSelections, setFeatSelections] = useState({}); 
  const [selectedSubclass, setSelectedSubclass] = useState(null);
  const [masteryChoices, setMasteryChoices] = useState(character.weapon_mastery_choices || []);
  
  // ZAUBER STATE (Jetzt nur noch ein State-Objekt für alles)
  const [spellState, setSpellState] = useState({ newCantrips: [], newSpells: [], swap: null });
  
  const [arcanumChoice, setArcanumChoice] = useState(null);
  const [invocationChoices, setInvocationChoices] = useState({ remove: null, add: [], isValid: false });

  const [narratorText, setNarratorText] = useState("");
  const diceContainerRef = useRef(null);
  const diceInstanceRef = useRef(null);

  const { hpRollFormula, isAbilityIncrease, isSubclassChoice, isMasteryIncrease, newMasteryCount, newCantripsToLearn, newSpellsToLearn } = character.pendingLevelUp;

  // Warlock Logic
  const isWarlock = character.class.key === 'warlock';
  const arcanumLevel = isWarlock ? getWarlockArcanumLevel(newLevel) : 0;
  const hasArcanumChoice = arcanumLevel > 0;
  const canSwapSpell = isWarlock || ['bard', 'sorcerer', 'ranger'].includes(character.class.key);
  const hasSpellChoice = newCantripsToLearn > 0 || newSpellsToLearn > 0 || hasArcanumChoice || (canSwapSpell && character.spells_known?.length > 0);
  const racialHpBonus = getRacialHpBonus(character);

  const logic = useMemo(() => new WarlockLogic({ ...character, features: character.features || [], level: newLevel }), [character, newLevel]);
  const currentInvCount = (character.features || []).filter(f => logic.getAllInvocations().some(i => i.key === f)).length;
  const targetInvCount = isWarlock ? logic.getInvocationCount() : 0;
  const hasInvocationChoice = isWarlock && (targetInvCount > currentInvCount || currentInvCount > 0); 

  const finalAbilities = useMemo(() => {
    const final = {};
    for (const key in character.abilities) final[key] = character.abilities[key] + getRacialAbilityBonus(character, key);
    return final;
  }, [character]);

  let maxSpellLevel = 1;
  if (['wizard', 'sorcerer', 'bard', 'cleric', 'druid'].includes(character.class.key)) maxSpellLevel = Math.ceil(newLevel / 2);
  else if (['ranger', 'paladin'].includes(character.class.key)) maxSpellLevel = Math.ceil(newLevel / 2) || (newLevel < 2 ? 0 : 1);
  else if (isWarlock) maxSpellLevel = Math.min(5, Math.ceil(newLevel / 2));

  const availableFeats = useMemo(() => {
      const existingFeats = [character.background?.feat, ...(character.feats || [])];
      return featuresData.filter(f => !existingFeats.includes(f.key) && f.feature_type === "feat");
  }, [character]);

  useEffect(() => {
    if (step === 0) {
      const timer = setTimeout(() => {
        if (diceContainerRef.current) {
          diceContainerRef.current.innerHTML = '';
          const box = new DiceBox({ container: "#dice-box", assetPath: "/assets/dice-box/", theme: "default", scale: 12 });
          box.init().then(() => { diceInstanceRef.current = box; });
        }
      }, 100);
      return () => clearTimeout(timer);
    } else { diceInstanceRef.current = null; }
  }, [step]);

  useEffect(() => {
    switch(step) {
      case 0: setNarratorText(`Du fühlst dich stärker, ${character.name}. Stelle fest, wie viel zäher du geworden bist.`); break;
      case 1: setNarratorText("Dein Körper und Geist entwickeln sich."); break;
      case 2: setNarratorText("Wähle den Pfad, dem du folgen wirst."); break;
      case 2.5: setNarratorText("Dein Patron gewährt dir neue mystische Geheimnisse."); break;
      case 3: setNarratorText("Dein arkanes Wissen wächst."); break;
      case 4: setNarratorText("Deine Waffenkunst verfeinert sich."); break;
      case 5: setNarratorText("Bestätige deinen Aufstieg."); break;
      default: setNarratorText("");
    }
  }, [step, character.name]);

  const handleRollHP = async () => {
    if (diceInstanceRef.current) {
      try {
        const results = await diceInstanceRef.current.roll(hpRollFormula);
        setRollResult(rollDiceFormula(hpRollFormula, results)); 
      } catch (e) { setRollResult({ total: Math.floor(Math.random() * 8) + 1, dice: [] }); }
    } else { setRollResult({ total: Math.floor(Math.random() * 8) + 1, dice: [] }); }
  };

  const navigateToNextStep = (currentStep) => {
    if (currentStep < 1 && isAbilityIncrease) setStep(1);
    
    // ÄNDERUNG HIER: Subklasse erzwingen, wenn isSubclassChoice (Engine) true ist 
    // ODER wenn es ein Warlock auf Level 3 ist (unser manueller Override)
    else if (currentStep < 2 && (isSubclassChoice || (isWarlock && newLevel === 3))) setStep(2);
    
    else if (currentStep < 2.5 && hasInvocationChoice) setStep(2.5);
    else if (currentStep < 3 && hasSpellChoice) setStep(3);
    else if (currentStep < 4 && isMasteryIncrease) setStep(4);
    else setStep(5);
  };

  const handleConfirmHP = () => navigateToNextStep(0);
  const handleConfirmDecision = () => {
    if (levelUpMode === 'asi' && asiPoints > 0) return alert("Bitte verteile alle Punkte.");
    if (levelUpMode === 'feat' && !selectedFeatKey) return alert("Bitte wähle ein Talent.");
    navigateToNextStep(1);
  };
  const handleConfirmSubclass = () => {
    if (!selectedSubclass) return alert("Bitte wähle einen Archetyp.");
    navigateToNextStep(2);
  };
  const handleConfirmInvocations = () => {
      if (!invocationChoices.isValid) return alert(`Du musst genau ${targetInvCount} Anrufungen besitzen.`);
      navigateToNextStep(2.5);
  };
  
  const handleConfirmSpells = () => {
      if (spellState.newCantrips.length < newCantripsToLearn) return alert(`Bitte wähle ${newCantripsToLearn} Zaubertricks.`);
      if (spellState.newSpells.length < newSpellsToLearn) return alert(`Bitte wähle ${newSpellsToLearn} Zauber.`);
      if (spellState.swap && (!spellState.swap.unlearn || !spellState.swap.learn)) return alert("Zaubertausch unvollständig.");
      if (hasArcanumChoice && !arcanumChoice) return alert("Bitte wähle ein Mystisches Arkanum.");
      navigateToNextStep(3);
  };

  const handleConfirmMastery = () => {
     if (masteryChoices.length < newMasteryCount) return alert(`Bitte wähle deine ${newMasteryCount}. Waffenmeisterschaft aus.`);
    navigateToNextStep(4);
  };

  const handleConfirmAll = () => {
    const finalSpellChoices = { 
        cantrips: spellState.newCantrips, 
        spells: spellState.newSpells 
    };
    if (arcanumChoice) finalSpellChoices.spells = [...finalSpellChoices.spells, arcanumChoice];

    const choices = {
      asi: levelUpMode === 'asi' ? asiChoices : null,
      feat: levelUpMode === 'feat' ? { key: selectedFeatKey, selections: featSelections[selectedFeatKey] } : null,
      subclassKey: selectedSubclass,
      weapon_mastery_choices: masteryChoices,
      newSpells: finalSpellChoices,
      spellSwap: spellState.swap,
      arcanumChoice: arcanumChoice,
      invocations: invocationChoices
    };
    onConfirm(summaryData.hp.total, choices);
  };

  const handleAsiChange = (newChoices, newPoints) => { setAsiChoices(newChoices); setAsiPoints(newPoints); };
  const handleFeatSelectionUpdate = (updates) => { if (updates.feat_choices) setFeatSelections(prev => ({ ...prev, ...updates.feat_choices })); };
  const selectedFeat = featuresData.find(f => f.key === selectedFeatKey);

  const summaryData = useMemo(() => {
    if (step !== 5) return null;
    const choices = {
      asi: Object.keys(asiChoices).length > 0 ? asiChoices : null,
      feat: selectedFeat ? { key: selectedFeat.key, name: selectedFeat.name } : null,
      subclassKey: selectedSubclass,
      newSpells: { cantrips: spellState.newCantrips, spells: spellState.newSpells },
      weapon_mastery_choices: masteryChoices,
      spellSwap: spellState.swap,
      arcanumChoice: arcanumChoice,
      invocations: invocationChoices
    };
    return getSummaryData(character, choices, rollResult, newLevel);
  }, [step, character, asiChoices, selectedFeat, selectedSubclass, spellState, masteryChoices, arcanumChoice, invocationChoices, rollResult, newLevel]);

  // --- RENDER SUMMARY ---
  const renderSummaryStep = () => {
    if (!summaryData) return <div>Lade Daten...</div>;
    return (
      <div className="levelup-section summary-section">
        <h3>Zusammenfassung: Stufe {newLevel}</h3>
        <div className="summary-grid">
          <div className="summary-card hp-card">
            <div className="card-header"><h4>❤️ Trefferpunkte</h4><span className="hp-total-badge">+{summaryData.hp.total}</span></div>
            <ul className="breakdown-list">{summaryData.hp.breakdown.map((item, idx) => <li key={idx}><span className="label">{item.label}</span><span className="value">+{item.value}</span></li>)}</ul>
            <div className="total-row"><span>Neues Maximum:</span><strong>{character.stats.maxHp + summaryData.hp.total} TP</strong></div>
          </div>
          
          {/* INVOCATIONS SUMMARY */}
          {summaryData.invocations && (summaryData.invocations.added.length > 0 || summaryData.invocations.removed) && (
            <div className="summary-card"><h4>👁️ Mystische Anrufungen</h4>
              <div className="invocations-summary">
                {summaryData.invocations.removed && <div className="swap-out"><span className="swap-icon">−</span> {summaryData.invocations.removed.name}</div>}
                {summaryData.invocations.added.map(inv => <div key={inv.key} className="swap-in"><span className="swap-icon">+</span> {inv.name}</div>)}
              </div>
            </div>
          )}

          {/* SPELLS SUMMARY */}
          {(summaryData.newSpells.cantrips.length > 0 || summaryData.newSpells.spells.length > 0 || summaryData.spellSwap || summaryData.arcanumChoice) && (
            <div className="summary-card wide-card"><h4>✨ Neue Magie</h4>
              <div className="spells-summary-container">
                {summaryData.arcanumChoice && <div className="spell-group" style={{width:'100%',marginBottom:'10px'}}><h5 style={{color:'#d4af37'}}>Mystisches Arkanum</h5><div className="mini-spell-chip arcanum-chip">★ {summaryData.arcanumChoice.name}</div></div>}
                {summaryData.spellSwap && <div className="spell-swap-summary"><div className="swap-out"><span className="swap-icon">−</span> <span className="swap-name">{summaryData.spellSwap.unlearn.name}</span></div><div className="swap-arrow">➜</div><div className="swap-in"><span className="swap-icon">+</span> <span className="swap-name">{summaryData.spellSwap.learn.name}</span></div></div>}
                {summaryData.newSpells.cantrips.length > 0 && <div className="spell-group"><h5>Zaubertricks</h5><div className="spell-icons-row">{summaryData.newSpells.cantrips.map(id => { const s = spellsData.find(x=>x.key===id); return <div key={id} className="mini-spell-chip">{s?.name||id}</div>; })}</div></div>}
                {summaryData.newSpells.spells.length > 0 && <div className="spell-group"><h5>Zauber</h5><div className="spell-icons-row">{summaryData.newSpells.spells.map(id => { const s = spellsData.find(x=>x.key===id); return <div key={id} className="mini-spell-chip spell-level-1">{s?.name||id}</div>; })}</div></div>}
              </div>
            </div>
          )}
          
          {/* REST (ASI, Subclass, Mastery) */}
          {summaryData.subclass && <div className="summary-card"><h4>🛡️ Neuer Archetyp</h4><div className="highlight-box"><strong>{summaryData.subclass.name}</strong></div></div>}
          {(summaryData.asi || summaryData.feat) && <div className="summary-card"><h4>💪 Entwicklung</h4>{summaryData.asi ? <ul className="simple-list">{Object.entries(summaryData.asi).map(([key, val]) => <li key={key}>{key}: +{val}</li>)}</ul> : <div className="feat-preview"><strong>{summaryData.feat.name}</strong></div>}</div>}
          {summaryData.newMasteries && summaryData.newMasteries.length > 0 && <div className="summary-card"><h4>⚔️ Neue Waffenmeisterschaft</h4><div className="mastery-tags">{summaryData.newMasteries.map(key => <span key={key} className="mastery-tag">{t(`items.${key}`, key)}</span>)}</div></div>}

        </div>
        <div className="summary-actions"><button onClick={handleConfirmAll} className="confirm-button final-confirm">Levelaufstieg abschließen</button></div>
      </div>
    );
  };

  // --- RENDER MAIN ---
  return (
    <div className="levelup-screen">
      <div className="levelup-sidebar">
        <h2>Stufenaufstieg!</h2>
        <p className="levelup-subtitle">{character.name} &rarr; Stufe {newLevel}</p>
        <div className="levelup-summary-preview">
            <p>TP: {character.stats.hp} {rollResult && ` + ${(rollResult.total || 0) + racialHpBonus + getAbilityModifier(character.abilities.con + getRacialAbilityBonus(character, 'con'))}`}</p>
        </div>
        <div className="levelup-steps">
          <div className={`step-item ${step === 0 ? 'active' : step > 0 ? 'complete' : ''}`}>Trefferpunkte</div>
          {isAbilityIncrease && <div className={`step-item ${step === 1 ? 'active' : step > 1 ? 'complete' : ''}`}>Attribute / Talent</div>}
          {isSubclassChoice && <div className={`step-item ${step === 2 ? 'active' : step > 2 ? 'complete' : ''}`}>Archetyp</div>}
          {hasInvocationChoice && <div className={`step-item ${step === 2.5 ? 'active' : step > 2.5 ? 'complete' : ''}`}>Anrufungen</div>}
          {hasSpellChoice && <div className={`step-item ${step === 3 ? 'active' : step > 3 ? 'complete' : ''}`}>Zauber</div>}
          {isMasteryIncrease && <div className={`step-item ${step === 4 ? 'active' : step > 4 ? 'complete' : ''}`}>Meisterschaft</div>}
          <div className={`step-item ${step === 5 ? 'active' : ''}`}>Zusammenfassung</div>
        </div>
      </div>

      <div className="levelup-main-panel">
        <div className="narrator-box"><p>{narratorText}</p></div>
        <div className="levelup-container">
          
          {step === 0 && (
            <div className="levelup-section hp-roll-section">
              <div id="dice-box" ref={diceContainerRef} style={{ width: '100%', height: '300px', position: 'relative', background: 'rgba(0,0,0,0.5)', borderRadius: '8px' }}></div>
              {!rollResult ? <button onClick={handleRollHP} className="roll-button">Würfeln ({hpRollFormula})</button> : <div className="hp-result"><p>Gewürfelt: {rollResult.dice.join(' + ')}</p><button onClick={handleConfirmHP} className="confirm-button">Weiter</button></div>}
            </div>
          )}
          
          {step === 1 && isAbilityIncrease && (
            <div className="levelup-section choices-section">
                <div className="toggle-group"><button className={levelUpMode === 'asi' ? 'active' : ''} onClick={() => setLevelUpMode('asi')}>Attribute</button><button className={levelUpMode === 'feat' ? 'active' : ''} onClick={() => setLevelUpMode('feat')}>Talent</button></div>
                <div className="choice-block">{levelUpMode === 'asi' ? <AbilityScoreImprovement finalAbilities={finalAbilities} points={asiPoints} choices={asiChoices} onChange={handleAsiChange} /> : <div className="feat-picker"><select className="panel-select" onChange={(e) => setSelectedFeatKey(e.target.value)} value={selectedFeatKey || ""}><option value="" disabled>Wähle ein Talent...</option>{availableFeats.map(f => <option key={f.key} value={f.key}>{f.name}</option>)}</select>{selectedFeat && <FeatSelection feat={selectedFeat} character={{ ...character, feat_choices: featSelections }} updateCharacter={handleFeatSelectionUpdate} />}</div>}</div>
                <button onClick={handleConfirmDecision} className="confirm-button">Weiter</button>
            </div>
          )}

          {step === 2 && isSubclassChoice && (
             <div className="levelup-section choices-section"><div className="choice-block"><SubclassSelection classKey={character.class.key} selectedKey={selectedSubclass} onSelect={setSelectedSubclass} /></div><button onClick={handleConfirmSubclass} className="confirm-button">Weiter</button></div>
          )}

          {/* STEP 2.5: INVOCATIONS */}
          {step === 2.5 && hasInvocationChoice && (
             <div className="levelup-section choices-section">
               <div className="choice-block">
                  <InvocationSelection character={character} targetCount={targetInvCount} onSelectionChange={setInvocationChoices} />
               </div>
               <button onClick={handleConfirmInvocations} className="confirm-button">Weiter</button>
             </div>
          )}

          {/* STEP 3: SPELLS (UNIFIED) */}
          {step === 3 && hasSpellChoice && (
             <div className="levelup-section choices-section">
               <div className="choice-block">
                    {/* 1. Arkana (falls nötig) */}
                    {hasArcanumChoice && (
                       <div style={{marginBottom: '20px'}}>
                           <MysticArcanumSelection character={character} arcanumLevel={arcanumLevel} selectedKey={arcanumChoice} onSelect={setArcanumChoice} />
                       </div>
                    )}

                    {/* 2. Normale Zauber (Lernen & Tauschen) */}
                    <LevelUpSpells 
                        character={character} 
                        cantripsCount={newCantripsToLearn} 
                        spellsCount={newSpellsToLearn} 
                        maxSpellLevel={maxSpellLevel} 
                        canSwap={canSwapSpell}
                        onUpdate={setSpellState} 
                    />
                </div>
              <button onClick={handleConfirmSpells} className="confirm-button">Weiter</button>
            </div>
          )}
          
          {step === 4 && isMasteryIncrease && (
             <div className="levelup-section choices-section"><div className="choice-block"><h4>Waffenmeisterschaft</h4><WeaponMasterySelection character={{ ...character, level: newLevel, weapon_mastery_choices: masteryChoices }} updateCharacter={(updates) => setMasteryChoices(updates.weapon_mastery_choices)} /></div><button onClick={handleConfirmMastery} className="confirm-button">Weiter</button></div>
          )}

          {step === 5 && renderSummaryStep()}
        </div>
      </div>
    </div>
  );
};

export default LevelUpScreen;