// src/components/BackgroundSelection.js
import React from 'react';
import './BackgroundSelection.css';
import './PanelDetails.css';
import allBackgroundData from '../../data/backgrounds.json';

export const BackgroundSelection = ({ character, updateCharacter }) => {
  const selectedBackground = character.background;

  if (!selectedBackground) {
    return <div>Lade Hintergründe...</div>;
  }

  return (
    <div className="background-selection-container">
      {/* Linke Spalte: Liste aller Hintergründe */}
      <div className="background-list">
        {allBackgroundData.map(bg => (
          <button
            key={bg.key}
            className={`background-button ${selectedBackground.key === bg.key ? 'selected' : ''}`}
            onClick={() => updateCharacter({ background: bg })}
          >
            {bg.name}
          </button>
        ))}
      </div>

      {/* Rechte Spalte: Details zum ausgewählten Hintergrund */}
      <div className="background-details">
        <h2>{selectedBackground.name}</h2>
        <p className="background-description">{selectedBackground.description}</p>
        
        <div className="details-divider"></div>
        
        <h3>Fertigkeiten & Werkzeuge</h3>
        <ul className="features-list">
          <li><strong>Geübte Fertigkeiten:</strong> {selectedBackground.skill_proficiencies.join(', ')}</li>
          {selectedBackground.tool_proficiencies.length > 0 && (
            <li><strong>Geübte Werkzeuge:</strong> {selectedBackground.tool_proficiencies.join(', ')}</li>
          )}
          {selectedBackground.languages.length > 0 && (
            <li><strong>Sprachen:</strong> {selectedBackground.languages.join(', ')}</li>
          )}
        </ul>

        <div className="details-divider"></div>

        <h3>Merkmal: {selectedBackground.feature.name}</h3>
        <p className="background-description">{selectedBackground.feature.description}</p>
      </div>
    </div>
  );
};
