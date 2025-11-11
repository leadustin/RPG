// src/components/character_creation/AncestrySelection.js
import React from 'react';
import './PanelDetails.css';
import './RaceSelection.css'; // Beibehalten für .race-grid & .race-button
import './AncestrySelection.css'; // <-- NEUER IMPORT

export const AncestrySelection = ({ ancestries, selectedAncestry, onAncestrySelect }) => {

  if (!ancestries || ancestries.length === 0) {
    return <div className="panel-details">Für dieses Volk sind keine Abstammungen verfügbar.</div>;
  }

  return (
    // Wir fügen die neue Layout-Klasse hinzu
    <div className="ancestry-selection-container panel-details ancestry-grid-layout">
      
      {/* --- LINKE SPALTE (Liste) --- */}
      <div className="ancestry-column-list">
        <h3>Abstammung wählen</h3>
        <p className="panel-details-description">
          Wähle die Abstammung deines Drachenblütigen. Dies bestimmt deinen Odem-Angriff und deine Schadensresistenz.
        </p>
        
        {/* Das Grid mit den Buttons */}
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
      </div>

      {/* --- RECHTE SPALTE (Details) --- */}
      <div className="ancestry-column-details">
        {selectedAncestry ? (
          // Zeigt die Details der ausgewählten Abstammung an
          <div className="ancestry-details">
            <div className="details-divider"></div>
            <h4>{selectedAncestry.name}</h4>
            <ul className="traits-list"> {/* 'traits-list' kommt aus PanelDetails.css */}
              <li>
                <strong>Schadensresistenz:</strong> {selectedAncestry.damage_resistance_type}
              </li>
              <li>
                {/* Annahme, dass die Beschreibung in den Daten vorhanden ist */}
                <strong>Odemwaffe:</strong> {selectedAncestry.breath_weapon_description || 'Beschreibung der Odemwaffe...'}
              </li>
            </ul>
          </div>
        ) : (
          // Platzhalter, wenn nichts ausgewählt ist
          <div className="ancestry-details-placeholder" style={{marginTop: '20px'}}>
            <p>Wähle links eine Abstammung, um die Details anzuzeigen.</p>
          </div>
        )}
      </div>

    </div>
  );
};