// src/components/character_creation/SummaryPanel.js
import React, { useState, useRef } from 'react'; // useState und useRef importieren
import './SummaryPanel.css';
import './PanelDetails.css';
import Tooltip from '../tooltip/Tooltip'; // Tooltip importieren
import {
  getAbilityModifier,
  getProficiencyBonus,
  calculateInitialHP,
  calculateAC,
  getRacialAbilityBonus,
  calculateSkillBonus,
  isProficientInSkill,
  SKILL_MAP,
  SKILL_NAMES_DE,
  ABILITY_DESCRIPTIONS_DE, // Beschreibungen für Attribute importieren
  SKILL_DESCRIPTIONS_DE,   // Beschreibungen für Fertigkeiten importieren
  COMBAT_STATS_DESCRIPTIONS_DE // Beschreibungen für Kampfwerte importieren
} from '../../engine/characterEngine';

export const SummaryPanel = ({ character }) => {
  // --- Hooks für die Tooltips ---
  const [hoveredStat, setHoveredStat] = useState(null);
  const [hoveredSkill, setHoveredSkill] = useState(null);
  const [hoveredCombatStat, setHoveredCombatStat] = useState(null); // Neu für Kampfwerte
  const abilityRefs = useRef({});
  const skillRefs = useRef({});
  const combatStatRefs = useRef({}); // Neu für Kampfwerte
  // -----------------------------

  if (!character) {
    return <div className="summary-panel"></div>;
  }

  const level = 1;
  const proficiencyBonus = getProficiencyBonus(level);
  const hp = calculateInitialHP(character);
  const ac = calculateAC(character);

  // Refs für Kampfwerte erstellen
  if (!combatStatRefs.current['ac']) combatStatRefs.current['ac'] = React.createRef();
  if (!combatStatRefs.current['hp']) combatStatRefs.current['hp'] = React.createRef();
  if (!combatStatRefs.current['proficiency']) combatStatRefs.current['proficiency'] = React.createRef();

  return (
    <div className="summary-panel">
      {/* TEIL 1: HEADER */}
      <div className="summary-header">
        <h2>{character.name}</h2>
        <h3>{character.race.name} {character.subrace ? `(${character.subrace.name})` : ''}</h3>
        <p>Stufe {level} {character.class.name}</p>
      </div>
      <div className="details-divider"></div>

      {/* TEIL 2: RÜSTUNGSKLASSE, HP, ETC. mit Tooltips */}
      <div className="summary-stats-grid">
        <div 
          className="stat-box"
          ref={combatStatRefs.current['ac']}
          onMouseEnter={() => setHoveredCombatStat('ac')}
          onMouseLeave={() => setHoveredCombatStat(null)}
        >
          <span className="stat-value">{ac}</span>
          <span className="stat-label">Rüstungsklasse</span>
          {hoveredCombatStat === 'ac' && (
            <Tooltip text={COMBAT_STATS_DESCRIPTIONS_DE.ac} parentRef={combatStatRefs.current['ac']} />
          )}
        </div>
        <div 
          className="stat-box"
          ref={combatStatRefs.current['hp']}
          onMouseEnter={() => setHoveredCombatStat('hp')}
          onMouseLeave={() => setHoveredCombatStat(null)}
        >
          <span className="stat-value">{hp} / {hp}</span>
          <span className="stat-label">Trefferpunkte</span>
          {hoveredCombatStat === 'hp' && (
            <Tooltip text={COMBAT_STATS_DESCRIPTIONS_DE.hp} parentRef={combatStatRefs.current['hp']} />
          )}
        </div>
        <div 
          className="stat-box"
          ref={combatStatRefs.current['proficiency']}
          onMouseEnter={() => setHoveredCombatStat('proficiency')}
          onMouseLeave={() => setHoveredCombatStat(null)}
        >
          <span className="stat-value">+{proficiencyBonus}</span>
          <span className="stat-label">Übungsbonus</span>
          {hoveredCombatStat === 'proficiency' && (
            <Tooltip text={COMBAT_STATS_DESCRIPTIONS_DE.proficiency} parentRef={combatStatRefs.current['proficiency']} />
          )}
        </div>
      </div>
      <div className="details-divider"></div>

      {/* TEIL 3: ATTRIBUTSLISTE mit Tooltips */}
      <ul className="ability-summary-list features-list">
        {Object.entries(character.abilities).map(([key, baseValue]) => {
          const bonus = getRacialAbilityBonus(character, key);
          const finalScore = baseValue + bonus;
          const modifier = getAbilityModifier(finalScore);
          
          // Ref für jedes Attribut erstellen
          if (!abilityRefs.current[key]) {
            abilityRefs.current[key] = React.createRef();
          }

          return (
            <li 
              key={key}
              ref={abilityRefs.current[key]}
              onMouseEnter={() => setHoveredStat(key)}
              onMouseLeave={() => setHoveredStat(null)}
            >
              <strong>{key.toUpperCase()}</strong>
              <span>{finalScore} ({modifier >= 0 ? `+${modifier}` : modifier})</span>
              {hoveredStat === key && (
                <Tooltip text={ABILITY_DESCRIPTIONS_DE[key]} parentRef={abilityRefs.current[key]} />
              )}
            </li>
          );
        })}
      </ul>
      <div className="details-divider"></div>

      {/* TEIL 4: FERTIGKEITENLISTE mit Tooltips */}
      <h3>Fertigkeiten</h3>
      <ul className="skill-summary-list features-list">
        {Object.keys(SKILL_MAP).map(skillKey => {
          const bonus = calculateSkillBonus(character, skillKey);
          const proficient = isProficientInSkill(character, skillKey);
          const ability = SKILL_MAP[skillKey].toUpperCase();
          const name = SKILL_NAMES_DE[skillKey];

          // Ref für jede Fertigkeit erstellen
          if (!skillRefs.current[skillKey]) {
            skillRefs.current[skillKey] = React.createRef();
          }

          return (
            <li 
              key={skillKey} 
              className="skill-item"
              ref={skillRefs.current[skillKey]}
              onMouseEnter={() => setHoveredSkill(skillKey)}
              onMouseLeave={() => setHoveredSkill(null)}
            >
              <div className="skill-info">
                <span className={`proficiency-dot ${proficient ? 'proficient' : ''}`}></span>
                <span>{name} <span className="skill-ability">({ability})</span></span>
              </div>
              <span className="skill-bonus">{bonus >= 0 ? `+${bonus}` : bonus}</span>
              {hoveredSkill === skillKey && (
                <Tooltip text={SKILL_DESCRIPTIONS_DE[skillKey]} parentRef={skillRefs.current[skillKey]} />
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};