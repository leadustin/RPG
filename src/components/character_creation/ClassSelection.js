// src/components/ClassSelection.js
import React from 'react';
import './ClassSelection.css';
import './PanelDetails.css';
import allClassData from '../data/classes.json';
import { SkillSelection } from './SkillSelection'; // Import der neuen Komponente
import { SKILL_NAMES_DE } from '../engine/characterEngine'; // Import der deutschen Namen

export const ClassSelection = ({ character, updateCharacter }) => {
  const selectedClass = character.class;
  const skillChoiceData = selectedClass.proficiencies.skills;

  // Diese Funktion wird aufgerufen, wenn sich die Fertigkeiten-Auswahl ändert
  const handleSkillChange = (newSelections) => {
    updateCharacter({ skill_proficiencies_choice: newSelections });
  };
  
  if (!selectedClass) {
    return <div>Lade Klassen...</div>;
  }

  return (
    <div className="class-selection-container">
      {/* Linke Spalte: Gitter mit allen Klassen */}
      <div className="class-grid">
        {allClassData.map(cls => (
          <button 
            key={cls.key} 
            className={`class-button ${selectedClass.key === cls.key ? 'selected' : ''}`}
            onClick={() => updateCharacter({ class: cls, skill_proficiencies_choice: [] })} // Setzt Fertigkeiten bei Klassenwechsel zurück
          >
            <div className="class-icon-placeholder"></div>
            <span>{cls.name}</span>
          </button>
        ))}
      </div>

      {/* Rechte Spalte: Details zur ausgewählten Klasse */}
      <div className="class-details">
        <h2>{selectedClass.name}</h2>
        <p className="class-description">{selectedClass.description}</p>
        <div className="details-divider"></div>
        <h3>Klassenmerkmale (Stufe 1)</h3>
        <ul className="features-list">
          {selectedClass.features
            .filter(feature => feature.level === 1)
            .map(feature => (
              <li key={feature.name}>
                <strong>{feature.name}:</strong> {feature.description}
              </li>
            ))
          }
        </ul>
        
        {/* Neue Sektion für die Fertigkeiten-Auswahl */}
        {skillChoiceData && (
          <>
            <div className="details-divider"></div>
            <SkillSelection 
              options={skillChoiceData.from.map(skillName => Object.keys(SKILL_NAMES_DE).find(key => SKILL_NAMES_DE[key] === skillName))}
              maxChoices={skillChoiceData.choose}
              selections={character.skill_proficiencies_choice}
              setSelections={handleSkillChange}
            />
          </>
        )}
      </div>
    </div>
  );
};
