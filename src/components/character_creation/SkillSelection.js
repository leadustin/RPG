// src/components/character_creation/SkillSelection.js
import React from 'react';
import './SkillSelection.css';
import { SKILL_NAMES_DE } from '../../engine/characterEngine';

// +++ NEU: importAll-Funktion (kopiert aus ClassSelection.js) +++
function importAll(r) {
  let images = {};
  r.keys().forEach((item) => {
    // Extrahiert den Dateinamen ohne Endung als Key
    // z.B. './acrobatics.png' -> 'acrobatics'
    const key = item.replace('./', '').replace(/\.(webp|png|jpe?g|svg)$/, '');
    images[key] = r(item);
  });
  return images;
}

// +++ NEU: Icons laden +++
// Annahme: Du hast einen Ordner 'src/assets/images/skills' erstellt
// und die Icons exakt wie die skillKeys benannt (z.B. 'acrobatics.png').
const skillIcons = importAll(require.context(
  '../../assets/images/skills', // <-- Der neue Ordner
  false,
  /\.(webp|png|jpe?g|svg)$/
));
// +++ ENDE NEU +++

export const SkillSelection = ({ 
  options, 
  maxChoices, 
  selections, 
  setSelections,
  isOpen,       // <-- Prop wird empfangen
  onToggle,     // <-- Prop wird empfangen
  isCollapsible // <-- NEUE Prop
}) => {
  
  const handleSelection = (skillKey) => {
    const newSelections = [...selections];
    const index = newSelections.indexOf(skillKey);

    if (index > -1) {
      newSelections.splice(index, 1);
    } else if (newSelections.length < maxChoices) {
      newSelections.push(skillKey);
    }
    setSelections(newSelections);
  };

  // --- NEU: Helper-Funktion für die Anzeige (vermeidet Code-Dopplung) ---
  const renderSkillGrid = () => (
    <div className="skill-grid">
      {options.map(skillKey => {
        const isSelected = selections.includes(skillKey);
        const iconSrc = skillIcons[skillKey]; // Icon-Quelle holen
        const skillName = SKILL_NAMES_DE[skillKey]; // Name für Tooltip

        return (
          <div 
            key={skillKey}
            className={`skill-choice ${isSelected ? 'selected' : ''}`}
            onClick={() => handleSelection(skillKey)}
            // WICHTIG: Zeigt den Namen beim Hovern an
            title={skillName} 
          >
            {/* === GEÄNDERT: Icon statt Text === */}
            {iconSrc ? (
              <img 
                src={iconSrc} 
                alt={skillName} // Gut für Barrierefreiheit
                className="skill-icon" 
              />
            ) : (
              // Fallback, falls Icon fehlt (zeigt Initialen, z.B. "AKR")
              skillName.substring(0, 3).toUpperCase()
            )}
            {/* === ENDE ÄNDERUNG === */}
          </div>
        );
      })}
    </div>
  );
  // --- ENDE Helper-Funktion ---


  // --- RENDER-LOGIK (nutzt jetzt den Helper) ---
  if (isCollapsible) {
    // VARIANTE A: FÜR MAGIER (einklappbar)
    const headerClassName = `collapsible-header ${isOpen ? 'open' : ''}`;
    return (
      <div className="skill-selection-container">
        <h4 className={headerClassName} onClick={onToggle}>
          Fertigkeiten {selections.length}/{maxChoices}
        </h4>
        {isOpen && renderSkillGrid()} {/* <-- Helper aufrufen */}
      </div>
    );
  }

  // VARIANTE B: FÜR ALLE ANDEREN (statisch)
  return (
    <div className="skill-selection-container">
      <h4>Fertigkeiten {selections.length}/{maxChoices}</h4>
      {renderSkillGrid()} {/* <-- Helper aufrufen */}
    </div>
  );
  // --- ENDE RENDER-LOGIK ---
};