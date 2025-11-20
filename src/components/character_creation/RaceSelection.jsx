// src/components/character_creation/RaceSelection.jsx
import React, { useState, useEffect } from 'react';
import './RaceSelection.css';
import './PanelDetails.css';
import allRaceData from '../../data/races.json';
import './CreationSidebar.css'; 
import { useTranslation } from "react-i18next";

const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

export const RaceSelection = ({ character, updateCharacter }) => {
  const { t } = useTranslation();
  const [assignments, setAssignments] = useState({});
  
  const selectedRace = character.race;
  
  // +++ NEU: Initialisierungs-Logik +++
  useEffect(() => {
    // Wenn noch kein Volk gewählt ist, aber Daten da sind -> Wähle das erste
    if (!selectedRace && allRaceData && allRaceData.length > 0) {
        // Timeout verhindert "Update during render" Warnungen
        setTimeout(() => {
            const defaultRace = allRaceData[0];
            updateCharacter({ 
              race: defaultRace,
              // Reset der Unter-Optionen
              subrace: null, 
              ancestry: null, 
              lineage: null, 
              legacy: null,
              // Falls das erste Volk feste Boni hat, setzen wir diese auch gleich
              ability_bonus_assignments: defaultRace.ability_bonuses?.fixed || {},
              floating_bonus_assignments: {}
            });
        }, 0);
    }
  }, [selectedRace, updateCharacter]); // Abhängigkeiten
  // +++ ENDE NEU +++

  
  // Wir holen uns dynamisch das aktuell gewählte Unter-Element, egal wie es im JSON heißt
  const selectedSubOption = character.subrace || character.ancestry || character.lineage || character.legacy;

  useEffect(() => {
    if (!selectedRace) return;

    let initialAssignments = {};
    
    // Fixe Boni initialisieren
    if (selectedRace.ability_bonuses && selectedRace.ability_bonuses.fixed) {
      Object.entries(selectedRace.ability_bonuses.fixed).forEach(([ability, value]) => {
        initialAssignments[ability] = (initialAssignments[ability] || 0) + value;
      });
    }

    // Floating Boni (freie Auswahl) initialisieren
    const floatingBonuses = selectedRace.ability_bonuses?.floating || [];
    if (floatingBonuses.length > 0) {
      initialAssignments.available = floatingBonuses.map((val, idx) => ({ 
        index: idx, 
        value: val, 
        assignedTo: null 
      }));
    }
    
    setAssignments(initialAssignments);
  
  }, [selectedRace]); 


  // --- HILFSFUNKTION: Ermittelt die Unterarten-Daten dynamisch ---
  const getSubOptionData = (race) => {
    // Prüft auf 'subraces' (z.B. Zwerge, Gnome, Halblinge)
    if (race.subraces && race.subraces.length > 0) {
      return { 
        key: 'subrace', 
        list: race.subraces, 
        label: t('creation.race.subraces') // "Unterrasse"
      };
    }
    
    // Prüft auf 'ancestries' (z.B. Drachenblütige, Goliaths)
    if (race.ancestries && race.ancestries.length > 0) {
      // Unterscheidung: Goliaths haben Riesen-Vorfahren, Drachenblütige drakonische
      const label = race.key === 'goliath' 
        ? t('creation.race.giantAncestry') // "Riesen"
        : t('creation.race.ancestries');   // "Drakonische Abstammung"

      return { 
        key: 'ancestry', 
        list: race.ancestries, 
        label: label
      };
    }

    // Prüft auf 'lineages' (z.B. Elfen 2024)
    if (race.lineages && race.lineages.length > 0) {
      return { 
        key: 'lineage', 
        list: race.lineages, 
        label: t('creation.race.lineages') // "Abstammungslinie"
      }; 
    }

    // Prüft auf 'legacies' (z.B. Tieflinge)
    if (race.legacies && race.legacies.length > 0) {
      return { 
        key: 'legacy', 
        list: race.legacies, 
        label: t('creation.race.legacies') // "Infernalisches Vermächtnis"
      };
    }

    return null;
  };


  const onSelectRace = (race) => {
    // Beim Wechsel des Volks müssen wir alle Unter-Optionen und Zuweisungen zurücksetzen
    updateCharacter({ 
      race: race, 
      subrace: null, 
      ancestry: null, 
      lineage: null,
      legacy: null,
      ability_bonus_assignments: race.ability_bonuses?.fixed || {},
      floating_bonus_assignments: {} 
    });
  };

  const onSelectSubOption = (key, option) => {
    // Dynamisches Update: key ist 'subrace', 'ancestry', 'lineage' oder 'legacy'
    updateCharacter({ 
        subrace: null, 
        ancestry: null, 
        lineage: null,
        legacy: null, 
        [key]: option 
    });
  };

  const handleAssignBonus = (abiKey, index) => {
    setAssignments(prev => {
      const newFloating = { ...character.floating_bonus_assignments };
      const currentAssignment = newFloating[abiKey];
      
      if (currentAssignment === index) {
        // Zuweisung aufheben
        delete newFloating[abiKey];
      } else {
        // Zuweisung ändern: Erst alte Bindung lösen, dann neu setzen
        for (const key in newFloating) {
          if (newFloating[key] === index) {
            delete newFloating[key];
          }
        }
        newFloating[abiKey] = index;
      }
      
      updateCharacter({ floating_bonus_assignments: newFloating });
      return prev; 
    });
  };

  const isBonusAssigned = (abiKey, index) => {
    return character.floating_bonus_assignments?.[abiKey] === index;
  };

  const isBonusUsed = (index) => {
    return Object.values(character.floating_bonus_assignments || {}).includes(index);
  };

  // +++ FALLBACK: Zeige Loading, wenn selectedRace noch nicht da ist +++
  if (!selectedRace) {
    return <div className="loading-text">{t('common.loadingRaces')}</div>;
  }
  
  const floatingBonuses = selectedRace.ability_bonuses?.floating || [];
  
  // *** Titel für Details-Panel ***
  const getDetailTitle = () => {
    if (selectedSubOption) {
        // Sonderfall Drachenblütige: Name (Farbe)
        if (selectedRace.key === 'dragonborn') {
            return `${selectedRace.name} (${selectedSubOption.name})`;
        }
        // Standardfall: Nur Name der Unterart (z.B. "Hochelf")
        return selectedSubOption.name;
    }
    return selectedRace.name;
  };

  // *** Beschreibung für Details-Panel ***
  const getDetailDescription = () => {
    // Wenn Unterart gewählt, zeige deren Beschreibung (falls vorhanden), sonst die des Volks
    if (selectedSubOption && selectedSubOption.description) {
        return selectedSubOption.description;
    }
    return selectedRace.description;
  };


  return (
    <div className="race-panel-layout">
      
      {/* --- LINKE SPALTE (Völkerliste) --- */}
      <div className="race-column-left">
        <div className="race-box">
          <h3>{t('creation.step_race')}</h3>
          
          <div className="race-list">
            {allRaceData.map(race => {
              const subData = getSubOptionData(race);
              const isSelected = selectedRace.key === race.key;

              return (
                <React.Fragment key={race.key}>
                  <button
                    className={`race-button ${isSelected ? 'selected' : ''}`}
                    onClick={() => onSelectRace(race)}
                  >
                    {race.name}
                  </button>

                  {/* --- Dynamischer Collapsible Container --- */}
                  {isSelected && subData && (
                    <div className="subrace-collapsible-container">
                      <div className="subrace-label-small">{subData.label}</div>
                      {subData.list.map(option => (
                        <button
                          key={option.key}
                          className={`subrace-button-nested ${selectedSubOption?.key === option.key ? 'selected' : ''}`}
                          onClick={() => onSelectSubOption(subData.key, option)}
                        >
                          {option.name}
                        </button>
                      ))}
                    </div>
                  )}
                </React.Fragment>
              );
            })}
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

            {/* ATTRIBUTE */}
            <h3>{t('creation.race.abilityBoost')}</h3>
            <p>{selectedRace.ability_bonuses?.text}</p>
            
            {floatingBonuses.length > 0 && (
              <ul className="ability-bonus-list">
                {ABILITIES.map(abiKey => (
                  <li key={abiKey}>
                    <span>{t(`abilities.${abiKey}_short`)}</span>
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

            <div className="details-divider"></div>

            {/* MERKMALE (TRAITS) */}
            <h3>{t('creation.race.traits')}</h3>
            <ul className="traits-list-panel">
              
              {/* 1. Merkmale des Hauptvolks */}
              {selectedRace.traits
                .filter(trait => {
                   // Filter-Logik: Verstecke Merkmale, die durch Unterart ersetzt werden
                   if (selectedRace.key === 'dragonborn' && trait.name === 'Odemwaffe') return false;
                   if (selectedRace.key === 'tiefling' && trait.name === 'Erwählte Erbschaft') return false;
                   return true;
                })
                .map(trait => (
                 <li key={trait.name}>
                    <strong>{trait.name}:</strong> {trait.description}
                  </li>
              ))}
              
              {/* 2. Merkmale der gewählten Unter-Option */}
              {selectedSubOption && selectedSubOption.traits && selectedSubOption.traits.map(trait => (
                 <li key={trait.name}>
                    <strong>{trait.name} ({selectedSubOption.name}):</strong> {trait.description}
                  </li>
              ))}

              {/* 3. Spezielle Logik für Drachenblütige (Datenstruktur ist anders) */}
              {selectedRace.key === 'dragonborn' && selectedSubOption && selectedSubOption.damage_type && (
                <>
                  <li>
                    <strong>{t('creation.race.damageResistance')} ({selectedSubOption.name}):</strong> 
                    {t('creation.race.damageResistanceDesc', { type: selectedSubOption.damage_type })}
                  </li>
                  <li>
                    <strong>{t('creation.race.breathWeapon')} ({selectedSubOption.name}):</strong> 
                    {selectedSubOption.shape}, {selectedSubOption.damage_type}-Schaden.
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