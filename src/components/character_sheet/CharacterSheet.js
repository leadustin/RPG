import React, { useState, useEffect, useMemo, useRef } from "react";
import { useDrop } from "react-dnd";
import "./CharacterSheet.css";
import Tooltip from "../tooltip/Tooltip";
import {
  getAbilityModifier,
  ABILITY_DESCRIPTIONS_DE,
  COMBAT_STATS_DESCRIPTIONS_DE, // Diese hatten wir auch wiederhergestellt
  SKILL_MAP,
  SKILL_NAMES_DE,
  SKILL_DESCRIPTIONS_DE,
} from "../../engine/characterEngine"; 
import { getProficiencyBonus, LEVEL_XP_TABLE } from "../../utils/helpers";
import InventoryItem from "./InventoryItem";
import EquipmentSlot from "./EquipmentSlot";
import { ItemTypes } from "../../dnd/itemTypes";
import InventoryFilter from "./InventoryFilter";
import allClassData from "../../data/classes.json";
import allArmor from "../../data/items/armor.json"; 
import allSpells from "../../data/spells.json"; 
import EquipmentPanel from "./EquipmentPanel"; // (Diese hattest du schon hinzugefügt)
import InventoryPanel from "./InventoryPanel";
// --- HILFS-KONSTANTEN (Unverändert) ---
const ATTRIBUTE_ORDER = ["str", "dex", "con", "int", "wis", "cha"];
const ATTRIBUTE_NAMES_DE = {
  str: "Stärke",
  dex: "Geschicklichkeit",
  con: "Konstitution",
  int: "Intelligenz",
  wis: "Weisheit",
  cha: "Charisma",
};
const SKILLS_BY_ATTRIBUTE = {
  str: [], dex: [], con: [], int: [], wis: [], cha: [],
};
// SKILL_MAP füllt SKILLS_BY_ATTRIBUTE
Object.entries(SKILL_MAP).forEach(([skillKey, abilityKey]) => {
  if (SKILLS_BY_ATTRIBUTE[abilityKey]) {
    SKILLS_BY_ATTRIBUTE[abilityKey].push(skillKey);
  }
});

// --- NEUE HELFERFUNKTION für die AC-Berechnung ---
/**
 * Berechnet die Rüstungsklasse (AC) basierend auf Ausrüstung UND Klassen-Logik.
 */
const calculateCharacterAC = (character) => {
  const dexMod = getAbilityModifier(character.abilities.dexterity);
  const classLogic = character.classLogic;

  // 1. Prüfen, ob eine "Ungepanzerte Verteidigung" (Barbar, Mönch) oder
  //    "Drakonische Widerstandsfähigkeit" (Zauberer) von der Klassenlogik bereitgestellt wird.
  let unarmoredDefenseAC = null;
  if (classLogic && typeof classLogic.getUnarmoredDefense === 'function') {
    unarmoredDefenseAC = classLogic.getUnarmoredDefense();
  }

  const armor = character.equipment.armor ? allArmor.find(a => a.key === character.equipment.armor) : null;
  const shield = character.equipment.offhand_shield ? allArmor.find(a => a.key === character.equipment.offhand_shield) : null;

  let baseAC = 10;
  let dexBonus = dexMod;
  let shieldBonus = shield ? shield.ac_bonus : 0;

  if (armor) {
    // Wenn Rüstung getragen wird, ist 'Ungepanzerte Verteidigung' inaktiv
    unarmoredDefenseAC = null; 
    
    baseAC = armor.ac_bonus;
    if (armor.dex_cap !== null) {
      dexBonus = Math.min(dexMod, armor.dex_cap);
    }
  } else if (unarmoredDefenseAC !== null) {
    // Keine Rüstung an, ABER eine Unarmored-Defense-Fähigkeit ist aktiv
    // (z.B. Mönch: 10 + GES + WEI oder Barbar: 10 + GES + KON)
    // Die classLogic berechnet den *vollen* Wert (z.B. 16)
    baseAC = unarmoredDefenseAC;
    dexBonus = 0; // Der Bonus ist bereits in unarmoredDefenseAC enthalten
  } else {
    // Keine Rüstung, keine Spezialfähigkeit -> 10 + GES
    baseAC = 10;
  }

  return baseAC + dexBonus + shieldBonus;
};


// --- STATS-PANEL (Als Unterkomponente definiert, aber im selben File) ---
const StatsPanel = ({ character, proficiencyBonus }) => {
  const skillRefs = useRef({});

  // --- MODIFIZIERT: Skill-Bonus-Berechnung ---
  // Liest jetzt direkt aus character.proficiencies, anstatt eine Engine-Funktion aufzurufen
  const getSkillBonus = (skillKey, abilityMod) => {
    const isProficient = character.proficiencies?.skills?.includes(skillKey);
    // TODO: Expertise prüfen (z.B. Schurke, Barde)
    // const isExpert = character.proficiencies?.expertise?.includes(skillKey);
    
    let bonus = abilityMod;
    if (isProficient) {
      bonus += proficiencyBonus;
    }
    // if (isExpert) {
    //   bonus += proficiencyBonus; // (Nochmal addieren für Verdopplung)
    // }
    return bonus;
  };

  return (
    <div className="stats-panel-content">
      {/* Linke Spalte: Attribute */}
      <div className="stats-column-left">
        {ATTRIBUTE_ORDER.map((key) => {
          const score = character.abilities[key];
          const modifier = getAbilityModifier(score);
          return (
            <div className="stat-block" key={key}>
              <div className="stat-name">{ATTRIBUTE_NAMES_DE[key]}</div>
              <div className="stat-score">{score}</div>
              <div className="stat-modifier">
                {modifier >= 0 ? "+" : ""}
                {modifier}
              </div>
            </div>
          );
        })}
      </div>

      {/* Rechte Spalte: Skills (dynamisch basierend auf Attributen) */}
      <div className="stats-column-right">
        {Object.entries(SKILLS_BY_ATTRIBUTE).map(([abilityKey, skills]) => {
          if (skills.length === 0) return null;
          const abilityMod = getAbilityModifier(character.abilities[abilityKey]);
          
          return (
            <div className="skill-group" key={abilityKey}>
              <div className="skill-group-header">
                {ATTRIBUTE_NAMES_DE[abilityKey]} (Mod: {abilityMod >= 0 ? "+" : ""}{abilityMod})
              </div>
              <div className="skill-list">
                {skills.map((skillKey) => {
                  const name = SKILL_NAMES_DE[skillKey] || skillKey;
                  const description = SKILL_DESCRIPTIONS_DE[skillKey] || "Keine Beschreibung.";
                  const bonus = getSkillBonus(skillKey, abilityMod);

                  return (
                    <React.Fragment key={skillKey}>
                      <div
                        className="skill-entry"
                        ref={(el) => (skillRefs.current[skillKey] = el)}
                        // (Tooltip-Handler... unverändert)
                      >
                        <span className="skill-name">{name}</span>
                        <span className="skill-bonus">
                          {bonus >= 0 ? "+" : ""}
                          {bonus}
                        </span>
                      </div>
                      {/* (Tooltip-Render... unverändert) */}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


// --- SPELLBOOK-TAB (Als Unterkomponente definiert) ---
const SpellbookTab = ({ character, classData }) => {
  // --- MODIFIZIERT: Holt Werte aus der Klassenlogik ---
  const spellSaveDC = character.classLogic.getSpellSaveDC ? character.classLogic.getSpellSaveDC() : 'N/A';
  const spellAttackBonus = character.classLogic.getSpellAttackBonus ? character.classLogic.getSpellAttackBonus() : 'N/A';
  const spellcastingAbility = character.classLogic.getSpellcastingAbility ? ATTRIBUTE_NAMES_DE[character.classLogic.getSpellcastingAbility()] : 'N/A';

  // --- NEU: Aufbereitung der Zauberliste basierend auf der Logik ---
  const spellsByLevel = useMemo(() => {
    if (!character.classLogic) return {};

    let preparableSpells = [];
    let alwaysPreparedSpells = [];
    let knownSpells = [];
    
    const casterType = classData.caster_type;

    // 1. Zauber für "Vorbereiter" (Kleriker, Druide, Paladin, Magier)
    if (casterType === 'full' || casterType === 'half') {
      if (character.classLogic.getPreparableSpells) {
        preparableSpells = character.classLogic.getPreparableSpells();
      }
      // Domänen-, Zirkel- oder Eid-Zauber
      if (character.classLogic.getDomainSpells) {
        alwaysPreparedSpells.push(...character.classLogic.getDomainSpells());
      }
      if (character.classLogic.getCircleSpells) {
        alwaysPreparedSpells.push(...character.classLogic.getCircleSpells());
      }
      if (character.classLogic.getOathSpells) {
        alwaysPreparedSpells.push(...character.classLogic.getOathSpells());
      }
    }
    
    // 2. Zauber für "Bekannte" (Barde, Ranger, Zauberer, Hexenmeister, 1/3-Wirker)
    if (casterType === 'pact' || casterType === 'third' || ['bard', 'sorcerer', 'ranger'].includes(character.classKey)) {
      knownSpells = character.knownSpells || []; // (Muss von LevelUp/Creation gefüllt werden)
    }

    // 3. Alle Zauber sammeln und nach Level gruppieren
    const allKnownSpellKeys = [...new Set([...preparableSpells, ...alwaysPreparedSpells, ...knownSpells])];
    const groupedSpells = {};

    allKnownSpellKeys.forEach(key => {
      const spell = allSpells.find(s => s.key === key);
      if (!spell) return;

      const level = spell.level;
      if (!groupedSpells[level]) {
        groupedSpells[level] = [];
      }
      
      let status = 'known'; // Standard für Barde/Zauberer etc.
      if (alwaysPreparedSpells.includes(key)) {
        status = 'always_prepared';
      } else if (preparableSpells.length > 0) {
        // Prüfen, ob der Kleriker/Druide diesen Zauber *aktiv* vorbereitet hat
        status = character.preparedSpells?.includes(key) ? 'prepared' : 'preparable';
      }

      groupedSpells[level].push({ ...spell, status });
    });

    return groupedSpells;
  }, [character, classData]);

  if (!classData.caster_type) {
    return <div className="spellbook-tab-content">Dieser Charakter kann keine Zauber wirken.</div>;
  }

  return (
    <div className="spellbook-tab-content">
      <div className="spell-stats-header">
        <div>Zauber-Attribut: <strong>{spellcastingAbility}</strong></div>
        <div>Rettungswurf-SG: <strong>{spellSaveDC}</strong></div>
        <div>Zauberangriffsbonus: <strong>+{spellAttackBonus}</strong></div>
      </div>
      <div className="spell-level-groups">
        {Object.keys(spellsByLevel).sort().map(level => (
          <div className="spell-level-group" key={level}>
            <h4>Grad {level} {level === "0" ? "(Zaubertricks)" : ""}</h4>
            <div className="spell-list">
              {spellsByLevel[level].map(spell => (
                <div key={spell.key} className={`spell-entry status-${spell.status}`}>
                  {spell.name}
                  {spell.status === 'always_prepared' && <span className="spell-status-tag">(Immer)</span>}
                  {spell.status === 'prepared' && <span className="spell-status-tag">(Vorbereitet)</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


// --- HAUPTKOMPONENTE CharacterSheet ---
const CharacterSheet = ({
  character,
  onClose,
  onEquipItem,
  onUnequipItem,
}) => {
  const [activeTab, setActiveTab] = useState("Inventory"); // Inventory, Spells, Stats
  const [filter, setFilter] = useState("all");

  // --- MODIFIZIERT: Alle Berechnungen verwenden jetzt `character` oder `character.classLogic` ---

  const classData = useMemo(() => {
    return allClassData.find((c) => c.key === character.classKey);
  }, [character.classKey]);

  const proficiencyBonus = useMemo(() => {
    return getProficiencyBonus(character.level);
  }, [character.level]);

  // --- MODIFIZIERT: Liest HP direkt vom Charakter-Objekt ---
  const hp = useMemo(() => {
    return { current: character.hp, max: character.maxHp };
  }, [character.hp, character.maxHp]);

  // --- MODIFIZIERT: Verwendet die neue AC-Berechnungs-Helferfunktion ---
  const armorClass = useMemo(() => {
    return calculateCharacterAC(character);
  }, [character]); // Abhängig vom ganzen Objekt (wegen Rüstung UND classLogic)

  // --- MODIFIZIERT: Holt Zauberwerte aus der Klassenlogik ---
  const spellSaveDC = useMemo(() => {
    if (character.classLogic && typeof character.classLogic.getSpellSaveDC === 'function') {
      return character.classLogic.getSpellSaveDC();
    }
    return "N/A";
  }, [character]);

  const spellAttackBonus = useMemo(() => {
    if (character.classLogic && typeof character.classLogic.getSpellAttackBonus === 'function') {
      return character.classLogic.getSpellAttackBonus();
    }
    return "N/A";
  }, [character]);

  // --- (Restliche Logik der Komponente) ---
  
  const nextLevelXP = LEVEL_XP_TABLE[character.level + 1] || character.experience;
  const xpProgress =
    ((character.experience - LEVEL_XP_TABLE[character.level]) /
      (nextLevelXP - LEVEL_XP_TABLE[character.level])) *
    100;

  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.INVENTORY_ITEM,
    drop: (item) => onEquipItem(item.id, item.slot),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  // ... (Restliche Funktionen wie handleFilterChange, onDragEnd... unverändert) ...
  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
  };

  const onDragEnd = (item) => {
    // Diese Funktion wird aufgerufen, wenn ein Item *zurück* ins Inventar gezogen wird.
    // (Der Drop-Handler ist in InventoryPanel)
    onUnequipItem(item.id, item.slot);
  };

  // --- RENDER-METHODE ---
  return (
    <div className="character-sheet-backdrop" onClick={onClose}>
      <main
        className="character-sheet-container"
        onClick={(e) => e.stopPropagation()}
        ref={drop}
      >
        <header>
          <button className="close-button" onClick={onClose}>
            X
          </button>
          <h2>{character.name}</h2>
          <div className="header-details">
            <span>Stufe {character.level} {classData.name}</span>
            <span>{character.race} ({character.background})</span>
          </div>
          <div className="xp-bar-container">
            <div className="xp-bar-fill" style={{ width: `${xpProgress}%` }}></div>
            <span className="xp-text">
              EP: {character.experience} / {nextLevelXP}
            </span>
          </div>
        </header>

        <section className="main-stats-bar">
          <div className="stat-box" title="Rüstungsklasse">
            <span className="stat-label">RK</span>
            <span className="stat-value">{armorClass}</span>
          </div>
          <div className="stat-box" title="Trefferpunkte">
            <span className="stat-label">TP</span>
            <span className="stat-value">{hp.current} / {hp.max}</span>
          </div>
          <div className="stat-box" title="Bewegungsrate">
            <span className="stat-label">Bew.</span>
            <span className="stat-value">9m</span> {/* (Platzhalter) */}
          </div>
          <div className="stat-box" title="Initiative">
            <span className="stat-label">INI</span>
            <span className="stat-value">
              {getAbilityModifier(character.abilities.dexterity) >= 0 ? "+" : ""}
              {getAbilityModifier(character.abilities.dexterity)}
            </span>
          </div>
          <div className="stat-box" title="Übungsbonus">
            <span className="stat-label">ÜB</span>
            <span className="stat-value">+{proficiencyBonus}</span>
          </div>
        </section>

        {/* Tabs */}
        <nav className="sheet-tabs">
          <button
            className={activeTab === "Inventory" ? "active" : ""}
            onClick={() => setActiveTab("Inventory")}
          >
            Inventar
          </button>
          <button
            className={activeTab === "Spells" ? "active" : ""}
            onClick={() => setActiveTab("Spells")}
          >
            Zauberbuch
          </button>
          <button
            className={activeTab === "Stats" ? "active" : ""}
            onClick={() => setActiveTab("Stats")}
          >
            Werte & Fähigkeiten
          </button>
        </nav>

        {/* Tab-Inhalt */}
        {activeTab === "Inventory" && (
          <aside className="inventory-equipment-container">
            <EquipmentPanel
              equipment={character.equipment}
              onDragEnd={onDragEnd}
            />
            <InventoryPanel
              inventory={character.inventory}
              filter={filter}
              onEquipItem={onEquipItem}
            />
            <InventoryFilter onFilterChange={handleFilterChange} />
          </aside>
        )}

        {activeTab === "Spells" && (
          <aside className="spellbook-container">
            {/* --- MODIFIZIERT: Übergibt die Logik-fähigen Objekte --- */}
            <SpellbookTab 
              character={character} 
              classData={classData} 
            />
          </aside>
        )}

        {activeTab === "Stats" && (
          <aside className="stats-container">
            {/* --- MODIFIZIERT: Übergibt die Logik-fähigen Objekte --- */}
            <StatsPanel 
              character={character} 
              proficiencyBonus={proficiencyBonus} 
            />
          </aside>
        )}
      </main>
    </div>
  );
};

export default CharacterSheet;