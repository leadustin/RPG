// src/components/character_creation/CharacterCreationScreen.js
import React, { useState } from "react";
import "./CharacterCreationScreen.css";
import { CreationSidebar } from "./CreationSidebar";
import { SelectionPanel } from "./SelectionPanel"; // Bleibt erhalten

import allRaceData from "../../data/races.json";
import allClassData from "../../data/classes.json";
import allBackgroundData from "../../data/backgrounds.json";

export const CharacterCreationScreen = ({ onCharacterFinalized }) => {
  const [currentStep, setCurrentStep] = useState("Race");

  // HINWEIS: Dies ist DEIN useState-Block, wie gewünscht.
  const [character, setCharacter] = useState({
    name: "Held",
    gender: "Männlich",
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
    tool_proficiencies_choice: [], // Für Barde
    background: allBackgroundData[0],
    abilities: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 },
    ability_bonus_assignments: {}, // NEU: Leeres Objekt. Wird von AbilitySelection gefüllt.
    floating_bonus_assignments: {}, // (Wird nicht mehr verwendet, kann später entfernt werden)
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
    if (
      newValues.background &&
      newValues.background.key !== character.background.key
    ) {
      newValues.background_choices = { languages: [], tools: [] };
    }

    setCharacter((prevCharacter) => ({
      ...prevCharacter,
      ...newValues,
    }));
  };

  const handleFinalize = () => {
    onCharacterFinalized(character);
  };

  return (
    // Das Container-Div ist jetzt einfacher
    <div className="creation-screen-container">
      <CreationSidebar
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        character={character}
        onFinalize={handleFinalize}
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