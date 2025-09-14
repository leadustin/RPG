// src/components/SummaryPanel.js
import React from 'react';
import './SummaryPanel.css';
import './PanelDetails.css';
import {
  getAbilityModifier,
  getProficiencyBonus,
  calculateInitialHP,
  calculateAC,
  getRacialAbilityBonus,
  calculateSkillBonus,
  isProficientInSkill,
  SKILL_MAP,
  SKILL_NAMES_DE
} from '../../engine/characterEngine';

export const SummaryPanel = ({ character }) => {
  if (!character) {
    return <div className="summary-panel"></div>;
  }

  const level = 1;
  const proficiencyBonus = getProficiencyBonus(level);
  const hp = calculateInitialHP(character);
  const ac = calculateAC(character);

  return (
    <div className="summary-panel">
      {/* TEIL 1: HEADER */}
      <div className="summary-header">
        {/* Zeigt jetzt den Namen an */}
        <h2>{character.name}</h2>
        <h3>{character.race.name} {character.subrace ? `(${character.subrace.name})` : ''}</h3>
        <p>Stufe {level} {character.class.name}</p>
      </div>
      <div className="details-divider"></div>

      {/* TEIL 2: RÜSTUNGSKLASSE, HP, ETC. */}
      <div className="summary-stats-grid">
        <div className="stat-box">
          <span className="stat-value">{ac}</span>
          <span className="stat-label">Rüstungsklasse</span>
        </div>
        <div className="stat-box">
          <span className="stat-value">{hp} / {hp}</span>
          <span className="stat-label">Trefferpunkte</span>
        </div>
        <div className="stat-box">
          <span className="stat-value">+{proficiencyBonus}</span>
          <span className="stat-label">Übungsbonus</span>
        </div>
      </div>
      <div className="details-divider"></div>

      {/* TEIL 3: ATTRIBUTSLISTE */}
      <ul className="ability-summary-list features-list">
        {Object.entries(character.abilities).map(([key, baseValue]) => {
          const bonus = getRacialAbilityBonus(character, key);
          const finalScore = baseValue + bonus;
          const modifier = getAbilityModifier(finalScore);

          return (
            <li key={key}>
              <strong>{key.toUpperCase()}</strong>
              <span>{finalScore} ({modifier >= 0 ? `+${modifier}` : modifier})</span>
            </li>
          );
        })}
      </ul>
      <div className="details-divider"></div>

      {/* TEIL 4: FERTIGKEITENLISTE */}
      <h3>Fertigkeiten</h3>
      <ul className="skill-summary-list features-list">
        {Object.keys(SKILL_MAP).map(skillKey => {
          const bonus = calculateSkillBonus(character, skillKey);
          const proficient = isProficientInSkill(character, skillKey);
          const ability = SKILL_MAP[skillKey].toUpperCase();
          const name = SKILL_NAMES_DE[skillKey];

          return (
            <li key={skillKey} className="skill-item">
              <div className="skill-info">
                <span className={`proficiency-dot ${proficient ? 'proficient' : ''}`}></span>
                <span>{name} <span className="skill-ability">({ability})</span></span>
              </div>
              <span className="skill-bonus">{bonus >= 0 ? `+${bonus}` : bonus}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
