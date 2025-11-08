// src/components/character_creation/AncestrySelection.js
import React from 'react';
import './PanelDetails.css';
import './RaceSelection.css'; // Wiederverwendung der Stile für 'race-grid'

// Diese Komponente erwartet jetzt die spezifischen Props statt des ganzen "character"-Objekts

export const AncestrySelection = ({ ancestries, selectedAncestry, onAncestrySelect }) => {

  if (!ancestries || ancestries.length === 0) {
    return <div className="panel-details">Für dieses Volk sind keine Abstammungen verfügbar.</div>;
  }

  return (
    <div className="ancestry-selection-container panel-details">
      <h3>Abstammung wählen</h3>
      <p className="panel-details-description">
        Wähle die Abstammung deines Drachenblütigen. Dies bestimmt deinen Odem-Angriff und deine Schadensresistenz.
      </p>
      <div className="race-grid">
        {ancestries.map((ancestry) => (
          <button
            key={ancestry.key}
            className={`race-button ${
              selectedAncestry?.key === ancestry.key ? "selected" : ""
            }`}
            onClick={() => onAncestrySelect(ancestry)}
          >
            <span>{ancestry.name}</span>
          </button>
        ))}
      </div>

      {/* Zeigt die Details der ausgewählten Abstammung an */}
      {selectedAncestry && (
        <div className="ancestry-details">
          <div className="details-divider"></div>
          <h4>{selectedAncestry.name}</h4>
          <ul className="traits-list">
            <li>
              <strong>Schadensresistenz:</strong> {selectedAncestry.damage_resistance_type}
            </li>
            <li>
              <strong>Odemwaffe:</strong> {selectedAncestry.breath_weapon_description}
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};