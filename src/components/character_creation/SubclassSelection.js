// src/components/character_creation/SubclassSelection.js
import React from 'react';
import './PanelDetails.css'; // Wiederverwendung der Stile
import './SkillSelection.css'; // Wiederverwendung für das Grid-Layout

export const SubclassSelection = ({ character, updateCharacter }) => {
  const selectedClass = character.class;
  const level1Subclasses = selectedClass.subclasses.filter(sc =>
    sc.features.some(f => f.level === 1)
  );

  if (level1Subclasses.length === 0) {
    return null; // Sollte nicht passieren, wenn es auf Lvl 1 aufgerufen wird
  }

  const handleSelect = (subclassKey) => {
    const subClassData = selectedClass.subclasses.find(sc => sc.key === subclassKey);
    updateCharacter({ subclassKey: subClassData.key });
  };

  return (
    <div className="subclass-selection">
      <div className="details-divider"></div>
      <h3>
        {
          selectedClass.features.find(
            f =>
              (f.level === 1 &&
                (f.name.includes("Ursprung") ||
                 f.name.includes("Domäne") ||
                 f.name.includes("Schutzpatron")))
          )?.name || "Unterklasse wählen"
        }
      </h3>

      {/* Verwendet .skill-grid und .skill-choice aus SkillSelection.css */}
      <div className="skill-grid"> 
        {level1Subclasses.map(sc => (
          <button
            key={sc.key}
            className={`skill-choice ${character.subclassKey === sc.key ? 'selected' : ''}`}
            onClick={() => handleSelect(sc.key)}
          >
            <span>{sc.name}</span>
          </button>
        ))}
      </div>

      {character.subclassKey && (
        <p className="panel-details-description">
          {level1Subclasses.find(sc => sc.key === character.subclassKey)?.description}
        </p>
      )}
    </div>
  );
};