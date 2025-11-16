// src/components/character_creation/RangerFeatureSelection.js
import React from 'react';
import './PanelDetails.css';

// Optionen basierend auf classes.json (vereinfacht)
const FAVORED_ENEMY_OPTIONS = ["Tiere", "Feen", "Humanoide", "Monstrositäten", "Untote"];
const NATURAL_EXPLORER_OPTIONS = ["Arktis", "Küste", "Wüste", "Wald", "Grasland", "Gebirge", "Sumpf", "Unterreich"];

export const RangerFeatureSelection = ({ character, updateCharacter }) => {

  return (
    <div className="ranger-feature-selection">
      <div className="details-divider"></div>
      <h3>Bevorzugter Feind</h3>
      <select 
        className="panel-select" 
        value={character.favored_enemy || ""} 
        onChange={(e) => updateCharacter({ favored_enemy: e.target.value })}
      >
        <option value="" disabled>Wähle einen Feind...</option>
        {FAVORED_ENEMY_OPTIONS.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>

      <div className="details-divider"></div>
      <h3>Natürlicher Entdecker</h3>
      <select 
        className="panel-select" 
        value={character.natural_explorer || ""} 
        onChange={(e) => updateCharacter({ natural_explorer: e.target.value })}
      >
        <option value="" disabled>Wähle ein Gelände...</option>
        {NATURAL_EXPLORER_OPTIONS.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
};