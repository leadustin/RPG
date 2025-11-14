// src/components/character_creation/FightingStyleSelection.js
import React from 'react';
import './PanelDetails.css';
import './SkillSelection.css';

// +++ NEU: importAll-Funktion (kopiert von ToolInstrumentSelection) +++
function importAll(r) {
  let images = {};
  r.keys().forEach((item) => {
    // Extrahiert den Dateinamen ohne Endung als Key
    // z.B. './Bogenschießen.png' -> 'Bogenschießen'
    const key = item.replace('./', '').replace(/\.(webp|png|jpe?g|svg)$/, '');
    images[key] = r(item);
  });
  return images;
}

// +++ NEU: Icons laden +++
// Annahme: Die Icons liegen im 'styles'-Ordner unter 'assets/images/'.
const styleIcons = importAll(require.context(
  '../../assets/images/styles', // <-- PASST DIESEN PFAD GGF. AN
  false,
  /\.(webp|png|jpe?g|svg)$/
));
// +++ ENDE NEU +++


// Optionen extrahiert aus classes.json -> fighter -> features -> "Kampfstil"
const FIGHTING_STYLE_OPTIONS = [
  "Bogenschießen", 
  "Verteidigung", 
  "Duellieren", 
  "Zwei-Waffen-Kampf"
  // Fügen Sie hier bei Bedarf weitere Stile aus der Beschreibung hinzu
];

export const FightingStyleSelection = ({ character, updateCharacter }) => {
  
  const handleSelect = (style) => {
    updateCharacter({ fighting_style: style });
  };

  return (
    <div className="fighting-style-selection">
      <div className="details-divider"></div>
      <h3>Kampfstil wählen</h3>
      <div className="skill-grid">
        {FIGHTING_STYLE_OPTIONS.map(style => {
          
          // +++ NEU: Icon-Logik +++
          const isSelected = character.fighting_style === style;
          const iconSrc = styleIcons[style]; // z.B. styleIcons["Bogenschießen"]
          // +++ ENDE NEU +++

          return (
            <button
              key={style}
              // MODIFIZIERT: 'has-icon' hinzugefügt
              className={`skill-choice ${isSelected ? 'selected' : ''} ${iconSrc ? 'has-icon' : ''}`}
              onClick={() => handleSelect(style)}
              // NEU: 'title' hinzugefügt für Tooltip
              title={style}
            >
              
              {/* --- ANGEPASSTE RENDER-LOGIK --- */}
              {/* WENN Icon existiert, DANN zeige Icon, SONST zeige Text */}
              {iconSrc ? (
                <img 
                  src={iconSrc} 
                  alt={style}
                  className="skill-icon" // Die CSS-Klasse, die schon funktioniert
                />
              ) : (
                <span>{style}</span>
              )}
              {/* --- ENDE ANPASSUNG --- */}

            </button>
          );
        })}
      </div>
    </div>
  );
};