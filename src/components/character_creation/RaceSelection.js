// src/components/RaceSelection.js
import React, { useState, useEffect } from 'react';
import './RaceSelection.css';
import './PanelDetails.css';
import allRaceData from '../data/races.json';

const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

export const RaceSelection = ({ character, updateCharacter }) => {
  const [assignments, setAssignments] = useState(character.ability_bonus_assignments);
  const selectedRace = character.race;
  const floatingBonuses = selectedRace.ability_bonuses.floating || [];

  useEffect(() => {
    let initialAssignments = {};
    if (selectedRace.ability_bonuses.fixed) {
      initialAssignments = selectedRace.ability_bonuses.fixed;
    }
    setAssignments(initialAssignments);
    updateCharacter({ race: selectedRace, ability_bonus_assignments: initialAssignments, subrace: null, ancestry: null });
  }, [selectedRace]);

  const updateCentralState = (newAssignments) => {
    updateCharacter({ ability_bonus_assignments: newAssignments });
  };

  const handleAssignBonus = (ability, bonus) => {
    const currentAssignments = { ...assignments };
    const oldAbilityForBonus = Object.keys(currentAssignments).find(key => currentAssignments[key] === bonus);
    if (oldAbilityForBonus) {
      delete currentAssignments[oldAbilityForBonus];
    }
    if (currentAssignments[ability] === bonus) {
        delete currentAssignments[ability];
    } else {
        currentAssignments[ability] = bonus;
    }
    setAssignments(currentAssignments);
    updateCentralState(currentAssignments);
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
        {/* ====================================================== */}
        {/* NEUE FELDER FÜR NAME UND GESCHLECHT                   */}
        {/* ====================================================== */}
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
        {/* ====================================================== */}

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
                      key={index}
                      onClick={() => handleAssignBonus(abiKey, bonusValue)}
                      className={assignments[abiKey] === bonusValue ? 'selected' : ''}
                      disabled={assignments[abiKey] && assignments[abiKey] !== bonusValue}
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
