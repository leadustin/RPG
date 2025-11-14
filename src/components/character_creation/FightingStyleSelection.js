// src/components/character_creation/FightingStyleSelection.js
import React from 'react';
import './PanelDetails.css';
import './SkillSelection.css';

// +++ GEÄNDERT: FightingStyleTooltip importiert +++
import Tooltip from '../tooltip/Tooltip';
import { FightingStyleTooltip } from '../tooltip/FightingStyleTooltip'; // NEU
import fightingStylesData from '../../data/fightingStyles.json';
// +++ ENDE +++

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


export const FightingStyleSelection = ({ character, updateCharacter }) => {
  
  const handleSelect = (styleName) => {
    updateCharacter({ fighting_style: styleName });
  };

  return (
    <div className="fighting-style-selection">
      <div className="details-divider"></div>
      <h3>Kampfstil wählen</h3>
      <div className="skill-grid">
        
        {fightingStylesData.map(style => {
          // 'style' ist jetzt ein Objekt: { name: "...", description: "..." }
          
          const isSelected = character.fighting_style === style.name;
          const iconSrc = styleIcons[style.name]; // Holt Icon basierend auf dem 'name'
          
          // +++ NEU: Die Daten für den Tooltip sind das 'style'-Objekt selbst +++
          const tooltipData = style;

          return (
            // +++ GEÄNDERT: Tooltip-Wrapper verwendet jetzt 'content'-Prop +++
            <Tooltip 
              key={style.name} 
              content={
                <FightingStyleTooltip data={tooltipData} />
              }
            >
              <button
                className={`skill-choice ${isSelected ? 'selected' : ''} ${iconSrc ? 'has-icon' : ''}`}
                onClick={() => handleSelect(style.name)}
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
            // +++ ENDE GEÄNDERT +++
          );
        })}
      </div>
    </div>
  );
};