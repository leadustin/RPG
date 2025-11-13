// src/components/character_creation/SubclassSelection.js
import React from 'react';
import './PanelDetails.css'; // Wiederverwendung der Stile
import './SkillSelection.css'; // Wiederverwendung für das Grid-Layout

export const SubclassSelection = ({ character, updateCharacter }) => {
  const selectedClass = character.class;
  
  // NEU: Überprüfen, ob es sich um den Kleriker handelt
  const isCleric = selectedClass.key === 'cleric';

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
        {level1Subclasses.map(sc => {
          
          // --- NEUER BLOCK FÜR ICON-LOGIK ---
          let iconSrc = null;
          if (isCleric) {
            try {
              // Dynamischer Import basierend auf dem 'key' der Unterklasse
              // Der Pfad ist relativ zu SubclassSelection.js
              iconSrc = require(`../../assets/images/domains/${sc.key}.png`);
            } catch (e) {
              // Fallback, falls ein Icon fehlt
              console.warn(`Icon für Domäne ${sc.key} nicht gefunden.`);
            }
          }
          // --- ENDE NEUER BLOCK ---

          return (
            <button
              key={sc.key}
              // MODIFIZIERT: Fügt 'has-icon' Klasse hinzu, wenn ein Icon vorhanden ist
              className={`skill-choice ${character.subclassKey === sc.key ? 'selected' : ''} ${iconSrc ? 'has-icon' : ''}`}
              onClick={() => handleSelect(sc.key)}
            >
              {/* --- MODIFIZIERTER INHALT --- */}
              {isCleric && iconSrc && (
                <img 
                  src={iconSrc} 
                  alt="" // Dekorativ, da der Name daneben steht
                  className="subclass-icon" 
                />
              )}
              <span>{sc.name}</span>
              {/* --- ENDE MODIFIKATION --- */}
            </button>
          );
        })}
      </div>

      {character.subclassKey && (
        <p className="panel-details-description">
          {level1Subclasses.find(sc => sc.key === character.subclassKey)?.description}
        </p>
      )}
    </div>
  );
};