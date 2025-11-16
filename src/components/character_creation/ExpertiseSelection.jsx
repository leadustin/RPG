// src/components/character_creation/ExpertiseSelection.jsx
import React, { useMemo } from 'react';
import { SKILL_NAMES_DE } from '../../engine/characterEngine';
import './PanelDetails.css';
import './SkillSelection.css';

// +++ NEU: Tooltip-Komponenten importieren +++
import Tooltip from '../tooltip/Tooltip';
import { SkillTooltip } from '../tooltip/SkillTooltip';

// +++ NEU: Skill-Details importieren +++
import skillDetails from '../../data/skillDetails.json';

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

// +++ Icons für Skills laden +++
const skillIconModules = import.meta.glob(
  '../../assets/images/skills/*.(webp|png|jpe?g|svg)',
  { eager: true }
);
const skillIcons = processIconModules(skillIconModules);

// +++ Icon für Proficiencies (Diebeswerkzeug) laden +++
const proficiencyIconModules = import.meta.glob(
  '../../assets/images/proficiencies/*.(webp|png|jpe?g|svg)',
  { eager: true }
);
const proficiencyIcons = processIconModules(proficiencyIconModules);

// +++ 
// +++ ENDE VITE-ERSATZ +++
// +++

export const ExpertiseSelection = ({ character, updateCharacter }) => {
  const maxChoices = 2; // Schurken wählen 2 Expertisen auf Lvl 1

  // Die Liste darf NUR Fertigkeiten anzeigen, die in der SkillSelection (Wähle 4)
  // ausgewählt wurden. (Diese werden in 'character.skill_proficiencies_choice' gespeichert)
  const proficientSkills = useMemo(() => {
    return character.skill_proficiencies_choice || [];
  }, [character.skill_proficiencies_choice]);

  // Füge Diebeswerkzeug hinzu (Schurken sind immer darin geübt)
  const allOptions = [
    ...proficientSkills,
    "thieves_tools" // Ein spezieller Schlüssel für Diebeswerkzeug
  ];
  
  const optionNames = {
    ...SKILL_NAMES_DE,
    "thieves_tools": "Diebeswerkzeug"
  };

  const selections = character.expertise_choices || [];

  const handleToggle = (key) => {
    let newSelection = [...selections];
    if (newSelection.includes(key)) {
      newSelection = newSelection.filter(s => s !== key);
    } else if (newSelection.length < maxChoices) {
      newSelection.push(key);
    }
    updateCharacter({ expertise_choices: newSelection });
  };

  return (
    <div className="expertise-selection">
      <div className="details-divider"></div>
      <h3>Expertise {selections.length}/{maxChoices}</h3>
      <p className="panel-details-description">
        Wähle {maxChoices} deiner geübten Fertigkeiten (oder Diebeswerkzeug). Dein Übungsbonus wird für diese verdoppelt.
      </p>

      <div className="skill-grid"> 
        {allOptions.map(key => {
          const isSelected = selections.includes(key);
          const displayName = optionNames[key];
          
          // +++ NEU: Icon-Logik +++
          let iconSrc = null;
          let tooltipContent = null;
          
          if (key === "thieves_tools") {
            // Diebeswerkzeug verwendet proficiencyIcons
            // HINWEIS: Stelle sicher, dass dein Icon 'Diebeswerkzeug.png' o.ä. heißt
            iconSrc = proficiencyIcons["Diebeswerkzeug"]; 
            
            // Eigener Tooltip für Diebeswerkzeug
            tooltipContent = (
              <>
                <h4 className="item-name">Diebeswerkzeug</h4>
                <div className="item-type">Werkzeug</div>
                <p className="item-description">
                  Diebeswerkzeug beinhaltet eine kleine Feile, einen Satz Dietriche, 
                  einen kleinen Spiegel auf einem Metallgriff, eine Schere und ein Paar 
                  Zangen. Geübtheit mit Diebeswerkzeug erlaubt es dir, Schlösser zu knacken 
                  und Fallen zu entschärfen.
                </p>
              </>
            );
          } else {
            // Normale Fertigkeiten verwenden skillIcons
            iconSrc = skillIcons[key];
            
            // Tooltip aus skillDetails.json
            const tooltipData = skillDetails[key];
            tooltipContent = <SkillTooltip data={tooltipData} />;
          }
          // +++ ENDE Icon-Logik +++

          return (
            <Tooltip
              key={key}
              content={tooltipContent}
            >
              <button
                className={`skill-choice ${isSelected ? 'selected' : ''}`}
                onClick={() => handleToggle(key)}
              >
                {iconSrc ? (
                  <img 
                    src={iconSrc} 
                    alt={displayName}
                    className="skill-icon" 
                  />
                ) : (
                  // Fallback: Zeige Initialen
                  displayName.substring(0, 3).toUpperCase()
                )}
              </button>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
};