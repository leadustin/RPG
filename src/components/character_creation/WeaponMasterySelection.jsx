// src/components/character_creation/WeaponMasterySelection.jsx
import React from 'react';
import './PanelDetails.css';
import './SkillSelection.css';

// +++ NEU: Tooltip-Komponenten importieren +++
import Tooltip from '../tooltip/Tooltip'; // Der generische Wrapper
import { WeaponMasteryTooltip } from '../tooltip/WeaponMasteryTooltip';

// +++ NEU: Die Detail-Daten importieren +++
import masteryDetails from '../../data/weaponMasteryDetails.json';
// +++ DEBUGGING 1: PRÜFEN, OB DIE DATEI GELADEN WIRD +++
console.log("Mastery Details (Ganze Datei):", masteryDetails);


// +++
// +++ VITE-ERSATZ für require.context +++
// +++

// 1. Lade alle Bildmodule aus dem 'weaponmasteries'-Ordner
const proficiencyIconModules = import.meta.glob(
  '../../assets/images/weaponmasteries/*.(webp|png|jpe?g|svg)',
  { eager: true } // 'eager: true' lädt sie sofort
);

// 2. Verarbeite die Module in das Format, das dein Code erwartet
// (z.B. { 'Streitaxt': '/path/to/Streitaxt.png' })
const proficiencyIcons = {};
for (const path in proficiencyIconModules) {
  const iconUrl = proficiencyIconModules[path].default; // 'default' ist die URL
  // Extrahiere den Dateinamen (z.B. "Streitaxt") als Key
  const key = path
    .split('/')
    .pop() // Dateiname.ext
    .replace(/\.(webp|png|jpe?g|svg)$/, ''); // Dateiname
  proficiencyIcons[key] = iconUrl;
}

// +++ 
// +++ ENDE VITE-ERSATZ +++
// +++


export const WeaponMasterySelection = ({ character, updateCharacter }) => {
  const selectedClass = character.class;
  
  // Prüfe, ob die Klasse Weapon Mastery hat
  if (!selectedClass.weapon_mastery) {
    return null;
  }

  const { level_1_count, level_9_count, available_weapons } = selectedClass.weapon_mastery;
  const currentLevel = character.level || 1;
  
  // Bestimme die Anzahl der verfügbaren Auswahlen basierend auf der Stufe
  const maxChoices = currentLevel >= 9 ? level_9_count : level_1_count;
  
  // Hole die aktuellen Auswahlen aus dem Character-Objekt
  const currentSelections = character.weapon_mastery_choices || [];

  const handleToggle = (weapon) => {
    let newSelections = [...currentSelections];
    
    if (newSelections.includes(weapon)) {
      // Waffe entfernen
      newSelections = newSelections.filter(w => w !== weapon);
    } else if (newSelections.length < maxChoices) {
      // Waffe hinzufügen
      newSelections.push(weapon);
    }
    
    updateCharacter({ weapon_mastery_choices: newSelections });
  };

  return (
    <div className="weapon-mastery-selection">
      <div className="details-divider"></div>
      <h3>Waffenbeherrschung {currentSelections.length}/{maxChoices}</h3>
      <p className="panel-details-description">
        Du beherrschst spezielle Techniken mit bestimmten Waffen. Wähle {maxChoices} Waffen, 
        mit denen du ihre Mastery-Eigenschaft nutzen kannst.
      </p>

      <div className="skill-grid">
        {available_weapons.map(weapon => {
          const isSelected = currentSelections.includes(weapon);
          
          // Icon-Logik
          const iconSrc = proficiencyIcons[weapon]; // z.B. proficiencyIcons["Streitaxt"]
          
          // +++ NEU: Tooltip-Daten holen +++
          // Wir holen die Daten für die Waffe (z.B. "Streitaxt") aus der importierten JSON
          const tooltipData = masteryDetails[weapon];
// +++ DEBUGGING 2: PRÜFEN, OB DER SCHLÜSSEL GEFUNDEN WIRD +++
          console.log(`Suche Schlüssel: '${weapon}' | Daten gefunden:`, tooltipData);
          return (
            // +++ NEU: Button mit Tooltip umwickelt +++
            <Tooltip
              key={weapon}
              // 'content' prop an den Wrapper übergeben
              content={
                <WeaponMasteryTooltip 
                  name={weapon} // Name der Waffe
                  data={tooltipData} // Das ganze Datenobjekt
                />
              }
              // (Passen Sie 'position' oder andere Props an, falls Ihr Tooltip-Wrapper sie benötigt)
            >
              <button
                className={`skill-choice ${isSelected ? 'selected' : ''} ${iconSrc ? 'has-icon' : ''}`}
                onClick={() => handleToggle(weapon)}
                disabled={!isSelected && currentSelections.length >= maxChoices}
              >
                
                {/* --- ANGEPASSTE RENDER-LOGIK --- */}
                {/* WENN Icon existiert, DANN zeige Icon, SONST zeige Text */}
                {iconSrc ? (
                  <img 
                    src={iconSrc} 
                    alt={weapon}
                    className="skill-icon" // Die CSS-Klasse, die schon funktioniert
                  />
                ) : (
                  <span>{weapon}</span>
                )}
                {/* --- ENDE ANPASSUNG --- */}

              </button>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
};