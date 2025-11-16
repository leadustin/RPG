// src/components/character_creation/SubclassSelection.jsx
import React from 'react';
import './PanelDetails.css';
import './SkillSelection.css';
import Tooltip from '../tooltip/Tooltip'; 
// Importiere deine angepasste Tooltip-Komponente
import { SubclassTooltip } from '../tooltip/SubclassTooltip';

// +++
// +++ VITE-ERSATZ für require.context +++
// +++

// Helper-Funktion, um das Ergebnis von import.meta.glob zu verarbeiten
function processIconModules(modules) {
  const icons = {};
  for (const path in modules) {
    const iconUrl = modules[path].default; // 'default' ist die URL
    const key = path
      .split('/')
      .pop() // Dateiname.ext
      .replace(/\.(webp|png|jpe?g|svg)$/, ''); // Dateiname
    icons[key] = iconUrl;
  }
  return icons;
}

// +++ Domänen-Icons laden (Kleriker) +++
// WICHTIG: Die Pfade MÜSSEN statisch sein für import.meta.glob
const domainIconModules = import.meta.glob(
  '../../assets/images/domains/*.(webp|png|jpe?g|svg)',
  { eager: true } // 'eager: true' lädt alle Bilder sofort
);
const domainIcons = processIconModules(domainIconModules);


// +++ Schutzpatron-Icons laden (Hexenmeister) +++
const patronIconModules = import.meta.glob(
  '../../assets/images/patrons/*.(webp|png|jpe?g|svg)',
  { eager: true }
);
const patronIcons = processIconModules(patronIconModules);


// +++ Arkane Tradition-Icons laden (Magier / Wizard) +++
const wizardSchoolIconModules = import.meta.glob(
  '../../assets/images/schools/*.(webp|png|jpe?g|svg)',
  { eager: true }
);
const wizardSchoolIcons = processIconModules(wizardSchoolIconModules);


// +++ Zauberer-Ursprung-Icons laden (Zauberer / Sorcerer) +++
const originIconModules = import.meta.glob(
  '../../assets/images/origins/*.(webp|png|jpe?g|svg)',
  { eager: true }
);
const originIcons = processIconModules(originIconModules);

// +++ 
// +++ ENDE VITE-ERSATZ +++
// +++


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