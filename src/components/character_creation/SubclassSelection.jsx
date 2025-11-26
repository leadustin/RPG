// src/components/character_creation/SubclassSelection.jsx
import React from 'react';
import './PanelDetails.css';
import './SkillSelection.css';
import Tooltip from '../tooltip/Tooltip'; 
import { SubclassTooltip } from '../tooltip/SubclassTooltip';
// Import der neuen Komponente
import { CreationInvocationSelection } from './CreationInvocationSelection';

// --- Icon Loader (wie gehabt) ---
function processIconModules(modules) {
  const icons = {};
  for (const path in modules) {
    const iconUrl = modules[path].default; 
    const key = path.split('/').pop().replace(/\.(webp|png|jpe?g|svg)$/, '');
    icons[key] = iconUrl;
  }
  return icons;
}
const domainIconModules = import.meta.glob('../../assets/images/domains/*.(webp|png|jpe?g|svg)', { eager: true });
const domainIcons = processIconModules(domainIconModules);
const patronIconModules = import.meta.glob('../../assets/images/patrons/*.(webp|png|jpe?g|svg)', { eager: true });
const patronIcons = processIconModules(patronIconModules);
const wizardSchoolIconModules = import.meta.glob('../../assets/images/schools/*.(webp|png|jpe?g|svg)', { eager: true });
const wizardSchoolIcons = processIconModules(wizardSchoolIconModules);
const originIconModules = import.meta.glob('../../assets/images/origins/*.(webp|png|jpe?g|svg)', { eager: true });
const originIcons = processIconModules(originIconModules);
// --- Ende Icon Loader ---

export const SubclassSelection = ({ character, updateCharacter }) => {
  const selectedClass = character.class;
  
  // 1. SPEZIAL-CHECK FÜR WARLOCK (PHB 2024)
  if (selectedClass.key === 'warlock') {
      // Statt Subklassen rendern wir hier die Invocation-Auswahl
      return <CreationInvocationSelection character={character} updateCharacter={updateCharacter} />;
  }

  // 2. NORMALE LOGIK FÜR ALLE ANDEREN KLASSEN
  const isCleric = selectedClass.key === 'cleric';
  const isWizard = selectedClass.key === 'wizard';
  const isSorcerer = selectedClass.key === 'sorcerer';

  // Filtert Unterklassen, die auf Level 1 verfügbar sind
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
        {selectedClass.features.find(
            f => (f.level === 1 && (f.name.includes("Ursprung") || f.name.includes("Domäne") || f.name.includes("Arkane Tradition")))
          )?.name || "Unterklasse wählen"
        }
      </h3>

      <div className="skill-grid"> 
        {level1Subclasses.map(sc => {
          let iconSrc = null;
          let subclassType = "Unterklasse";

          if (isCleric) {
            iconSrc = domainIcons[sc.key];
            subclassType = "Göttliche Domäne"; 
          } else if (isWizard) { 
            iconSrc = wizardSchoolIcons[sc.key];
            subclassType = "Arkane Tradition"; 
          } else if (isSorcerer) { 
            iconSrc = originIcons[sc.key]; 
            subclassType = "Zauberer-Ursprung"; 
          }

          return (
            <Tooltip key={sc.key} content={<SubclassTooltip data={sc} type={subclassType} />}>
              <button
                className={`skill-choice ${character.subclassKey === sc.key ? 'selected' : ''} ${iconSrc ? 'has-icon' : ''}`}
                onClick={() => handleSelect(sc.key)}
              >
                {iconSrc ? (
                  <img src={iconSrc} alt={sc.name} className="skill-icon" />
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