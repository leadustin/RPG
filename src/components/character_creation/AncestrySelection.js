// src/components/character_creation/AncestrySelection.js
import React from 'react';
import './PanelDetails.css';
import './RaceSelection.css'; // Wiederverwendung der Stile für 'race-grid'
import './AncestrySelection.css'; // <-- NEUER IMPORT

export const AncestrySelection = ({ ancestries, selectedAncestry, onAncestrySelect }) => {

  if (!ancestries || ancestries.length === 0) {
    return <div className="panel-details">Für dieses Volk sind keine Abstammungen verfügbar.</div>;
  }

  return (
    // Haupt-Grid-Container, .panel-details entfernt, da .summary-panel-layout die Höhe steuert
    <div className="summary-panel-layout"> 
      
      {/* --- LINKE SPALTE (Liste) --- */}
      <div className="summary-column-left">
        {/* Box 1: Enthält die Auswahl */}
        <div className="summary-box">
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
        </div>
      </div>

      {/* --- RECHTE SPALTE (Details) --- */}
      <div className="summary-column-right">
        {/* Box 2: Enthält die Details */}
        <div className="summary-box">
          {selectedAncestry ? (
            // React.Fragment wird verwendet, damit die Details direkt in der Box liegen
            <React.Fragment> 
              <div className="details-divider"></div>
              <h4>{selectedAncestry.name}</h4>
              <ul className="traits-list">
                <li>
                  <strong>Schadensresistenz:</strong> {selectedAncestry.damage_resistance_type}
                </li>
                <li>
                  {/* TODO: Beschreibung der Odemwaffe aus den Daten hinzufügen */}
                  <strong>Odemwaffe:</strong> {selectedAncestry.breath_weapon_description || 'Beschreibung der Odemwaffe...'}
                </li>
              </ul>
            </React.Fragment>
          ) : (
            // Platzhalter, wenn nichts ausgewählt ist
            <div className="ancestry-details-placeholder" style={{ margin: 'auto', textAlign: 'center' }}>
              <p>Wähle links eine Abstammung, um die Details anzuzeigen.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};