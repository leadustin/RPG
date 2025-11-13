// src/components/character_creation/SubclassSelection.js
import React from 'react';
import './PanelDetails.css'; // Wiederverwendung der Stile
import './SkillSelection.css'; // Wiederverwendung für das Grid-Layout

// +++ NEU: importAll-Funktion (exakt wie in ToolInstrumentSelection) +++
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

// +++ NEU: Domänen-Icons laden +++
// Wir sagen Webpack, es soll alle Bilder aus dem 'domains'-Ordner laden.
const domainIcons = importAll(require.context(
  '../../assets/images/domains', // Pfad von dieser Datei zu den Domänen-Icons
  false,
  /\.(webp|png|jpe?g|svg)$/
));
// +++ ENDE NEU +++


export const SubclassSelection = ({ character, updateCharacter }) => {
  const selectedClass = character.class;
  
  // HINZUGEFÜGT: Prüfen, ob es sich um den Kleriker handelt
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
          
          // +++ NEU: Icon-Logik basierend auf require.context +++
          // Wir holen das Icon aus unserem geladenen 'domainIcons'-Objekt.
          // sc.key ist z.B. "life_domain"
          const iconSrc = isCleric ? domainIcons[sc.key] : null;
          // +++ ENDE NEU +++

          return (
            <button
              key={sc.key}
              // MODIFIZIERT: Fügt 'has-icon' hinzu, wenn ein Icon vorhanden ist
              className={`skill-choice ${character.subclassKey === sc.key ? 'selected' : ''} ${iconSrc ? 'has-icon' : ''}`}
              onClick={() => handleSelect(sc.key)}
            >
              {/* --- MODIFIZIERTER INHALT --- */}
              {/* Zeigt das Icon an, WENN es Kleriker ist UND das Icon existiert */}
              {isCleric && iconSrc && (
                <img 
                  src={iconSrc} 
                  alt="" // Alt-Text ist optional, da der Name daneben steht
                  className="skill-icon" // Eigene Klasse, um die Größe zu steuern
                />
              )}
              {/* Der Name wird immer angezeigt */}
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