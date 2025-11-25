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
import EquipmentSlot from "./EquipmentSlot";
import SpellbookTab from './SpellbookTab';
import { ItemTypes } from "../../dnd/itemTypes"; 
import allClassData from "../../data/classes.json";
import AbilitiesTab from './AbilitiesTab'; 
import InventoryPanel from "./InventoryPanel";

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
  character: initialCharacter, 
  party = [], 
  onClose,
  onUpdateCharacter, 
  handleEquipItem,
  handleUnequipItem,
  handleToggleTwoHanded,
  handleFillQuiver,
  handleUnloadQuiver,
  handleUnpackItem,
  handleDestroyItem
}) => {
  const { t } = useTranslation(); 
  
  const [displayCharacter, setDisplayCharacter] = useState(initialCharacter || party[0]);
  const [activeTab, setActiveTab] = useState("Inventory");
  const [activeStatTab, setActiveStatTab] = useState("Stats");

  useEffect(() => {
    if (initialCharacter) {
      setDisplayCharacter(initialCharacter);
    }
  }, [initialCharacter]);

  const currentParty = party.length > 0 ? party : (displayCharacter ? [displayCharacter] : []);

  const hasSpellcasting = useMemo(() => {
      if (!displayCharacter?.class) return false;
      const cls = allClassData.find(c => c.key === displayCharacter.class.key);
      return !!cls?.spellcasting; 
  }, [displayCharacter]);

  const getClassTabLabel = () => {
    if (!displayCharacter?.class?.key) return "Fähigkeiten";
    const key = displayCharacter.class.key;

    if (hasSpellcasting) {
        switch (key) {
            case 'wizard': return "Zauberbuch";
            case 'warlock': return "Paktmagie";
            case 'cleric': return "Gebete";
            case 'druid': return "Naturmagie";
            case 'sorcerer': return "Arkane Macht";
            case 'paladin': return "Göttliche Macht";
            case 'ranger': return "Wildnismagie";
            case 'bard': return "Lieder & Magie";
            default: return "Zauber";
        }
    }
    switch (key) {
        case 'monk': return "Ki-Kräfte";
        case 'barbarian': return "Zorn & Instinkt";
        case 'fighter': return "Kampftechniken";
        case 'rogue': return "Talente";
        default: return "Fertigkeiten";
    }
  };

  const classTabLabel = getClassTabLabel();
  const classTabKey = hasSpellcasting ? "Spells" : "Abilities";

  useEffect(() => {
      if (activeTab === "Spells" && !hasSpellcasting) {
          setActiveTab("Abilities");
      }
      if (activeTab === "Abilities" && hasSpellcasting) {
          setActiveTab("Spells");
      }
  }, [displayCharacter, hasSpellcasting, activeTab]);

  const currentWeight = useMemo(() => {
    if (!displayCharacter) return 0;
    let totalWeight = 0;
    if (displayCharacter.inventory) {
      totalWeight += displayCharacter.inventory.reduce((total, item) => {
        if (item && typeof item.weight === "number") {
          return total + item.weight;
        }
        return total;
      }, 0);
    }
    if (displayCharacter.equipment) {
      Object.values(displayCharacter.equipment).forEach((item) => {
        if (item && typeof item.weight === "number") {
          totalWeight += item.weight;
        }
      });
    }
    return totalWeight;
  }, [displayCharacter]);
  
  const finalModifiers = useMemo(() => {
    if (!displayCharacter) return {};
    const modifiers = {};
    ATTRIBUTE_ORDER.forEach((key) => {
      const finalScore =
        displayCharacter.abilities[key] + getRacialAbilityBonus(displayCharacter, key);
      modifiers[key] = getAbilityModifier(finalScore);
    });
    return modifiers;
  }, [displayCharacter]);

  const getTwoHandedDisplayItem = () => {
    if (!displayCharacter) return null;
    const mainHand = displayCharacter.equipment["main-hand"];
    if (!mainHand || mainHand.type !== "weapon") return null;

    const isTwoHanded =
      mainHand.properties &&
      (mainHand.properties.includes("Zweihändig") ||
        mainHand.properties.includes("Two-Handed") ||
        (mainHand.properties.some((p) => p.startsWith("Vielseitig")) &&
          mainHand.isTwoHanded));

    if (isTwoHanded && !displayCharacter.equipment["off-hand"]) {
      return { ...mainHand, isTwoHandedDisplay: true };
    }
    return null;
  };

  // +++ SMARTE AUSRÜST-FUNKTION +++
  const enhancedHandleEquipItem = (item, slotType) => {
    // 1. Check: Ist es Munition?
    if (item.type === 'ammo') {
        const currentAmmoSlot = displayCharacter.equipment.ammo;

        // 2. Check: Haben wir einen Köcher ausgerüstet?
        if (currentAmmoSlot && currentAmmoSlot.type === 'quiver') {
            // Ja -> In den Köcher füllen!
            handleFillQuiver(item);
        } else {
            // Nein -> Fehler / Blockieren
            // (Pfeile können nicht ohne Köcher ausgerüstet werden)
            console.warn("Kein Köcher ausgerüstet! Pfeile können nicht ausgerüstet werden.");
            // Optional: Hier könnte man eine Toast-Notification auslösen
        }
        return; // Stopp, nicht normal ausrüsten!
    }

    // Standard-Verhalten für alles andere (Waffen, Rüstung, Köcher selbst)
    handleEquipItem(item, slotType); 
  };

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const [, drop] = useDrop(
    () => ({
      accept: [ItemTypes.WEAPON, ItemTypes.ARMOR, ItemTypes.SHIELD, ItemTypes.ACCESSORY, ItemTypes.CLOTH, ItemTypes.AMMO, ItemTypes.QUIVER, ItemTypes.HEAD, ItemTypes.HANDS, ItemTypes.BOOTS, ItemTypes.BELT],
      drop: (item) => handleUnequipItem(item, item.equippedIn),
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
        canDrop: !!monitor.canDrop(),
      }),
    }),
    [handleUnequipItem]
  );

  const getClassIconSrc = () => {
    if (!displayCharacter || !displayCharacter.class || !displayCharacter.class.icon) return null;
    return classIcons[displayCharacter.class.icon];
  };

  if (!displayCharacter) return null;

  const maxHp = displayCharacter.stats.maxHp;
  const currentHp = displayCharacter.stats.hp !== undefined ? displayCharacter.stats.hp : maxHp;
  const armorClass = calculateAC(displayCharacter);
  const finalDexForInit = displayCharacter.abilities.dex + getRacialAbilityBonus(displayCharacter, 'dex');
  const initiative = getAbilityModifier(finalDexForInit);
  const meleeDamage = calculateMeleeDamage(displayCharacter);
  const currentExp = displayCharacter.experience || 0;
  const nextLevel = (displayCharacter.level || 1) + 1;
  const expForNextLevel = nextLevel <= 20 ? LEVEL_XP_TABLE[nextLevel] : "MAX";
  
  const classData = displayCharacter.class.key ? allClassData.find((c) => c.key === displayCharacter.class.key) : null;
  const subclassData = classData && displayCharacter.subclassKey
      ? classData.subclasses.find((sc) => sc.key === displayCharacter.subclassKey)
      : null;
  const subclassName = subclassData?.name;
  const raceInfo = displayCharacter.subrace || displayCharacter.race;
  const classIconSrc = getClassIconSrc();

  return (
    <div className="game-ui">
      <header>
        <nav className="main-nav">
          <button className={`nav-btn ${activeTab === "Inventory" ? "active" : ""}`} onClick={() => setActiveTab("Inventory")}>
            Ausrüstung
          </button>
          <button className={`nav-btn ${activeTab === classTabKey ? "active" : ""}`} onClick={() => setActiveTab(classTabKey)}>
            {classTabLabel}
          </button>
          <button className={`nav-btn ${activeTab === "Alchemy" ? "active" : ""}`} onClick={() => setActiveTab("Alchemy")}>
            Alchemie
          </button>
        </nav>
        <div className="party-gold">
          <span>Party Gold</span>
          <span className="gold-amount">{displayCharacter.wallet?.gold || displayCharacter.gold || 0}</span>
        </div>
        <button onClick={onClose} className="close-btn">X</button>
      </header>

      <main className="main-content">
        
        <aside className="left-sidebar">
          {currentParty.map((member) => {
             const isSelected = member.id === displayCharacter.id || (member.name === displayCharacter.name);
             const memMaxHp = member.stats.maxHp || calculateInitialHP(member);
             const memCurHp = member.stats.hp !== undefined ? member.stats.hp : memMaxHp;

             return (
              <div
                key={member.id || member.name}
                className={`character-portrait ${isSelected ? "active" : ""}`}
                onClick={() => setDisplayCharacter(member)} 
              >
                {member.portrait ? (
                    <img src={member.portrait} alt={`${member.name} Portrait`} />
                ) : (
                    <div className="portrait-placeholder">?</div>
                )}
                <div className="hp-bar-wrapper">
                  <div className="hp-current" style={{ width: `${(memCurHp / memMaxHp) * 100}%` }}></div>
                  <span className="hp-text">{`${memCurHp} / ${memMaxHp}`}</span>
                </div>
              </div>
             );
          })}
        </aside>

        {activeTab === "Inventory" && (
          <section ref={drop} className="inventory-section">
            <InventoryPanel 
              inventory={displayCharacter.inventory}
              currency={displayCharacter.wallet}
              onEquip={enhancedHandleEquipItem} // Hier übergeben wir die smarte Funktion
              onUnequip={handleUnequipItem}
              handleUnpackItem={handleUnpackItem}
              handleDestroyItem={handleDestroyItem}
            />
          </section>
        )}
        
        {activeTab === "Spells" && hasSpellcasting && (
          <SpellbookTab 
             character={displayCharacter} 
             onUpdateCharacter={onUpdateCharacter} 
          />
        )}

        {activeTab === "Abilities" && !hasSpellcasting && (
          <AbilitiesTab character={displayCharacter} />
        )}

        {activeTab === "Inventory" && (
          <aside className="right-panel-character-sheet">
            <div className="equipment-column-left">
              <p className="slot-label">Ausrüstung</p>
              <div className="two-column-grid">
                <EquipmentSlot slotType="head" currentItem={displayCharacter.equipment.head} onEquipItem={enhancedHandleEquipItem} />
                <EquipmentSlot slotType="amulet" currentItem={displayCharacter.equipment.amulet} onEquipItem={enhancedHandleEquipItem} />
                <EquipmentSlot slotType="armor" currentItem={displayCharacter.equipment.armor} onEquipItem={enhancedHandleEquipItem} />
                <EquipmentSlot slotType="cloth" currentItem={displayCharacter.equipment.cloth} onEquipItem={enhancedHandleEquipItem} />
                <EquipmentSlot slotType="cloak" currentItem={displayCharacter.equipment.cloak} onEquipItem={enhancedHandleEquipItem} />
                <EquipmentSlot slotType="gloves" currentItem={displayCharacter.equipment.gloves} onEquipItem={enhancedHandleEquipItem} />
                <EquipmentSlot slotType="belt" currentItem={displayCharacter.equipment.belt} onEquipItem={enhancedHandleEquipItem} />
                <EquipmentSlot slotType="boots" currentItem={displayCharacter.equipment.boots} onEquipItem={enhancedHandleEquipItem} />
                <EquipmentSlot slotType="ring1" currentItem={displayCharacter.equipment.ring1} onEquipItem={enhancedHandleEquipItem} />
                <EquipmentSlot slotType="ring2" currentItem={displayCharacter.equipment.ring2} onEquipItem={enhancedHandleEquipItem} />
              </div>
              <p className="slot-label">Nahkampf</p>
              <div className="two-column-grid">
                <EquipmentSlot slotType="main-hand" currentItem={displayCharacter.equipment["main-hand"]} onEquipItem={enhancedHandleEquipItem} />
                <EquipmentSlot slotType="off-hand" currentItem={getTwoHandedDisplayItem() || displayCharacter.equipment["off-hand"]} onEquipItem={enhancedHandleEquipItem} isTwoHandedDisplay={!!getTwoHandedDisplayItem()} />
              </div>
              {displayCharacter.equipment["main-hand"] && displayCharacter.equipment["main-hand"].properties?.some((p) => p.startsWith("Vielseitig")) && (
                <button onClick={() => handleToggleTwoHanded("main-hand")} className="toggle-btn">
                  {displayCharacter.equipment["main-hand"].isTwoHanded ? "Einhändig" : "Zweihändig"}
                  {!displayCharacter.equipment["main-hand"].isTwoHanded && displayCharacter.equipment["off-hand"] ? " (Off-Hand räumen)" : ""}
                </button>
              )}
              
              <p className="slot-label">Fernkampf</p>
              <div className="two-column-grid">
                <EquipmentSlot slotType="ranged" currentItem={displayCharacter.equipment.ranged} onEquipItem={enhancedHandleEquipItem} />
                <EquipmentSlot 
                    slotType="ammo" 
                    currentItem={displayCharacter.equipment.ammo} 
                    onEquipItem={enhancedHandleEquipItem}
                    onFillQuiver={handleFillQuiver}
                    onUnloadQuiver={handleUnloadQuiver}
                />
              </div>
            </div>

            <div className="character-model-column">
              <div className="character-viewer">
                <img src={displayCharacter.model || "https://placeholder.pics/svg/160x300"} alt="Character Model" />
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
                          {displayCharacter.subrace ? displayCharacter.subrace.name : displayCharacter.race.name}
                        </p>
                      </Tooltip>
                      <Tooltip text={displayCharacter.class.name}>
                        <div className="class-icon-wrapper-centered tooltip-hover">
                          <div className="class-icon">
                             {classIconSrc && <img src={classIconSrc} alt={`${displayCharacter.class.name} icon`} />}
                          </div>
                        </div>
                      </Tooltip>
                      {subclassName && (
                        <Tooltip text={subclassData.description || subclassName}>
                          <p className="char-subclass-centered tooltip-hover">{subclassName}</p>
                        </Tooltip>
                      )}
                      <Tooltip text={displayCharacter.class.description || displayCharacter.class.name}>
                        <p className="char-class-centered tooltip-hover">
                          Lv {displayCharacter.level || 1} {displayCharacter.class.name}
                        </p>
                      </Tooltip>
                      <p className="char-background-centered">{displayCharacter.background.name}</p>
                    </div>

                    <div className="primary-stats">
                      {Object.keys(displayCharacter.abilities).map((key) => {
                        const finalScore = displayCharacter.abilities[key] + getRacialAbilityBonus(displayCharacter, key);
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
                    <div className="combat-stat"><span>Bewegungsgeschw.</span><span>{displayCharacter.race.speed}m</span></div>
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
                          const bonus = calculateSkillBonus(displayCharacter, skillKey);
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
        
      </main>
    </div>
  );
};

export default CharacterSheet;