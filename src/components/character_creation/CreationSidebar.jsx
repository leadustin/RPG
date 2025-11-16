// src/components/character_creation/CreationSidebar.jsx
import React from 'react';
import './CreationSidebar.css';
import { useTranslation } from "react-i18next"; 

// Übersetzungsobjekt und Steps-Array wurden nach CharacterCreationScreen.jsx verschoben

export const CreationSidebar = ({ 
  currentStep, 
  steps,                  // NEU
  stepTranslations,       // NEU
  maxStepIndex,           // NEU
  onStepSelect,           // GEÄNDERT (war setCurrentStep)
  onPrev,                 // NEU
  onNext,                 // NEU
  character 
}) => {
  const { t } = useTranslation(); // +++ NEU
  const currentStepIndex = steps.indexOf(currentStep);
  const isLastStep = currentStepIndex === steps.length - 1;

  // handleStepClick wurde durch onStepSelect (aus Props) ersetzt

  return (
    // Wir fügen .ui-panel hier hinzu, um das Panel-Design anzuwenden
    <div className="sidebar-panel ui-panel">
      {/* Wir verwenden wieder deine originale <ul> Struktur */}
      <ul>
        {steps.map((step, index) => {
          
          let label = stepTranslations[step];
          const isDisabled = index > maxStepIndex; // Prüfe, ob der Schritt gesperrt ist

          // --- KLASSENLOGIK ANGEPASST ---\
          let liClass = '';
          if (currentStep === step) liClass = 'active';
          if (isDisabled) liClass += ' disabled'; // Füge 'disabled' Klasse hinzu
          
          return (
            <li 
              key={step}
              className={liClass}
              // --- ONCLICK ANGEPASST ---\
              // Erlaube Klick nur, wenn nicht disabled
              onClick={() => !isDisabled && onStepSelect(step)} 
            >
              {label}
            </li>
          );
        })}
      </ul>

      {/* --- GEÄNDERT: Navigations-Buttons statt "Finalize" --- */}
      <div className="sidebar-navigation">
        <button 
          className="ui-button" 
          onClick={onPrev}
          // Deaktiviere "Zurück" auf dem ersten Schritt
          disabled={currentStepIndex === 0} 
        >
          {t('common.back')} {/* +++ GEÄNDERT +++ */}
        </button>
        <button 
          className="ui-button" 
          onClick={onNext}
        >
          {/* +++ GEÄNDERT +++ */}
          {/* Ändere den Button-Text auf dem letzten Schritt */}
          {isLastStep ? t('creation.finalize') : t('common.next')}
        </button>
      </div>
    </div>
  );
};