// src/components/character_creation/WeaponMasterySelection.js
import React from 'react';
import './PanelDetails.css';
import './SkillSelection.css';

export const WeaponMasterySelection = ({ character, updateCharacter }) => {
  const selectedClass = character.class;
  
  // Prüfe, ob die Klasse Weapon Mastery hat
  if (!selectedClass.weapon_mastery) {
    return null;
  }

  const { level_1_count, level_9_count, available_weapons } = selectedClass.weapon_mastery;
  const currentLevel = character.level || 1;
  
  // Bestimme die Anzahl der verfügbaren Auswahlen basierend auf der Stufe
  const maxChoices = currentLevel >= 9 ? level_9_count : level_1_count;
  
  // Hole die aktuellen Auswahlen aus dem Character-Objekt
  const currentSelections = character.weapon_mastery_choices || [];

  const handleToggle = (weapon) => {
    let newSelections = [...currentSelections];
    
    if (newSelections.includes(weapon)) {
      // Waffe entfernen
      newSelections = newSelections.filter(w => w !== weapon);
    } else if (newSelections.length < maxChoices) {
      // Waffe hinzufügen
      newSelections.push(weapon);
    }
    
    updateCharacter({ weapon_mastery_choices: newSelections });
  };

  return (
    <div className="weapon-mastery-selection">
      <div className="details-divider"></div>
      <h3>Waffenbeherrschung (Wähle {maxChoices})</h3>
      <p className="panel-details-description">
        Du beherrschst spezielle Techniken mit bestimmten Waffen. Wähle {maxChoices} Waffen, 
        mit denen du ihre Mastery-Eigenschaft nutzen kannst.
      </p>

      <div className="skill-grid">
        {available_weapons.map(weapon => {
          const isSelected = currentSelections.includes(weapon);
          return (
            <button
              key={weapon}
              className={`skill-choice ${isSelected ? 'selected' : ''}`}
              onClick={() => handleToggle(weapon)}
              disabled={!isSelected && currentSelections.length >= maxChoices}
            >
              {weapon}
            </button>
          );
        })}
      </div>
    </div>
  );
};