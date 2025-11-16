// src/components/character_creation/SpellSelection.jsx
import React from 'react';
import allSpells from '../../data/spells.json';
import { getAbilityModifier } from '../../engine/characterEngine';
import './PanelDetails.css';
import './SkillSelection.css';

// Logik für die Anzahl der Zauber auf Stufe 1
const getSpellCounts = (character) => {
  const classKey = character.class.key;
  // intMod wird derzeit nicht verwendet, aber könnte für zukünftige Klassen benötigt werden
  // const intMod = getAbilityModifier(character.abilities.int);
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
        level1Spells: Math.max(1, wisMod) + 1, // (1 + WEIS)
        spellType: 'prepare' 
      };
    case 'druid':
      return { 
        cantrips: 2, 
        level1Spells: Math.max(1, wisMod) + 1, // (1 + WEIS)
        spellType: 'prepare' 
      };
    default:
      return { cantrips: 0, level1Spells: 0, spellType: null };
  }
};

// Logik zur Abfrage der Spells (vereinfacht)
const getAvailableSpells = (classKey, spellLevel) => {
  return allSpells.filter(s => 
    s.level === spellLevel && 
    (s.classes.includes(classKey) || s.classes.includes("any"))
  );
};


export const SpellSelection = ({ 
  character, 
  updateCharacter,
  isOpenCantrips,
  isOpenSpells,
  onToggleCantrips,
  onToggleSpells,
  isCollapsible
}) => {
  
  const { cantrips, level1Spells, spellType } = getSpellCounts(character);
  
  const availableCantrips = getAvailableSpells(character.class.key, 0);
  const availableLevel1Spells = getAvailableSpells(character.class.key, 1);
  
  const currentSelections = getCurrentSelections(character, spellType);
  const currentCantripCount = character.cantrips_known?.length || 0;

  const handleCantripToggle = (spellKey) => {
    let newCantrips = [...(character.cantrips_known || [])];
    if (newCantrips.includes(spellKey)) {
      newCantrips = newCantrips.filter(k => k !== spellKey);
    } else if (newCantrips.length < cantrips) {
      newCantrips.push(spellKey);
    }
    updateCharacter({ cantrips_known: newCantrips });
  };

  const handleLvl1SpellToggle = (spellKey) => {
    let newSpells = [...currentSelections];
    if (newSpells.includes(spellKey)) {
      newSpells = newSpells.filter(k => k !== spellKey);
    } else if (newSpells.length < level1Spells) {
      newSpells.push(spellKey);
    }

    if (spellType === 'spellbook') updateCharacter({ spellbook: newSpells });
    if (spellType === 'known') updateCharacter({ spells_known: newSpells });
    if (spellType === 'prepare') updateCharacter({ spells_prepared: newSpells });
  };

  function getCurrentSelections(character, spellType) {
     if (spellType === 'spellbook') return character.spellbook || [];
     if (spellType === 'known') return character.spells_known || [];
     if (spellType === 'prepare') return character.spells_prepared || [];
     return [];
  }

  // === GEÄNDERT: Nimmt die aktuelle Anzahl entgegen ===
  const getLvl1Title = (count) => {
    if (spellType === 'spellbook') return `Zauberbuch ${count}/${level1Spells}`;
    if (spellType === 'known') return `Bekannte Zauber ${count}/${level1Spells}`;
    if (spellType === 'prepare') return `Vorbereitete Zauber ${count}/${level1Spells}`;
    return "Zauber Stufe 1";
  }
  // === ENDE ÄNDERUNG ===

  // --- RENDER-LOGIK ---
  if (isCollapsible) {
    // VARIANTE A: FÜR MAGIER (einklappbar)
    const cantripHeaderClassName = `collapsible-header ${isOpenCantrips ? 'open' : ''}`;
    const spellHeaderClassName = `collapsible-header ${isOpenSpells ? 'open' : ''}`;

    return (
      <div className="spell-selection">
        {/* --- Sektion Zaubertricks --- */}
        <div className="details-divider"></div>
        {/* === GEÄNDERT === */}
        <h3 className={cantripHeaderClassName} onClick={onToggleCantrips}>
          Zaubertricks {currentCantripCount}/{cantrips}
        </h3>
        {/* === ENDE ÄNDERUNG === */}
        {isOpenCantrips && (
          <div className="skill-grid">
            {availableCantrips.map(spell => (
              <button
                key={spell.key}
                className={`skill-choice ${character.cantrips_known?.includes(spell.key) ? 'selected' : ''}`}
                onClick={() => handleCantripToggle(spell.key)}
              >
                {spell.name}
              </button>
            ))}
          </div>
        )}

        {/* --- Sektion Stufe 1 Zauber --- */}
        <div className="details-divider"></div>
        {/* === GEÄNDERT === */}
        <h3 className={spellHeaderClassName} onClick={onToggleSpells}>
          {getLvl1Title(currentSelections.length)}
        </h3>
        {/* === ENDE ÄNDERUNG === */}
        {isOpenSpells && (
          <div className="skill-grid">
            {availableLevel1Spells.map(spell => (
              <button
                key={spell.key}
                className={`skill-choice ${currentSelections.includes(spell.key) ? 'selected' : ''}`}
                onClick={() => handleLvl1SpellToggle(spell.key)}
              >
                {spell.name}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // VARIANTE B: FÜR ALLE ANDEREN (statisch)
  return (
    <div className="spell-selection">
      {/* --- Sektion Zaubertricks --- */}
      <div className="details-divider"></div>
      {/* === GEÄNDERT === */}
      <h3>Zaubertricks {currentCantripCount}/{cantrips}</h3>
      {/* === ENDE ÄNDERUNG === */}
      <div className="skill-grid">
        {availableCantrips.map(spell => (
          <button
            key={spell.key}
            className={`skill-choice ${character.cantrips_known?.includes(spell.key) ? 'selected' : ''}`}
            onClick={() => handleCantripToggle(spell.key)}
          >
            {spell.name}
          </button>
        ))}
      </div>

      {/* --- Sektion Stufe 1 Zauber --- */}
      <div className="details-divider"></div>
      {/* === GEÄNDERT === */}
      <h3>{getLvl1Title(currentSelections.length)}</h3>
      {/* === ENDE ÄNDERUNG === */}
      <div className="skill-grid">
        {availableLevel1Spells.map(spell => (
          <button
            key={spell.key}
            className={`skill-choice ${currentSelections.includes(spell.key) ? 'selected' : ''}`}
            onClick={() => handleLvl1SpellToggle(spell.key)}
          >
            {spell.name}
          </button>
        ))}
      </div>
    </div>
  );
};