// src/components/character_creation/RaceSelection.jsx
import React, { useState, useEffect } from 'react';
import './RaceSelection.css';
import './PanelDetails.css';
import allRaceData from '../../data/races.json';
import './CreationSidebar.css'; 
import { useTranslation } from "react-i18next";

const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

export const RaceSelection = ({ character, updateCharacter }) => {
  const { t } = useTranslation(); // +++ NEU
  const [assignments, setAssignments] = useState({});
  const selectedRace = character.race;
  const selectedSubrace = character.subrace;
  const selectedAncestry = character.ancestry;

  useEffect(() => {
    // Bei Rassenwechsel die Zuweisungen zurücksetzen
    let initialAssignments = {};
    
    if (selectedRace.ability_bonuses.fixed) {
      Object.entries(selectedRace.ability_bonuses.fixed).forEach(([ability, value]) => {
        initialAssignments[ability] = (initialAssignments[ability] || 0) + value;
      });
    }

    // floatingBonuses hier direkt aus selectedRace holen
    const floatingBonuses = selectedRace.ability_bonuses.floating || [];
    
    if (floatingBonuses.length > 0) {
      // Wenn es floating Boni gibt, initialisiere 'available'
      initialAssignments.available = floatingBonuses.map((val, idx) => ({ index: idx, value: val, assignedTo: null }));
    }
    
    setAssignments(initialAssignments);
  
  }, [selectedRace]); // Nur selectedRace als Dependency


  const onSelectRace = (race) => {
    // Beim Wechsel des Volks müssen wir die Zuweisungen zurücksetzen
    updateCharacter({ 
      race: race, 
      subrace: null,
      ancestry: null,
      ability_bonus_assignments: race.ability_bonuses.fixed || {},
      floating_bonus_assignments: {} 
    });
  };

  // Handler für die Auswahl der Unterart
  const onSelectSubrace = (subrace) => {
    updateCharacter({ subrace: subrace });
  };

  // *** NEU: Handler für die Auswahl der Abstammung ***
  const onSelectAncestry = (ancestry) => {
    updateCharacter({ ancestry: ancestry });
  };


  const handleAssignBonus = (abiKey, index) => {
    setAssignments(prev => {
      const newFloating = { ...prev.floating_bonus_assignments };
      const currentAssignment = newFloating[abiKey];
      
      if (currentAssignment === index) {
        // Zuweisung aufheben
        delete newFloating[abiKey];
      } else {
        // Zuweisung ändern oder neu setzen
        // Entferne zuerst, falls dieser Bonus (index) woanders zugewiesen war
        for (const key in newFloating) {
          if (newFloating[key] === index) {
            delete newFloating[key];
          }
        }
        newFloating[abiKey] = index;
      }
      
      // Update des Character-Objekts im Haupt-State
      updateCharacter({ floating_bonus_assignments: newFloating });

      return {
        ...prev,
        floating_bonus_assignments: newFloating
      };
    });
  };

  const isBonusAssigned = (abiKey, index) => {
    return assignments.floating_bonus_assignments?.[abiKey] === index;
  };

  const isBonusUsed = (index) => {
    return Object.values(assignments.floating_bonus_assignments || {}).includes(index);
  };

  if (!selectedRace) {
    // +++ GEÄNDERT +++
    return <div>{t('common.loadingRaces')}</div>;
  }
  
  // floatingBonuses hier für die Render-Logik definieren
  const floatingBonuses = selectedRace.ability_bonuses.floating || [];
  
  // *** NEU: Logik für den Detail-Titel ***
  const getDetailTitle = () => {
    // HINWEIS: Diese Namen kommen aus der JSON-Datei und sind noch nicht übersetzt
    if (selectedSubrace) return selectedSubrace.name;
    if (selectedAncestry) return `${selectedRace.name} (${selectedAncestry.name})`;
    return selectedRace.name;
  };

  // *** NEU: Logik für die Detail-Beschreibung ***
  const getDetailDescription = () => {
    // HINWEIS: Diese Beschreibungen kommen aus der JSON-Datei
    if (selectedSubrace) return selectedSubrace.description;
    return selectedRace.description;
  };


  return (
    <div className="race-panel-layout">
      
      {/* --- LINKE SPALTE (Völkerliste) --- */}
      <div className="race-column-left">
        <div className="race-box">
          {/* +++ GEÄNDERT +++ */}
          <h3>{t('creation.step_race')}</h3>
          
          <div className="race-list">
            {allRaceData.map(race => (
              <React.Fragment key={race.key}>
                <button
                  className={`race-button ${selectedRace.key === race.key ? 'selected' : ''}`}
                  onClick={() => onSelectRace(race)}
                >
                  {race.name} {/* HINWEIS: Aus JSON, nicht übersetzt */}
                </button>

                {/* --- Collapsible Container (Logik angepasst) --- */}
                {selectedRace.key === race.key && (
                  <>
                    {/* Fall 1: Untervölker (z.B. Elf) */}
                    {race.subraces && race.subraces.length > 0 && (
                      <div className="subrace-collapsible-container">
                        {race.subraces.map(subrace => (
                          <button
                            key={subrace.key}
                            className={`subrace-button-nested ${selectedSubrace?.key === subrace.key ? 'selected' : ''}`}
                            onClick={() => onSelectSubrace(subrace)}
                          >
                            {subrace.name} {/* HINWEIS: Aus JSON, nicht übersetzt */}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Fall 2: Abstammungen (z.B. Drachenblütiger) */}
                    {race.ancestries && race.ancestries.length > 0 && (
                      <div className="subrace-collapsible-container">
                        {race.ancestries.map(ancestry => (
                          <button
                            key={ancestry.key}
                            className={`subrace-button-nested ${selectedAncestry?.key === ancestry.key ? 'selected' : ''}`}
                            onClick={() => onSelectAncestry(ancestry)}
                          >
                            {ancestry.name} {/* HINWEIS: Aus JSON, nicht übersetzt */}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
                {/* --- Ende Collapsible Container --- */}

              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* --- RECHTE SPALTE (Details) --- */}
      <div className="race-column-right">
        <div className="race-box">
          <h2 className="panel-details-header">{getDetailTitle()}</h2>

          <div className="race-details-content-wrapper">
            <p className="panel-details-description">
              {getDetailDescription()}
            </p>
            
            <div className="details-divider"></div>

            {/* +++ GEÄNDERT +++ */}
            <h3>{t('creation.race.abilityBoost')}</h3>
            <p>{selectedRace.ability_bonuses.text}</p> {/* HINWEIS: Aus JSON, nicht übersetzt */}
            
            {floatingBonuses.length > 0 && (
              <ul className="ability-bonus-list">
                {ABILITIES.map(abiKey => (
                  <li key={abiKey}>
                    <span>{t(`abilities.${abiKey}_short`)}</span> {/* +++ GEÄNDERT (Kürzel) +++ */}
                    <div className="bonus-buttons">
                      {floatingBonuses.map((bonusValue, index) => (
                        <button
                          key={`${abiKey}-${index}`}
                          onClick={() => handleAssignBonus(abiKey, index)}
                          className={isBonusAssigned(abiKey, index) ? 'selected' : ''}
                          disabled={isBonusUsed(index) && !isBonusAssigned(abiKey, index)}
                        >
                          +{bonusValue}
                        </button>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {/* *** Zeige die Traits (Merkmale) an (Logik angepasst) *** */}
            <div className="details-divider"></div>
            {/* +++ GEÄNDERT +++ */}
            <h3>{t('creation.race.traits')}</h3>
            <ul className="traits-list-panel">
              {/* Zeige die Merkmale des Hauptvolks (außer Odemwaffe, die wird ersetzt) */}
              {selectedRace.traits
                 // HINWEIS: 'Odemwaffe' ist hier hartkodiert, was i18n erschwert.
                 // Idealerweise würde man auf einen Schlüssel (z.B. 'breath_weapon') prüfen.
                .filter(trait => !(selectedRace.key === 'dragonborn' && trait.name === 'Odemwaffe'))
                .map(trait => (
                 <li key={trait.name}>
                    {/* HINWEIS: trait.name & trait.description kommen aus JSON */}
                    <strong>{trait.name}:</strong> {trait.description}
                  </li>
              ))}
              
              {/* Zeige die Merkmale des Untervolks, falls ausgewählt */}
              {selectedSubrace && selectedSubrace.traits.map(trait => (
                 <li key={trait.name}>
                    <strong>{trait.name} ({selectedSubrace.name}):</strong> {trait.description}
                  </li>
              ))}

              {/* Zeige die Merkmale der Abstammung, falls ausgewählt */}
              {selectedRace.key === 'dragonborn' && selectedAncestry && (
                <>
                  <li>
                    {/* +++ GEÄNDERT +++ */}
                    <strong>{t('creation.race.damageResistance')} ({selectedAncestry.name}):</strong> 
                    {t('creation.race.damageResistanceDesc', { type: selectedAncestry.damage_type })}
                  </li>
                  <li>
                    {/* +++ GEÄNDERT +++ */}
                    <strong>{t('creation.race.breathWeapon')} ({selectedAncestry.name}):</strong> 
                    {selectedAncestry.breath_weapon} ({selectedAncestry.damage_type}).
                  </li>
                </>
              )}
            </ul>

          </div> 
        </div>
      </div>
    </div>
  );
};