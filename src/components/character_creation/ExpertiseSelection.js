// src/components/character_creation/ExpertiseSelection.js
import React, { useMemo } from 'react';
import { SKILL_NAMES_DE, isProficientInSkill } from '../../engine/characterEngine';
import './PanelDetails.css';
import './SkillSelection.css'; // Stil wiederverwenden

export const ExpertiseSelection = ({ character, updateCharacter }) => {
  const maxChoices = 2; // Schurken wählen 2 Expertisen auf Lvl 1

  // Finde alle Fertigkeiten, in denen der Charakter bereits geübt ist
  const proficientSkills = useMemo(() => {
    return Object.keys(SKILL_NAMES_DE).filter(skillKey => 
      isProficientInSkill(character, skillKey)
    );
  }, [character]);

  // Füge Diebeswerkzeug hinzu (Schurken sind immer darin geübt)
  const allOptions = [
    ...proficientSkills,
    "thieves_tools" // Ein spezieller Schlüssel für Diebeswerkzeug
  ];
  
  const optionNames = {
      ...SKILL_NAMES_DE,
      "thieves_tools": "Diebeswerkzeug"
  };

  const selections = character.expertise_choices || [];

  const handleToggle = (key) => {
    let newSelection = [...selections];
    if (newSelection.includes(key)) {
      newSelection = newSelection.filter(s => s !== key);
    } else if (newSelection.length < maxChoices) {
      newSelection.push(key);
    }
    updateCharacter({ expertise_choices: newSelection });
  };

  return (
    <div className="expertise-selection">
      <div className="details-divider"></div>
      <h3>Expertise (Wähle {maxChoices})</h3>
      <p className="panel-details-description">
        Wähle {maxChoices} deiner geübten Fertigkeiten (oder Diebeswerkzeug). Dein Übungsbonus wird für diese verdoppelt.
      </p>
      <div className="skill-selection-grid">
        {allOptions.map(key => (
          <button
            key={key}
            className={`skill-button ${selections.includes(key) ? 'selected' : ''}`}
            onClick={() => handleToggle(key)}
            >
            {optionNames[key]}
          </button>
        ))}
      </div>
    </div>
  );
};