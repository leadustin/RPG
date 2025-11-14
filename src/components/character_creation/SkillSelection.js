// src/components/character_creation/SkillSelection.js
import React from 'react';
import './SkillSelection.css';
import { SKILL_NAMES_DE } from '../../engine/characterEngine';

// +++ NEU: Tooltip-Komponenten importieren +++
import Tooltip from '../tooltip/Tooltip'; // Der generische Wrapper
import { SkillTooltip } from '../tooltip/SkillTooltip'; // Die neue Inhaltskomponente

// +++ NEU: Die Skill-Detail-Daten importieren +++
// (Stelle sicher, dass du src/data/skillDetails.json erstellt hast, wie in meiner letzten Antwort)
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
  selections, // <-- Diese Prop ist 'undefined' oder ein Objekt, was den Absturz verursacht
  setSelections,
  isOpen,       
  onToggle,     
  isCollapsible 
}) => {

  // +++ CRASH-FIX (A) +++
  // Wir stellen sicher, dass 'selections' IMMER ein Array ist, bevor wir es verwenden.
  const safeSelections = Array.isArray(selections) ? selections : [];

  const handleSelection = (skillKey) => {
    setSelections(prev => {
      // +++ CRASH-FIX (B) +++
      // Auch hier 'prev' absichern, falls der State fehlerhaft initialisiert wurde
      const currentSelections = Array.isArray(prev) ? prev : [];

      if (currentSelections.includes(skillKey)) {
        return currentSelections.filter(s => s !== skillKey);
      }
      if (currentSelections.length < maxChoices) {
        return [...currentSelections, skillKey];
      }
      return currentSelections; // Gib immer ein Array zurück
    });
  };

  // --- Helper-Funktion zum Rendern des Grids (MODIFIZIERT FÜR TOOLTIPS) ---
  const renderSkillGrid = () => (
    <div className="skill-grid">
      {options.map((skillKey) => {
        const skillName = SKILL_NAMES_DE[skillKey] || skillKey;
        const iconSrc = skillIcons[skillKey];
        
        // +++ CRASH-FIX (C) +++
        // Verwende 'safeSelections' statt 'selections'
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
              // title={skillName} // <-- ENTFERNT! Verhindert Konflikt mit React-Tooltip
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