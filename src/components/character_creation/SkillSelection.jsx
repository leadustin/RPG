// src/components/character_creation/SkillSelection.jsx
import React from 'react';
import { useTranslation } from 'react-i18next'; // +++ NEU +++
import './SkillSelection.css';
// import { SKILL_NAMES_DE } from '../../engine/characterEngine'; // <-- ENTFERNT
import Tooltip from '../tooltip/Tooltip';
import { SkillTooltip } from '../tooltip/SkillTooltip';
import skillDetails from '../../data/skillDetails.json';

// +++ VITE-ERSATZ FÜR BILDER (Bleibt gleich) +++
const skillImageModules = import.meta.glob(
  '../../assets/images/skills/*.(webp|png|jpe?g|svg)',
  { eager: true }
);

const skillIcons = {};
for (const path in skillImageModules) {
  const iconUrl = skillImageModules[path].default;
  const key = path.split('/').pop().replace(/\.(webp|png|jpe?g|svg)$/, '');
  skillIcons[key] = iconUrl;
}
// +++ ENDE VITE-ERSATZ +++

export const SkillSelection = ({ 
  options, 
  maxChoices, 
  selections = [], 
  setSelections,
  isOpen,       
  onToggle,     
  isCollapsible 
}) => {
  const { t } = useTranslation(); // +++ NEU: Hook nutzen +++
  const safeSelections = Array.isArray(selections) ? selections : [];

  const handleSelection = (skillKey) => {
    const currentSelections = [...safeSelections];
    if (currentSelections.includes(skillKey)) {
      setSelections(currentSelections.filter(s => s !== skillKey));
    } else if (currentSelections.length < maxChoices) {
      setSelections([...currentSelections, skillKey]);
    }
  };

  const renderSkillGrid = () => (
    <div className="skill-grid">
      {options.map((skillKey) => {
        // +++ FIX: Name jetzt aus der Übersetzung holen +++
        const skillName = t(`skills.${skillKey}`, skillKey); 
        const iconSrc = skillIcons[skillKey];
        const isSelected = safeSelections.includes(skillKey);
        const tooltipData = skillDetails[skillKey];

        return (
          <Tooltip
            key={skillKey}
            content={<SkillTooltip data={tooltipData} />}
          >
            <div
              className={`skill-choice ${isSelected ? 'selected' : ''}`}
              onClick={() => handleSelection(skillKey)}
            >
              {iconSrc ? (
                <img src={iconSrc} alt={skillName} className="skill-icon" />
              ) : (
                skillName.substring(0, 3).toUpperCase()
              )}
            </div>
          </Tooltip>
        );
      })}
    </div>
  );

  if (isCollapsible) {
    const headerClassName = `collapsible-header ${isOpen ? 'open' : ''}`;
    return (
      <div className="skill-selection-container">
        <h4 className={headerClassName} onClick={onToggle}>
          {t('skills.title', 'Fertigkeiten')} {safeSelections.length}/{maxChoices}
        </h4>
        {isOpen && renderSkillGrid()}
      </div>
    );
  }

  return (
    <div className="skill-selection-container">
      <h4>{t('skills.title', 'Fertigkeiten')} {safeSelections.length}/{maxChoices}</h4>
      <p className="panel-details-description">
        {t('characterCreation.chooseSkills', { count: maxChoices })}
      </p>
      {renderSkillGrid()}
    </div>
  );
};