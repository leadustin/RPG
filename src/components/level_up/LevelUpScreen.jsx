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

// Importe
import { WeaponMasterySelection } from '../character_creation/WeaponMasterySelection';
import { FeatSelection } from '../character_creation/FeatSelection';
import { InvocationSelection } from './InvocationSelection';
import Tooltip from '../tooltip/Tooltip'; 
import '../character_creation/SkillSelection.css'; 
import '../character_creation/PanelDetails.css'; 

// --- ICONS LADEN ---
const iconModules = import.meta.glob('../../assets/images/icons/*.(png|webp|jpg|svg)', { eager: true });
const spellIcons = {};
for (const path in iconModules) {
  const fileName = path.split('/').pop();
  spellIcons[fileName] = iconModules[path].default;
}

// --- HELPER: ZUSAMMENFASSUNG BERECHNEN ---
const getSummaryData = (character, levelUpChoices, hpRollResult, newLevel) => {
  if (!character || !levelUpChoices) return null;

  // 1. Attribute (inkl. ASI)
  const raceBonuses = {
    con: getRacialAbilityBonus(character, 'con'),
  };

  const currentCon = character.abilities.con + (raceBonuses.con || 0);
  const asiCon = levelUpChoices.asi?.con || 0;
  const finalCon = currentCon + asiCon;
  
  const oldConMod = getAbilityModifier(currentCon);
  const newConMod = getAbilityModifier(finalCon);

  // 2. HP Analyse
  const oldFeatBonus = calculateFeatHpBonus(character);
  
  let tempFeats = [...(character.feats || [])];
  if (levelUpChoices.feat) tempFeats.push(levelUpChoices.feat.key);
  
  const tempChar = { ...character, level: newLevel, feats: tempFeats, background: character.background };
  const newFeatBonus = calculateFeatHpBonus(tempChar);
  
  const featHpGain = newFeatBonus - oldFeatBonus;
  
  let retroactiveConHp = 0;
  if (newConMod > oldConMod) {
    retroactiveConHp = (newConMod - oldConMod) * (newLevel - 1);
  }

  const dwarfBonus = character.race?.key === 'dwarf' ? 1 : 0;
  const diceRollValue = hpRollResult?.total || 0;
  const totalHpIncrease = diceRollValue + newConMod + featHpGain + retroactiveConHp + dwarfBonus;

  // 3. Waffenmeisterschaften Filtern
  const oldMasteries = character.weapon_mastery_choices || [];
  const selectedMasteries = levelUpChoices.weapon_mastery_choices || [];
  const newMasteriesToShow = selectedMasteries.filter(m => !oldMasteries.includes(m));

  // 4. Zauber-Tausch Daten aufbereiten
  const swapData = levelUpChoices.spellSwap;
  let swapInfo = null;
  if (swapData && swapData.unlearn && swapData.learn) {
      const unlearnSpell = spellsData.find(s => s.key === swapData.unlearn);
      const learnSpell = spellsData.find(s => s.key === swapData.learn);
      if (unlearnSpell && learnSpell) {
          swapInfo = { unlearn: unlearnSpell, learn: learnSpell };
      }
  }

  // 5. Arkanum Info
  const arkanumSpell = levelUpChoices.arcanumChoice ? spellsData.find(s => s.key === levelUpChoices.arcanumChoice) : null;

  // 6.INVOCATIONS
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
    invocations: {
        added: newInvocations,
        removed: removedInvocation
    }
  };
};

// --- TOOLTIP CONTENT ---
const SpellTooltipContent = ({ spell, t }) => (
  <div className="spell-tooltip-content">
    <div className="spell-tooltip-header">
      <span className="spell-tooltip-name">{spell.name}</span>
      <span className="spell-tooltip-school">{t ? t(`magicSchools.${spell.school}`, spell.school) : spell.school}</span>
    </div>
    
    <div className="spell-tooltip-meta-grid">
      <div className="meta-item">
        <span className="label">Zeit:</span>
        <span className="value">{spell.ui_casting_time || spell.casting_time}</span>
      </div>
      <div className="meta-item">
        <span className="label">RW:</span>
        <span className="value">{spell.ui_range || spell.range}</span>
      </div>
      <div className="meta-item">
        <span className="label">Dauer:</span>
        <span className="value">{spell.ui_duration || spell.duration}</span>
      </div>
      <div className="meta-item">
        <span className="label">Komp:</span>
        <span className="value">{spell.components?.join(', ')}</span>
      </div>
    </div>

    <div className="spell-tooltip-description">
      {spell.ui_description || spell.description}
    </div>

    {spell.ui_scaling && (
      <div className="spell-tooltip-scaling">
        <strong>Auf höheren Graden:</strong> {spell.ui_scaling}
      </div>
    )}
    
    <div className="spell-tooltip-footer">
      {spell.level === 0 ? (t ? t('common.cantrip') : "Zaubertrick") : `${t ? t('common.level') : "Grad"} ${spell.level}`}
      {spell.ritual && <span className="tag ritual">Ritual</span>}
      {(spell.duration || "").toLowerCase().includes("konz") && <span className="tag concentration">Konz.</span>}
    </div>
  </div>
);

// --- HELPER ---
const getRacialHpBonus = (character) => {
  if (character.race.key === 'dwarf') return 1;
  return 0;
};

const rollDiceFormula = (formula, results) => {
  const diceValues = results.map(r => r.value);
  const diceSum = diceValues.reduce((a, b) => a + b, 0);
  return {
    total: diceSum,
    dice: diceValues,
  };
};

// --- HELPER: WARLOCK ARCANUM LEVEL ---
const getWarlockArcanumLevel = (level) => {
    if (level === 11) return 6;
    if (level === 13) return 7;
    if (level === 15) return 8;
    if (level === 17) return 9;
    return 0;
};

// +++ KOMPONENTE: MYSTISCHES ARKANUM AUSWAHL +++
const MysticArcanumSelection = ({ character, arcanumLevel, onSelect, selectedKey }) => {
    const { t } = useTranslation();
    const classKey = character.class.key;

    const availableSpells = spellsData.filter(s => 
        s.level === arcanumLevel && 
        s.classes.includes(classKey) && 
        !(character.spells_known || []).includes(s.key)
    );

    const renderIcon = (spell, isSelected, onClick) => {
        const iconSrc = spellIcons[spell.icon] || spellIcons['skill_placeholder.png'];
        return (
            <Tooltip key={spell.key} content={<SpellTooltipContent spell={spell} t={t} />}>
                <div className={`spell-selection-card icon-only ${isSelected ? 'selected' : ''} arcanum-card`} onClick={() => onClick(spell.key)}>
                    <img src={iconSrc} alt={spell.name} className="spell-selection-icon" />
                    {isSelected && <div className="spell-selection-check">★</div>}
                </div>
            </Tooltip>
        );
    };

    return (
        <div className="spell-group-container arcanum-container">
            <h4 className="main-group-title arcanum-title">
                Mystisches Arkanum (Grad {arcanumLevel})
                <span className="selection-count">{selectedKey ? '(1/1)' : '(0/1)'}</span>
            </h4>
            <p className="small-text">Wähle einen Zauber des {arcanumLevel}. Grades, den du einmal pro langer Rast wirken kannst.</p>
            
            <div className="spell-grid-layout">
                {availableSpells.map(spell => renderIcon(spell, selectedKey === spell.key, onSelect))}
            </div>
            {availableSpells.length === 0 && <p className="empty-msg">Keine Zauber verfügbar.</p>}
        </div>
    );
};

// +++ KOMPONENTE: Zauber-TAUSCH +++
const SpellSwapSelection = ({ character, maxSpellLevel, onSwapChange, currentSwap }) => {
    const { t } = useTranslation();
    const classKey = character.class.key;

    const knownSpellKeys = character.spells_known || [];
    const knownSpellsObjects = knownSpellKeys
        .map(key => spellsData.find(s => s.key === key))
        // FIX: Wir filtern jetzt auch nach maxSpellLevel. 
        // Da maxSpellLevel für Warlocks bei 5 gekappt ist, werden Arkana (Lvl 6+) hier ausgeschlossen.
        .filter(s => s && s.level > 0 && s.level <= maxSpellLevel);

    const availableSpells = spellsData.filter(s => 
        s.level > 0 && 
        s.level <= maxSpellLevel && 
        s.classes.includes(classKey) && 
        !knownSpellKeys.includes(s.key) &&
        s.key !== currentSwap.unlearn
    );

    const handleUnlearnClick = (key) => {
        const newVal = currentSwap.unlearn === key ? null : key;
        onSwapChange({ ...currentSwap, unlearn: newVal, learn: null });
    };

    const handleLearnClick = (key) => {
        const newVal = currentSwap.learn === key ? null : key;
        onSwapChange({ ...currentSwap, learn: newVal });
    };

    const renderIcon = (spell, isSelected, onClick, type) => {
        const iconSrc = spellIcons[spell.icon] || spellIcons['skill_placeholder.png'];
        let cardClass = `spell-selection-card icon-only ${isSelected ? 'selected' : ''}`;
        if (isSelected) cardClass += type === 'unlearn' ? ' selected-unlearn' : ' selected-learn';

        return (
            <Tooltip key={spell.key} content={<SpellTooltipContent spell={spell} t={t} />}>
                <div className={cardClass} onClick={() => onClick(spell.key)}>
                    <img src={iconSrc} alt={spell.name} className="spell-selection-icon" />
                    <div className="spell-level-indicator">{spell.level}</div>
                    {isSelected && <div className="spell-selection-check">{type === 'unlearn' ? '−' : '+'}</div>}
                </div>
            </Tooltip>
        );
    };

    return (
        <div className="spell-swap-container">
            <div className="spell-swap-column">
                <h5>Vergessen (Wähle 1)</h5>
                <div className="spell-grid-layout compact">
                    {knownSpellsObjects.map(spell => renderIcon(spell, currentSwap.unlearn === spell.key, handleUnlearnClick, 'unlearn'))}
                    {knownSpellsObjects.length === 0 && <span className="small-text">Keine Zauber zum Tauschen verfügbar.</span>}
                </div>
            </div>
            <div className="spell-swap-arrow">➔</div>
            <div className="spell-swap-column">
                <h5>Neu lernen (Wähle 1)</h5>
                <div className="spell-grid-layout compact">
                    {availableSpells.sort((a,b) => a.level - b.level).map(spell => renderIcon(spell, currentSwap.learn === spell.key, handleLearnClick, 'learn'))}
                </div>
            </div>
        </div>
    );
};


// +++ KOMPONENTE: Zauberauswahl (Neue lernen) +++
const LevelUpSpellSelection = ({ character, cantripsCount, spellsCount, onSelectionChange, maxSpellLevel, excludedKeys = [] }) => {
    const { t } = useTranslation();
    const [selectedCantrips, setSelectedCantrips] = useState([]);
    const [selectedSpells, setSelectedSpells] = useState([]);
    const classKey = character.class.key;

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
        !(character.spellbook || []).includes(s.key) &&
        !excludedKeys.includes(s.key)
    );

    const spellsByLevel = useMemo(() => {
        const grouped = {};
        availableSpells.forEach(spell => {
            if (!grouped[spell.level]) grouped[spell.level] = [];
            grouped[spell.level].push(spell);
        });
        return grouped;
    }, [availableSpells]);

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

    useEffect(() => {
        onSelectionChange({ cantrips: selectedCantrips, spells: selectedSpells });
    }, [selectedCantrips, selectedSpells]);

    const renderSpellIcon = (spell, isSelected, onClick) => {
        const iconSrc = spellIcons[spell.icon] || spellIcons['skill_placeholder.png'];
        return (
            <Tooltip key={spell.key} content={<SpellTooltipContent spell={spell} t={t} />}>
                <div className={`spell-selection-card icon-only ${isSelected ? 'selected' : ''}`} onClick={() => onClick(spell.key)}>
                    <img src={iconSrc} alt={spell.name} className="spell-selection-icon" />
                    {isSelected && <div className="spell-selection-check">✓</div>}
                </div>
            </Tooltip>
        );
    };

    return (
        <div className="feat-sub-selection">
            {cantripsCount > 0 && (
                <div className="spell-group">
                    <h4 className="spell-group-title">Neue Zaubertricks <span className="selection-count">({selectedCantrips.length}/{cantripsCount})</span></h4>
                    <div className="spell-grid-layout">
                        {availableCantrips.map(spell => renderSpellIcon(spell, selectedCantrips.includes(spell.key), handleCantripToggle))}
                    </div>
                </div>
            )}

            {spellsCount > 0 && (
                <div className="spell-group-container">
                    <h4 className="main-group-title">Neue Zauber <span className="selection-count">({selectedSpells.length}/{spellsCount})</span></h4>
                    {Object.keys(spellsByLevel).sort((a,b) => a-b).map(level => (
                        <div key={level} className="spell-level-subgroup">
                            <h5 className="level-subtitle">Grad {level}</h5>
                            <div className="spell-grid-layout">
                                {spellsByLevel[level].map(spell => renderSpellIcon(spell, selectedSpells.includes(spell.key), handleSpellToggle))}
                            </div>
                        </div>
                    ))}
                    {availableSpells.length === 0 && <p className="empty-msg">Keine neuen Zauber verfügbar.</p>}
                </div>
            )}
        </div>
    );
};


const AbilityScoreImprovement = ({ finalAbilities, points, choices, onChange }) => {
  const handleIncrease = (key) => {
    const currentVal = finalAbilities[key] + (choices[key] || 0);
    if (currentVal >= 20) return;
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
      <p className="small-text">Verteile +2 auf ein Attribut oder +1 auf zwei Attribute (Max. 20).</p>
      {Object.keys(finalAbilities).map((key) => {
        const currentBonus = choices[key] || 0;
        const currentTotal = finalAbilities[key] + currentBonus;
        const isMaxed = currentTotal >= 20;
        return (
          <div key={key} className="asi-row">
            <span className="asi-label">{key.toUpperCase()} ({finalAbilities[key]})</span>
            <button onClick={() => handleDecrease(key)} disabled={!currentBonus}>-</button>
            <span className="asi-choice">{currentTotal} {currentBonus > 0 && <span style={{fontSize:'0.8em', color:'#d4af37'}}>(+{currentBonus})</span>}</span>
            <button onClick={() => handleIncrease(key)} disabled={points === 0 || currentBonus >= 2 || isMaxed} title={isMaxed ? "Maximum von 20 erreicht" : ""}>+</button>
          </div>
        );
      })}
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
        <div key={sc.key} className={`subclass-option ${selectedKey === sc.key ? 'selected' : ''}`} onClick={() => onSelect(sc.key)}>
          <strong>{sc.name}</strong>
          <p>{sc.description}</p>
        </div>
      ))}
    </div>
  );
};

export const LevelUpScreen = ({ character, onConfirm }) => {
  const { t } = useTranslation();
  const { newLevel } = character.pendingLevelUp;
  
  const [step, setStep] = useState(0); 
  const [rollResult, setRollResult] = useState(null);
  
  const [levelUpMode, setLevelUpMode] = useState('asi'); 
  const [asiPoints, setAsiPoints] = useState(2);
  const [asiChoices, setAsiChoices] = useState({});
  
  const [selectedFeatKey, setSelectedFeatKey] = useState(null);
  const [featSelections, setFeatSelections] = useState({}); 

  const [selectedSubclass, setSelectedSubclass] = useState(null);
  const [masteryChoices, setMasteryChoices] = useState(character.weapon_mastery_choices || []);
  
  const [spellChoices, setSpellChoices] = useState({ cantrips: [], spells: [] });
  const [spellSwap, setSpellSwap] = useState({ unlearn: null, learn: null });
  const [isSwapExpanded, setIsSwapExpanded] = useState(false);
  
  const [arcanumChoice, setArcanumChoice] = useState(null);
  const [invocationChoices, setInvocationChoices] = useState({ remove: null, add: [], isValid: false });

  const [narratorText, setNarratorText] = useState("");

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

  const isWarlock = character.class.key === 'warlock';
  const arcanumLevel = isWarlock ? getWarlockArcanumLevel(newLevel) : 0;
  const hasArcanumChoice = arcanumLevel > 0;

  const hasSpellChoice = newCantripsToLearn > 0 || newSpellsToLearn > 0 || hasArcanumChoice;
  const canSwapSpell = isWarlock || character.class.key === 'bard' || character.class.key === 'sorcerer' || character.class.key === 'ranger';
  const logic = useMemo(() => new WarlockLogic({ ...character, features: character.features || [], level: newLevel }), [character, newLevel]);
  const currentInvCount = (character.features || []).filter(f => logic.getAllInvocations().some(i => i.key === f)).length;
  const targetInvCount = isWarlock ? logic.getInvocationCount() : 0;
  const hasInvocationChoice = isWarlock && (targetInvCount > currentInvCount || currentInvCount > 0);

  const racialHpBonus = getRacialHpBonus(character);

  const finalAbilities = useMemo(() => {
    const final = {};
    for (const key in character.abilities) {
      final[key] = character.abilities[key] + getRacialAbilityBonus(character, key);
    }
    return final;
  }, [character]);

  let maxSpellLevel = 1;
  if (['wizard', 'sorcerer', 'bard', 'cleric', 'druid'].includes(character.class.key)) {
      maxSpellLevel = Math.ceil(newLevel / 2);
  } else if (['ranger', 'paladin'].includes(character.class.key)) {
      maxSpellLevel = Math.ceil(newLevel / 2); 
      if (newLevel < 2) maxSpellLevel = 0; 
  } else if (character.class.key === 'warlock') {
      maxSpellLevel = Math.ceil(newLevel / 2); 
      if (maxSpellLevel > 5) maxSpellLevel = 5; 
  }

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
    } else {
      diceInstanceRef.current = null;
    }
  }, [step]);

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
        const results = await diceInstanceRef.current.roll(hpRollFormula);
        const formulaResult = rollDiceFormula(hpRollFormula, results); 
        setRollResult({ ...formulaResult }); 
      } catch (e) {
        console.error("Dice roll error:", e);
        const fallbackRoll = Math.floor(Math.random() * parseInt(hpRollFormula.split('d')[1] || 8)) + 1;
        setRollResult({ total: fallbackRoll, dice: [fallbackRoll] });
      }
    } else {
      const fallbackRoll = Math.floor(Math.random() * parseInt(hpRollFormula.split('d')[1] || 8)) + 1;
      setRollResult({ total: fallbackRoll, dice: [fallbackRoll] });
    }
  };

  const navigateToNextStep = (currentStep) => {
    if (currentStep < 1 && isAbilityIncrease) setStep(1);
    else if (currentStep < 2 && isSubclassChoice) setStep(2);
    else if (currentStep < 2.5 && hasInvocationChoice) setStep(2.5);
    else if (currentStep < 3 && hasSpellChoice) setStep(3); 
    else if (currentStep < 4 && isMasteryIncrease) setStep(4);
    else setStep(5);
  };

  const handleConfirmHP = () => navigateToNextStep(0);
  
  const handleConfirmDecision = () => {
    if (levelUpMode === 'asi' && asiPoints > 0) return alert("Bitte verteile alle Attributspunkte.");
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
      if (spellChoices.cantrips.length < newCantripsToLearn) return alert(`Bitte wähle ${newCantripsToLearn} Zaubertricks.`);
      if (spellChoices.spells.length < newSpellsToLearn) return alert(`Bitte wähle ${newSpellsToLearn} Zauber.`);
      if (spellSwap.unlearn && !spellSwap.learn) return alert("Du hast gewählt, einen Zauber zu vergessen. Bitte wähle einen Ersatz.");
      if (hasArcanumChoice && !arcanumChoice) return alert(`Bitte wähle ein Mystisches Arkanum des ${arcanumLevel}. Grades.`);
      navigateToNextStep(3);
  };

  const handleConfirmMastery = () => {
     if (masteryChoices.length < newMasteryCount) return alert(`Bitte wähle deine ${newMasteryCount}. Waffenmeisterschaft aus.`);
    navigateToNextStep(4);
  };

  const handleConfirmAll = () => {
    const finalSpellChoices = { ...spellChoices };
    if (arcanumChoice) {
        finalSpellChoices.spells = [...finalSpellChoices.spells, arcanumChoice];
    }

    const choices = {
      asi: levelUpMode === 'asi' ? asiChoices : null,
      feat: levelUpMode === 'feat' ? { key: selectedFeatKey, selections: featSelections[selectedFeatKey] } : null,
      subclassKey: selectedSubclass,
      weapon_mastery_choices: masteryChoices,
      newSpells: finalSpellChoices, 
      spellSwap: spellSwap,
      arcanumChoice: arcanumChoice,
      invocations: invocationChoices
    };
    const totalHpGain = summaryData.hp.total;
    onConfirm(totalHpGain, choices);
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
      newSpells: spellChoices,
      weapon_mastery_choices: masteryChoices,
      spellSwap: spellSwap,
      arcanumChoice: arcanumChoice,
      invocations: invocationChoices
    };
    return getSummaryData(character, choices, rollResult, newLevel);
  }, [step, character, asiChoices, selectedFeat, selectedSubclass, spellChoices, masteryChoices, spellSwap, arcanumChoice, invocationChoices, rollResult, newLevel]);

  const renderSummaryStep = () => {
    if (!summaryData) return <div>Lade Daten...</div>;
    return (
      <div className="levelup-section summary-section">
        <h3>Zusammenfassung: Stufe {newLevel}</h3>
        <div className="summary-grid">
          <div className="summary-card hp-card">
            <div className="card-header">
              <h4>❤️ Trefferpunkte</h4>
              <span className="hp-total-badge">+{summaryData.hp.total}</span>
            </div>
            <ul className="breakdown-list">
              {summaryData.hp.breakdown.map((item, idx) => <li key={idx}><span className="label">{item.label}</span><span className="value">+{item.value}</span></li>)}
            </ul>
            <div className="total-row"><span>Neues Maximum:</span><strong>{character.stats.maxHp + summaryData.hp.total} TP</strong></div>
          </div>

          {summaryData.subclass && (
            <div className="summary-card">
              <h4>🛡️ Neuer Archetyp</h4>
              <div className="highlight-box"><strong>{summaryData.subclass.name}</strong><p className="small-desc">Deine Spezialisierung beginnt.</p></div>
            </div>
          )}

          {(summaryData.asi || summaryData.feat) && (
            <div className="summary-card">
              <h4>💪 Entwicklung</h4>
              {summaryData.asi ? (
                <ul className="simple-list">{Object.entries(summaryData.asi).map(([key, val]) => <li key={key}><span className="attr-name">{t(`stats.${key}`)}</span> <span className="attr-val">+{val}</span></li>)}</ul>
              ) : (<div className="feat-preview"><strong>{summaryData.feat.name}</strong><span className="tag">Talent</span></div>)}
            </div>
          )}

          {/* NEU: INVOCATIONS SUMMARY */}
          {summaryData.invocations && (summaryData.invocations.added.length > 0 || summaryData.invocations.removed) && (
              <div className="summary-card">
                  <h4>👁️ Mystische Anrufungen</h4>
                  <div className="invocations-summary">
                      {summaryData.invocations.removed && (
                          <div className="swap-out">
                              <span className="swap-icon">−</span> {summaryData.invocations.removed.name}
                          </div>
                      )}
                      {summaryData.invocations.added.map(inv => (
                          <div key={inv.key} className="swap-in">
                              <span className="swap-icon">+</span> {inv.name}
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {(summaryData.newSpells.cantrips.length > 0 || summaryData.newSpells.spells.length > 0 || summaryData.spellSwap || summaryData.arcanumChoice) && (
            <div className="summary-card wide-card">
              <h4>✨ Neue Magie</h4>
              <div className="spells-summary-container">
                
                {summaryData.arcanumChoice && (
                    <div className="spell-group" style={{width: '100%', marginBottom: '10px'}}>
                        <h5 style={{color: '#d4af37'}}>Mystisches Arkanum</h5>
                        <div className="mini-spell-chip arcanum-chip">
                            ★ {summaryData.arcanumChoice.name}
                        </div>
                    </div>
                )}

                {summaryData.spellSwap && (
                    <div className="spell-swap-summary">
                        <div className="swap-out">
                            <span className="swap-icon">−</span>
                            <span className="swap-name">{summaryData.spellSwap.unlearn.name}</span>
                        </div>
                        <div className="swap-arrow">➜</div>
                        <div className="swap-in">
                            <span className="swap-icon">+</span>
                            <span className="swap-name">{summaryData.spellSwap.learn.name}</span>
                        </div>
                    </div>
                )}

                {summaryData.newSpells.cantrips.length > 0 && (
                  <div className="spell-group">
                    <h5>Zaubertricks</h5>
                    <div className="spell-icons-row">
                      {summaryData.newSpells.cantrips.map(id => {
                        const spell = spellsData.find(s => s.key === id);
                        return <div key={id} className="mini-spell-chip">{spell?.name || id}</div>;
                      })}
                    </div>
                  </div>
                )}
                {summaryData.newSpells.spells.length > 0 && (
                  <div className="spell-group">
                    <h5>Zauber</h5>
                    <div className="spell-icons-row">
                      {summaryData.newSpells.spells.map(id => {
                        const spell = spellsData.find(s => s.key === id);
                        return <div key={id} className="mini-spell-chip spell-level-1">{spell?.name || id}</div>;
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {summaryData.newMasteries && summaryData.newMasteries.length > 0 && (
            <div className="summary-card">
              <h4>⚔️ Neue Waffenmeisterschaft</h4>
              <div className="mastery-tags">{summaryData.newMasteries.map(key => <span key={key} className="mastery-tag">{t(`items.${key}`, key)}</span>)}</div>
            </div>
          )}
        </div>
        <div className="summary-actions"><button onClick={handleConfirmAll} className="confirm-button final-confirm">Levelaufstieg abschließen</button></div>
      </div>
    );
  };

  return (
    <div className="levelup-screen">
      <div className="levelup-sidebar">
        <h2>Stufenaufstieg!</h2>
        <p className="levelup-subtitle">{character.name} &rarr; Stufe {newLevel}</p>
        
        <div className="levelup-summary-preview">
            <p>TP: {character.stats.hp} {rollResult && ` + ${(rollResult.total || 0) + racialHpBonus + getAbilityModifier(character.abilities.con + getRacialAbilityBonus(character, 'con'))}`}</p>
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
              {!rollResult ? <button onClick={handleRollHP} className="roll-button">Würfeln ({hpRollFormula})</button> : (
                <div className="hp-result">
                  <p>Gewürfelt: {rollResult.dice.join(' + ')}</p>
                  <p>Konstitution: +{getAbilityModifier(character.abilities.con + getRacialAbilityBonus(character, 'con'))}</p>
                  {racialHpBonus > 0 && <p>Rassenbonus (Zwerg): {racialHpBonus}</p>}
                  <p className="hp-total">Vorläufiger Zuwachs: {rollResult.total + getAbilityModifier(character.abilities.con + getRacialAbilityBonus(character, 'con')) + racialHpBonus}</p>
                  <button onClick={handleConfirmHP} className="confirm-button">Weiter</button>
                </div>
              )}
            </div>
          )}
          
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

          {step === 2 && isSubclassChoice && (
             <div className="levelup-section choices-section">
              <div className="choice-block"><SubclassSelection classKey={character.class.key} selectedKey={selectedSubclass} onSelect={setSelectedSubclass} /></div>
              <button onClick={handleConfirmSubclass} className="confirm-button">Weiter</button>
            </div>
          )}

          {/* NEU: STEP 2.5 INVOCATIONS */}
          {step === 2.5 && hasInvocationChoice && (
             <div className="levelup-section choices-section">
               <div className="choice-block">
                  <InvocationSelection 
                    character={character}
                    targetCount={targetInvCount}
                    onSelectionChange={setInvocationChoices}
                  />
               </div>
               <button onClick={handleConfirmInvocations} className="confirm-button">Weiter</button>
             </div>
          )}

          {step === 3 && hasSpellChoice && (
             <div className="levelup-section choices-section">
               
               {/* TEIL A: Zaubertausch (Optional) */}
               {canSwapSpell && (character.spells_known?.length > 0) && (
                   <div className="choice-block spell-swap-block">
                       <div className="swap-header" onClick={() => setIsSwapExpanded(!isSwapExpanded)}>
                           <h4>🔄 Zauber tauschen (Optional)</h4>
                           <span>{isSwapExpanded ? '▲' : '▼'}</span>
                       </div>
                       {isSwapExpanded && (
                           <SpellSwapSelection 
                                character={character} 
                                maxSpellLevel={maxSpellLevel} 
                                currentSwap={spellSwap} 
                                onSwapChange={setSpellSwap} 
                           />
                       )}
                   </div>
               )}

               {/* TEIL B: Mystisches Arkanum (Warlock Lvl 11,13,15,17) */}
               {hasArcanumChoice && (
                   <div className="choice-block arcanum-choice-block">
                       <MysticArcanumSelection 
                            character={character} 
                            arcanumLevel={arcanumLevel} 
                            selectedKey={arcanumChoice}
                            onSelect={setArcanumChoice}
                       />
                   </div>
               )}

               {/* TEIL C: Neue Zauber lernen */}
               {(newCantripsToLearn > 0 || newSpellsToLearn > 0) && (
                   <div className="choice-block">
                      <h3>Magisches Wissen erweitert</h3>
                      <LevelUpSpellSelection 
                        character={character} 
                        cantripsCount={newCantripsToLearn} 
                        spellsCount={newSpellsToLearn} 
                        maxSpellLevel={maxSpellLevel}
                        excludedKeys={spellSwap.learn ? [spellSwap.learn] : []}
                        onSelectionChange={setSpellChoices} 
                      />
                    </div>
               )}
               
              <button onClick={handleConfirmSpells} className="confirm-button">Weiter</button>
            </div>
          )}
          
          {step === 4 && isMasteryIncrease && (
             <div className="levelup-section choices-section">
               <div className="choice-block">
                  <h4>Waffenmeisterschaft (Wähle {newMasteryCount})</h4>
                  <WeaponMasterySelection character={{ ...character, level: newLevel, weapon_mastery_choices: masteryChoices }} updateCharacter={(updates) => setMasteryChoices(updates.weapon_mastery_choices)} />
                </div>
              <button onClick={handleConfirmMastery} className="confirm-button">Weiter</button>
            </div>
          )}

          {step === 5 && renderSummaryStep()}
        </div>
      </div>
    </div>
  );
};

export default LevelUpScreen;