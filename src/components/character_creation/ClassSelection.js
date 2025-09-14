// src/components/ClassSelection.js
import React from 'react';
import './ClassSelection.css';
import './PanelDetails.css';
import allClassData from '../../data/classes.json';
import { SkillSelection } from './SkillSelection';
import { SKILL_NAMES_DE } from '../../engine/characterEngine';

function importAll(r) {
  let images = {};
  r.keys().forEach((item) => {
    images[item.replace('./', '')] = r(item);
  });
  return images;
}

const classIcons = importAll(require.context('../../assets/images/classes', false, /\.(webp|png|jpe?g|svg)$/));

export const ClassSelection = ({ character, updateCharacter }) => {
  const selectedClass = character.class;
  const skillChoiceData = selectedClass.proficiencies.skills;

  const handleSkillChange = (newSelections) => {
    updateCharacter({ skill_proficiencies_choice: newSelections });
  };
  
  if (!selectedClass) {
    return <div>Lade Klassen...</div>;
  }

  // --- NEUE LOGIK ZUR FEHLERBEHEBUNG START ---
  let skillOptions = [];
  if (skillChoiceData && skillChoiceData.from) {
    const allSkillKeys = Object.keys(SKILL_NAMES_DE);
    // Prüfe, ob "from" der Sonderfall "any" ist
    if (skillChoiceData.from === 'any') {
      skillOptions = allSkillKeys;
    } 
    // Prüfe, ob "from" eine Liste (Array) ist, um Abstürze zu vermeiden
    else if (Array.isArray(skillChoiceData.from)) {
      skillOptions = skillChoiceData.from.map(skillName => 
        allSkillKeys.find(key => SKILL_NAMES_DE[key] === skillName)
      );
    }
  }
  // --- NEUE LOGIK ZUR FEHLERBEHEBUNG ENDE ---

  return (
    <div className="class-selection-container">
      <div className="class-grid">
        {allClassData.map(cls => (
          <button 
            key={cls.key} 
            className={`class-button ${selectedClass.key === cls.key ? 'selected' : ''}`}
            onClick={() => updateCharacter({ class: cls, skill_proficiencies_choice: [] })}
          >
            {classIcons[cls.icon] && (
              <img 
                src={classIcons[cls.icon]} 
                alt={`${cls.name} Icon`} 
                className="class-icon"
              />
            )}
            <span>{cls.name}</span>
          </button>
        ))}
      </div>

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
        
        {skillChoiceData && (
          <>
            <div className="details-divider"></div>
            <SkillSelection 
              // Verwendet jetzt die sichere "skillOptions"-Variable
              options={skillOptions}
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