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
    
    if (selectedRace.ability_bonuses.fixed) {
      Object.entries(selectedRace.ability_bonuses.fixed).forEach(([ability, value]) => {
        initialAssignments[ability] = value;
      });
    }
    
    setAssignments(initialAssignments);
    updateCharacter({ 
      race: selectedRace, 
      ability_bonus_assignments: initialAssignments, 
      floating_bonus_assignments: {},
      subrace: null, 
      ancestry: null,
      portrait: 1,
    });
  }, [selectedRace]);

  const updateCentralState = (newAssignments, floatingAssignments = {}) => {
    updateCharacter({ 
      ability_bonus_assignments: newAssignments,
      floating_bonus_assignments: floatingAssignments 
    });
  };

  const handleAssignBonus = (ability, bonusIndex) => {
    const newFloatingAssignments = { ...character.floating_bonus_assignments } || {};
    
    if (floatingBonuses.length > 0) {
      if (newFloatingAssignments[ability] === bonusIndex) {
        delete newFloatingAssignments[ability];
      } else {
        const existingAbility = Object.keys(newFloatingAssignments).find(
          key => newFloatingAssignments[key] === bonusIndex
        );
        if (existingAbility) {
          delete newFloatingAssignments[existingAbility];
        }
        newFloatingAssignments[ability] = bonusIndex;
      }
      
      const combinedAssignments = { ...selectedRace.ability_bonuses.fixed };
      
      setAssignments({ ...combinedAssignments, ...newFloatingAssignments });
      updateCentralState(combinedAssignments, newFloatingAssignments);
    }
  };
  
  const isBonusAssigned = (ability, bonusIndex) => {
    return character.floating_bonus_assignments?.[ability] === bonusIndex;
  };
  
  const isBonusUsed = (bonusIndex) => {
    return Object.values(character.floating_bonus_assignments || {}).includes(bonusIndex);
  };

  // --- KORRIGIERTE FUNKTION ---
  const getPortraitPath = (raceKey, gender, portraitIndex) => {
    const genderString = gender === 'Männlich' ? 'male' : 'female';
    // Verwende require() mit dem relativen Pfad von dieser Komponente aus
    try {
      return require(`../../assets/images/portraits/${raceKey}/${genderString}/${portraitIndex}.webp`);
    } catch (e) {
      // Optional: Lade ein Platzhalterbild, falls ein Porträt fehlt, um einen Fehler zu vermeiden.
      // return require('../../assets/images/portraits/placeholder.webp');
      console.error("Portrait not found:", raceKey, genderString, portraitIndex);
      return ''; // Oder ein Platzhalterbild-Pfad
    }
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

        <h3>Portrait</h3>
        <div className="portrait-selection">
          {[1, 2, 3, 4].map(index => (
            <img
              key={index}
              src={getPortraitPath(selectedRace.key, character.gender, index)}
              alt={`Portrait ${index}`}
              className={`portrait-image ${character.portrait === index ? 'selected' : ''}`}
              onClick={() => updateCharacter({ portrait: index })}
            />
          ))}
        </div>
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