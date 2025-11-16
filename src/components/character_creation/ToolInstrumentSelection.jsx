// src/components/character_creation/ToolInstrumentSelection.jsx
import React from 'react';
import './PanelDetails.css';
import './SkillSelection.css';


// 1. Lade alle Bildmodule aus dem 'proficiencies'-Ordner
const proficiencyIconModules = import.meta.glob(
  '../../assets/images/proficiencies/*.(webp|png|jpe?g|svg)',
  { eager: true } // 'eager: true' lädt sie sofort
);

// 2. Verarbeite die Module in das Format, das dein Code erwartet
// (z.B. { 'Laute': '/path/to/Laute.png' })
const proficiencyIcons = {};
for (const path in proficiencyIconModules) {
  const iconUrl = proficiencyIconModules[path].default; // 'default' ist die URL
  // Extrahiere den Dateinamen (z.B. "Laute") als Key
  const key = path
    .split('/')
    .pop() // Dateiname.ext
    .replace(/\.(webp|png|jpe?g|svg)$/, ''); // Dateiname
  proficiencyIcons[key] = iconUrl;
}

// +++ 
// +++ ENDE VITE-ERSATZ +++
// +++


// --- Konstanten (bleiben gleich) ---
const INSTRUMENT_OPTIONS = ["Dudelsack", "Trommel", "Horn", "Flöte", "Laute", "Lyra", "Glockenspiel"];
const TOOL_OPTIONS = ["Alchemistenwerkzeug", "Brauerwerkzeug", "Kalligraphenwerkzeug", "Schmiedewerkzeug", "Zimmermannswerkzeug"];
// --- ENDE ---

export const ToolInstrumentSelection = ({ character, updateCharacter }) => {
  const classKey = character.class.key;
  
  let options = [];
  let maxChoices = 0;
  let titleText = "";
  let selectionKey = "class_tool_choice";
  let currentSelections = [];
  
  let gridClassName = "skill-grid";

  if (classKey === 'bard') {
    options = INSTRUMENT_OPTIONS;
    maxChoices = 3;
    titleText = "Musikinstrumente";
    selectionKey = "tool_proficiencies_choice";
    currentSelections = character.tool_proficiencies_choice || [];
    gridClassName = "skill-grid";
  } else if (classKey === 'monk') {
    options = [...INSTRUMENT_OPTIONS, ...TOOL_OPTIONS];
    maxChoices = 1;
    titleText = "Handwerkerwerkzeug oder Instrument";
    selectionKey = "class_tool_choice";
    currentSelections = character.class_tool_choice ? [character.class_tool_choice] : [];
    gridClassName = "skill-grid-2col";
  } else {
    return null;
  }


  const handleToggle = (key) => {
    if (maxChoices === 1) {
      updateCharacter({ [selectionKey]: key });
    } else {
      let newSelection = [...currentSelections];
      if (newSelection.includes(key)) {
        newSelection = newSelection.filter(s => s !== key);
      } else if (newSelection.length < maxChoices) {
        newSelection.push(key);
      }
      updateCharacter({ [selectionKey]: newSelection });
    }
  };

  const selectionCount = (maxChoices === 1 && character.class_tool_choice) ? 1 : currentSelections.length;

  return (
    <div className="tool-instrument-selection">
      <div className="details-divider"></div>
      <h3>{titleText} {selectionCount}/{maxChoices}</h3>
      
      <div className={gridClassName}> 
        {options.map(opt => {
          // +++ NEU: Icon-Logik +++
          const isSelected = currentSelections.includes(opt);
          // Holt Icon basierend auf dem String (z.B. 'Laute')
          // (Stellt sicher, dass das Icon 'Laute.png' o.ä. heißt)
          const iconSrc = proficiencyIcons[opt]; 
          // +++ ENDE NEU +++

          return (
            <button
              key={opt}
              className={`skill-choice ${isSelected ? 'selected' : ''}`} // CSS-Klasse wiederverwenden
              onClick={() => handleToggle(opt)}
              title={opt} // Zeigt den vollen Namen beim Hovern
            >
              {/* === GEÄNDERT: Icon statt Text === */}
              {iconSrc ? (
                <img 
                  src={iconSrc} 
                  alt={opt}
                  className="skill-icon" // CSS-Klasse aus SkillSelection.css
                />
              ) : (
                // Fallback, falls Icon fehlt (z.B. "LAU")
                opt.substring(0, 3).toUpperCase()
              )}
              {/* === ENDE ÄNDERUNG === */}
            </button>
          );
        })}
      </div>
    </div>
  );
};