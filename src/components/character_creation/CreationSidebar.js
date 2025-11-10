// src/components/character_creation/CreationSidebar.js
import React from 'react';
import './CreationSidebar.css';

// Übersetzungsobjekt für die deutschen Begriffe
const stepTranslations = {
  Race: 'Volk',
  Subrace: 'Unterart',
  Class: 'Klasse',
  Background: 'Hintergrund',
  Abilities: 'Fähigkeiten',
  Identity: 'Identität', // <-- NEU
  Zusammenfassung: 'Zusammenfassung', 
};

export const CreationSidebar = ({ currentStep, setCurrentStep, character, onFinalize }) => {

  // "Identity" hier einfügen
  const steps = ['Race', 'Subrace', 'Class', 'Background', 'Abilities', 'Identity', 'Zusammenfassung']; // <-- NEU

  const hasSubraces = character.race?.subraces && character.race.subraces.length > 0;
  const hasAncestries = character.race?.ancestries && character.race.ancestries.length > 0;

  const handleStepClick = (step) => {
    if (step === 'Subrace' && !hasSubraces && !hasAncestries) {
      return;
    }
    setCurrentStep(step);
  };

  return (
    // Wir fügen .ui-panel hier hinzu, um das Panel-Design anzuwenden
    <div className="sidebar-panel ui-panel">
      {/* Wir verwenden wieder deine originale <ul> Struktur */}
      <ul>
        {steps.map(step => {
          const isSubraceStep = step === 'Subrace';
          
          let label = stepTranslations[step];

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
      <div className="sidebar-finalize-container">
        
        {/* Die Bedingung ist hier. Sie wird nur true, 
            wenn currentStep exakt "Zusammenfassung" ist. */}
        {currentStep === 'Zusammenfassung' && (
          <button className="finalize-button ui-button" onClick={onFinalize}>
            Charakter erstellen
          </button>
        )}
      </div>
    </div>
  );
};