// src/components/character_creation/AncestrySelection.js
import React from 'react';
import './PanelDetails.css'; // Behalten für .details-divider, .traits-list
import './RaceSelection.css'; // Behalten für .race-grid, .race-button
import './AncestrySelection.css'; // <-- NEUER IMPORT mit den eigenen Klassen

export const AncestrySelection = ({ ancestries, selectedAncestry, onAncestrySelect }) => {

  if (!ancestries || ancestries.length === 0) {
    // .panel-details ist okay für die Fallback-Ansicht
    return <div className="panel-details">Für dieses Volk sind keine Abstammungen verfügbar.</div>;
  }

  return (
    // Haupt-Grid-Container mit NEUER Klasse
    <div className="ancestry-grid-layout"> 
      
      {/* --- LINKE SPALTE (Liste) --- */}
      <div className="ancestry-column-list">
        {/* Box 1: Enthält die Auswahl mit NEUER Klasse */}
        <div className="ancestry-box">
          <h3>Abstammung wählen</h3>
          <p className="panel-details-description">
            Wähle die Abstammung deines Drachenblütigen. Dies bestimmt deinen Odem-Angriff und deine Schadensresistenz.
          </p>
          
          {/* .race-grid wird wiederverwendet, da es Button-Stile sind */}
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
      <div className="ancestry-column-details">
        {/* Box 2: Enthält die Details mit NEUER Klasse */}
        <div className="ancestry-box">
          {selectedAncestry ? (
            <React.Fragment> 
              {/* .details-divider wird wiederverwendet */}
              <div className="details-divider"></div> 
              <h4>{selectedAncestry.name}</h4>
              {/* .traits-list wird wiederverwendet */}
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
            // Platzhalter
            <div className="ancestry-details-placeholder" style={{ margin: 'auto', textAlign: 'center' }}>
              <p>Wähle links eine Abstammung, um die Details anzuzeigen.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};