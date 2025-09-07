// src/components/SubraceSelection.js
import React from 'react';
import './SubraceSelection.css';
import './PanelDetails.css';

export const SubraceSelection = ({ character, updateCharacter }) => {
  const { race, subrace } = character;

  // Prüfen, ob Untervölker vorhanden sind
  if (!race?.subraces || race.subraces.length === 0) {
    return (
      <div className="subrace-container">
        <h2>Keine Untervölker</h2>
        <p>Das Volk '{race.name}' hat keine verfügbaren Untervölker.</p>
      </div>
    );
  }

  return (
    <div className="subrace-container">
      <h2>Wähle ein Untervolk für {race.name}</h2>
      <div className="subrace-options">
        {race.subraces.map(sub => (
          <button
            key={sub.key}
            className={`subrace-button ${subrace?.key === sub.key ? 'selected' : ''}`}
            onClick={() => updateCharacter({ subrace: sub })}
          >
            {sub.name}
          </button>
        ))}
      </div>
      
      {subrace && (
        <div className="subrace-details">
          <div className="details-divider"></div>
          <h3>{subrace.name}</h3>
          <p className="race-description">{subrace.description}</p>
          <ul className="features-list">
            {subrace.traits.map(trait => (
               <li key={trait.name}><strong>{trait.name}:</strong> {trait.description}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};