// src/components/character_creation/ClassSelection.jsx
import React, { useState } from 'react';
import './ClassSelection.css';
import './PanelDetails.css';
import allClassData from '../../data/classes.json';
import { SkillSelection } from './SkillSelection';
import { SKILL_NAMES_DE } from '../../engine/characterEngine';
import { useTranslation } from "react-i18next";
// +++ IMPORTS ERWEITERT +++
import { SubclassSelection } from './SubclassSelection';
import { FightingStyleSelection } from './FightingStyleSelection';
import { SpellSelection } from './SpellSelection';
import { ExpertiseSelection } from './ExpertiseSelection';
import { RangerFeatureSelection } from './RangerFeatureSelection';
import { ToolInstrumentSelection } from './ToolInstrumentSelection';
import { WeaponMasterySelection } from './WeaponMasterySelection'; // NEU
// +++ IMPORTS ENDE +++


// 1. Lade alle Bildmodule aus dem 'classes'-Ordner
const classIconModules = import.meta.glob(
  '../../assets/images/classes/*.(webp|png|jpe?g|svg)',
  { eager: true } // 'eager: true' lädt sie sofort
);

// 2. Verarbeite die Module in das Format, das dein Code erwartet
// (z.B. { 'barbarian.webp': '/path/to/barbarian.webp' })
const classIcons = {};
for (const path in classIconModules) {
  const iconUrl = classIconModules[path].default; // 'default' ist die URL
  // Extrahiere den Dateinamen (z.B. "barbarian.webp") als Key
  const key = path.split('/').pop(); // Dateiname.ext
  classIcons[key] = iconUrl;
}



export const ClassSelection = ({ character, updateCharacter }) => {
  const { t } = useTranslation();
  const selectedClass = character.class;
  const skillChoiceData = selectedClass.proficiencies.skills;

  const handleSkillChange = (newSelections) => {
    updateCharacter({ skill_proficiencies_choice: newSelections });
  };
  
  // --- NEU: Status für einklappbare Panels ---
  // Standardmäßig sind 'skills' (Fertigkeiten) und 'cantrips' (Zaubertricks) offen
  const [openPanels, setOpenPanels] = useState(['skills', 'cantrips']);

  const handlePanelToggle = (panelKey) => {
    setOpenPanels(currentPanels => {
      // 1. Wenn wir auf ein bereits offenes Panel klicken, schließen wir es
      if (currentPanels.includes(panelKey)) {
        return currentPanels.filter(p => p !== panelKey);
      }

      // 2. DEINE REGEL: Wenn wir 'spells' (Zauberbuch) öffnen, schließe alle anderen
      if (panelKey === 'spells') {
        return ['spells']; 
      }

      // 3. Wenn wir 'skills' oder 'cantrips' öffnen, schließe 'spells'
      //    und füge das neue Panel zur Liste der offenen hinzu
      return [...currentPanels.filter(p => p !== 'spells'), panelKey];
    });
  };
  // --- ENDE NEU ---
  
  if (!selectedClass) {
    return <div>Lade Klassen...</div>;
  }

  // --- Skill-Optionen-Logik (bleibt gleich) ---
  let skillOptions = [];
  if (skillChoiceData && skillChoiceData.from) {
    const allSkillKeys = Object.keys(SKILL_NAMES_DE);
    // Prüfe, ob "from" der Sonderfall "any" ist
    if (skillChoiceData.from === 'any') {
      skillOptions = allSkillKeys;
    } 
    // Prüfe, ob "from" eine Liste (Array) ist, um Abstürze zu vermeiden
    else if (Array.isArray(skillChoiceData.from)) {
      skillOptions = skillChoiceData.from.map(skillName => 
        allSkillKeys.find(key => SKILL_NAMES_DE[key] === skillName)
      );
    }
  }
  // --- Ende Skill-Optionen-Logik ---

  // +++ HELFER-VARIABLEN (ERWEITERT) +++
  const classKey = selectedClass.key;
  
  // --- NEU: Prüfen, ob Magier aktiv ist ---
  const isWizard = classKey === 'wizard';
  
  // Zeige Subklassen-Auswahl auf Lvl 1?
  const showSubclassChoice = (
    classKey === 'cleric' || 
    classKey === 'sorcerer' || 
    classKey === 'warlock'
  );

  // Zeige Kampfstil-Auswahl auf Lvl 1?
  const showLvl1FightingStyle = (classKey === 'fighter');

  // Zeige Zauber-Auswahl auf Lvl 1?
  const showSpellChoice = (
    selectedClass.spellcasting && 
    (classKey === 'wizard' || classKey === 'sorcerer' || classKey === 'bard' || classKey === 'warlock' || classKey === 'cleric' || classKey === 'druid')
  );

  const showExpertiseChoice = (classKey === 'rogue');
  const showRangerFeatures = (classKey === 'ranger');
  const showToolInstrumentChoice = (classKey === 'bard' || classKey === 'monk');
  const showWeaponMastery = (selectedClass.weapon_mastery !== undefined); // NEU
  // +++ HELFER-VARIABLEN ENDE +++


  return (
    <div className="class-selection-container">
      {/* --- Klassenauswahl-Grid (ERWEITERTES RESET) --- */}
      <div className="class-grid class-summary-box">
        {allClassData.map(cls => (
          <button 
            key={cls.key} 
            onClick={() => updateCharacter({ 
                class: cls, 
                // Setze ALLE klassenspezifischen Auswahlen zurück
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
                weapon_mastery_choices: [], // NEU
            })}
            className={`class-button ${selectedClass.key === cls.key ? 'selected' : ''}`}
          >
            {/* HINWEIS: Der Key ist jetzt der volle Dateiname, z.B. 'barbarian.webp' */}
            {classIcons[cls.icon] && (
              <img 
                src={classIcons[cls.icon]} 
                alt={`${cls.name} Icon`} 
                className="class-icon"
              />
            )}
            <span>{cls.name}</span>
          </button>
        ))}
      </div>

      {/* --- Klassendetails (STARK ERWEITERT) --- */}
      <div className="class-details class-summary-box">
        <p className="class-description">{selectedClass.description}</p>
        <div className="details-divider"></div>
        <h3>{t("classSelection.classCharacteristics")}</h3>
        <ul className="features-list">
          {selectedClass.features
            .filter(feature => feature.level === 1)
            .map(feature => (
              <li key={feature.name}>
                <strong>{feature.name}:</strong> {feature.description}
              </li>
            ))
          }
        </ul>
        
        {/* === START: Bedingte Auswahlmöglichkeiten === */}

        {/* 1. Subklasse (Kleriker, Zauberer, Hexenmeister) */}
        {showSubclassChoice && (
          <SubclassSelection 
            character={character}
            updateCharacter={updateCharacter}
          />
        )}

        {/* 2. Kampfstil (Kämpfer) */}
        {showLvl1FightingStyle && (
          <FightingStyleSelection
            character={character}
            updateCharacter={updateCharacter}
          />
        )}

        {/* 3. Waldläufer-Merkmale (Waldläufer) */}
        {showRangerFeatures && (
          <RangerFeatureSelection 
            character={character}
            updateCharacter={updateCharacter}
          />
        )}
        
        {/* 3b. Waffenbeherrschung (Barbar, Kämpfer, Paladin, Waldläufer) */}
        {showWeaponMastery && (
          <WeaponMasterySelection 
            character={character}
            updateCharacter={updateCharacter}
          />
        )}
        
        {/* 4. Fertigkeiten (Skills) (Alle Klassen mit Auswahl) */}
        {/* HINWEIS: Dieser Block ist (korrekterweise) vor Expertise */}
        {skillChoiceData && (
          <>
            {/* <div className="details-divider"></div> <-- Entfernt für kompaktes Layout */}
            <SkillSelection 
              options={skillOptions}
              maxChoices={skillChoiceData.choose}
              selections={character.skill_proficiencies_choice}
              setSelections={handleSkillChange}
              
              // --- KONDITIONALE PROPS (NUR WENN MAGIER) ---
              isCollapsible={isWizard}
              isOpen={openPanels.includes('skills')}
              onToggle={() => handlePanelToggle('skills')}
            />
          </>
        )}

        {/* 5. Werkzeuge/Instrumente (Barde, Mönch) */}
        {showToolInstrumentChoice && (
            <ToolInstrumentSelection
                character={character}
                updateCharacter={updateCharacter}
            />
        )}

        {/* 6. Expertise (Schurke) */}
        {showExpertiseChoice && (
            <ExpertiseSelection 
                character={character}
                updateCharacter={updateCharacter}
            />
        )}


        {/* 7. Zauber (Alle Zauberklassen) */}
        {showSpellChoice && (
          <SpellSelection 
            character={character}
            updateCharacter={updateCharacter}
            
            // --- KONDITIONALE PROPS (NUR WENN MAGIER) ---
            isCollapsible={isWizard}
            isOpenCantrips={openPanels.includes('cantrips')}
            isOpenSpells={openPanels.includes('spells')}
            onToggleCantrips={() => handlePanelToggle('cantrips')}
            onToggleSpells={() => handlePanelToggle('spells')}
          />
        )}
        
        {/* === ENDE: Bedingte Auswahlmöglichkeiten === */}

      </div>
    </div>
  );
};