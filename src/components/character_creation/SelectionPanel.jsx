// src/components/character_creation/SelectionPanel.jsx
import React from "react";
import "./SelectionPanel.css";
import { RaceSelection } from "./RaceSelection";
import { ClassSelection } from "./ClassSelection";
import { AbilitySelection } from "./AbilitySelection";
import { BackgroundSelection } from "./BackgroundSelection";
import { SummaryPanel } from "./SummaryPanel"; 
import { SubraceSelection } from "./SubraceSelection";
import { AncestrySelection } from "./AncestrySelection";
import { IdentitySelection } from './IdentitySelection';

export const SelectionPanel = ({
  currentStep,
  character,
  updateCharacter,
}) => {

  const selectedRace = character.race;
  const hasSubraces = selectedRace?.subraces && selectedRace.subraces.length > 0;
  const hasAncestries = selectedRace?.ancestries && selectedRace.ancestries.length > 0;

  const renderStep = () => {
    switch (currentStep) {
      case "Race":
        return (
          <RaceSelection
            character={character}
            updateCharacter={updateCharacter}
          />
        );
      case "Subrace":
        if (hasSubraces) {
          return (
            <SubraceSelection 
              subraces={selectedRace.subraces}
              selectedSubrace={character.subrace}
              onSubraceSelect={(subrace) => updateCharacter({ subrace: subrace })}
            />
          );
        }
        if (hasAncestries) {
          return (
             <AncestrySelection
              ancestries={selectedRace.ancestries}
              selectedAncestry={character.ancestry}
              onAncestrySelect={(ancestry) => updateCharacter({ ancestry: ancestry })}
            />
          );
        }
        return <div>Für dieses Volk ist keine Unterart oder Abstammung verfügbar.</div>;
      case "Class":
        return (
          <ClassSelection
            character={character}
            updateCharacter={updateCharacter}
          />
        );
      case "Background":
        return (
          <BackgroundSelection
            character={character}
            updateCharacter={updateCharacter}
          />
        );
      case "Abilities":
        return (
          <AbilitySelection
            character={character}
            updateCharacter={updateCharacter}
          />
        );
      
      // --- NEUEN CASE HINZUFÜGEN ---
      case "Identity":
        return <IdentitySelection character={character} updateCharacter={updateCharacter} />;
      // --- ENDE NEU ---
        
      case "Zusammenfassung":
        return (
          <SummaryPanel 
            character={character} 
          />
        );
      default:
        return <div>Schritt nicht gefunden: {currentStep}</div>;
    }
  };

  return (
    // HINZUGEFÜGT: .ui-panel Klasse
    <main className="selection-panel ui-panel">
      {renderStep()}
    </main>
  );
};