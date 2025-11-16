// src/components/character_creation/RaceSelection.js
import React, { useState, useEffect } from 'react';
import './RaceSelection.css';
import './PanelDetails.css';
import allRaceData from '../../data/races.json';
import './CreationSidebar.css'; 

const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

export const RaceSelection = ({ character, updateCharacter }) => {
  const [assignments, setAssignments] = useState({});
  const selectedRace = character.race;
  const selectedSubrace = character.subrace;
  const selectedAncestry = character.ancestry; // NEU

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
        // Setze die neue Zuweisung
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
    return <div>Lade Völker...</div>;
  }
  
  // floatingBonuses hier für die Render-Logik definieren
  const floatingBonuses = selectedRace.ability_bonuses.floating || [];
  
  // *** NEU: Logik für den Detail-Titel ***
  const getDetailTitle = () => {
    if (selectedSubrace) return selectedSubrace.name;
    if (selectedAncestry) return `${selectedRace.name} (${selectedAncestry.name})`;
    return selectedRace.name;
  };

  // *** NEU: Logik für die Detail-Beschreibung ***
  const getDetailDescription = () => {
    // Untervölker (wie Hochelf) haben eigene Beschreibungen
    if (selectedSubrace) return selectedSubrace.description;
    // Abstammungen (wie Roter Drache) haben keine, also die des Hauptvolks verwenden
    return selectedRace.description;
  };


  return (
    <div className="race-panel-layout">
      
      {/* --- LINKE SPALTE (Völkerliste) --- */}
      <div className="race-column-left">
        <div className="race-box">
          <h3>Völker</h3>
          
          <div className="race-list">
            {allRaceData.map(race => (
              <React.Fragment key={race.key}>
                <button
                  className={`race-button ${selectedRace.key === race.key ? 'selected' : ''}`}
                  onClick={() => onSelectRace(race)}
                >
                  {race.name}
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
                            {subrace.name}
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
                            {ancestry.name}
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

            {/* Zeige immer die Boni des Hauptvolks */}
            <h3>Attributs-Boost</h3>
            <p>{selectedRace.ability_bonuses.text}</p>
            
            {floatingBonuses.length > 0 && (
              <ul className="ability-bonus-list">
                {ABILITIES.map(abiKey => (
                  <li key={abiKey}>
                    <span>{abiKey.toUpperCase()}</span>
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
            <h3>Merkmale</h3>
            <ul className="traits-list-panel">
              {/* Zeige die Merkmale des Hauptvolks (außer Odemwaffe, die wird ersetzt) */}
              {selectedRace.traits
                .filter(trait => !(selectedRace.key === 'dragonborn' && trait.name === 'Odemwaffe'))
                .map(trait => (
                 <li key={trait.name}>
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
                    <strong>Schadensresistenz ({selectedAncestry.name}):</strong> Du hast Resistenz gegen {selectedAncestry.damage_type}.
                  </li>
                  <li>
                    <strong>Odemwaffe ({selectedAncestry.name}):</strong> {selectedAncestry.breath_weapon} ({selectedAncestry.damage_type}).
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