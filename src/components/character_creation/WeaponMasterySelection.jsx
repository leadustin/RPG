// src/components/character_creation/WeaponMasterySelection.jsx
import React from 'react';
import './PanelDetails.css';
import './SkillSelection.css';

// Tooltip-Komponenten
import Tooltip from '../tooltip/Tooltip';
import { WeaponMasteryTooltip } from '../tooltip/WeaponMasteryTooltip';

// Detail-Daten
import masteryDetails from '../../data/weaponMasteryDetails.json';

// Lade alle Bildmodule aus dem 'weaponmasteries'-Ordner
const proficiencyIconModules = import.meta.glob(
  '../../assets/images/weaponmasteries/*.(webp|png|jpe?g|svg)',
  { eager: true }
);

// Verarbeite die Module in das erwartete Format
const proficiencyIcons = {};
for (const path in proficiencyIconModules) {
  const iconUrl = proficiencyIconModules[path].default;
  const key = path
    .split('/')
    .pop()
    .replace(/\.(webp|png|jpe?g|svg)$/, '');
  proficiencyIcons[key] = iconUrl;
}

// +++ START NEUE HILFSFUNKTION +++
/**
 * Findet die korrekte Anzahl an Meisterschaften für die aktuelle Stufe.
 * Liest dynamisch alle 'level_X_count'-Einträge.
 */
const getMasteryCountForLevel = (masteryData, level) => {
  if (!masteryData) return 0;
  let currentMax = 0;
  let bestLevel = 0;

  // Iteriert durch alle "level_X_count"-Einträge in der JSON
  for (const key in masteryData) {
    if (key.startsWith("level_") && key.endsWith("_count")) {
      const levelKey = parseInt(key.split('_')[1]);
      
      // Finde die höchste Stufe, die der Charakter erreicht hat
      if (level >= levelKey && levelKey > bestLevel) {
        bestLevel = levelKey;
        currentMax = masteryData[key];
      }
    }
  }
  return currentMax;
};
// +++ ENDE NEUE HILFSFUNKTION +++

export const WeaponMasterySelection = ({ character, updateCharacter }) => {
  const selectedClass = character.class;
  
  if (!selectedClass.weapon_mastery) {
    return null;
  }

  // +++ START ANGEPASSTE LOGIK +++
  const { available_weapons } = selectedClass.weapon_mastery;
  const currentLevel = character.level || 1;
  
  // Verwendet die neue Hilfsfunktion, um die korrekte Anzahl dynamisch zu ermitteln
  const maxChoices = getMasteryCountForLevel(selectedClass.weapon_mastery, currentLevel);
  // +++ ENDE ANGEPASSTE LOGIK +++
  
  // HINWEIS: currentSelections wird jetzt direkt vom 'character'-Prop genommen,
  // was wichtig für das LevelUpModal ist.
  const currentSelections = character.weapon_mastery_choices || [];

  const handleToggle = (weapon) => {
    let newSelections = [...currentSelections];
    
    if (newSelections.includes(weapon)) {
      newSelections = newSelections.filter(w => w !== weapon);
    } else if (newSelections.length < maxChoices) {
      newSelections.push(weapon);
    }
    
    // Ruft die updateCharacter-Funktion auf, die vom Elter (CreationScreen oder LevelUpModal)
    // übergeben wurde.
    updateCharacter({ weapon_mastery_choices: newSelections });
  };

  return (
    <div className="weapon-mastery-selection">
      <div className="details-divider"></div>
      <h3>Waffenbeherrschung {currentSelections.length}/{maxChoices}</h3>
      <p className="panel-details-description">
        Du beherrschst spezielle Techniken mit bestimmten Waffen. Wähle {maxChoices} Waffen, 
        mit denen du ihre Mastery-Eigenschaft nutzen kannst.
      </p>

      <div className="skill-grid">
        {available_weapons.map(weapon => {
          const isSelected = currentSelections.includes(weapon);
          const iconSrc = proficiencyIcons[weapon];
          const tooltipData = masteryDetails[weapon];
          
          return (
            <Tooltip
              key={weapon}
              content={
                <WeaponMasteryTooltip 
                  name={weapon}
                  data={tooltipData}
                />
              }
            >
              <button
                className={`skill-choice ${isSelected ? 'selected' : ''} ${iconSrc ? 'has-icon' : ''}`}
                onClick={() => handleToggle(weapon)}
                disabled={!isSelected && currentSelections.length >= maxChoices}
              >
                {iconSrc ? (
                  <img 
                    src={iconSrc} 
                    alt={weapon}
                    className="skill-icon"
                  />
                ) : (
                  <span>{weapon}</span>
                )}
              </button>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
};