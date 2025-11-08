// src/components/character_creation/ToolInstrumentSelection.js
import React from 'react';
import './PanelDetails.css';
import './SkillSelection.css'; // Stil wiederverwenden

// Vereinfachte Liste. Diese sollte idealerweise aus einer eigenen JSON-Datei kommen.
const INSTRUMENT_OPTIONS = ["Dudelsack", "Trommel", "Horn", "Flöte", "Laute", "Lyra", "Glockenspiel"];
const TOOL_OPTIONS = ["Alchemistenwerkzeug", "Brauerwerkzeug", "Kalligraphenwerkzeug", "Schmiedewerkzeug", "Zimmermannswerkzeug"];

export const ToolInstrumentSelection = ({ character, updateCharacter }) => {
  const classKey = character.class.key;
  
  let options = [];
  let maxChoices = 0;
  let title = "";
  let selectionKey = "class_tool_choice"; // Schlüssel im character-Objekt
  let currentSelections = [];

  if (classKey === 'bard') {
    options = INSTRUMENT_OPTIONS;
    maxChoices = 3;
    title = "Musikinstrumente (Wähle 3)";
    selectionKey = "tool_proficiencies_choice"; // Barde wählt 3 (Array)
    currentSelections = character.tool_proficiencies_choice || [];
  } else if (classKey === 'monk') {
    options = [...INSTRUMENT_OPTIONS, ...TOOL_OPTIONS];
    maxChoices = 1;
    title = "Handwerkerwerkzeug oder Instrument (Wähle 1)";
    selectionKey = "class_tool_choice"; // Mönch wählt 1 (String)
    currentSelections = character.class_tool_choice ? [character.class_tool_choice] : [];
  } else {
    return null;
  }

  const handleToggle = (key) => {
    if (maxChoices === 1) {
      updateCharacter({ [selectionKey]: key });
    } else {
      // Logik für Mehrfachauswahl (Barde)
      let newSelection = [...currentSelections];
      if (newSelection.includes(key)) {
        newSelection = newSelection.filter(s => s !== key);
      } else if (newSelection.length < maxChoices) {
        newSelection.push(key);
      }
      updateCharacter({ [selectionKey]: newSelection });
    }
  };

  return (
    <div className="tool-instrument-selection">
      <div className="details-divider"></div>
      <h3>{title}</h3>
      <div className="skill-selection-grid">
        {options.map(opt => (
          <button
            key={opt}
            className={`skill-button ${currentSelections.includes(opt) ? 'selected' : ''}`}
            onClick={() => handleToggle(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};