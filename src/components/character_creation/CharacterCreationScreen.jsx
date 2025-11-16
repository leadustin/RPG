// src/components/character_creation/CharacterCreationScreen.jsx
import React, { useState } from "react";
import "./CharacterCreationScreen.css";
import { CreationSidebar } from "./CreationSidebar";
import { SelectionPanel } from "./SelectionPanel";
import { useTranslation } from "react-i18next"; // +++ NEU

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

  const updateCharacter = (newValues) => {
    // Dein alter Code zum Zurücksetzen des Hintergrunds
    if (
      newValues.background &&
      newValues.background.key !== character.background.key
    ) {
      newValues.background_choices = { languages: [], tools: [] };
    }

    // +++ START: NEUE LOGIK FÜR RASSENWECHSEL +++
    // Wenn sich die Rasse ändert...
    if (newValues.race && newValues.race.key !== character.race.key) {
      const newRaceProps = newValues.race.physical_props;
      if (newRaceProps) {
        // ... setze Alter, Größe und Gewicht auf die Standardwerte der NEUEN Rasse
        newValues.age = newRaceProps.age?.default || 25;
        newValues.height = newRaceProps.height?.default || 1.75;
        newValues.weight = newRaceProps.weight?.default || 75;
      }
      // Setze auch Subrasse, Portrait etc. zurück
      newValues.subrace = null; 
      newValues.ancestry = null;
      newValues.portrait = null; // Wichtig, damit das useEffect in IdentitySelection greift
      
      // WICHTIG: Auch Gender zurücksetzen, damit useEffect das richtige Portrait lädt
      // (Stellt sicher, dass 'gender' nicht auf 'null' gesetzt wird, falls es nicht in newValues ist)
      if (!newValues.gender) {
        newValues.gender = character.gender; // Behalte das aktuelle Gender
      }
    }
    // +++ ENDE: NEUE LOGIK FÜR RASSENWECHSEL +++

    setCharacter((prevCharacter) => ({
      ...prevCharacter,
      ...newValues,
    }));
  };

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