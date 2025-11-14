// src/components/character_creation/SkillSelection.js
import React from 'react';
import './SkillSelection.css';
import { SKILL_NAMES_DE } from '../../engine/characterEngine';

// +++ NEU: Tooltip-Komponenten importieren +++
import Tooltip from '../tooltip/Tooltip'; // Der generische Wrapper
import { SkillTooltip } from '../tooltip/SkillTooltip'; // Unser neuer Inhalt

// +++ NEU: Die Skill-Detail-Daten importieren +++
import skillDetails from '../../data/skillDetails.json';


// +++ importAll-Funktion für Icons (war schon da) +++
function importAll(r) {
  let images = {};
  r.keys().forEach((item) => {
    const key = item.replace('./', '').replace(/\.(webp|png|jpe?g|svg)$/, '');
    images[key] = r(item);
  });
  return images;
}

const skillIcons = importAll(require.context(
  '../../assets/images/skills', 
  false,
  /\.(webp|png|jpe?g|svg)$/
));
// +++ ENDE Icons +++

export const SkillSelection = ({ 
  options, 
  maxChoices, 
  selections, 
  setSelections,
  isOpen,       
  onToggle,     
  isCollapsible 
}) => {

  const handleSelection = (skillKey) => {
    setSelections(prev => {
      if (prev.includes(skillKey)) {
        return prev.filter(s => s !== skillKey);
      }
      if (prev.length < maxChoices) {
        return [...prev, skillKey];
      }
      return prev;
    });
  };

  // --- Helper-Funktion zum Rendern des Grids (MODIFIZIERT) ---
  const renderSkillGrid = () => (
    <div className="skill-grid">
      {options.map((skillKey) => {
        const skillName = SKILL_NAMES_DE[skillKey] || skillKey;
        const iconSrc = skillIcons[skillKey];
        const isSelected = selections.includes(skillKey);
        
        // +++ NEU: Tooltip-Daten holen +++
        const tooltipData = skillDetails[skillKey];

        return (
          // +++ NEU: Mit Tooltip umwickelt +++
          <Tooltip
            key={skillKey}
            content={
              <SkillTooltip data={tooltipData} />
            }
          >
            <div
              className={`skill-choice ${isSelected ? 'selected' : ''}`}
              onClick={() => handleSelection(skillKey)}
              // title={skillName} // <-- ENTFERNT, um Konflikt zu vermeiden
            >
              {iconSrc ? (
                <img 
                  src={iconSrc} 
                  alt={skillName}
                  className="skill-icon" 
                />
              ) : (
                skillName.substring(0, 3).toUpperCase()
              )}
            </div>
          </Tooltip>
        );
      })}
    </div>
  );
  // --- ENDE Helper-Funktion ---\


  // --- RENDER-LOGIK (unverändert) ---\
  if (isCollapsible) {
    const headerClassName = `collapsible-header ${isOpen ? 'open' : ''}`;
    return (
      <div className="skill-selection-container">
        <h4 className={headerClassName} onClick={onToggle}>
          Fertigkeiten {selections.length}/{maxChoices}
        </h4>
        {isOpen && renderSkillGrid()}
      </div>
    );
  }

  return (
    <div className="skill-selection-container">
      <h4>Fertigkeiten {selections.length}/{maxChoices}</h4>
      <p className="panel-details-description">
        Wähle {maxChoices} Fertigkeiten, in denen du geübt bist.
      </p>
      {renderSkillGrid()}
    </div>
  );
};