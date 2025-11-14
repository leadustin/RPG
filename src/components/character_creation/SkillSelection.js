// src/components/character_creation/SkillSelection.js
import React from 'react';
import './SkillSelection.css';
import { SKILL_NAMES_DE } from '../../engine/characterEngine';

// +++ NEU: Tooltip-Komponenten importieren +++
import Tooltip from '../tooltip/Tooltip'; // Der generische Wrapper
import { SkillTooltip } from '../tooltip/SkillTooltip'; // Die neue Inhaltskomponente

// +++ NEU: Die Skill-Detail-Daten importieren +++
import skillDetails from '../../data/skillDetails.json';

// +++ importAll-Funktion für Icons +++
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

export const SkillSelection = ({ 
  options, 
  maxChoices, 
  selections = [], // Default-Wert hinzufügen
  setSelections,
  isOpen,       
  onToggle,     
  isCollapsible 
}) => {

  // Sicherstellen, dass selections immer ein Array ist
  const safeSelections = Array.isArray(selections) ? selections : [];

  const handleSelection = (skillKey) => {
    // Direkt mit safeSelections arbeiten statt mit prev
    const currentSelections = [...safeSelections];

    if (currentSelections.includes(skillKey)) {
      // Skill entfernen
      setSelections(currentSelections.filter(s => s !== skillKey));
    } else if (currentSelections.length < maxChoices) {
      // Skill hinzufügen
      setSelections([...currentSelections, skillKey]);
    }
  };

  // --- Helper-Funktion zum Rendern des Grids (MODIFIZIERT FÜR TOOLTIPS) ---
  const renderSkillGrid = () => (
    <div className="skill-grid">
      {options.map((skillKey) => {
        const skillName = SKILL_NAMES_DE[skillKey] || skillKey;
        const iconSrc = skillIcons[skillKey];
        
        const isSelected = safeSelections.includes(skillKey);
        
        // +++ NEU: Tooltip-Daten holen +++
        const tooltipData = skillDetails[skillKey];

        return (
          // +++ NEU: Mit Tooltip umwickelt +++
          <Tooltip
            key={skillKey}
            content={
              // Übergibt die Daten an unsere neue SkillTooltip-Komponente
              <SkillTooltip data={tooltipData} />
            }
          >
            <div
              className={`skill-choice ${isSelected ? 'selected' : ''}`}
              onClick={() => handleSelection(skillKey)}
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
  // --- ENDE Helper-Funktion ---


  // --- RENDER-LOGIK ---
  if (isCollapsible) {
    const headerClassName = `collapsible-header ${isOpen ? 'open' : ''}`;
    return (
      <div className="skill-selection-container">
        <h4 className={headerClassName} onClick={onToggle}>
          Fertigkeiten {safeSelections.length}/{maxChoices}
        </h4>
        {isOpen && renderSkillGrid()}
      </div>
    );
  }

  return (
    <div className="skill-selection-container">
      <h4>Fertigkeiten {safeSelections.length}/{maxChoices}</h4>
      <p className="panel-details-description">
        Wähle {maxChoices} Fertigkeiten, in denen du geübt bist.
      </p>
      {renderSkillGrid()}
    </div>
  );
};