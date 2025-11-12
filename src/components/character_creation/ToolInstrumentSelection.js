// src/components/character_creation/ToolInstrumentSelection.js
import React from 'react';
import './PanelDetails.css';
import './SkillSelection.css'; // Stil wiederverwenden

// --- KORREKTUR: Konstanten hierher verschoben ---
// Vereinfachte Liste. Diese sollte idealerweise aus einer eigenen JSON-Datei kommen.
const INSTRUMENT_OPTIONS = ["Dudelsack", "Trommel", "Horn", "Flöte", "Laute", "Lyra", "Glockenspiel"];
const TOOL_OPTIONS = ["Alchemistenwerkzeug", "Brauerwerkzeug", "Kalligraphenwerkzeug", "Schmiedewerkzeug", "Zimmermannswerkzeug"];
// --- ENDE KORREKTUR ---

export const ToolInstrumentSelection = ({ character, updateCharacter }) => {
  const classKey = character.class.key;
  
  let options = [];
  let maxChoices = 0;
  let titleText = ""; // Neuer Name für den Text-Teil
  let selectionKey = "class_tool_choice"; // Schlüssel im character-Objekt
  let currentSelections = [];
  
  // --- KORREKTUR (aus vorheriger Anfrage): Dynamische Grid-Klasse ---
  let gridClassName = "skill-grid"; // Standard ist 3er-Grid

  if (classKey === 'bard') {
    options = INSTRUMENT_OPTIONS; // Jetzt hier sichtbar
    maxChoices = 3;
    titleText = "Musikinstrumente"; // Nur der Titel
    selectionKey = "tool_proficiencies_choice"; // Barde wählt 3 (Array)
    currentSelections = character.tool_proficiencies_choice || [];
    gridClassName = "skill-grid"; // Barde bleibt beim 3er-Grid
  } else if (classKey === 'monk') {
    options = [...INSTRUMENT_OPTIONS, ...TOOL_OPTIONS]; // Jetzt hier sichtbar
    maxChoices = 1;
    titleText = "Handwerkerwerkzeug oder Instrument"; // Nur der Titel
    selectionKey = "class_tool_choice"; // Mönch wählt 1 (String)
    currentSelections = character.class_tool_choice ? [character.class_tool_choice] : [];
    gridClassName = "skill-grid-2col"; // Mönch nutzt das 2er-Grid
  } else {
    return null;
  }
  // --- ENDE KORREKTUR ---


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

  // Zähle die Auswahlen (für Mönch ist es 1, wenn
  // class_tool_choice gesetzt ist, sonst 0)
  const selectionCount = (maxChoices === 1 && character.class_tool_choice) ? 1 : currentSelections.length;

  return (
    <div className="tool-instrument-selection">
      <div className="details-divider"></div>
      {/* === GEÄNDERT === */}
      <h3>{titleText} {selectionCount}/{maxChoices}</h3>
      {/* === ENDE ÄNDERUNG === */}
      
      {/* Wendet die dynamische Klasse an */}
      <div className={gridClassName}> 
        {options.map(opt => (
          <button
            key={opt}
            className={`skill-choice ${currentSelections.includes(opt) ? 'selected' : ''}`}
            onClick={() => handleToggle(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};