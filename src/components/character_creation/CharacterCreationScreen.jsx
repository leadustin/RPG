// src/components/character_creation/CharacterCreationScreen.jsx
import React, { useState, useCallback } from "react";
import "./CharacterCreationScreen.css";
import { CreationSidebar } from "./CreationSidebar";
import { SelectionPanel } from "./SelectionPanel";
import { useTranslation } from "react-i18next";

import allRaceData from "../../data/races.json";
import allClassData from "../../data/classes.json";
import allBackgroundData from "../../data/backgrounds.json";

import { initializeInventory } from '../../engine/inventoryEngine';

const STEPS = ['Class', 'Background', 'Race', 'Abilities', 'Identity', 'Zusammenfassung'];

export const CharacterCreationScreen = ({ onCharacterFinalized }) => {
  const { t } = useTranslation();

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
  const [errorMsg, setErrorMsg] = useState(""); // Für Validierungs-Meldungen

  const defaultRace = allRaceData.find((r) => r.key === "human");
  const defaultProps = defaultRace?.physical_props;

  const [character, setCharacter] = useState({
    name: t('creation.default_name'),
    gender: "male",
    age: defaultProps?.age?.default || 20,
    height: defaultProps?.height?.default || 1.75,
    weight: defaultProps?.weight?.default || 75,
    alignment: "n",
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
    tool_proficiencies_choice: [], 
    background: allBackgroundData[0],
    abilities: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 },
    ability_bonus_assignments: {}, 
    floating_bonus_assignments: {}, 
    skill_proficiencies_choice: [],
    weapon_mastery_choices: [],
    
    // Datenspeicher für UI-Komponenten
    selectedLanguages: {}, 
    feat_choices: {},     
    background_options: { equipmentOption: 'a', asiMode: 'focus', bonuses: {} },

    // Platzhalter
    background_choices: { languages: [], tools: [] }, // <--- Das hier hat gefehlt/wurde nicht befüllt!
    inventory: [],
    wallet: { gold: 0, silver: 0, copper: 0 },
    level: 1,
    experience: 0
  });

  const updateCharacter = useCallback((newValues) => {
    setCharacter((prevCharacter) => {
      const updatedValues = { ...newValues };

      // Reset-Logik bei Hintergrund-Wechsel
      if (updatedValues.background && updatedValues.background.key !== prevCharacter.background.key) {
        updatedValues.background_choices = { languages: [], tools: [] };
        // Auch temporäre Auswahlen resetten
        updatedValues.feat_choices = {}; 
      }

      // Reset-Logik bei Rassen-Wechsel
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
        if (!updatedValues.gender) updatedValues.gender = prevCharacter.gender;
      }

      return { ...prevCharacter, ...updatedValues };
    });
  }, []);

  const currentStepIndex = STEPS.indexOf(currentStep);

  const handleStepSelect = (step) => {
    const selectedIndex = STEPS.indexOf(step);
    if (selectedIndex <= maxStepIndex) {
      setCurrentStep(step);
      setErrorMsg(""); // Fehler zurücksetzen bei Wechsel
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(STEPS[currentStepIndex - 1]);
      setErrorMsg("");
    }
  };

  // --- VALIDIERUNG: Prüft, ob alles Wichtige gewählt wurde ---
  const validateCharacter = (char) => {
    const errors = [];

    // 1. Name
    if (!char.name || char.name.trim() === "") {
      errors.push("Bitte gib deinem Charakter einen Namen (Identität).");
    }

    // 2. Sprachen (PHB 2024: Immer 2 Wahl-Sprachen im Hintergrund)
    // Wir prüfen, ob selectedLanguages 2 Einträge hat
    const langCount = Object.keys(char.selectedLanguages || {}).length;
    // Optional: Du kannst hier "2" hartcodieren oder es dynamisch machen, falls manche Rassen mehr/weniger haben.
    // Für jetzt warnen wir nur, wenn gar nichts gewählt wurde, um nicht zu strikt zu sein.
    if (langCount < 1) { 
       // errors.push("Du hast noch keine zusätzlichen Sprachen gewählt (Identität)."); 
       // (Kommentiert, falls du es optional lassen willst)
    }

    // 3. Talente/Feats (z.B. "Magischer Adept" braucht Zauber-Auswahl)
    if (char.background?.feat) {
       // Prüfen ob für das Talent eine Auswahl getroffen wurde, falls nötig
       // Das ist komplexer, da wir wissen müssten, welches Talent welche Wahl braucht.
       // Für den Moment überspringen wir tiefe Validierung hier.
    }

    return errors;
  };
  
  const handleNextStep = () => {
    // --- FINALISIERUNG ---
    if (currentStepIndex === STEPS.length - 1) {
      
      // 1. Validierung vor Abschluss
      const validationErrors = validateCharacter(character);
      if (validationErrors.length > 0) {
        setErrorMsg(validationErrors.join(" "));
        return; // Abbruch, nicht speichern!
      }

      // 2. Daten Konsolidieren (Das behebt den Absturz!)
      // Wir sammeln die verstreuten Daten ein
      const consolidatedLanguages = [
        "common", 
        ...Object.values(character.selectedLanguages || {})
      ];

      // Sammle Werkzeuge aus den Feat-Choices (z.B. Crafter)
      let consolidatedTools = [];
      if (character.feat_choices) {
         Object.values(character.feat_choices).forEach(choiceObj => {
             // Wenn es ein Tool ist (beginnt oft mit 'tool_' oder ist einfach ein String im Objekt)
             Object.entries(choiceObj).forEach(([key, val]) => {
                 if (val && (key.startsWith('tool') || key.startsWith('instrument') || key.startsWith('choice'))) {
                     // Prüfen ob es ein Tool ist (simple Heuristik oder Abgleich mit Listen)
                     consolidatedTools.push(val);
                 }
             });
         });
      }

      // 3. Inventar & Geld berechnen
      const { inventory, wallet } = initializeInventory(character);

      // 4. Finales Objekt zusammenbauen
      const finalCharacter = {
        ...character,
        inventory, 
        wallet,
        stats: {
          ...character.stats,
          currentHp: character.stats?.maxHp || 10, 
        },
        // Hier füllen wir das Feld, das useGameState erwartet:
        background_choices: {
            languages: consolidatedLanguages,
            tools: consolidatedTools
        },
        // Auch direkt auf Root-Ebene speichern, falls andere Komponenten es dort suchen
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
          
          <SelectionPanel
            currentStep={currentStep}
            character={character}
            updateCharacter={updateCharacter}
          />
      </div>
    </div>
  );
};