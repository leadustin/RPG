// src/components/character_creation/SubclassSelection.js
import React from 'react';
import './PanelDetails.css'; // Wiederverwendung der Stile
import './SkillSelection.css'; // Wiederverwendung für das Grid-Layout
import Tooltip from '../tooltip/Tooltip'; 
// Importiere deine angepasste Tooltip-Komponente
import { SubclassTooltip } from '../tooltip/SubclassTooltip';

// +++ importAll-Funktion (zum Laden von Bild-Ordnern) +++
function importAll(r) {
  let images = {};
  r.keys().forEach((item) => {
    // Extrahiert den Dateinamen ohne Endung als Key
    const key = item.replace('./', '').replace(/\.(webp|png|jpe?g|svg)$/, '');
    images[key] = r(item);
  });
  return images;
}

// +++ Domänen-Icons laden (Kleriker) +++
const domainIcons = importAll(require.context(
  '../../assets/images/domains', // Pfad zu den Domänen-Icons
  false,
  /\.(webp|png|jpe?g|svg)$/
));

// +++ Schutzpatron-Icons laden (Hexenmeister) +++
let patronIcons = {};
try {
  patronIcons = importAll(require.context(
    '../../assets/images/patrons', // Pfad zu den Schutzpatron-Icons
    false,
    /\.(webp|png|jpe?g|svg)$/
  ));
} catch (e) {
  console.warn("Konnte Hexenmeister-Schutzpatron-Icons nicht laden. (Verzeichnis 'src/assets/images/patrons' fehlt?)");
}

// +++ Arkane Tradition-Icons laden (Magier / Wizard) +++
let wizardSchoolIcons = {};
try {
  wizardSchoolIcons = importAll(require.context(
    '../../assets/images/schools', // Pfad zu den Zauberschulen-Icons
    false,
    /\.(webp|png|jpe?g|svg)$/
  ));
} catch (e) {
  console.warn("Konnte Magier-Arkane Tradition-Icons nicht laden. (Verzeichnis 'src/assets/images/schools' fehlt?)");
}

// +++ Zauberer-Ursprung-Icons laden (Zauberer / Sorcerer) +++
let originIcons = {};
try {
  originIcons = importAll(require.context(
    '../../assets/images/origins', // Pfad zu den Ursprung-Icons
    false,
    /\.(webp|png|jpe?g|svg)$/
  ));
} catch (e) {
  console.warn("Konnte Zauberer-Ursprung-Icons nicht laden. (Verzeichnis 'src/assets/images/origins' fehlt?)");
}


export const SubclassSelection = ({ character, updateCharacter }) => {
  const selectedClass = character.class;
  const isCleric = selectedClass.key === 'cleric';
  const isWarlock = selectedClass.key === 'warlock';
  const isWizard = selectedClass.key === 'wizard'; // Magier
  const isSorcerer = selectedClass.key === 'sorcerer'; // Zauberer

  // Filtert Unterklassen, die auf Level 1 ein Feature haben
  const level1Subclasses = selectedClass.subclasses.filter(sc =>
    sc.features.some(f => f.level === 1)
  );

  // Wenn keine Level-1-Unterklasse, Komponente nicht anzeigen
  if (level1Subclasses.length === 0) {
    return null; 
  }

  // Setzt den subclassKey im Charakter-Objekt
  const handleSelect = (subclassKey) => {
    const subClassData = selectedClass.subclasses.find(sc => sc.key === subclassKey);
    updateCharacter({ subclassKey: subClassData.key });
  };

  return (
    <div className="subclass-selection">
      <div className="details-divider"></div>
      <h3>
        {
          // Findet den Namen des Features (z.B. "Göttliche Domäne")
          selectedClass.features.find(
            f =>
              (f.level === 1 &&
                (f.name.includes("Ursprung") ||
                 f.name.includes("Domäne") ||
                 f.name.includes("Schutzpatron") ||
                 f.name.includes("Arkane Tradition")))
          )?.name || "Unterklasse wählen"
        }
      </h3>

      <div className="skill-grid"> 
        {level1Subclasses.map(sc => {
          
          let iconSrc = null;
          let subclassType = "Unterklasse"; // Standard-Fallback für Tooltip

          // Weist Icon und Tooltip-Typ basierend auf der Klasse zu
          if (isCleric) {
            iconSrc = domainIcons[sc.key];
            subclassType = "Göttliche Domäne"; 
          } else if (isWarlock) {
            iconSrc = patronIcons[sc.key]; 
            subclassType = "Außerweltlicher Schutzpatron"; 
          } else if (isWizard) { 
            iconSrc = wizardSchoolIcons[sc.key];
            subclassType = "Arkane Tradition"; 
          } else if (isSorcerer) { 
            iconSrc = originIcons[sc.key]; 
            subclassType = "Zauberer-Ursprung"; 
          }

          return (
            <Tooltip 
              key={sc.key} 
              // Übergibt die Daten an die SubclassTooltip-Komponente
              content={<SubclassTooltip data={sc} type={subclassType} />}
            >
              <button
                className={`skill-choice ${character.subclassKey === sc.key ? 'selected' : ''} ${iconSrc ? 'has-icon' : ''}`}
                onClick={() => handleSelect(sc.key)}
              >
                
                {/* Zeigt Icon ODER Text-Namen an */}
                {(isCleric || isWarlock || isWizard || isSorcerer) && iconSrc ? (
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
    </div>
  );
};