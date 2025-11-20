// src/components/character_creation/ClassSelection.jsx
import React, { useState, useEffect } from 'react'; // useEffect hinzugefügt
import './ClassSelection.css';
import './PanelDetails.css';
import allClassData from '../../data/classes.json';
import { SkillSelection } from './SkillSelection';
import { useTranslation } from "react-i18next";
import { SKILL_MAP } from '../../engine/characterEngine';

// +++ IMPORTS (Bleiben gleich) +++
import { SubclassSelection } from './SubclassSelection';
import { FightingStyleSelection } from './FightingStyleSelection';
import { SpellSelection } from './SpellSelection';
import { ExpertiseSelection } from './ExpertiseSelection';
import { RangerFeatureSelection } from './RangerFeatureSelection';
import { ToolInstrumentSelection } from './ToolInstrumentSelection';
import { WeaponMasterySelection } from './WeaponMasterySelection';


// 1. Lade alle Bildmodule aus dem 'classes'-Ordner
const classIconModules = import.meta.glob(
  '../../assets/images/classes/*.(webp|png|jpe?g|svg)',
  { eager: true } 
);

// 2. Verarbeite die Module
const classIcons = {};
for (const path in classIconModules) {
  const iconUrl = classIconModules[path].default; 
  const key = path.split('/').pop(); 
  classIcons[key] = iconUrl;
}

export const ClassSelection = ({ character, updateCharacter }) => {
  const { t } = useTranslation();
  const selectedClass = character.class;

  // +++ NEU: Initialisierungs-Logik +++
  useEffect(() => {
    if (!selectedClass && allClassData.length > 0) {
      // Wähle die erste Klasse aus, um leeren State zu vermeiden
      // (Wir nutzen setTimeout, um Update-Zyklus-Probleme zu vermeiden)
      setTimeout(() => {
          updateCharacter({ 
              class: allClassData[0],
              // Reset aller Auswahlen für sauberen Start
              skill_proficiencies_choice: [],
              subclassKey: null,
              cantrips_known: [],
              spells_known: [],
              spells_prepared: [],
              spellbook: [],
              fighting_style: null,
              favored_enemy: null,
              natural_explorer: null,
              expertise_choices: [],
              class_tool_choice: null,
              tool_proficiencies_choice: [],
              weapon_mastery_choices: [], 
          });
      }, 0);
    }
  }, [selectedClass, updateCharacter]); // Abhängigkeiten
  // +++ ENDE NEU +++

  
  // State für Panels
  const [openPanels, setOpenPanels] = useState(['skills', 'cantrips']);

  const handlePanelToggle = (panelKey) => {
    setOpenPanels(currentPanels => {
      if (currentPanels.includes(panelKey)) {
        return currentPanels.filter(p => p !== panelKey);
      }
      if (panelKey === 'spells') {
        return ['spells']; 
      }
      return [...currentPanels.filter(p => p !== 'spells'), panelKey];
    });
  };
  
  const handleSkillChange = (newSelections) => {
    updateCharacter({ skill_proficiencies_choice: newSelections });
  };

  // Wenn immer noch keine Klasse da ist (z.B. beim allerersten Render), zeige Loading
  if (!selectedClass) {
    return <div className="loading-text">{t('common.loadingClasses')}</div>;
  }

  // +++ SAFETY FIX: skillChoiceData +++
  // Sicherer Zugriff auf proficiencies
  const skillChoiceData = selectedClass.proficiencies?.skills;

  let skillOptions = [];
  if (skillChoiceData && skillChoiceData.from) {
    const allSkillKeys = Object.keys(SKILL_MAP);
    
    if (skillChoiceData.from === 'any') {
      skillOptions = allSkillKeys;
    } 
    else if (Array.isArray(skillChoiceData.from)) {
      skillOptions = skillChoiceData.from;
    }
  }
  // +++ ENDE FIX +++

  // +++ HELFER-VARIABLEN +++
  const classKey = selectedClass.key;
  const isWizard = classKey === 'wizard';
  
  const showSubclassChoice = (
    classKey === 'cleric' || 
    classKey === 'sorcerer' || 
    classKey === 'warlock'
  );

  const showLvl1FightingStyle = (classKey === 'fighter');

  const showSpellChoice = (
    selectedClass.spellcasting && 
    (classKey === 'wizard' || classKey === 'sorcerer' || classKey === 'bard' || classKey === 'warlock' || classKey === 'cleric' || classKey === 'druid')
  );

  const showExpertiseChoice = (classKey === 'rogue');
  const showRangerFeatures = (classKey === 'ranger');
  const showToolInstrumentChoice = (classKey === 'bard' || classKey === 'monk');
  const showWeaponMastery = (selectedClass.weapon_mastery !== undefined); 


  return (
    <div className="class-selection-container">
      {/* --- Klassenauswahl-Grid --- */}
      <div className="class-grid class-summary-box">
        {allClassData.map(cls => (
          <button 
            key={cls.key} 
            onClick={() => updateCharacter({ 
                class: cls, 
                // Reset aller Auswahlen bei Wechsel
                skill_proficiencies_choice: [],
                subclassKey: null,
                cantrips_known: [],
                spells_known: [],
                spells_prepared: [],
                spellbook: [],
                fighting_style: null,
                favored_enemy: null,
                natural_explorer: null,
                expertise_choices: [],
                class_tool_choice: null,
                tool_proficiencies_choice: [],
                weapon_mastery_choices: [], 
            })}
            className={`class-button ${selectedClass.key === cls.key ? 'selected' : ''}`}
          >
            {classIcons[cls.icon] && (
              <img 
                src={classIcons[cls.icon]} 
                alt={t('classSelection.classIconAlt', { className: cls.name })}
                className="class-icon"
              />
            )}
            <span>{cls.name}</span>
          </button>
        ))}
      </div>

      {/* --- Klassendetails --- */}
      <div className="class-details class-summary-box">
        <p className="class-description">{selectedClass.description}</p>
        <div className="details-divider"></div>
        <h3>{t("classSelection.classCharacteristics")}</h3>
        <ul className="features-list">
          {selectedClass.features
            .filter(feature => feature.level === 1)
            .filter(feature => {
              // Filter für Ranger-UI
              if (classKey === 'ranger' && (
                feature.name === 'Bevorzugter Feind' || 
                feature.name === 'Natürlicher Entdecker'
              )) {
                return false;
              }
              return true;
            })
            .map(feature => (
              <li key={feature.name}>
                <strong>{feature.name}:</strong> {feature.description}
              </li>
            ))
          }
        </ul>
        
        {/* === Bedingte Auswahlmöglichkeiten === */}

        {showSubclassChoice && (
          <SubclassSelection character={character} updateCharacter={updateCharacter} />
        )}

        {showLvl1FightingStyle && (
          <FightingStyleSelection character={character} updateCharacter={updateCharacter} />
        )}

        {showRangerFeatures && (
          <RangerFeatureSelection character={character} updateCharacter={updateCharacter} />
        )}
        
        {showWeaponMastery && (
          <WeaponMasterySelection character={character} updateCharacter={updateCharacter} />
        )}
        
        {skillChoiceData && (
          <SkillSelection 
            options={skillOptions}
            maxChoices={skillChoiceData.choose}
            selections={character.skill_proficiencies_choice}
            setSelections={handleSkillChange}
            
            isCollapsible={isWizard}
            isOpen={openPanels.includes('skills')}
            onToggle={() => handlePanelToggle('skills')}
          />
        )}

        {showToolInstrumentChoice && (
            <ToolInstrumentSelection character={character} updateCharacter={updateCharacter} />
        )}

        {showExpertiseChoice && (
            <ExpertiseSelection character={character} updateCharacter={updateCharacter} />
        )}

        {showSpellChoice && (
          <SpellSelection 
            character={character}
            updateCharacter={updateCharacter}
            
            isCollapsible={isWizard}
            isOpenCantrips={openPanels.includes('cantrips')}
            isOpenSpells={openPanels.includes('spells')}
            onToggleCantrips={() => handlePanelToggle('cantrips')}
            onToggleSpells={() => handlePanelToggle('spells')}
          />
        )}
        
      </div>
    </div>
  );
};