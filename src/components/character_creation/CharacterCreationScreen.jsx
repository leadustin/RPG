// src/components/character_creation/CharacterCreationScreen.jsx
import React, { useState, useCallback } from "react";
import "./CharacterCreationScreen.css";
import { CreationSidebar } from "./CreationSidebar";
import { SelectionPanel } from "./SelectionPanel";
import StartingEquipmentSelection from "./StartingEquipmentSelection"; 
import { useTranslation } from "react-i18next";

import allRaceData from "../../data/races.json";
import allClassData from "../../data/classes.json";
import allBackgroundData from "../../data/backgrounds.json";

// WICHTIG: Import der Engine-Funktion
import { initializeInventory } from '../../engine/inventoryEngine';

const STEPS = ['Class', 'Background', 'Race', 'Abilities', 'Identity', 'Equipment', 'Zusammenfassung'];

export const CharacterCreationScreen = ({ onCharacterFinalized }) => {
  const { t } = useTranslation();

  const stepTranslations = {
    Race: t('creation.step_race'),
    Class: t('creation.step_class'),
    Background: t('creation.step_background'),
    Abilities: t('creation.step_abilities'),
    Identity: t('creation.step_identity'),
    Equipment: "Ausrüstung",
    Zusammenfassung: t('creation.step_summary'),
  };

  const [currentStep, setCurrentStep] = useState(STEPS[0]);
  const [maxStepIndex, setMaxStepIndex] = useState(0); 
  const [errorMsg, setErrorMsg] = useState(""); 

  // State für die gewählte Klassen-Ausrüstung (Option A/B)
  const [startingEquipment, setStartingEquipment] = useState(null);

  const defaultRace = allRaceData.find((r) => r.key === "human");
  const defaultClass = allClassData.find((c) => c.key === "fighter");
  const defaultBackground = allBackgroundData.find((b) => b.key === "soldier");

  const [character, setCharacter] = useState({
    name: "",
    race: defaultRace,
    subrace: null,
    class: defaultClass,
    subclass: null,
    background: defaultBackground,
    abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    skills: [],
    alignment: "",
    appearance: {
        gender: "male",
        hairColor: "#000000",
        skinColor: "#f5c295",
        eyeColor: "#000000",
        portrait: null
    },
    level: 1,
    xp: 0,
    hp: 10,
    maxHp: 10,
    inventory: [], 
    gold: 0        
  });

  const handleCharacterUpdate = useCallback((updates) => {
    setCharacter((prev) => ({ ...prev, ...updates }));
    setErrorMsg(""); 
  }, []);

  const handleStepSelect = (step) => {
    const stepIndex = STEPS.indexOf(step);
    if (stepIndex <= maxStepIndex) {
      setCurrentStep(step);
      setErrorMsg("");
    }
  };

  const handlePrevStep = () => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1]);
      setErrorMsg("");
    }
  };

  const handleNextStep = () => {
    const currentStepIndex = STEPS.indexOf(currentStep);

    // Validierung Identity
    if (currentStep === 'Identity') {
        if (!character.name || character.name.trim() === "") {
            setErrorMsg(t('creation.error_name_required'));
            return;
        }
    }

    // Validierung Equipment
    if (currentStep === 'Equipment') {
        if (!startingEquipment) {
            setErrorMsg("Bitte wähle eine Option für die Startausrüstung.");
            return;
        }
    }

    // --- FINALISIERUNG ---
    if (currentStep === 'Zusammenfassung') {
      
      // FIX: Hier nutzen wir jetzt initializeInventory, um ALLES zusammenzuführen
      // (Klasse + Hintergrund + Gold)
      const { inventory, gold } = initializeInventory(character, startingEquipment);

      // Daten konsolidieren (Sprachen/Tools)
      const consolidatedLanguages = [
        ...(character.race?.languages || []),
        ...(character.background_choices?.languages || [])
      ];
      
      const consolidatedTools = [
        ...(character.class?.proficiencies?.tools || []),
        ...(character.background_choices?.tools || [])
      ];

      const finalCharacter = {
        ...character,
        // Wir speichern hier nur die Keys, um den State klein zu halten
        // (Die Re-Hydrierung passiert in useGameState)
        class: character.class.key, 
        race: character.race.key,   
        subclass: character.subclass ? character.subclass.key : null,
        background: character.background.key, 
        
        // Hier kommen die berechneten Werte rein
        gold: gold,
        inventory: inventory,

        background_choices: {
            languages: consolidatedLanguages,
            tools: consolidatedTools
        },
        languages: consolidatedLanguages 
      };

      console.log("Charakter validiert & fertiggestellt:", finalCharacter);
      
      onCharacterFinalized(finalCharacter);
    } 
    // --- NORMALER SCHRITT ---
    else if (currentStepIndex < STEPS.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStep(STEPS[nextIndex]);
      setMaxStepIndex(Math.max(maxStepIndex, nextIndex));
      setErrorMsg("");
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
      />
      
      <div className="panel-content-wrapper">
          {/* Fehlermeldung anzeigen */}
          {errorMsg && (
            <div className="validation-error-banner">
                ⚠️ {errorMsg}
            </div>
          )}
          
          {/* Bedingte Anzeige */}
          {currentStep === 'Equipment' ? (
            <StartingEquipmentSelection 
              classData={character.class}
              onSelect={setStartingEquipment}
            />
          ) : (
            <SelectionPanel
              currentStep={currentStep}
              character={character}
              updateCharacter={handleCharacterUpdate} 
            />
          )}
      </div>
    </div>
  );
};