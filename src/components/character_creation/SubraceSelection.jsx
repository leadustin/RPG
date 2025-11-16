// src/components/character_creation/SubraceSelection.js
import React from 'react';
import './SubraceSelection.css';
import './PanelDetails.css';

// Diese Komponente erwartet jetzt die spezifischen Props statt des ganzen "character"-Objekts

export const SubraceSelection = ({ subraces, selectedSubrace, onSubraceSelect }) => {
  
  if (!subraces || subraces.length === 0) {
    return <div className="panel-details">Für dieses Volk sind keine Unterarten verfügbar.</div>;
  }

  return (
    <div className="subrace-selection-container panel-details">
      <h3>Unterart wählen</h3>
      {/* Wir verwenden die Stile von RaceSelection wieder */}
      <div className="race-grid">
        {subraces.map((subrace) => (
          <button
            key={subrace.key}
            className={`race-button ${
              selectedSubrace?.key === subrace.key ? "selected" : ""
            }`}
            onClick={() => onSubraceSelect(subrace)}
          >
            {/* Hier könnte man später Sub-Porträts hinzufügen, falls vorhanden */}
            <span>{subrace.name}</span>
          </button>
        ))}
      </div>

      {/* Zeigt die Details der ausgewählten Unterart an */}
      {selectedSubrace && (
        <div className="subrace-details">
          <div className="details-divider"></div>
          <h4>{selectedSubrace.name}</h4>
          <ul className="traits-list">
            {selectedSubrace.traits.map((trait) => (
              <li key={trait.name}>
                <strong>{trait.name}:</strong> {trait.description}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};