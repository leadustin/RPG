// src/components/character_creation/RaceSelection.js
import React, { useState, useEffect } from 'react';
import './RaceSelection.css';
import './PanelDetails.css';
import allRaceData from '../../data/races.json';

const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

export const RaceSelection = ({ character, updateCharacter }) => {
  const [assignments, setAssignments] = useState({});
  const selectedRace = character.race;
  const floatingBonuses = selectedRace.ability_bonuses.floating || [];

  // KORREKTUR: Diese Funktion lädt das Bild als Modul, das React verwenden kann.
  const getPortraitModule = (raceKey, gender, portraitIndex) => {
    const genderString = gender === 'Männlich' ? 'male' : 'female';
    try {
      // require() gibt das Modul zurück, nicht nur den Pfad.
      return require(`../../assets/images/portraits/${raceKey}/${genderString}/${portraitIndex}.webp`);
    } catch (e) {
      console.error("Portrait not found:", raceKey, genderString, portraitIndex);
      return ''; // Fallback
    }
  };

  useEffect(() => {
    // Bei Rassenwechsel die Zuweisungen zurücksetzen
    let initialAssignments = {};
    
    if (selectedRace.ability_bonuses.fixed) {
      Object.entries(selectedRace.ability_bonuses.fixed).forEach(([ability, value]) => {
        initialAssignments[ability] = value;
      });
    }
    
    setAssignments(initialAssignments);

    // KORREKTUR: Setzt das initial geladene Portrait-Modul
    const initialPortraitModule = getPortraitModule(selectedRace.key, character.gender, 1);

    updateCharacter({ 
      race: selectedRace, 
      ability_bonus_assignments: initialAssignments, 
      floating_bonus_assignments: {},
      subrace: null, 
      ancestry: null,
      portrait: initialPortraitModule, // Speichert das Modul, nicht einen Index oder Pfad-String
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
  
  // KORREKTUR: Eigene Funktion, um beim Geschlechtswechsel das Portrait zu aktualisieren
  const handleGenderChange = (newGender) => {
    // Setzt das Portrait auf das erste Bild des neuen Geschlechts zurück,
    // um sicherzustellen, dass immer ein gültiges Portrait geladen ist.
    const newPortraitModule = getPortraitModule(character.race.key, newGender, 1);
    updateCharacter({ gender: newGender, portrait: newPortraitModule });
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
                        onClick={() => handleGenderChange('Männlich')}
                    >
                        Männlich
                    </button>
                    <button 
                        className={character.gender === 'Weiblich' ? 'selected' : ''}
                        onClick={() => handleGenderChange('Weiblich')}
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
          {[1, 2, 3, 4].map(index => {
            const portraitModule = getPortraitModule(selectedRace.key, character.gender, index);
            return (
              <img
                key={index}
                src={portraitModule} // src erhält das geladene Modul
                alt={`Portrait ${index}`}
                className={`portrait-image ${character.portrait === portraitModule ? 'selected' : ''}`}
                onClick={() => updateCharacter({ portrait: portraitModule })} // Speichert das Modul
              />
            );
          })}
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