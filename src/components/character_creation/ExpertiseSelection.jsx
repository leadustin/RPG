// src/components/character_creation/ExpertiseSelection.jsx
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next'; // +++ NEU +++
// import { SKILL_NAMES_DE } from '../../engine/characterEngine'; // <-- ENTFERNT
import './PanelDetails.css';
import './SkillSelection.css';

import Tooltip from '../tooltip/Tooltip';
import { SkillTooltip } from '../tooltip/SkillTooltip';
import skillDetails from '../../data/skillDetails.json';

// +++ VITE-ERSATZ (Bleibt gleich) +++
function processIconModules(modules) {
  const icons = {};
  for (const path in modules) {
    const iconUrl = modules[path].default;
    const key = path.split('/').pop().replace(/\.(webp|png|jpe?g|svg)$/, '');
    icons[key] = iconUrl;
  }
  return icons;
}

const skillIconModules = import.meta.glob('../../assets/images/skills/*.(webp|png|jpe?g|svg)', { eager: true });
const skillIcons = processIconModules(skillIconModules);

const proficiencyIconModules = import.meta.glob('../../assets/images/proficiencies/*.(webp|png|jpe?g|svg)', { eager: true });
const proficiencyIcons = processIconModules(proficiencyIconModules);
// +++ ENDE VITE-ERSATZ +++


export const ExpertiseSelection = ({ character, updateCharacter }) => {
  const { t } = useTranslation(); // +++ NEU +++
  const maxChoices = 2; 

  const proficientSkills = useMemo(() => {
    return character.skill_proficiencies_choice || [];
  }, [character.skill_proficiencies_choice]);

  const allOptions = [
    ...proficientSkills,
    "thieves_tools"
  ];
  
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
        Wähle {maxChoices} Fertigkeiten (oder Diebeswerkzeug). Dein Übungsbonus wird verdoppelt.
      </p>

      <div className="skill-grid"> 
        {allOptions.map(key => {
          const isSelected = selections.includes(key);
          
          // +++ FIX: Namen dynamisch ermitteln +++
          let displayName = "";
          let iconSrc = null;
          let tooltipContent = null;
          
          if (key === "thieves_tools") {
            displayName = "Diebeswerkzeug"; // oder t('items.thieves_tools')
            iconSrc = proficiencyIcons["Diebeswerkzeug"] || proficiencyIcons["thieves_tools"];
            
            tooltipContent = (
              <>
                <h4 className="item-name">Diebeswerkzeug</h4>
                <div className="item-type">Werkzeug</div>
                <p className="item-description">
                  Erlaubt das Knacken von Schlössern und Entschärfen von Fallen.
                </p>
              </>
            );
          } else {
            // Übersetzung via i18n
            displayName = t(`skills.${key}`, key);
            iconSrc = skillIcons[key];
            
            const tooltipData = skillDetails[key];
            tooltipContent = <SkillTooltip data={tooltipData} />;
          }
          // +++ ENDE FIX +++

          return (
            <Tooltip key={key} content={tooltipContent}>
              <button
                className={`skill-choice ${isSelected ? 'selected' : ''}`}
                onClick={() => handleToggle(key)}
              >
                {iconSrc ? (
                  <img src={iconSrc} alt={displayName} className="skill-icon" />
                ) : (
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