// src/components/character_creation/FightingStyleSelection.js
import React from 'react';
import './PanelDetails.css';
import './SkillSelection.css';

// +++ NEU: Tooltip-Komponente und JSON-Daten importieren +++
import Tooltip from '../tooltip/Tooltip';
import fightingStylesData from '../../data/fightingStyles.json';
// +++ ENDE NEU +++

// +++ Icon-Ladefunktion (unverändert) +++
function importAll(r) {
  let images = {};
  r.keys().forEach((item) => {
    const key = item.replace('./', '').replace(/\.(webp|png|jpe?g|svg)$/, '');
    images[key] = r(item);
  });
  return images;
}

// +++ Icons laden (unverändert) +++
const styleIcons = importAll(require.context(
  '../../assets/images/styles', // Pfad zu Ihren Kampfstil-Icons
  false,
  /\.(webp|png|jpe?g|svg)$/
));
// +++ ENDE +++

// --- ENTFERNT ---
// const FIGHTING_STYLE_OPTIONS = [ ... ]; // Wird nicht mehr benötigt


export const FightingStyleSelection = ({ character, updateCharacter }) => {
  
  const handleSelect = (styleName) => {
    updateCharacter({ fighting_style: styleName });
  };

  return (
    <div className="fighting-style-selection">
      <div className="details-divider"></div>
      <h3>Kampfstil wählen</h3>
      <div className="skill-grid">
        
        {/* +++ GEÄNDERT: Iteration über JSON-Daten +++ */}
        {fightingStylesData.map(style => {
          // 'style' ist jetzt ein Objekt: { name: "...", description: "..." }
          
          const isSelected = character.fighting_style === style.name;
          const iconSrc = styleIcons[style.name]; // Holt Icon basierend auf dem 'name'

          return (
            // +++ NEU: Mit Tooltip umschlossen +++
            <Tooltip 
              key={style.name} 
              header={style.name} 
              text={style.description}
            >
              <button
                className={`skill-choice ${isSelected ? 'selected' : ''} ${iconSrc ? 'has-icon' : ''}`}
                onClick={() => handleSelect(style.name)}
                // Das 'title'-Attribut wird nicht mehr benötigt, da der Tooltip das übernimmt
              >
                {/* Logik für Icon/Text (unverändert) */}
                {iconSrc ? (
                  <img 
                    src={iconSrc} 
                    alt={style.name}
                    className="skill-icon" // Wiederverwendung der funktionierenden CSS-Klasse
                  />
                ) : (
                  <span>{style.name}</span> // Fallback-Text
                )}
              </button>
            </Tooltip>
            // +++ ENDE NEU +++
          );
        })}
      </div>
    </div>
  );
};