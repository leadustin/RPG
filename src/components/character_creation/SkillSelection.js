// src/components/SkillSelection.js
import React from 'react';
import './SkillSelection.css';
import { SKILL_NAMES_DE } from '../../engine/characterEngine';

export const SkillSelection = ({ options, maxChoices, selections, setSelections }) => {
  const handleSelection = (skillKey) => {
    const newSelections = [...selections];
    const index = newSelections.indexOf(skillKey);

    if (index > -1) {
      // Auswahl aufheben
      newSelections.splice(index, 1);
    } else if (newSelections.length < maxChoices) {
      // Neue Auswahl hinzufügen
      newSelections.push(skillKey);
    }
    setSelections(newSelections);
  };

  return (
    <div className="skill-selection-container">
      <h4>Wähle {maxChoices} Fertigkeiten</h4>
      <div className="skill-grid">
        {options.map(skillKey => {
          const isSelected = selections.includes(skillKey);
          return (
            <div 
              key={skillKey}
              className={`skill-choice ${isSelected ? 'selected' : ''}`}
              onClick={() => handleSelection(skillKey)}
            >
              {SKILL_NAMES_DE[skillKey]}
            </div>
          );
        })}
      </div>
    </div>
  );
};
