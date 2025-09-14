// src/components/AncestrySelection.js
import React from 'react';
import './SubraceSelection.css'; // Wir können die gleichen Stile wiederverwenden
import './PanelDetails.css';

export const AncestrySelection = ({ character, updateCharacter }) => {
  const { race, ancestry } = character;

  return (
    <div className="subrace-container">
      <h2>Wähle eine Abstammung für {race.name}</h2>
      <p>Deine Wahl bestimmt den Schadenstyp deiner Odemwaffe und deiner Schadensresistenz.</p>
      <div className="details-divider"></div>
      <div className="ancestry-grid">
        {race.ancestries.map(anc => (
          <button
            key={anc.key}
            className={`subrace-button ${ancestry?.key === anc.key ? 'selected' : ''}`}
            onClick={() => updateCharacter({ ancestry: anc })}
          >
            {anc.name}
          </button>
        ))}
      </div>
      
      {ancestry && (
        <div className="subrace-details">
          <div className="details-divider"></div>
          <h3>{ancestry.name} Drache</h3>
          <ul className="features-list">
            <li><strong>Schadensresistenz:</strong> {ancestry.damage_type}</li>
            <li><strong>Odemwaffe:</strong> {ancestry.breath_weapon}</li>
          </ul>
        </div>
      )}
    </div>
  );
};
