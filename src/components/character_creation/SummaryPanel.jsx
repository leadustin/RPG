// src/components/character_creation/SummaryPanel.jsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './SummaryPanel.css';
import './PanelDetails.css'; 
import Tooltip from '../tooltip/Tooltip';
import {
  getAbilityModifier,
  getProficiencyBonus,
  calculateInitialHP,
  calculateAC,
  calculateSkillBonus,
  isProficientInSkill,
  SKILL_MAP
} from '../../engine/characterEngine';

import allSpells from "../../data/spells.json";
import allClassData from "../../data/classes.json";

// +++ VITE-ERSATZ für Bilder +++
const portraitModules = import.meta.glob(
  '../../assets/images/portraits/**/*.webp',
  { eager: true, import: 'default' }
);

const getPortraitPath = (raceKey, gender, portraitIndex = 1) => {
    if (!raceKey) return null;
    const genderStr = gender === 'male' ? 'male' : 'female';
    const path = `../../assets/images/portraits/${raceKey}/${genderStr}/${portraitIndex}.webp`;
    return portraitModules[path] || null;
};
// +++ ENDE VITE-ERSATZ +++

// --- Helfer-Komponenten ---

const StatDisplay = ({ statKey, label, value, modifier }) => {
    return (
      <li> 
        <div className="stat-display">
          <span className="stat-label">{label}</span>
          <span className="stat-value">
             {value} <span className="stat-modifier">({modifier >= 0 ? `+${modifier}` : modifier})</span>
          </span>
        </div>
      </li>
    );
};

const CombatStatDisplay = ({ label, value }) => {
  return (
      <li>
        <div className="stat-box">
          <div className="stat-value">{value}</div>
          <div className="stat-label">{label}</div>
        </div>
      </li>
  );
};

export const SummaryPanel = ({ character }) => {
  const { t } = useTranslation();
  const [isSkillsOpen, setIsSkillsOpen] = useState(true);
  
  if (!character) {
    return <div className="summary-panel-layout">Charakter wird geladen...</div>;
  }

  const { abilities, race, class: charClass, background } = character;
  const level = 1;

  // --- BERECHNUNGEN (PHB 2024: Boni aus Hintergrund) ---
  const bgBonuses = character.background_options?.bonuses || {};

  const finalStats = {
    str: abilities.str + (bgBonuses.str || 0),
    dex: abilities.dex + (bgBonuses.dex || 0),
    con: abilities.con + (bgBonuses.con || 0),
    int: abilities.int + (bgBonuses.int || 0),
    wis: abilities.wis + (bgBonuses.wis || 0),
    cha: abilities.cha + (bgBonuses.cha || 0),
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
  
  // --- Portrait ---
  let portraitSrc = character.portrait;
  if (!portraitSrc && race) {
      portraitSrc = getPortraitPath(race.key, character.gender, 1);
  }

  // --- Daten für rechte Spalte ---
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
     level1SpellLabel = "Zauberbuch";
  } else if (character.spells_known?.length > 0) {
     level1SpellNames = getSpellNames(character.spells_known);
     level1SpellLabel = "Bekannte Zauber";
  } else if (character.spells_prepared?.length > 0) {
     level1SpellNames = getSpellNames(character.spells_prepared);
     level1SpellLabel = "Vorbereitete Zauber";
  }
  
  const showExpertiseThievesTools = character.expertise_choices?.includes("thieves_tools");


  return (
    <div className="summary-panel-layout">
      
      {/* --- LINKE SPALTE (STATS & INFO) --- */}
      <div className="summary-column-left">
        
        {/* Box 1: Identität */}
        <div className="summary-box">
          <div className="summary-header summary-basics-flex">
            {portraitSrc ? (
                <img 
                  src={portraitSrc} 
                  alt="Charakterporträt" 
                  className="summary-portrait-img-small" 
                />
            ) : (
                <div className="summary-portrait-img-small" style={{background: '#333'}}>?</div>
            )}
            
            <div className="summary-header-info">
              <h2>{character.name || t('creation.default_name')}</h2>
              <h3>
                {t(`races.${race?.key}.name`, race?.name)} | {charClass?.name} | {background?.name}
              </h3>
              <p>Level {level}</p>
              {subclassData && (
                  <p style={{fontSize: '0.85em', color: '#aaa', marginTop: '2px'}}>
                     {subclassData.name}
                  </p>
              )}
            </div>
          </div>
        </div>

        {/* Box 2: Kampfwerte */}
        <div className="summary-box">
          <h3>Kampfwerte</h3>
          <ul className="summary-stats-grid">
            <CombatStatDisplay label="Rüstungsklasse" value={ac} />
            <CombatStatDisplay label="Trefferpunkte" value={hp} />
            <CombatStatDisplay label="Übungsbonus" value={`+${profBonus}`} />
          </ul>
        </div>
        
        {/* Box 3: Attribute - FIX: Layout angepasst */}
        <div className="summary-box">
          <h3>Attribute</h3>
          {/* Hier nutzen wir jetzt die korrekte CSS-Klasse für eine Liste */}
          <ul className="ability-summary-list">
            {Object.keys(abilities).map(key => {
              const statKey = key.toLowerCase();
              return (
                <StatDisplay 
                  key={statKey}
                  statKey={statKey}
                  label={t(`abilities.${statKey}`, statKey.toUpperCase())}
                  value={finalStats[statKey]}
                  modifier={modifiers[statKey]}
                />
              );
            })}
          </ul>
          {Object.keys(bgBonuses).length > 0 && (
             <div style={{textAlign: 'center', fontSize: '0.8em', color: '#888', marginTop: '5px'}}>
               (Inkl. Boni durch Hintergrund)
             </div>
          )}
        </div>
      </div>

      {/* --- RECHTE SPALTE (LISTEN & FEATURES) --- */}
      <div className="summary-column-right">

        {/* Box 4: Klassenauswahl */}
        <div className="summary-box">
          <h3>Klassen-Auswahl</h3>
          <ul className="skill-summary-list features-list">
            {character.fighting_style && (
              <li className="skill-item">
                  <div className="skill-info"><span><strong>Kampfstil:</strong> {t(`fightingStyles.${character.fighting_style}.name`, character.fighting_style)}</span></div>
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
                  <div className="skill-info">
                      <span><strong>Instrumente:</strong> {character.tool_proficiencies_choice.join(", ")}</span>
                  </div>
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
        
        {/* Box 5: Ausrüstung & Hintergrund */}
        <div className="summary-box">
            <h3>Ausrüstung</h3>
            <ul className="skill-summary-list features-list">
                <li className="skill-item">
                    <div className="skill-info">
                        <span>Paket: <strong>{character.background_options?.equipmentOption?.toUpperCase() || 'A'}</strong> ({background?.name})</span>
                    </div>
                </li>
                {background?.feat && (
                    <li className="skill-item">
                        <div className="skill-info">
                            <span>Bonus Talent: <strong>{t(`feats.${background.feat}`, background.feat)}</strong></span>
                        </div>
                    </li>
                )}
            </ul>
        </div>

        {/* Box 6: Fertigkeiten */}
        <div className="summary-box">
          <h3 
            className={`collapsible-header ${isSkillsOpen ? 'open' : ''}`}
            onClick={() => setIsSkillsOpen(!isSkillsOpen)}
          >
            {t('skills.title', 'Fertigkeiten')}
            <span className="collapse-icon">{isSkillsOpen ? '▼' : '►'}</span>
          </h3>
          
          {isSkillsOpen && (
            <ul className="skill-summary-list features-list scrollable-list-box">
              {Object.keys(SKILL_MAP).map(skillKey => {
                 const attrKey = SKILL_MAP[skillKey];
                 const attrVal = finalStats[attrKey];
                 const mod = getAbilityModifier(attrVal);
                 
                 const isProf = isProficientInSkill(character, skillKey);
                 const isExpert = character.expertise_choices?.includes(skillKey);
                 
                 let bonus = mod;
                 if (isProf) bonus += profBonus;
                 if (isExpert) bonus += profBonus;
                 
                 return (
                    <li key={skillKey} className={`skill-item ${isProf ? 'proficient' : ''}`}>
                        <div className="skill-info">
                            <span className={`proficiency-dot ${isProf ? 'proficient' : ''}`}></span>
                            <span>
                                {t(`skills.${skillKey}`, skillKey)} 
                                {isExpert && " (E)"} 
                                <span className="skill-ability"> ({attrKey.toUpperCase()})</span>
                            </span>
                        </div>
                        <span className="skill-bonus">{bonus >= 0 ? `+${bonus}` : bonus}</span>
                    </li>
                 );
              })}
              
              {showExpertiseThievesTools && (
                  <li className="skill-item">
                    <div className="skill-info">
                      <span className="proficiency-dot proficient"></span>
                      <span>Diebeswerkzeug (E) <span className="skill-ability">(DEX)</span></span>
                    </div>
                  </li>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};