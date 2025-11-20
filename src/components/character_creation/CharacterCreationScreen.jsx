// src/components/character_creation/CharacterCreationScreen.jsx
import React, { useState, useCallback } from "react";
import "./CharacterCreationScreen.css";
import { CreationSidebar } from "./CreationSidebar";
import { SelectionPanel } from "./SelectionPanel";
import { useTranslation } from "react-i18next";

// Importiere die Daten (werden für Validierung benötigt)
import allRaceData from "../../data/races.json";
import allClassData from "../../data/classes.json";
import allBackgroundData from "../../data/backgrounds.json";

// +++ NEU: Import der Inventory Engine +++
import { initializeInventory } from '../../engine/inventoryEngine';

// --- Die Schlüssel für die Schritte ---
const STEPS = ['Class', 'Background', 'Race', 'Abilities', 'Identity', 'Zusammenfassung'];

export const CharacterCreationScreen = ({ onCharacterFinalized }) => {
  const { t } = useTranslation();

  // --- stepTranslations dynamisch ---
  const stepTranslations = {
    Race: t('creation.step_race'),
    Class: t('creation.step_class'),
    Background: t('creation.step_background'),
    Abilities: t('creation.step_abilities'),
    Identity: t('creation.step_identity'),
    Zusammenfassung: t('creation.step_summary'),
  };

  const [currentStep, setCurrentStep] = useState(STEPS[0]);
  const [maxStepIndex, setMaxStepIndex] = useState(0); 

  // Zentraler State für den Charakter
  const [character, setCharacter] = useState({
    name: "",
    race: null,
    class: null,
    background: null,
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    skills: [],
    level: 1,
    experience: 0,
    
    // +++ NEU: Platzhalter für Inventar & Geld (werden am Ende befüllt) +++
    inventory: [],
    wallet: { gold: 0, silver: 0, copper: 0 },
    
    // Optionale Felder
    subclassKey: null, 
    feat_choices: {},     // Für Talente wie "Magischer Adept"
    background_options: { // Für Hintergrund-Wahl (Ausrüstung A/B)
        equipmentOption: 'a',
        asiMode: 'focus',
        bonuses: {}
    } 
  });

  // Funktion zum Aktualisieren des Charakters
  const updateCharacter = useCallback((updates) => {
    setCharacter((prev) => ({ ...prev, ...updates }));
  }, []);

  const currentStepIndex = STEPS.indexOf(currentStep);

  const handleStepSelect = (stepName) => {
    const stepIndex = STEPS.indexOf(stepName);
    if (stepIndex <= maxStepIndex) {
      setCurrentStep(stepName);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(STEPS[currentStepIndex - 1]);
    }
  };

  // Validierung (bleibt gleich)
  const canProceed = () => {
    const char = character;
    switch (currentStep) {
      case 'Class':
        return !!char.class;
      case 'Background':
        return !!char.background;
      case 'Race':
        if (!char.race) return false;
        // Subrace-Check
        if (char.race.subraces && char.race.subraces.length > 0 && !char.subraceKey) return false;
        return !!char.race;
      case 'Abilities':
        // Optional: Prüfen, ob Punkte verteilt sind
        return true; 
      case 'Identity':
        return !!char.name && char.name.trim() !== "";
      default:
        return true;
    }
  };

  const handleNextStep = () => {
    // --- FINALISIERUNG DES CHARAKTERS ---
    if (currentStepIndex === STEPS.length - 1) {
      
      // 1. Inventar & Geld berechnen (mithilfe der neuen Engine)
      const { inventory, wallet } = initializeInventory(character);

      // 2. Finales Objekt zusammenbauen
      const finalCharacter = {
        ...character,
        inventory, // Das berechnete Inventar
        wallet,    // Das berechnete Geld
        stats: {
          ...character.stats,
          // Stelle sicher, dass HP voll sind beim Start
          currentHp: character.stats?.maxHp || 10, 
          languages: [
             "common", // Common ist immer dabei (fest)
             ...Object.values(character.selectedLanguages || {}) 
        ]
        }
      };

      console.log("Charakter fertiggestellt & Inventar generiert:", finalCharacter);
      
      // 3. An die App übergeben
      onCharacterFinalized(finalCharacter);
    } 
    // --- NORMALER SCHRITT ---
    else if (currentStepIndex < STEPS.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStep(STEPS[nextIndex]);
      setMaxStepIndex(Math.max(maxStepIndex, nextIndex));
    }
  };

  return (
    <div className="creation-screen-container">
      <CreationSidebar
        steps={STEPS} 
        stepTranslations={stepTranslations}
        currentStep={currentStep}
        maxStepIndex={maxStepIndex} 
        onStepSelect={handleStepSelect} 
        onPrev={handlePrevStep} 
        onNext={handleNextStep} 
        character={character}
        canProceed={canProceed()} // Validierung an Sidebar übergeben für Button-Status
      />
      
      <SelectionPanel
        currentStep={currentStep}
        character={character}
        updateCharacter={updateCharacter}
        allRaceData={allRaceData}
        allClassData={allClassData}
        allBackgroundData={allBackgroundData}
      />
    </div>
  );
};