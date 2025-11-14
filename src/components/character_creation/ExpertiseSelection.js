// src/components/character_creation/ExpertiseSelection.js
import React from 'react';
// WICHTIG: Wir verwenden dasselbe CSS wie SkillSelection für .skill-grid und .skill-choice
import './SkillSelection.css'; 
import { SKILL_NAMES_DE } from '../../engine/characterEngine';

// +++ NEU: Tooltip-Komponenten importieren +++
import Tooltip from '../tooltip/Tooltip'; 
import { SkillTooltip } from '../tooltip/SkillTooltip'; 

// +++ NEU: Die Skill-Detail-Daten importieren +++
import skillDetails from '../../data/skillDetails.json';

// +++ NEU: importAll-Funktion für Icons +++
function importAll(r) {
  let images = {};
  r.keys().forEach((item) => {
    const key = item.replace('./', '').replace(/\.(webp|png|jpe?g|svg)$/, '');
    images[key] = r(item);
  });
  return images;
}

// +++ NEU: Icons laden +++
const skillIcons = importAll(require.context(
  '../../assets/images/skills', // Der Pfad zu deinen Skill-Icons
  false,
  /\.(webp|png|jpe?g|svg)$/
));
// +++ ENDE NEU +++


export const ExpertiseSelection = ({ 
  options,  // Das sind die 4 Fertigkeiten, in denen der Schurke geübt ist
  maxChoices, // Sollte 2 sein
  selections = [], // Die 2 ausgewählten Skills (Default auf [] gesetzt)
  setSelections 
}) => {

  // Deine Logik zum Auswählen (sieht gut aus)
  const handleSelection = (skillKey) => {
    const currentSelections = Array.isArray(selections) ? selections : [];
    let newSelections;

    if (currentSelections.includes(skillKey)) {
      newSelections = currentSelections.filter(s => s !== skillKey);
    } else if (currentSelections.length < maxChoices) {
      newSelections = [...currentSelections, skillKey];
    } else {
      // Wenn max erreicht ist, keine Änderung
      newSelections = [...currentSelections]; 
    }
    setSelections(newSelections);
  };

  return (
    <div className="skill-selection-container">
      {/* Der Titel und die Beschreibung sind spezifisch für Expertise */}
      <h4>Expertise {selections.length}/{maxChoices}</h4>
      <p className="panel-details-description">
        Wähle {maxChoices} deiner geübten Fertigkeiten. Dein Übungsbonus wird für diese Fertigkeiten verdoppelt.
      </p>

      {/* Das Grid verwendet dieselben Stile wie SkillSelection */}
      <div className="skill-grid">
        {options.map((skillKey) => {
          const skillName = SKILL_NAMES_DE[skillKey] || skillKey;
          
          // +++ NEU: Icon- und Tooltip-Daten holen +++
          const iconSrc = skillIcons[skillKey];
          const isSelected = selections.includes(skillKey);
          const tooltipData = skillDetails[skillKey]; // Daten aus der JSON holen

          return (
            // +++ NEU: Mit Tooltip umwickelt +++
            <Tooltip
              key={skillKey}
              content={<SkillTooltip data={tooltipData} />}
            >
              <div
                className={`skill-choice ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelection(skillKey)}
                // Kein 'title'-Attribut, um Konflikte zu vermeiden
              >
                {/* +++ NEU: Icon-Render-Logik +++ */}
                {iconSrc ? (
                  <img 
                    src={iconSrc} 
                    alt={skillName}
                    className="skill-icon" 
                  />
                ) : (
                  // Fallback, falls Icon fehlt
                  skillName.substring(0, 3).toUpperCase()
                )}
              </div>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
};