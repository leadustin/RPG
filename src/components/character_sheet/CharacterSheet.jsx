// src/components/character_sheet/CharacterSheet.jsx
import React, { useState, useEffect, useMemo } from "react"; 
import { useDrop } from "react-dnd";
import { useTranslation } from "react-i18next"; 
import "./CharacterSheet.css";
import Tooltip from "../tooltip/Tooltip";
import {
  getAbilityModifier,
  calculateInitialHP,
  calculateAC,
  calculateMeleeDamage,
  ABILITY_DESCRIPTIONS_DE,
  getRacialAbilityBonus,
  calculateSkillBonus,
  SKILL_MAP,
  SKILL_DESCRIPTIONS_DE,
} from "../../engine/characterEngine";
import { LEVEL_XP_TABLE } from "../../utils/helpers";
import InventoryItem from "./InventoryItem";
import EquipmentSlot from "./EquipmentSlot";
import SpellbookTab from './SpellbookTab';
import { ItemTypes } from "../../dnd/itemTypes"; 
import InventoryFilter from "./InventoryFilter";
import allClassData from "../../data/classes.json";

// --- HELPER: Lade alle Klassen-Icons ---
const classIconModules = import.meta.glob(
  '../../assets/images/classes/*.(png|webp|jpg|svg)', 
  { eager: true }
);
const classIcons = {};
for (const path in classIconModules) {
  const fileName = path.split('/').pop();
  classIcons[fileName] = classIconModules[path].default;
}

const ATTRIBUTE_ORDER = ["str", "dex", "con", "int", "wis", "cha"];

const SKILLS_BY_ATTRIBUTE = { str: [], dex: [], con: [], int: [], wis: [], cha: [] };
for (const [skillKey, attrKey] of Object.entries(SKILL_MAP)) {
  if (SKILLS_BY_ATTRIBUTE[attrKey]) {
    SKILLS_BY_ATTRIBUTE[attrKey].push(skillKey);
  }
}

const CharacterSheet = ({
  character,
  onClose,
  handleEquipItem,
  handleUnequipItem,
  handleToggleTwoHanded,
  // +++ FIX: Diese beiden haben gefehlt! +++
  handleFillQuiver,
  handleUnloadQuiver
}) => {
  const { t } = useTranslation(); 
  const [activeTab, setActiveTab] = useState("Inventory");
  const [activeStatTab, setActiveStatTab] = useState("Stats");
  const [activePortrait, setActivePortrait] = useState("");
  const [collapsedInventories, setCollapsedInventories] = useState({});
  const [activeFilter, setActiveFilter] = useState("all");

  // --- useMemo Hooks ---
  const currentWeight = useMemo(() => {
    if (!character) return 0;
    let totalWeight = 0;
    if (character.inventory) {
      totalWeight += character.inventory.reduce((total, item) => {
        if (item && typeof item.weight === "number") {
          return total + item.weight;
        }
        return total;
      }, 0);
    }
    if (character.equipment) {
      Object.values(character.equipment).forEach((item) => {
        if (item && typeof item.weight === "number") {
          totalWeight += item.weight;
        }
      });
    }
    return totalWeight;
  }, [character]);

  const filteredInventory = useMemo(() => {
    if (!character || !character.inventory) {
      return [];
    }
    if (activeFilter === "all") {
      return character.inventory;
    }

    // Spezialfilter für "Rüstung"
    if (activeFilter === "armor") {
        return character.inventory.filter(item => 
            ["armor", "shield", "head", "hands", "boots", "cloth", "belt", "cloak"].includes(item.type)
        );
    }

    return character.inventory.filter(
      (item) => item && item.type === activeFilter
    );
  }, [character, activeFilter]);
  
  const finalModifiers = useMemo(() => {
    if (!character) return {};
    const modifiers = {};
    ATTRIBUTE_ORDER.forEach((key) => {
      const finalScore =
        character.abilities[key] + getRacialAbilityBonus(character, key);
      modifiers[key] = getAbilityModifier(finalScore);
    });
    return modifiers;
  }, [character]);

  // --- Event Handlers & Logik ---
  const getTwoHandedDisplayItem = () => {
    const mainHand = character.equipment["main-hand"];
    if (!mainHand || mainHand.type !== "weapon") return null;

    const isTwoHanded =
      mainHand.properties &&
      (mainHand.properties.includes("Zweihändig") ||
        mainHand.properties.includes("Two-Handed") ||
        (mainHand.properties.some((p) => p.startsWith("Vielseitig")) &&
          mainHand.isTwoHanded));

    if (isTwoHanded && !character.equipment["off-hand"]) {
      return { ...mainHand, isTwoHandedDisplay: true };
    }

    return null;
  };

  const enhancedHandleEquipItem = (item, slotType) => {
    const mainHandWeapon = character.equipment["main-hand"];
    const offHandItem = character.equipment["off-hand"];

    if (slotType === "main-hand" && item.type === "weapon") {
      const isTwoHanded =
        item.properties &&
        (item.properties.includes("Zweihändig") ||
          item.properties.includes("Two-Handed") ||
          (item.properties.some((p) => p.startsWith("Vielseitig")) &&
            item.isTwoHanded));

      if (isTwoHanded && offHandItem) {
        handleUnequipItem(offHandItem, "off-hand");
      }
    }

    if (slotType === "off-hand" && mainHandWeapon) {
      const mainHandIsTwoHanded =
        mainHandWeapon.properties &&
        (mainHandWeapon.properties.includes("Zweihändig") ||
          mainHandWeapon.properties.includes("Two-Handed") ||
          (mainHandWeapon.properties.some((p) => p.startsWith("Vielseitig")) &&
            mainHandWeapon.isTwoHanded));

      if (mainHandIsTwoHanded) {
        if (mainHandWeapon.properties.some((p) => p.startsWith("Vielseitig"))) {
          handleToggleTwoHanded("main-hand");
        } else {
          console.warn(
            "Kann nicht in Off-Hand ausrüsten - Main-Hand ist zweihändig besetzt"
          );
          return;
        }
      }
    }
    handleEquipItem(item, slotType);
  };

  const canTwoWeaponFight = () => {
    const mainHand = character.equipment["main-hand"];
    const offHand = character.equipment["off-hand"];

    if (!mainHand || !offHand) return false;
    if (mainHand.type !== "weapon" || offHand.type !== "weapon") return false;

    const mainHandLight =
      mainHand.properties && mainHand.properties.includes("Leicht");
    const offHandLight =
      offHand.properties && offHand.properties.includes("Leicht");
    const mainHandVersatile =
      mainHand.properties &&
      mainHand.properties.some((p) => p.startsWith("Vielseitig")) &&
      !mainHand.isTwoHanded;

    return (
      (mainHandLight && offHandLight) || (mainHandVersatile && offHandLight)
    );
  };

  useEffect(() => {
    if (character) {
      setActivePortrait(character.name);
    }
  }, [character]);

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // --- Drop Target ---
  const [, drop] = useDrop(
    () => ({
      accept: [
        ItemTypes.WEAPON,
        ItemTypes.ARMOR,
        ItemTypes.SHIELD,
        ItemTypes.ACCESSORY,
        ItemTypes.CLOTH,
        ItemTypes.AMMO,    // <-- WICHTIG
        ItemTypes.QUIVER,  // <-- WICHTIG
        ItemTypes.HEAD,
        ItemTypes.HANDS,
        ItemTypes.BOOTS,
        ItemTypes.BELT
      ],
      drop: (item) => handleUnequipItem(item, item.equippedIn),
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
        canDrop: !!monitor.canDrop(),
      }),
    }),
    [handleUnequipItem]
  );

  const getClassIconSrc = () => {
    if (!character || !character.class || !character.class.icon) {
      return null;
    }
    const iconSrc = classIcons[character.class.icon];
    return iconSrc;
  };

  if (!character) {
    return null;
  }

  const finalStrForWeight = character.abilities.str + getRacialAbilityBonus(character, 'str');
  const maxWeight = finalStrForWeight * 15;
  const toggleInventory = (characterName) => {
    setCollapsedInventories((prevState) => ({
      ...prevState,
      [characterName]: !prevState[characterName],
    }));
  };
  const maxHp = character.stats.maxHp || calculateInitialHP(character);
  const currentHp = character.stats.hp || maxHp;
  const armorClass = calculateAC(character);
  const finalDexForInit = character.abilities.dex + getRacialAbilityBonus(character, 'dex');
  const initiative = getAbilityModifier(finalDexForInit);
  const meleeDamage = calculateMeleeDamage(character);
  const currentExp = character.experience || 0;
  const nextLevel = (character.level || 1) + 1;
  const expForNextLevel = nextLevel <= 20 ? LEVEL_XP_TABLE[nextLevel] : "MAX";
  const classData = character.class.key ? allClassData.find((c) => c.key === character.class.key) : null;
  const subclassData =
    classData && character.subclassKey
      ? classData.subclasses.find((sc) => sc.key === character.subclassKey)
      : null;
  const subclassName = subclassData?.name;
  const raceInfo = character.subrace || character.race;
  const classIconSrc = getClassIconSrc();

  return (
    <div className="game-ui">
      {/* --- HEADER --- */}
      <header>
        <nav className="main-nav">
          <button
            className={`nav-btn ${activeTab === "Inventory" ? "active" : ""}`}
            onClick={() => setActiveTab("Inventory")}
          >
            Ausrüstung
          </button>
          <button
            className={`nav-btn ${activeTab === "Spells" ? "active" : ""}`}
            onClick={() => setActiveTab("Spells")}
          >
            Zauberbuch
          </button>
          <button
            className={`nav-btn ${activeTab === "Alchemy" ? "active" : ""}`}
            onClick={() => setActiveTab("Alchemy")}
          >
            Alchemie
          </button>
        </nav>
        <div className="party-gold">
          <span>Party Gold</span>
          <span className="gold-amount">{character.wallet?.gold || character.gold || 0}</span>
        </div>
        <button onClick={onClose} className="close-btn">
          X
        </button>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="main-content">
        {/* --- LEFT SIDEBAR --- */}
        <aside className="left-sidebar">
          <div
            className={`character-portrait ${
              activePortrait === character.name ? "active" : ""
            }`}
            onClick={() => setActivePortrait(character.name)}
          >
            {character.portrait ? (
                <img src={character.portrait} alt={`${character.name} Portrait`} />
            ) : (
                <div className="portrait-placeholder">?</div>
            )}
            <div className="hp-bar-wrapper">
              <div
                className="hp-current"
                style={{ width: `${(currentHp / maxHp) * 100}%` }}
              ></div>
              <span className="hp-text">{`${currentHp} / ${maxHp}`}</span>
            </div>
          </div>
        </aside>

        {/* --- INVENTORY TAB --- */}
        {activeTab === "Inventory" && (
          <section ref={drop} className="inventory-section">
            <div className="inventory-header">
              <h2>Inventory</h2>
            </div>
            <InventoryFilter
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
            />
            <div
              className={`character-inventory ${
                collapsedInventories[character.name] ? "collapsed" : ""
              }`}
            >
              <div
                className="inventory-owner toggle-inventory"
                onClick={() => toggleInventory(character.name)}
              >
                <h3>{character.name}</h3>
                <div className="inventory-details">
                  <div
                    className={`weight-display ${
                      currentWeight > maxWeight ? "encumbered" : ""
                    }`}
                  >
                    Gewicht: {currentWeight.toFixed(1)} / {maxWeight} kg
                  </div>
                  <span className="toggle-icon">
                    {collapsedInventories[character.name] ? "+" : "-"}
                  </span>
                </div>
              </div>
              <div className="inventory-grid">
                {filteredInventory.map((item, index) => (
                  <InventoryItem key={`${item.id}-${index}`} item={item} />
                ))}
              </div>
            </div>
          </section>
        )}
        
        {/* --- SPELLS TAB --- */}
        {activeTab === "Spells" && (
          <SpellbookTab character={character} />
        )}

        {/* --- RIGHT PANEL --- */}
        {activeTab === "Inventory" && (
          <aside className="right-panel-character-sheet">
            <div className="equipment-column-left">
              <p className="slot-label">Ausrüstung</p>
              <div className="two-column-grid">
                <EquipmentSlot slotType="head" currentItem={character.equipment.head} onEquipItem={enhancedHandleEquipItem} />
                <EquipmentSlot slotType="amulet" currentItem={character.equipment.amulet} onEquipItem={enhancedHandleEquipItem} />
                <EquipmentSlot slotType="armor" currentItem={character.equipment.armor} onEquipItem={enhancedHandleEquipItem} />
                <EquipmentSlot slotType="cloth" currentItem={character.equipment.cloth} onEquipItem={enhancedHandleEquipItem} />
                <EquipmentSlot slotType="cloak" currentItem={character.equipment.cloak} onEquipItem={enhancedHandleEquipItem} />
                <EquipmentSlot slotType="gloves" currentItem={character.equipment.gloves} onEquipItem={enhancedHandleEquipItem} />
                <EquipmentSlot slotType="belt" currentItem={character.equipment.belt} onEquipItem={enhancedHandleEquipItem} />
                <EquipmentSlot slotType="boots" currentItem={character.equipment.boots} onEquipItem={enhancedHandleEquipItem} />
                <EquipmentSlot slotType="ring1" currentItem={character.equipment.ring1} onEquipItem={enhancedHandleEquipItem} />
                <EquipmentSlot slotType="ring2" currentItem={character.equipment.ring2} onEquipItem={enhancedHandleEquipItem} />
              </div>
              <p className="slot-label">Nahkampf</p>
              <div className="two-column-grid">
                <EquipmentSlot slotType="main-hand" currentItem={character.equipment["main-hand"]} onEquipItem={enhancedHandleEquipItem} />
                <EquipmentSlot slotType="off-hand" currentItem={getTwoHandedDisplayItem() || character.equipment["off-hand"]} onEquipItem={enhancedHandleEquipItem} isTwoHandedDisplay={!!getTwoHandedDisplayItem()} />
              </div>
              {character.equipment["main-hand"] && character.equipment["main-hand"].properties?.some((p) => p.startsWith("Vielseitig")) && (
                <button onClick={() => handleToggleTwoHanded("main-hand")} className="toggle-btn" disabled={character.equipment["off-hand"] !== null}>
                  {character.equipment["main-hand"].isTwoHanded ? "Einhändig" : "Zweihändig"}
                  {character.equipment["off-hand"] && " (Off-Hand räumen)"}
                </button>
              )}
              
              {/* +++ FERNKAMPF & MUNITION +++ */}
              <p className="slot-label">Fernkampf</p>
              <div className="two-column-grid">
                <EquipmentSlot slotType="ranged" currentItem={character.equipment.ranged} onEquipItem={enhancedHandleEquipItem} />
                <EquipmentSlot 
                    slotType="ammo" 
                    currentItem={character.equipment.ammo} 
                    onEquipItem={enhancedHandleEquipItem}
                    onFillQuiver={handleFillQuiver}     // <--- FIX: Handler weitergegeben
                    onUnloadQuiver={handleUnloadQuiver} // <--- FIX: Handler weitergegeben
                />
              </div>
            </div>

            {/* MODEL & STATS */}
            <div className="character-model-column">
              <div className="character-viewer">
                <img src={character.model || "https://placeholder.pics/svg/160x300"} alt="Character Model" />
              </div>
            </div>

            <div className="stats-column-right">
              <div className="stat-tab-nav">
                <button className={`stat-tab-btn ${activeStatTab === "Stats" ? "active" : ""}`} onClick={() => setActiveStatTab("Stats")}>Stats</button>
                <button className={`stat-tab-btn ${activeStatTab === "Kampf" ? "active" : ""}`} onClick={() => setActiveStatTab("Kampf")}>Kampf</button>
                <button className={`stat-tab-btn ${activeStatTab === "Details" ? "active" : ""}`} onClick={() => setActiveStatTab("Details")}>Details</button>
              </div>

              <div className="stat-tab-content">
                {activeStatTab === "Stats" && (
                  <React.Fragment>
                    <div className="character-info-centered">
                      <Tooltip text={raceInfo.description || raceInfo.name}>
                        <p className="char-race-centered tooltip-hover">
                          {character.subrace ? character.subrace.name : character.race.name}
                        </p>
                      </Tooltip>
                      <Tooltip text={character.class.name}>
                        <div className="class-icon-wrapper-centered tooltip-hover">
                          <div className="class-icon">
                             {classIconSrc && <img src={classIconSrc} alt={`${character.class.name} icon`} />}
                          </div>
                        </div>
                      </Tooltip>
                      {subclassName && (
                        <Tooltip text={subclassData.description || subclassName}>
                          <p className="char-subclass-centered tooltip-hover">{subclassName}</p>
                        </Tooltip>
                      )}
                      <Tooltip text={character.class.description || character.class.name}>
                        <p className="char-class-centered tooltip-hover">
                          Lv {character.level || 1} {character.class.name}
                        </p>
                      </Tooltip>
                      <p className="char-background-centered">{character.background.name}</p>
                    </div>

                    <div className="primary-stats">
                      {Object.keys(character.abilities).map((key) => {
                        const finalScore = character.abilities[key] + getRacialAbilityBonus(character, key);
                        return (
                          <Tooltip key={key} text={ABILITY_DESCRIPTIONS_DE[key] || t(`abilities.descriptions.${key}`)}>
                            <div className="stat-block">
                              <span className="stat-value">{finalScore}</span>
                              <span className="stat-label">{key.toUpperCase()}</span>
                            </div>
                          </Tooltip>
                        );
                      })}
                    </div>
                  </React.Fragment>
                )}

                {activeStatTab === "Kampf" && (
                  <div className="combat-stats">
                    <div className="combat-stat"><span>Nahkampfschaden</span><span>{meleeDamage}</span></div>
                    <div className="combat-stat"><span>Attack Bonus</span><span>+0</span></div>
                    <div className="combat-stat"><span>Hit Points</span><span>{currentHp}/{maxHp}</span></div>
                    <div className="combat-stat"><span>Armour Class</span><span>{armorClass}</span></div>
                    <div className="combat-stat"><span>Bewegungsgeschw.</span><span>{character.race.speed}m</span></div>
                    <div className="combat-stat"><span>Initiative</span><span>{initiative >= 0 ? `+${initiative}` : initiative}</span></div>
                    <div className="combat-stat"><span>Erfahrung</span><span>{currentExp}{expForNextLevel !== "MAX" ? `/${expForNextLevel}` : " (MAX)"}</span></div>
                  </div>
                )}

                {activeStatTab === "Details" && (
                <div className="details-tab-content skill-list">
                  {ATTRIBUTE_ORDER.map((attrKey) => {
                    const skills = SKILLS_BY_ATTRIBUTE[attrKey];
                    if (!skills || skills.length === 0) return null; 
                    const modifier = finalModifiers[attrKey];
                    return (
                      <div className="skill-group" key={attrKey}>
                        <div className="skill-group-header">
                          {t(`abilities.${attrKey}`)} ({modifier >= 0 ? "+" : ""}{modifier})
                        </div>
                        {skills.map((skillKey) => {
                          const bonus = calculateSkillBonus(character, skillKey);
                          const name = t(`skills.${skillKey}`, skillKey);
                          const description = SKILL_DESCRIPTIONS_DE[skillKey] || "Keine Beschreibung verfügbar.";
                          return (
                            <Tooltip key={skillKey} text={description}>
                              <div className="skill-row">
                                <span className="skill-name">{name}</span>
                                <span className="skill-bonus">
                                  {bonus >= 0 ? "+" : ""}{bonus}
                                </span>
                              </div>
                            </Tooltip>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
              </div>
            </div>
          </aside>
        )}
        
        {activeTab === "spellbook" && (
          <SpellbookTab character={character} />
        )}
      </main>
    </div>
  );
};

export default CharacterSheet;