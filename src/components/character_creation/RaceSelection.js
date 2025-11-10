// src/components/character_creation/RaceSelection.js
import React, { useState, useEffect } from 'react';
import './RaceSelection.css';
import './PanelDetails.css';
import allRaceData from '../../data/races.json';
// Importiere die Stile für die goldenen Buttons (ersetze dies, falls der Stil woanders liegt)
import './CreationSidebar.css'; 

const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

export const RaceSelection = ({ character, updateCharacter }) => {
  const [assignments, setAssignments] = useState({});
  const selectedRace = character.race;
  const floatingBonuses = selectedRace.ability_bonuses.floating || [];

  // --- HINWEIS: Die 'getPortraitModule'-Funktion WURDE VON HIER ENTFERNT ---
  // (Sie zieht in IdentitySelection.js um)

  useEffect(() => {
    // Bei Rassenwechsel die Zuweisungen zurücksetzen
    let initialAssignments = {};
    
    if (selectedRace.ability_bonuses.fixed) {
      Object.entries(selectedRace.ability_bonuses.fixed).forEach(([ability, value]) => {
        initialAssignments[ability] = (initialAssignments[ability] || 0) + value;
      });
    }

    if (floatingBonuses.length > 0) {
      // Wenn es floating Boni gibt, initialisiere 'available'
      initialAssignments.available = floatingBonuses.map((val, idx) => ({ index: idx, value: val, assignedTo: null }));
    }
    
    setAssignments(initialAssignments);
  }, [selectedRace, floatingBonuses]);


  const onSelect = (race) => {
    // Beim Wechsel des Volks müssen wir die Zuweisungen zurücksetzen
    updateCharacter({ 
      race: race, 
      subrace: null, // Subrace zurücksetzen
      ancestry: null, // Abstammung zurücksetzen
      ability_bonus_assignments: race.ability_bonuses.fixed || {}, // Feste Boni setzen
      floating_bonus_assignments: {} // Floating Boni zurücksetzen
    });
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
  
  return (
    <div className="race-selection-container">
      <div className="race-list">
        {allRaceData.map(race => (
          <button
            key={race.key}
            // HINWEIS: Ich verwende 'creation-nav-button', da 'race-button' in deiner .css entfernt wird
            // (basierend auf CreationSidebar.css)
            className={`creation-nav-button ${selectedRace.key === race.key ? 'active' : ''}`} 
            onClick={() => onSelect(race)}
          >
            {race.name}
          </button>
        ))}
      </div>

      <div className="panel-details-container">
        <h2 className="panel-details-header">{selectedRace.name}</h2>
        <p className="panel-details-description">{selectedRace.description}</p>
        
        {/* --- 
          DER GESAMTE BLOCK FÜR NAME, GESCHLECHT UND PORTRAIT WURDE HIER ENTFERNT 
        --- */}

        <div className="details-divider"></div>

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
      </div>
    </div>
  );
};