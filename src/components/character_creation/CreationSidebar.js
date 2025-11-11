// src/components/character_creation/CreationSidebar.js
import React from 'react';
import './CreationSidebar.css';

// Übersetzungsobjekt für die deutschen Begriffe
const stepTranslations = {
  Race: 'Volk',
  // Subrace: 'Unterart', // Entfernt
  Class: 'Klasse',
  Background: 'Hintergrund',
  Abilities: 'Fähigkeiten',
  Identity: 'Identität',
  Zusammenfassung: 'Zusammenfassung', 
};

export const CreationSidebar = ({ currentStep, setCurrentStep, character, onFinalize }) => {

  // *** NEUE REIHENFOLGE: Schritte angepasst und Subrace/Ancestry entfernt ***
  const steps = ['Class', 'Background', 'Race', 'Abilities', 'Identity', 'Zusammenfassung'];

  // *** VEREINFACHT: Logik für Subrace/Ancestry entfernt ***
  const handleStepClick = (step) => {
    setCurrentStep(step);
  };

  return (
    // Wir fügen .ui-panel hier hinzu, um das Panel-Design anzuwenden
    <div className="sidebar-panel ui-panel">
      {/* Wir verwenden wieder deine originale <ul> Struktur */}
      <ul>
        {steps.map(step => {
          // *** VEREINFACHT: Logik für Subrace/Ancestry entfernt ***
          let label = stepTranslations[step];
          
          return (
            <li 
              key={step}
              className={`${currentStep === step ? 'active' : ''}`}
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