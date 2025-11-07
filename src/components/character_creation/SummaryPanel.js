// --- Datei: src/components/character_creation/SummaryPanel.js ---

import React, { useMemo, useState, useRef } from "react";
import "./SummaryPanel.css";
import Tooltip from "../tooltip/Tooltip";
import allClassData from "../../data/classes.json";
import allArmor from "../../data/items/armor.json"; // Benötigt für AC-Berechnung

// Importiere die NEUEN Logik-Klassen (nur die, die wir für Stufe 1 brauchen)
import { BarbarianLogic } from "../../engine/logic/classes/BarbarianLogic.js";
import { MonkLogic } from "../../engine/logic/classes/MonkLogic.js";
import { SorcererLogic } from "../../engine/logic/classes/SorcererLogic.js";

// Importiere die KONSTANTEN, die wir wiederhergestellt haben
import {
  getAbilityModifier,
  getProficiencyBonus,
  ABILITY_DESCRIPTIONS_DE,
  COMBAT_STATS_DESCRIPTIONS_DE,
  SKILL_MAP,
  SKILL_NAMES_DE,
  SKILL_DESCRIPTIONS_DE,
} from "../../engine/characterEngine";

// --- HILFSFUNKTIONEN (Duplikat aus CharacterSheet.js, da wir keinen 'character' haben) ---

/**
 * Erstellt eine temporäre, minimale Klassen-Logik-Instanz NUR für die AC-Berechnung.
 */
const getTempClassLogic = (classKey, abilities, level) => {
  // Erstelle ein minimales 'temp' Charakterobjekt
  const tempChar = {
    level: level,
    abilities: abilities,
    features: allClassData.find(c => c.key === classKey)?.features
                           .filter(f => f.level === 1)
                           .map(f => f.key) || []
  };
  
  // Weise die Logik basierend auf dem Key zu (nur die mit Spezial-AC)
  switch (classKey) {
    case 'barbarian':
      return new BarbarianLogic(tempChar);
    case 'monk':
      return new MonkLogic(tempChar);
    case 'sorcerer':
      // Prüfen, ob es 'draconic_resilience_ac' hat (im echten System wäre Subklasse bekannt)
      // Für die Vorschau nehmen wir an, dass es *nicht* aktiv ist.
      // return new SorcererLogic(tempChar); 
      return null; // Sicherere Annahme für die Vorschau
    default:
      return null;
  }
};

/**
 * Berechnet die Rüstungsklasse (AC) für die Vorschau.
 */
const calculatePreviewAC = (abilities, classKey) => {
  const dexMod = getAbilityModifier(abilities.dexterity);
  const classLogic = getTempClassLogic(classKey, abilities, 1);

  let unarmoredDefenseAC = null;
  if (classLogic && typeof classLogic.getUnarmoredDefense === 'function') {
    unarmoredDefenseAC = classLogic.getUnarmoredDefense();
  }

  // Annahme: Keine Rüstung in der Vorschau
  const armor = null;
  const shield = null;

  let baseAC = 10;
  let dexBonus = dexMod;
  let shieldBonus = 0; // (Kein Schild in Vorschau)

  if (unarmoredDefenseAC !== null) {
    baseAC = unarmoredDefenseAC;
    dexBonus = 0; 
  } else {
    baseAC = 10;
  }

  return baseAC + dexBonus + shieldBonus;
};

/**
 * Berechnet die HP für die Vorschau.
 */
const calculatePreviewHP = (abilities, classKey) => {
  const classData = allClassData.find((c) => c.key === classKey);
  if (!classData) return 0;
  
  const conMod = getAbilityModifier(abilities.constitution);
  const classLogic = getTempClassLogic(classKey, abilities, 1);
  
  const hpBonus = (classLogic && classLogic.getHitPointBonus) ? classLogic.getHitPointBonus() : 0;
  
  return classData.hit_die + conMod + hpBonus;
};

// --- KOMPONENTE ---

const SummaryPanel = ({ creationState }) => {
  const {
    raceData,
    subraceData,
    classKey,
    backgroundData,
    abilities,
    abilityAssignments,
    skillProficiencies,
    portrait,
  } = creationState;

  const [hoveredStat, setHoveredStat] = useState(null);
  const [hoveredSkill, setHoveredSkill] = useState(null);
  const statRefs = useRef({});
  const skillRefs = useRef({});

  const proficiencyBonus = getProficiencyBonus(1); // Immer 2 auf Stufe 1

  // Kombinierte Attributswerte berechnen
  const finalAbilities = useMemo(() => {
    const final = { ...abilities };
    for (const key in final) {
      final[key] += abilityAssignments[key] || 0;
    }
    return final;
  }, [abilities, abilityAssignments]);

  // --- MODIFIZIERT: Verwendet die neuen Vorschau-Funktionen ---
  const finalHP = useMemo(() => {
    return calculatePreviewHP(finalAbilities, classKey);
  }, [finalAbilities, classKey]);

  const finalAC = useMemo(() => {
    return calculatePreviewAC(finalAbilities, classKey);
  }, [finalAbilities, classKey]);
  
  const finalSpeed = raceData.speed || 9;
  const finalInitiative = getAbilityModifier(finalAbilities.dexterity);

  // --- MODIFIZIERT: Eigene Skill-Bonus-Berechnung ---
  const getSkillBonus = (skillKey, abilityMod) => {
    const isProficient = skillProficiencies.includes(skillKey);
    let bonus = abilityMod;
    if (isProficient) {
      bonus += proficiencyBonus;
    }
    return bonus;
  };
  
  const getFullAbilityName = (abilityKey) => {
     return {
      str: "Stärke", dex: "Geschicklichkeit", con: "Konstitution",
      int: "Intelligenz", wis: "Weisheit", cha: "Charisma",
    }[abilityKey];
  };

  // --- RENDER ---
  return (
    <div className="summary-panel-container">
      {/* (Restliches JSX bleibt größtenteils gleich,
         verwendet aber die oben berechneten finalHP, finalAC etc.) */}
      
      <h3>Zusammenfassung</h3>
      
      <div className="summary-section summary-top-info">
        <div className="summary-portrait">
          <img src={portrait} alt="Portrait" />
        </div>
        <div className="summary-class-race">
          <div className="summary-name-placeholder">[Dein Name]</div>
          <div className="summary-level">Stufe 1</div>
          <div className="summary-race">{raceData.name} {subraceData ? `(${subraceData.name})` : ""}</div>
          <div className="summary-class">{allClassData.find(c => c.key === classKey)?.name}</div>
          <div className="summary-background">{backgroundData.name}</div>
        </div>
      </div>

      {/* --- KAMPFWERTE --- */}
      <div className="summary-section summary-combat-stats">
        <div 
          className="combat-stat"
          ref={el => statRefs.current['hp'] = el}
          onMouseEnter={() => setHoveredStat('hp')}
          onMouseLeave={() => setHoveredStat(null)}
        >
          <div className="combat-stat-label">Trefferpunkte</div>
          <div className="combat-stat-value">{finalHP}</div>
        </div>
        {hoveredStat === 'hp' && <Tooltip text={COMBAT_STATS_DESCRIPTIONS_DE.hp} parentRef={statRefs.current.hp} />}

        <div 
          className="combat-stat"
          ref={el => statRefs.current['ac'] = el}
          onMouseEnter={() => setHoveredStat('ac')}
          onMouseLeave={() => setHoveredStat(null)}
        >
          <div className="combat-stat-label">Rüstungsklasse</div>
          <div className="combat-stat-value">{finalAC}</div>
        </div>
        {hoveredStat === 'ac' && <Tooltip text={COMBAT_STATS_DESCRIPTIONS_DE.ac} parentRef={statRefs.current.ac} />}

        <div 
          className="combat-stat"
          ref={el => statRefs.current['speed'] = el}
          onMouseEnter={() => setHoveredStat('speed')}
          onMouseLeave={() => setHoveredStat(null)}
        >
          <div className="combat-stat-label">Bewegung</div>
          <div className="combat-stat-value">{finalSpeed}m</div>
        </div>
        {hoveredStat === 'speed' && <Tooltip text={COMBAT_STATS_DESCRIPTIONS_DE.speed} parentRef={statRefs.current.speed} />}

        <div 
          className="combat-stat"
          ref={el => statRefs.current['initiative'] = el}
          onMouseEnter={() => setHoveredStat('initiative')}
          onMouseLeave={() => setHoveredStat(null)}
        >
          <div className="combat-stat-label">Initiative</div>
          <div className="combat-stat-value">{finalInitiative >= 0 ? '+' : ''}{finalInitiative}</div>
        </div>
        {hoveredStat === 'initiative' && <Tooltip text={COMBAT_STATS_DESCRIPTIONS_DE.initiative} parentRef={statRefs.current.initiative} />}
      </div>

      {/* --- ATTRIBUTE --- */}
      <div className="summary-section summary-abilities">
        {Object.entries(finalAbilities).map(([key, score]) => {
          const modifier = getAbilityModifier(score);
          return (
            <React.Fragment key={key}>
              <div 
                className="ability-entry"
                ref={el => statRefs.current[key] = el}
                onMouseEnter={() => setHoveredStat(key)}
                onMouseLeave={() => setHoveredStat(null)}
              >
                <div className="ability-name">{getFullAbilityName(key)}</div>
                <div className="ability-score">{score}</div>
                <div className="ability-mod">{modifier >= 0 ? '+' : ''}{modifier}</div>
              </div>
              {hoveredStat === key && <Tooltip text={ABILITY_DESCRIPTIONS_DE[key]} parentRef={statRefs.current[key]} />}
            </React.Fragment>
          );
        })}
      </div>
      
      {/* --- FERTIGKEITEN (SKILLS) --- */}
      <div className="summary-section summary-skills">
        <div className="skill-proficiency-header">
          Übungsbonus: +{proficiencyBonus}
        </div>
        <div className="skill-list">
          {Object.keys(SKILL_MAP).map(skillKey => {
            const abilityKey = SKILL_MAP[skillKey];
            const abilityMod = getAbilityModifier(finalAbilities[abilityKey]);
            // --- MODIFIZIERT: Verwendet die neue lokale Funktion ---
            const bonus = getSkillBonus(skillKey, abilityMod);
            const isProficient = skillProficiencies.includes(skillKey);
            const name = SKILL_NAMES_DE[skillKey] || skillKey;
            
            return (
              <React.Fragment key={skillKey}>
                <div 
                  className={`skill-entry ${isProficient ? 'proficient' : ''}`}
                  ref={el => skillRefs.current[skillKey] = el}
                  onMouseEnter={() => setHoveredSkill(skillKey)}
                  onMouseLeave={() => setHoveredSkill(null)}
                >
                  <span className="skill-proficiency-dot">{isProficient ? '●' : '○'}</span>
                  <span className="skill-name">{name}</span>
                  <span className="skill-ability">({abilityKey.toUpperCase()})</span>
                  <span className="skill-bonus">{bonus >= 0 ? '+' : ''}{bonus}</span>
                </div>
                {hoveredSkill === skillKey && <Tooltip text={SKILL_DESCRIPTIONS_DE[skillKey]} parentRef={skillRefs.current[skillKey]} />}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SummaryPanel;