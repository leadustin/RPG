// src/components/character_creation/SpellSelection.js
import React, { useState, useEffect } from 'react';
import allSpells from '../../data/spells.json';
import { getAbilityModifier } from '../../engine/characterEngine';
import './PanelDetails.css';
import './SkillSelection.css'; // Wiederverwendung der Stile

// Logik für die Anzahl der Zauber auf Stufe 1
const getSpellCounts = (character) => {
  const classKey = character.class.key;
  const intMod = getAbilityModifier(character.abilities.int);
  const wisMod = getAbilityModifier(character.abilities.wis);

  switch (classKey) {
    case 'wizard':
      return { 
        cantrips: 3, 
        level1Spells: 6, // 6 Zauber ins Zauberbuch eintragen
        spellType: 'spellbook' 
      };
    case 'sorcerer':
      return { 
        cantrips: 4, 
        level1Spells: 2, // 2 bekannte Zauber
        spellType: 'known' 
      };
    case 'bard':
      return { 
        cantrips: 2, 
        level1Spells: 4, // 4 bekannte Zauber
        spellType: 'known' 
      };
    case 'warlock':
      return { 
        cantrips: 2, 
        level1Spells: 2, // 2 bekannte Zauber
        spellType: 'known' 
      };
    case 'cleric':
      return { 
        cantrips: 3, 
        level1Spells: Math.max(1, wisMod + character.level), // Vorbereitete Zauber
        spellType: 'prepare' 
      };
    case 'druid':
      return { 
        cantrips: 2, 
        level1Spells: Math.max(1, wisMod + character.level), // Vorbereitete Zauber
        spellType: 'prepare' 
      };
    default:
      return { cantrips: 0, level1Spells: 0, spellType: null };
  }
};

export const SpellSelection = ({ character, updateCharacter }) => {
  const { cantrips, level1Spells, spellType } = getSpellCounts(character);

  const [availableCantrips, setAvailableCantrips] = useState([]);
  const [availableLevel1Spells, setAvailableLevel1Spells] = useState([]);

  useEffect(() => {
    const classKey = character.class.key;
    // Finde alle Zauber für diese Klasse
    const classSpells = allSpells.filter(spell => spell.classes.includes(classKey));
    
    // Kleriker erhalten Domänenzauber (falls Subklasse gewählt)
    if (classKey === 'cleric' && character.subclassKey) {
        const subclass = character.class.subclasses.find(sc => sc.key === character.subclassKey);
        const domainSpellKeys = subclass.features.find(f => f.name === "Domänenzauber")?.description.match(/\'(.*?)\'/g).map(s => s.replace(/'/g, ''));
        // HIER: Logik, um 'domainSpellKeys' zu 'availableLevel1Spells' hinzuzufügen
    }

    setAvailableCantrips(classSpells.filter(s => s.level === 0));
    setAvailableLevel1Spells(classSpells.filter(s => s.level === 1));

  }, [character.class.key, character.subclassKey]);

  // Handler für Zaubertricks (Cantrips)
  const handleCantripToggle = (spellKey) => {
    const currentSelection = character.cantrips_known || [];
    let newSelection = [...currentSelection];
    
    if (newSelection.includes(spellKey)) {
      newSelection = newSelection.filter(s => s !== spellKey);
    } else if (newSelection.length < cantrips) {
      newSelection.push(spellKey);
    }
    updateCharacter({ cantrips_known: newSelection });
  };

  // Handler für Lvl 1 Zauber
  const handleLevel1SpellToggle = (spellKey) => {
    // Magier fügt dem Zauberbuch hinzu
    if (spellType === 'spellbook') {
      const currentSelection = character.spellbook || [];
      let newSelection = [...currentSelection];
      if (newSelection.includes(spellKey)) {
        newSelection = newSelection.filter(s => s !== spellKey);
      } else if (newSelection.length < level1Spells) {
        newSelection.push(spellKey);
      }
      updateCharacter({ spellbook: newSelection });
    }
    // Andere Klassen (Barde, Zauberer etc.) lernen sie
    else if (spellType === 'known') {
      const currentSelection = character.spells_known || [];
      let newSelection = [...currentSelection];
      if (newSelection.includes(spellKey)) {
        newSelection = newSelection.filter(s => s !== spellKey);
      } else if (newSelection.length < level1Spells) {
        newSelection.push(spellKey);
      }
      updateCharacter({ spells_known: newSelection });
    }
    // Kleriker/Druide bereiten sie vor
    else if (spellType === 'prepare') {
         const currentSelection = character.spells_prepared || [];
         let newSelection = [...currentSelection];
         if (newSelection.includes(spellKey)) {
           newSelection = newSelection.filter(s => s !== spellKey);
         } else if (newSelection.length < level1Spells) {
           newSelection.push(spellKey);
         }
         updateCharacter({ spells_prepared: newSelection });
    }
  };
  
  const getLvl1List = () => {
     if (spellType === 'spellbook') return character.spellbook || [];
     if (spellType === 'known') return character.spells_known || [];
     if (spellType === 'prepare') return character.spells_prepared || [];
     return [];
  }

  const getLvl1Title = () => {
    if (spellType === 'spellbook') return `Zauberbuch (Wähle ${level1Spells})`;
    if (spellType === 'known') return `Bekannte Zauber (Wähle ${level1Spells})`;
    if (spellType === 'prepare') return `Vorbereitete Zauber (Wähle ${level1Spells})`;
    return "Zauber Stufe 1";
  }

  return (
    <div className="spell-selection">
      {/* --- Sektion Zaubertricks --- */}
      <div className="details-divider"></div>
      <h3>Zaubertricks (Wähle {cantrips})</h3>
      <div className="skill-selection-grid">
        {availableCantrips.map(spell => (
          <button
            key={spell.key}
            className={`skill-button ${character.cantrips_known?.includes(spell.key) ? 'selected' : ''}`}
            onClick={() => handleCantripToggle(spell.key)}
          >
            {spell.name}
          </button>
        ))}
      </div>

      {/* --- Sektion Stufe 1 Zauber --- */}
      <div className="details-divider"></div>
      <h3>{getLvl1Title()}</h3>
      <div className="skill-selection-grid">
        {availableLevel1Spells.map(spell => (
          <button
            key={spell.key}
            className={`skill-button ${getLvl1List().includes(spell.key) ? 'selected' : ''}`}
            onClick={() => handleLevel1SpellToggle(spell.key)}
          >
            {spell.name}
          </button>
        ))}
      </div>
    </div>
  );
};