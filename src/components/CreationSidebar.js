// src/components/CreationSidebar.js
import React from 'react';
import './CreationSidebar.css';

export const CreationSidebar = ({ currentStep, setCurrentStep, character }) => {
  const steps = ['Race', 'Subrace', 'Class', 'Background', 'Abilities'];

  const hasSubraces = character.race?.subraces && character.race.subraces.length > 0;
  const hasAncestries = character.race?.ancestries && character.race.ancestries.length > 0;

  const handleStepClick = (step) => {
    // Verhindere Klick, wenn der Schritt nicht relevant ist
    if (step === 'Subrace' && !hasSubraces && !hasAncestries) {
      return;
    }
    setCurrentStep(step);
  };

  return (
    <div className="sidebar-panel">
      <ul>
        {steps.map(step => {
          const isSubraceStep = step === 'Subrace';
          let label = step;
          // Ändere den Text für Drachenblütige
          if (isSubraceStep && hasAncestries) {
            label = 'Abstammung';
          }
          
          const isDisabled = isSubraceStep && !hasSubraces && !hasAncestries;
          
          return (
            <li 
              key={step}
              className={`${currentStep === step ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
              onClick={() => handleStepClick(step)}
            >
              {label}
            </li>
          );
        })}
      </ul>
    </div>
  );
};