// src/components/CharacterCreationScreen.js
import React, { useState } from 'react';
import './CharacterCreationScreen.css';
import { CreationSidebar } from './CreationSidebar';
import { SelectionPanel } from './SelectionPanel';
import { SummaryPanel } from './SummaryPanel';
import { saveCharacter, loadCharacter } from '../../utils/persistence';

import allRaceData from '../../data/races.json';
import allClassData from '../../data/classes.json';
import allBackgroundData from '../../data/backgrounds.json';

export const CharacterCreationScreen = ({ onCharacterFinalized }) => {
  const [currentStep, setCurrentStep] = useState('Race');

  const [character, setCharacter] = useState({
    name: 'Held',
    gender: 'Männlich',
    race: allRaceData.find(r => r.key === 'human'),
    subrace: null,
    ancestry: null,
    class: allClassData.find(c => c.key === 'fighter'),
    background: allBackgroundData[0],
    abilities: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 },
    ability_bonus_assignments: allRaceData.find(r => r.key === 'human').ability_bonuses.fixed,
    skill_proficiencies_choice: [],
  });

  const updateCharacter = (newValues) => {
    setCharacter(prevCharacter => ({
      ...prevCharacter,
      ...newValues,
    }));
  };

  const handleFinalize = () => {
    saveCharacter(character);
    onCharacterFinalized(character);
  };

  return (
    <div className="creation-screen-container">
      <CreationSidebar
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        character={character}
      />
      
      <SelectionPanel 
        currentStep={currentStep}
        character={character}
        updateCharacter={updateCharacter}
      />

      <SummaryPanel character={character} />
      
      <div className="finalize-bar">
        <button onClick={handleFinalize}>Abenteuer beginnen</button>
      </div>
    </div>
  );
};
