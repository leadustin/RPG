// src/components/character_creation/FightingStyleSelection.js
import React from 'react';
import './PanelDetails.css';
import './SkillSelection.css';

// Optionen extrahiert aus classes.json -> fighter -> features -> "Kampfstil"
const FIGHTING_STYLE_OPTIONS = [
  "Bogenschießen", 
  "Verteidigung", 
  "Duellieren", 
  "Zwei-Waffen-Kampf"
  // Fügen Sie hier bei Bedarf weitere Stile aus der Beschreibung hinzu
];

export const FightingStyleSelection = ({ character, updateCharacter }) => {
  
  const handleSelect = (style) => {
    updateCharacter({ fighting_style: style });
  };

  return (
    <div className="fighting-style-selection">
      <div className="details-divider"></div>
      <h3>Kampfstil wählen</h3>
      <div className="skill-grid"> {/* <-- KLASSE GEÄNDERT */}
        {FIGHTING_STYLE_OPTIONS.map(style => (
          <button
            key={style}
            className={`skill-choice ${character.fighting_style === style ? 'selected' : ''}`}
            onClick={() => handleSelect(style)}
          >
            {style}
          </button>
        ))}
      </div>
    </div>
  );
};