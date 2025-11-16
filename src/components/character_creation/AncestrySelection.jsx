// src/components/character_creation/AncestrySelection.jsx
import React from 'react';
import './PanelDetails.css'; 
import './AncestrySelection.css'; 

export const AncestrySelection = ({ ancestries, selectedAncestry, onAncestrySelect }) => {

  if (!ancestries || ancestries.length === 0) {
    return <div className="panel-details">Für dieses Volk sind keine Abstammungen verfügbar.</div>;
  }

  return (
    <div className="ancestry-grid-layout"> 
      
      {/* --- LINKE SPALTE (Liste) --- */}
      <div className="ancestry-column-list">
        <div className="ancestry-box">
          <h3>Abstammung wählen</h3>
          <p className="panel-details-description">
            Wähle die Abstammung deines Drachenblütigen. Dies bestimmt deinen Odem-Angriff und deine Schadensresistenz.
          </p>
          
          {/* KLASSE GEÄNDERT */}
          <div className="ancestry-button-grid">
            {ancestries.map((ancestry) => (
              <button
                key={ancestry.key}
                /* KLASSE GEÄNDERT */
                className={`ancestry-button ${
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
        <div className="ancestry-box">
          {selectedAncestry ? (
            <React.Fragment> 
              <div className="details-divider"></div> 
              <h4>{selectedAncestry.name}</h4>
              <ul className="traits-list">
                <li>
                  <strong>Schadensresistenz:</strong> {selectedAncestry.damage_resistance_type}
                </li>
                <li>
                  <strong>Odemwaffe:</strong> {selectedAncestry.breath_weapon_description || 'Beschreibung der Odemwaffe...'}
                </li>
              </ul>
            </React.Fragment>
          ) : (
            <div className="ancestry-details-placeholder" style={{ margin: 'auto', textAlign: 'center' }}>
              <p>Wähle links eine Abstammung, um die Details anzuzeigen.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};