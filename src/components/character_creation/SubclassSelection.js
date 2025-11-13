// src/components/character_creation/SubclassSelection.js
import React from 'react';
import './PanelDetails.css'; // Wiederverwendung der Stile
import './SkillSelection.css'; // Wiederverwendung für das Grid-Layout

// +++ importAll-Funktion (exakt wie in ToolInstrumentSelection) +++
function importAll(r) {
  let images = {};
  r.keys().forEach((item) => {
    // Extrahiert den Dateinamen ohne Endung als Key
    // z.B. './life_domain.png' -> 'life_domain'
    const key = item.replace('./', '').replace(/\.(webp|png|jpe?g|svg)$/, '');
    images[key] = r(item);
  });
  return images;
}

// +++ Domänen-Icons laden +++
const domainIcons = importAll(require.context(
  '../../assets/images/domains', // Pfad von dieser Datei zu den Domänen-Icons
  false,
  /\.(webp|png|jpe?g|svg)$/
));


export const SubclassSelection = ({ character, updateCharacter }) => {
  const selectedClass = character.class;
  const isCleric = selectedClass.key === 'cleric';

  const level1Subclasses = selectedClass.subclasses.filter(sc =>
    sc.features.some(f => f.level === 1)
  );

  if (level1Subclasses.length === 0) {
    return null; 
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

      <div className="skill-grid"> 
        {level1Subclasses.map(sc => {
          
          const iconSrc = isCleric ? domainIcons[sc.key] : null;

          return (
            <button
              key={sc.key}
              className={`skill-choice ${character.subclassKey === sc.key ? 'selected' : ''} ${iconSrc ? 'has-icon' : ''}`}
              onClick={() => handleSelect(sc.key)}
              
              // +++ NEU: 'title' hinzufügen (wie in ToolInstrumentSelection) +++
              title={sc.name} 
            >
              
              {/* --- ANGEPASSTE RENDER-LOGIK --- */}
              {/* WENN Kleriker UND Icon existiert, DANN zeige Icon, SONST zeige Text */}
              {isCleric && iconSrc ? (
                <img 
                  src={iconSrc} 
                  alt={sc.name} // Alt-Text für Barrierefreiheit
                  className="skill-icon" // Die CSS-Klasse, die schon funktioniert
                />
              ) : (
                <span>{sc.name}</span>
              )}
              {/* --- ENDE ANPASSUNG --- */}

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