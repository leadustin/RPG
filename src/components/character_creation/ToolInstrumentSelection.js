// src/components/character_creation/ToolInstrumentSelection.js
import React from 'react';
import './PanelDetails.css';
import './SkillSelection.css'; // Stil wiederverwenden

// +++ NEU: importAll-Funktion +++
function importAll(r) {
  let images = {};
  r.keys().forEach((item) => {
    // Extrahiert den Dateinamen ohne Endung als Key
    // z.B. './Laute.png' -> 'Laute'
    const key = item.replace('./', '').replace(/\.(webp|png|jpe?g|svg)$/, '');
    images[key] = r(item);
  });
  return images;
}

// +++ NEU: Icons laden +++
// Annahme: Du erstellst einen Ordner (z.B. 'src/assets/images/proficiencies')
// und benennst die Icons exakt wie die Options-Strings (z.B. 'Laute.png', 'Schmiedewerkzeug.png')
const proficiencyIcons = importAll(require.context(
  '../../assets/images/proficiencies', // <-- Passe diesen Ordner-Pfad ggf. an
  false,
  /\.(webp|png|jpe?g|svg)$/
));
// +++ ENDE NEU +++


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
          const iconSrc = proficiencyIcons[opt]; // Holt Icon basierend auf dem String
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