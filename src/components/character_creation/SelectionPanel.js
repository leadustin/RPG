import React from 'react';
import './SelectionPanel.css';
import { ClassSelection } from './ClassSelection';
import { RaceSelection } from './RaceSelection';
import { BackgroundSelection } from './BackgroundSelection';
import { AbilitySelection } from './AbilitySelection';
import { SubraceSelection } from './SubraceSelection';
import { AncestrySelection } from './AncestrySelection';

export const SelectionPanel = ({ currentStep, character, updateCharacter }) => {
  
  const renderContent = () => {
    switch (currentStep) {
      case 'Race':
        return <RaceSelection character={character} updateCharacter={updateCharacter} />;
      case 'Subrace':
        if (character.race?.key === 'dragonborn') {
          return <AncestrySelection character={character} updateCharacter={updateCharacter} />;
        }
        return <SubraceSelection character={character} updateCharacter={updateCharacter} />;
      case 'Class':
        return <ClassSelection character={character} updateCharacter={updateCharacter} />;
      case 'Background':
        return <BackgroundSelection character={character} updateCharacter={updateCharacter} />;
      case 'Abilities':
        return <AbilitySelection character={character} updateCharacter={updateCharacter} />;
      default:
        return <h2>{currentStep}</h2>;
    }
  };

  return (
    <div className="selection-panel">
      {renderContent()}
    </div>
  );
};
