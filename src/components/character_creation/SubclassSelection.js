// src/components/character_creation/SubclassSelection.js
import React from 'react';
import './PanelDetails.css'; // Wiederverwendung der Stile
import './SkillSelection.css'; // Wiederverwendung für das Grid-Layout
// +++ KORREKTUR: Import von 'default' export (ohne Klammern) +++
import Tooltip from '../tooltip/Tooltip'; 

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

// +++ Schutzpatron-Icons laden +++
let patronIcons = {};
try {
  patronIcons = importAll(require.context(
    '../../assets/images/patrons', // ANNNAHME: Pfad zu den Schutzpatron-Icons
    false,
    /\.(webp|png|jpe?g|svg)$/
  ));
} catch (e) {
  console.warn("Konnte Hexenmeister-Schutzpatron-Icons nicht laden. (Verzeichnis 'src/assets/images/patrons' fehlt?)");
  // patronIcons bleibt ein leeres Objekt, die Anzeige fällt auf Text zurück.
}


export const SubclassSelection = ({ character, updateCharacter }) => {
  const selectedClass = character.class;
  const isCleric = selectedClass.key === 'cleric';
  const isWarlock = selectedClass.key === 'warlock';

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
          
          let iconSrc = null;
          if (isCleric) {
            iconSrc = domainIcons[sc.key];
          } else if (isWarlock) {
            iconSrc = patronIcons[sc.key]; 
          }

          return (
            // Button ist jetzt mit Tooltip umschlossen
            <Tooltip key={sc.key} text={sc.description}>
              <button
                className={`skill-choice ${character.subclassKey === sc.key ? 'selected' : ''} ${iconSrc ? 'has-icon' : ''}`}
                onClick={() => handleSelect(sc.key)}
              >
                
                {(isCleric || isWarlock) && iconSrc ? (
                  <img 
                    src={iconSrc} 
                    alt={sc.name} 
                    className="skill-icon"
                  />
                ) : (
                  <span>{sc.name}</span>
                )}

              </button>
            </Tooltip>
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