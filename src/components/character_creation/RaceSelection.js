// src/components/RaceSelection.js
import React, { useState, useEffect } from 'react';
import './RaceSelection.css';
import './PanelDetails.css';
import allRaceData from '../../data/races.json';

const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

export const RaceSelection = ({ character, updateCharacter }) => {
  const [assignments, setAssignments] = useState({});
  const selectedRace = character.race;
  const floatingBonuses = selectedRace.ability_bonuses.floating || [];

  useEffect(() => {
    // Bei Rassenwechsel die Zuweisungen zurücksetzen
    let initialAssignments = {};
    
    // Für fixe Boni verwenden wir die Attribut-Keys direkt
    if (selectedRace.ability_bonuses.fixed) {
      // Kopiere die fixen Boni direkt
      Object.entries(selectedRace.ability_bonuses.fixed).forEach(([ability, value]) => {
        initialAssignments[ability] = value;
      });
    }
    
    setAssignments(initialAssignments);
    updateCharacter({ 
      race: selectedRace, 
      ability_bonus_assignments: initialAssignments, 
      floating_bonus_assignments: {}, // Neue Struktur für floating Boni
      subrace: null, 
      ancestry: null 
    });
  }, [selectedRace]);

  const updateCentralState = (newAssignments, floatingAssignments = {}) => {
    updateCharacter({ 
      ability_bonus_assignments: newAssignments,
      floating_bonus_assignments: floatingAssignments 
    });
  };

  const handleAssignBonus = (ability, bonusIndex) => {
    const newAssignments = { ...assignments };
    const newFloatingAssignments = { ...character.floating_bonus_assignments } || {};
    
    // Für floating Boni verwenden wir eine separate Struktur
    if (floatingBonuses.length > 0) {
      // Prüfe ob dieser Bonus-Index bereits diesem Attribut zugewiesen ist
      if (newFloatingAssignments[ability] === bonusIndex) {
        // Wenn ja, entferne die Zuweisung
        delete newFloatingAssignments[ability];
      } else {
        // Prüfe ob dieser spezifische Bonus-Index bereits einem anderen Attribut zugewiesen ist
        const existingAbility = Object.keys(newFloatingAssignments).find(
          key => newFloatingAssignments[key] === bonusIndex
        );
        if (existingAbility) {
          delete newFloatingAssignments[existingAbility];
        }
        // Weise den Bonus dem neuen Attribut zu
        newFloatingAssignments[ability] = bonusIndex;
      }
      
      // Behalte die fixen Boni bei
      const combinedAssignments = { ...selectedRace.ability_bonuses.fixed };
      
      setAssignments({ ...combinedAssignments, ...newFloatingAssignments });
      updateCentralState(combinedAssignments, newFloatingAssignments);
    }
  };
  
  // Helper-Funktion um zu prüfen, ob ein Bonus-Index zugewiesen ist
  const isBonusAssigned = (ability, bonusIndex) => {
    return character.floating_bonus_assignments?.[ability] === bonusIndex;
  };
  
  // Helper-Funktion um zu prüfen, ob ein Bonus-Index bereits verwendet wird
  const isBonusUsed = (bonusIndex) => {
    return Object.values(character.floating_bonus_assignments || {}).includes(bonusIndex);
  };
  
  return (
    <div className="race-selection-container">
      <div className="race-list">
        {allRaceData.map(race => (
          <button
            key={race.key}
            className={`race-button ${selectedRace.key === race.key ? 'selected' : ''}`}
            onClick={() => updateCharacter({ race: race })}
          >
            {race.name}
          </button>
        ))}
      </div>

      <div className="race-details">
        {/* Name und Geschlecht Felder */}
        <div className="character-identity">
            <div className="input-group">
                <label htmlFor="charName">Name</label>
                <input 
                    type="text" 
                    id="charName" 
                    value={character.name}
                    onChange={(e) => updateCharacter({ name: e.target.value })}
                />
            </div>
            <div className="input-group">
                <label>Geschlecht</label>
                <div className="gender-buttons">
                    <button 
                        className={character.gender === 'Männlich' ? 'selected' : ''}
                        onClick={() => updateCharacter({ gender: 'Männlich' })}
                    >
                        Männlich
                    </button>
                    <button 
                        className={character.gender === 'Weiblich' ? 'selected' : ''}
                        onClick={() => updateCharacter({ gender: 'Weiblich' })}
                    >
                        Weiblich
                    </button>
                </div>
            </div>
        </div>
        <div className="details-divider"></div>

        <h2>{selectedRace.name}</h2>
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