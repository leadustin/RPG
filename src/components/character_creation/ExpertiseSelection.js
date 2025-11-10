// src/components/character_creation/ExpertiseSelection.js
import React, { useMemo } from 'react';
import { SKILL_NAMES_DE } from '../../engine/characterEngine'; // isProficientInSkill entfernt
import './PanelDetails.css';
import './SkillSelection.css'; // Stil wiederverwenden

export const ExpertiseSelection = ({ character, updateCharacter }) => {
  const maxChoices = 2; // Schurken wählen 2 Expertisen auf Lvl 1

  // === KORREKTUR 1: LOGIK ===
  // Die Liste darf NUR Fertigkeiten anzeigen, die in der SkillSelection (Wähle 4)
  // ausgewählt wurden. (Diese werden in 'character.skill_proficiencies_choice' gespeichert)
  const proficientSkills = useMemo(() => {
    return character.skill_proficiencies_choice || [];
  }, [character.skill_proficiencies_choice]); // Abhängigkeit korrigiert
  // === ENDE KORREKTUR 1 ===

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

      {/* KORREKTUR 2: LAYOUT (aus vorheriger Anfrage beibehalten) */}
      <div className="skill-grid"> 
        {allOptions.map(key => {
          const isSelected = selections.includes(key);
          return (
            <button
              key={key}
              className={`skill-choice ${isSelected ? 'selected' : ''}`}
              onClick={() => handleToggle(key)}
            >
              {optionNames[key]}
            </button>
          );
        })}
      </div>
      {/* === ENDE KORREKTUR 2 === */}
    </div>
  );
};