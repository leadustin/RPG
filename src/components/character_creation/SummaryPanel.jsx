// src/components/character_creation/SummaryPanel.jsx
import React, { useState } from 'react'; // *** GEÄNDERT: useState importiert ***
import './SummaryPanel.css';
import './PanelDetails.css'; 
import Tooltip from '../tooltip/Tooltip'; // Der "Wrapper"-Tooltip
import {
  getAbilityModifier,
  getProficiencyBonus,
  calculateInitialHP,
  calculateAC,
  getRacialAbilityBonus,
  calculateSkillBonus,
  isProficientInSkill,
  SKILL_MAP,
  SKILL_NAMES_DE,
  ABILITY_DESCRIPTIONS_DE, 
  SKILL_DESCRIPTIONS_DE,   
  COMBAT_STATS_DESCRIPTIONS_DE 
} from '../../engine/characterEngine';

import allSpells from "../../data/spells.json";
import allClassData from "../../data/classes.json";

// +++
// +++ VITE-ERSATZ für require.context +++
// +++

// 1. Lade alle Bildmodule aus dem 'portraits/human/male'-Ordner
const portraitModules = import.meta.glob(
  '../../assets/images/portraits/human/male/*.webp',
  { eager: true } // 'eager: true' lädt sie sofort
);

// 2. Verarbeite die Module in das Format, das dein Code erwartet
// (z.B. { '1.webp': '/path/to/1.webp' })
const racePortraits = {};
for (const path in portraitModules) {
  const iconUrl = portraitModules[path].default; // 'default' ist die URL
  // Extrahiere den Dateinamen (z.B. "1.webp") als Key
  const key = path.split('/').pop(); // "1.webp"
  racePortraits[key] = iconUrl;
}

// +++ 
// +++ ENDE VITE-ERSATZ +++
// +++


// --- Helfer-Komponenten (unverändert) ---

const StatDisplay = ({ statKey, label, value, modifier }) => {
  const description = ABILITY_DESCRIPTIONS_DE[statKey];
  return (
    <Tooltip text={description}>
      <li> 
        <div className="stat-display">
          <span className="stat-label">{label}</span>
          <span className="stat-value">{value}</span>
          <span className="stat-modifier">
            {modifier >= 0 ? `+${modifier}` : modifier}
          </span>
        </div>
      </li>
    </Tooltip>
  );
};

const SkillDisplay = ({ skillKey, character }) => {
  const bonus = calculateSkillBonus(character, skillKey);
  const proficient = isProficientInSkill(character, skillKey);
  const ability = SKILL_MAP[skillKey].toUpperCase();
  const name = SKILL_NAMES_DE[skillKey];
  const isExpertise = character.expertise_choices?.includes(skillKey);
  const description = SKILL_DESCRIPTIONS_DE[skillKey];

  return (
    <Tooltip text={description}>
      <li key={skillKey} className="skill-item">
        <div className="skill-info">
          <span className={`proficiency-dot ${proficient ? 'proficient' : ''}`}></span>
          <span>{name} {isExpertise ? "(E)" : ""} <span className="skill-ability">({ability})</span></span>
        </div>
        <span className="skill-bonus">{bonus >= 0 ? `+${bonus}` : bonus}</span>
      </li>
    </Tooltip>
  );
};

const CombatStatDisplay = ({ statKey, label, value }) => {
  const description = COMBAT_STATS_DESCRIPTIONS_DE[statKey];
  return (
    <Tooltip text={description}>
      <li>
        <div className="stat-box">
          <div className="stat-value">{value}</div>
          <div className="stat-label">{label}</div>
        </div>
      </li>
    </Tooltip>
  );
};
// --- Ende Helfer-Komponenten ---


export const SummaryPanel = ({ character }) => {
  
  // NEU: State für die einklappbare Fertigkeiten-Box
  const [isSkillsOpen, setIsSkillsOpen] = useState(true); // Standardmäßig geöffnet
  
  if (!character) {
    return <div className="summary-panel-layout">Charakter wird geladen...</div>;
  }

  const { abilities, race, class: charClass, background } = character;
  const level = 1;

  // --- Berechnungen (unverändert) ---
  const finalStats = {
    str: abilities.str + getRacialAbilityBonus(character, "str"),
    dex: abilities.dex + getRacialAbilityBonus(character, "dex"),
    con: abilities.con + getRacialAbilityBonus(character, "con"),
    int: abilities.int + getRacialAbilityBonus(character, "int"),
    wis: abilities.wis + getRacialAbilityBonus(character, "wis"),
    cha: abilities.cha + getRacialAbilityBonus(character, "cha"),
  };
  const modifiers = {
    str: getAbilityModifier(finalStats.str),
    dex: getAbilityModifier(finalStats.dex),
    con: getAbilityModifier(finalStats.con),
    int: getAbilityModifier(finalStats.int),
    wis: getAbilityModifier(finalStats.wis),
    cha: getAbilityModifier(finalStats.cha),
  };
  const hp = calculateInitialHP(character);
  const ac = calculateAC(character);
  const profBonus = getProficiencyBonus(level);
  
  // --- Porträt-Logik (unverändert) ---
  const portraitKey = character.race?.portrait_img || "1.webp";
  const portraitSrc = racePortraits[portraitKey];

  // --- Daten für rechte Spalte (unverändert) ---
  const getSpellNames = (spellKeys = []) => {
    return spellKeys
      .map((key) => allSpells.find((s) => s.key === key)?.name)
      .filter(Boolean);
  };
  const subclassData =
    character.subclassKey &&
    allClassData
      .find((c) => c.key === charClass.key)
      ?.subclasses.find((sc) => sc.key === character.subclassKey);
  const cantripNames = getSpellNames(character.cantrips_known);
  let level1SpellNames = [];
  let level1SpellLabel = "Zauber (Lvl 1)";
  if (character.spellbook?.length > 0) {
     level1SpellNames = getSpellNames(character.spellbook);
     level1SpellLabel = "Zauberbuch (Lvl 1)";
  } else if (character.spells_known?.length > 0) {
     level1SpellNames = getSpellNames(character.spells_known);
     level1SpellLabel = "Bekannte Zauber (Lvl 1)";
  } else if (character.spells_prepared?.length > 0) {
     level1SpellNames = getSpellNames(character.spells_prepared);
     level1SpellLabel = "Vorbereitete Zauber (Lvl 1)";
  }
  const showExpertiseThievesTools = character.expertise_choices?.includes("thieves_tools");
  // --- Ende Daten rechte Spalte ---

  return (
    <div className="summary-panel-layout">
      
      {/* --- LINKE SPALTE (STATS & INFO) --- */}
      <div className="summary-column-left">
        
        {/* Box 1: Grundlagen (unverändert) */}
        <div className="summary-box">
          <div className="summary-basics">
            <img 
              src={portraitSrc} 
              alt="Charakterporträt" 
              className="summary-portrait-img" 
            />
            <div className="summary-basics-info">
              <h3>{character.name}</h3>
              <p>
                {race?.name} {charClass?.name} {level}
              </p>
              {subclassData && (
                <p>
                  <strong>{subclassData.name.includes("Domäne") ? "Domäne" : "Unterklasse"}:</strong> {subclassData.name}
                </p>
              )}
              <p>
                <strong>Hintergrund:</strong> {background?.name}
              </p>
            </div>
          </div>
        </div>

        {/* Box 2: Kampfwerte (unverändert) */}
        <div className="summary-box">
          <h3>Kampfwerte</h3>
          <ul className="summary-stats-grid">
            <CombatStatDisplay 
              statKey="ac" label="RK" value={ac} />
            <CombatStatDisplay 
              statKey="hp" label="TP" value={hp} />
            <CombatStatDisplay 
              statKey="proficiency" label="ÜB" value={`+${profBonus}`} />
          </ul>
        </div>
        
        {/* Box 3: Attribute (unverändert) */}
        <div className="summary-box">
          <h3>Attribute</h3>
          <ul className="ability-summary-list">
            {Object.keys(abilities).map(key => {
              const statKey = key.toLowerCase();
              return (
                <StatDisplay 
                  key={statKey}
                  statKey={statKey}
                  label={statKey.toUpperCase()}
                  value={finalStats[statKey]}
                  modifier={modifiers[statKey]}
                />
              );
            })}
          </ul>
        </div>
      </div>

      {/* --- RECHTE SPALTE (LISTEN & FEATURES) --- */}
      <div className="summary-column-right">

        {/* Box 4: Klassenauswahl (unverändert) */}
        <div className="summary-box">
          <h3>Klassen-Auswahl (Lvl 1)</h3>
          <ul className="skill-summary-list features-list">
            {character.fighting_style && (
              <li className="skill-item">
                  <div className="skill-info"><span><strong>Kampfstil:</strong> {character.fighting_style}</span></div>
              </li>
            )}
            {character.favored_enemy && (
              <li className="skill-item">
                  <div className="skill-info"><span><strong>Bev. Feind:</strong> {character.favored_enemy}</span></div>
              </li>
            )}
            {character.natural_explorer && (
              <li className="skill-item">
                  <div className="skill-info"><span><strong>Gelände:</strong> {character.natural_explorer}</span></div>
              </li>
            )}
            {character.class_tool_choice && (
               <li className="skill-item">
                  <div className="skill-info"><span><strong>Werkzeug:</strong> {character.class_tool_choice}</span></div>
               </li>
            )}
            {character.tool_proficiencies_choice?.length > 0 && (
               <li className="skill-item">
                  <div className="skill-info"><span><strong>Instrumente:</strong> {character.tool_proficiencies_choice.join(", ")}</span></div>
               </li>
            )}
            {cantripNames.length > 0 && (
              <li className="skill-item">
                <div className="skill-info"><span><strong>Zaubertricks:</strong> {cantripNames.join(", ")}</span></div>
              </li>
            )}
            {level1SpellNames.length > 0 && (
               <li className="skill-item">
                  <div className="skill-info"><span><strong>{level1SpellLabel}:</strong> {level1SpellNames.join(", ")}</span></div>
               </li>
            )}
          </ul>
        </div>

        {/* Box 5: Fertigkeiten (JETZT COLLAPSIBLE) */}
        <div className="summary-box">
          {/* GEÄNDERT: h3 ist jetzt klickbar und hat Klassen */}
          <h3 
            className={`collapsible-header ${isSkillsOpen ? 'open' : ''}`}
            onClick={() => setIsSkillsOpen(!isSkillsOpen)}
          >
            Fertigkeiten
            <span className="collapse-icon">{isSkillsOpen ? '▼' : '►'}</span>
          </h3>
          
          {/* NEU: Bedingte Anzeige der Liste */}
          {isSkillsOpen && (
            <ul className="skill-summary-list features-list scrollable-list-box">
              {Object.keys(SKILL_MAP).map(skillKey => (
                <SkillDisplay 
                  key={skillKey}
                  skillKey={skillKey}
                  character={character}
                />
              ))}
              {showExpertiseThievesTools && (
                <Tooltip text={"Expertise in Diebeswerkzeug (DEX). Dein Übungsbonus wird verdoppelt."}>
                  <li className="skill-item">
                    <div className="skill-info">
                      <span className="proficiency-dot proficient"></span>
                      <span>Diebeswerkzeug (E) <span className="skill-ability">(DEX)</span></span>
                    </div>
                    {/* <span className="skill-bonus">+X</span> */}
                  </li>
                </Tooltip>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};