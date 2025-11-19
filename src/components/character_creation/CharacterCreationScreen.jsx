// src/components/character_creation/CharacterCreationScreen.jsx
import React, { useState, useCallback } from "react";
import "./CharacterCreationScreen.css";
import { CreationSidebar } from "./CreationSidebar";
import { SelectionPanel } from "./SelectionPanel";
import { useTranslation } from "react-i18next";

import allRaceData from "../../data/races.json";
import allClassData from "../../data/classes.json";
import allBackgroundData from "../../data/backgrounds.json";

// --- Die Schlüssel für die Schritte (bleiben gleich) ---
const STEPS = ['Class', 'Background', 'Race', 'Abilities', 'Identity', 'Zusammenfassung'];

// --- stepTranslations wird jetzt dynamisch mit t() erstellt ---
// (Muss *innerhalb* der Komponente stattfinden)

export const CharacterCreationScreen = ({ onCharacterFinalized }) => {
  const { t } = useTranslation(); // +++ NEU: Hook holen

  // --- NEU: stepTranslations hier dynamisch definieren ---
  const stepTranslations = {
    Race: t('creation.step_race'),
    Class: t('creation.step_class'),
    Background: t('creation.step_background'),
    Abilities: t('creation.step_abilities'), // "Fähigkeiten"
    Identity: t('creation.step_identity'), // "Identität"
    Zusammenfassung: t('creation.step_summary'), // "Zusammenfassung"
  };
  // --- ENDE NEU ---

  const [currentStep, setCurrentStep] = useState(STEPS[0]);
  const [maxStepIndex, setMaxStepIndex] = useState(0); 

  // Standard-Rasse (Mensch) und deren Standard-Werte holen
  const defaultRace = allRaceData.find((r) => r.key === "human");
  const defaultProps = defaultRace?.physical_props;

  const [character, setCharacter] = useState({
    // --- GEÄNDERT: Logik-Werte statt übersetzter Strings ---
    name: t('creation.default_name'), // "Held" -> t()
    gender: "male", // "Männlich" -> "male"
    age: defaultProps?.age?.default || 20,
    height: defaultProps?.height?.default || 1.75,
    weight: defaultProps?.weight?.default || 75,
    alignment: "n", // "Neutral" -> "n"
    // --- ENDE ÄNDERUNG ---
    race: allRaceData.find((r) => r.key === "human"),
    subrace: null,
    ancestry: null,
    class: allClassData.find((c) => c.key === "fighter"),
    subclassKey: null,
    cantrips_known: [],
    spells_known: [],
    spells_prepared: [],
    spellbook: [],
    fighting_style: null,
    favored_enemy: null,
    natural_explorer: null,
    expertise_choices: [],
    class_tool_choice: null,
    tool_proficiencies_choice: [], // Für Barden
    background: allBackgroundData[0],
    abilities: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 },
    ability_bonus_assignments: {}, 
    floating_bonus_assignments: {}, 
    skill_proficiencies_choice: [],
    weapon_mastery_choices: [],
    background_choices: {
      languages: [],
      tools: [],
    },
    level: 1,
    experience: 0
  });

  // +++ GEÄNDERT: useCallback und Functional Update Pattern um Loop zu verhindern +++
  const updateCharacter = useCallback((newValues) => {
    setCharacter((prevCharacter) => {
      const updatedValues = { ...newValues };

      // Logik zum Zurücksetzen des Hintergrunds
      if (
        updatedValues.background &&
        updatedValues.background.key !== prevCharacter.background.key
      ) {
        updatedValues.background_choices = { languages: [], tools: [] };
      }

      // Logik für Rassenwechsel
      if (updatedValues.race && updatedValues.race.key !== prevCharacter.race.key) {
        const newRaceProps = updatedValues.race.physical_props;
        if (newRaceProps) {
          updatedValues.age = newRaceProps.age?.default || 25;
          updatedValues.height = newRaceProps.height?.default || 1.75;
          updatedValues.weight = newRaceProps.weight?.default || 75;
        }
        updatedValues.subrace = null; 
        updatedValues.ancestry = null;
        updatedValues.portrait = null; 
        
        if (!updatedValues.gender) {
          updatedValues.gender = prevCharacter.gender;
        }
      }

      return {
        ...prevCharacter,
        ...updatedValues,
      };
    });
  }, []); // Keine Abhängigkeiten -> stabile Referenz
  // +++ ENDE GEÄNDERT +++

  // --- NEUE NAVIGATIONS-HANDLER ---
  const currentStepIndex = STEPS.indexOf(currentStep);

  const handleStepSelect = (step) => {
    const selectedIndex = STEPS.indexOf(step);
    // Erlaube Klick nur, wenn der Schritt bereits freigeschaltet ist
    if (selectedIndex <= maxStepIndex) {
      setCurrentStep(step);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(STEPS[currentStepIndex - 1]);
    }
  };
  
  // Eine einfache Validierungsfunktion
const isStepValid = (step, char) => {
  switch (step) {
    case 'Class':
      return !!char.class; // Klasse muss gewählt sein
    case 'Race':
      // Z.B. wenn Subrassen existieren, muss eine gewählt sein
      const needsSubrace = char.race?.subraces && char.race.subraces.length > 0;
      if (needsSubrace && !char.subrace) return false;
      return !!char.race;
    case 'Abilities':
      // Prüfen, ob alle Punkte verteilt sind (Beispiel-Logik)
      // return char.pointsRemaining === 0; 
      return true; 
    case 'Identity':
      return !!char.name && char.name.trim() !== "";
    default:
      return true;
  }
};

  const handleNextStep = () => {
    // Wenn der "Weiter"-Button auf dem letzten Schritt geklickt wird
    if (currentStepIndex === STEPS.length - 1) {
      onCharacterFinalized(character);
    } 
    // Normaler "Weiter"-Klick
    else if (currentStepIndex < STEPS.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStep(STEPS[nextIndex]);
      // Schalte den nächsten Schritt frei
      setMaxStepIndex(Math.max(maxStepIndex, nextIndex));
    }
  };
  // --- ENDE NEUE HANDLER ---

  return (
    // Das Container-Div ist jetzt einfacher
    <div className="creation-screen-container">
      <CreationSidebar
        steps={STEPS} 
        stepTranslations={stepTranslations} // Das dynamische Objekt übergeben
        currentStep={currentStep}
        maxStepIndex={maxStepIndex} 
        onStepSelect={handleStepSelect} 
        onPrev={handlePrevStep} 
        onNext={handleNextStep} 
        character={character}
      />
      {/* SelectionPanel bleibt für die Logik der Inhaltsanzeige verantwortlich */}
      <SelectionPanel
        currentStep={currentStep}
        character={character}
        updateCharacter={updateCharacter}
      />
    </div>
  );
};