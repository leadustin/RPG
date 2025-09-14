// src/components/CreationSidebar.js
import React from 'react';
import './CreationSidebar.css';

// Übersetzungsobjekt für die deutschen Begriffe
const stepTranslations = {
  Race: 'Volk',
  Subrace: 'Unterart',
  Class: 'Klasse',
  Background: 'Hintergrund',
  Abilities: 'Fähigkeiten',
};

export const CreationSidebar = ({ currentStep, setCurrentStep, character }) => {
  // Wir behalten die englischen Schlüssel für die Logik bei
  const steps = ['Race', 'Subrace', 'Class', 'Background', 'Abilities'];

  const hasSubraces = character.race?.subraces && character.race.subraces.length > 0;
  const hasAncestries = character.race?.ancestries && character.race.ancestries.length > 0;

  const handleStepClick = (step) => {
    // Die Logik hier bleibt unverändert, da wir die englischen Schlüssel verwenden
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
          
          // Standard-Label aus unserem Übersetzungsobjekt holen
          let label = stepTranslations[step];

          // Sonderfall für Drachenblütige beibehalten
          if (isSubraceStep && hasAncestries) {
            label = 'Abstammung';
          }
          
          const isDisabled = isSubraceStep && !hasSubraces && !hasAncestries;
          
          return (
            <li 
              key={step}
              // Die Logik für 'active' und 'disabled' funktioniert weiterhin
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