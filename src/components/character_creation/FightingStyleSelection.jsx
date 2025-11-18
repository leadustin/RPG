// src/components/character_creation/FightingStyleSelection.jsx
import React from 'react';
import './PanelDetails.css';
import './SkillSelection.css';

// +++ GEÄNDERT: FightingStyleTooltip importiert +++
import Tooltip from '../tooltip/Tooltip';
import { FightingStyleTooltip } from '../tooltip/FightingStyleTooltip';
import fightingStylesData from '../../data/fightingStyles.json';
// +++ ENDE +++

// +++
// +++ VITE-ERSATZ für require.context +++
// +++

// 1. Lade alle Bildmodule aus dem 'styles'-Ordner
const styleIconModules = import.meta.glob(
  '../../assets/images/styles/*.(webp|png|jpe?g|svg)',
  { eager: true } // 'eager: true' lädt sie sofort
);

// 2. Verarbeite die Module in das Format, das dein Code erwartet
const styleIcons = {};
for (const path in styleIconModules) {
  const iconUrl = styleIconModules[path].default; // 'default' ist die URL
  // Extrahiere den Dateinamen (z.B. "Archery") als Key
  const key = path
    .split('/')
    .pop() // Dateiname.ext
    .replace(/\.(webp|png|jpe?g|svg)$/, ''); // Dateiname
  styleIcons[key] = iconUrl;
}

// +++ 
// +++ ENDE VITE-ERSATZ +++
// +++


export const FightingStyleSelection = ({ character, updateCharacter }) => {
  
  const handleSelect = (styleName) => {
    updateCharacter({ fighting_style: styleName });
  };

  return (
    <div className="fighting-style-selection">
      <h3>Kampfstil wählen</h3>
      <div className="skill-grid">
        
        {fightingStylesData.map(style => {
          // 'style' ist jetzt ein Objekt: { name: "...", description: "..." }
          
          const isSelected = character.fighting_style === style.name;
          
          // +++ GEÄNDERT: Icons werden jetzt basierend auf 'style.name' geholt +++
          // Stellt sicher, dass eure Icon-Dateinamen (z.B. "Archery.png") 
          // mit den 'name'-Eigenschaften in 'fightingStylesData.json' übereinstimmen.
          const iconSrc = styleIcons[style.name]; 
          
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