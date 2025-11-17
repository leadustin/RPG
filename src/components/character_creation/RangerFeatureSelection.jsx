// src/components/character_creation/RangerFeatureSelection.jsx
import React from 'react';
import './PanelDetails.css'; // Benötigt für .panel-details-description
import './RangerFeatureSelection.css'; // Benötigt für .feature-block-container und .feature-block

export const RangerFeatureSelection = ({ character, updateCharacter }) => {
  const classData = character.class;

  if (!classData || !classData.features) {
    return null; 
  }

  // Finde die Feature-Daten dynamisch aus classes.json
  const favoredEnemyData = classData.features.find(f => f.name === "Bevorzugter Feind");
  const naturalExplorerData = classData.features.find(f => f.name === "Natürlicher Entdecker");

  if (!favoredEnemyData || !naturalExplorerData) {
    return null;
  }

  // Hole die Optionen aus dem 'choices'-Block
  const favoredEnemyOptions = favoredEnemyData.choices?.from || [];
  const naturalExplorerOptions = naturalExplorerData.choices?.from || [];

  return (
    <div className="ranger-feature-selection">
      

      {/* Dieser Container legt die beiden Boxen nebeneinander */}
      <div className="feature-block-container">

        {/* Box 1: Bevorzugter Feind (entspricht dem Stil im Bild) */}
        <div className="feature-block">
          <h3>{favoredEnemyData.name}</h3>
          <p className="panel-details-description">
            {favoredEnemyData.description}
          </p>
          <select 
            className="panel-select" 
            value={character.favored_enemy || ""} 
            onChange={(e) => updateCharacter({ favored_enemy: e.target.value })}
          >
            <option value="" disabled>Wähle einen Feind...</option>
            {favoredEnemyOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>

        {/* Box 2: Natürlicher Entdecker (entspricht dem Stil im Bild) */}
        <div className="feature-block">
          <h3>{naturalExplorerData.name}</h3>
          <p className="panel-details-description">
            {naturalExplorerData.description}
          </p>
          <select 
            className="panel-select" 
            value={character.natural_explorer || ""} 
            onChange={(e) => updateCharacter({ natural_explorer: e.target.value })}
          >
            <option value="" disabled>Wähle ein Gelände...</option>
            {naturalExplorerOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
        
      </div> {/* Ende feature-block-container */}
    </div>
  );
};