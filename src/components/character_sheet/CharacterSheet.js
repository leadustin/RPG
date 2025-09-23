import React, { useState, useEffect, useMemo, useRef } from "react";
import { useDrop } from "react-dnd";
import "./CharacterSheet.css";
import Tooltip from "../tooltip/Tooltip";
//import SpellbookTab from './SpellbookTab';
import {
  getAbilityModifier,
  calculateInitialHP,
  calculateAC,
  calculateMeleeDamage,
  ABILITY_DESCRIPTIONS_DE,
} from "../../engine/characterEngine";
import InventoryItem from "./InventoryItem";
import EquipmentSlot from "./EquipmentSlot";
import { ItemTypes } from "../../dnd/itemTypes";

const CharacterSheet = ({
  character,
  onClose,
  handleEquipItem,
  handleUnequipItem,
  handleToggleTwoHanded,
}) => {
  const [activeTab, setActiveTab] = useState("Inventory"); 
  const [activePortrait, setActivePortrait] = useState("");
  const [collapsedInventories, setCollapsedInventories] = useState({});

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
      Object.values(character.equipment).forEach(item => {
        if (item && typeof item.weight === "number") {
          totalWeight += item.weight;
        }
      });
    }
    return totalWeight;
  }, [character]);

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

  const [hoveredStat, setHoveredStat] = useState(null);
  const strRef = useRef(null);
  const dexRef = useRef(null);
  const conRef = useRef(null);
  const intRef = useRef(null);
  const wisRef = useRef(null);
  const chaRef = useRef(null);

  const statRefs = { str: strRef, dex: dexRef, con: conRef, int: intRef, wis: wisRef, cha: chaRef };

  const [{ canDrop, isOver }, drop] = useDrop(() => ({
    accept: [ItemTypes.WEAPON, ItemTypes.ARMOR, ItemTypes.ACCESSORY, ItemTypes.CLOTH],
    drop: (item) => handleUnequipItem(item, item.equippedIn),
    collect: (monitor) => ({ isOver: !!monitor.isOver(), canDrop: !!monitor.canDrop() }),
  }), [handleUnequipItem]);

  if (!character) {
    return null;
  }

  const maxWeight = character.stats.abilities.str * 15;
  const toggleInventory = (characterName) => {
    setCollapsedInventories((prevState) => ({
      ...prevState,
      [characterName]: !prevState[characterName],
    }));
  };

  const maxHp = calculateInitialHP(character);
  const currentHp = character.stats.hp || maxHp;
  const armorClass = calculateAC(character);
  const initiative = getAbilityModifier(character.stats.abilities.dex);
  const meleeDamage = calculateMeleeDamage(character);

  return (
    <div className="game-ui">
      <header>
        <nav className="main-nav">
          <button
            className={`nav-btn ${activeTab === "Inventory" ? "active" : ""}`}
            onClick={() => setActiveTab("Inventory")}
          >
            Inventory
          </button>
          <button
            className={`nav-btn ${activeTab === "Spells" ? "active" : ""}`}
            onClick={() => setActiveTab("Spells")}
          >
            Zauberbuch
          </button>
        </nav>
        <div className="party-gold">
          <span>Party Gold</span>
          <span className="gold-amount">{character.gold || 188}</span>
        </div>
        <button onClick={onClose} className="close-btn">X</button>
      </header>

      <main className="main-content">
        <aside className="left-sidebar">
          <div
            className={`character-portrait ${activePortrait === character.name ? "active" : ""}`}
            onClick={() => setActivePortrait(character.name)}
          >
            <img src={character.portrait || "https://placeholder.pics/svg/120x120.svg"} alt={`${character.name} Portrait`} />
            <div className="hp-bar">
              <div className="hp-current" style={{ width: `${(currentHp / maxHp) * 100}%` }}></div>
              <span>{currentHp} / {maxHp}</span>
            </div>
          </div>
        </aside>

        {activeTab === "Inventory" && (
          <section ref={drop} className="inventory-section">
            <div className="inventory-header">
              <h2>Inventory</h2>
              <button className="filter-btn">Filters</button>
            </div>
            <div className={`character-inventory ${collapsedInventories[character.name] ? "collapsed" : ""}`}>
              <div className="inventory-owner toggle-inventory" onClick={() => toggleInventory(character.name)}>
                <h3>{character.name}</h3>
                <div className="inventory-details">
                  <div className={`weight-display ${currentWeight > maxWeight ? "encumbered" : ""}`}>
                    Gewicht: {currentWeight.toFixed(1)} / {maxWeight} kg
                  </div>
                  <span className="toggle-icon">{collapsedInventories[character.name] ? "+" : "-"}</span>
                </div>
              </div>
              <div className="inventory-grid">
                {character.inventory.map((item, index) => (
                  <InventoryItem key={`${item.id}-${index}`} item={item} />
                ))}
              </div>
            </div>
          </section>
        )}

        {activeTab === "Spells" && (
          <section className="spells-section">
            <div className="spells-header">
              <h2>Zauberbuch</h2>
            </div>
            <div className="spells-content">
              <p>Hier werden bald die Zauber angezeigt.</p>
              {/* Hier kommt deine Zauberbuch-Komponente hin */}
            </div>
          </section>
        )}

        {/* --- ÄNDERUNG START: Die gesamte rechte Spalte wird jetzt nur noch im Inventar-Tab angezeigt --- */}
        {activeTab === "Inventory" && (
          <aside className="right-panel-character-sheet">
            <div className="equipment-column-left">
              <p className="slot-label">Ausrüstung</p>
              <div className="two-column-grid">
                <EquipmentSlot
                  slotType="head"
                  currentItem={character.equipment.head}
                  onEquipItem={handleEquipItem}
                />
                <EquipmentSlot
                  slotType="cloak"
                  currentItem={character.equipment.cloak}
                  onEquipItem={handleEquipItem}
                />
                <EquipmentSlot
                  slotType="armor"
                  currentItem={character.equipment.armor}
                  onEquipItem={handleEquipItem}
                />
                <EquipmentSlot
                  slotType="cloth"
                  currentItem={character.equipment.cloth}
                  onEquipItem={handleEquipItem}
                />
                <EquipmentSlot
                  slotType="gloves"
                  currentItem={character.equipment.gloves}
                  onEquipItem={handleEquipItem}
                />
                <EquipmentSlot
                  slotType="amulet"
                  currentItem={character.equipment.amulet}
                  onEquipItem={handleEquipItem}
                />
                <EquipmentSlot
                  slotType="boots"
                  currentItem={character.equipment.boots}
                  onEquipItem={handleEquipItem}
                />
                <EquipmentSlot
                  slotType="belt"
                  currentItem={character.equipment.belt}
                  onEquipItem={handleEquipItem}
                />
                <EquipmentSlot
                  slotType="ring1"
                  currentItem={character.equipment.ring1}
                  onEquipItem={handleEquipItem}
                />
                <EquipmentSlot
                  slotType="ring2"
                  currentItem={character.equipment.ring2}
                  onEquipItem={handleEquipItem}
                />
              </div>

              <p className="slot-label">Melee</p>
              <div className="two-column-grid">
                <EquipmentSlot
                  slotType="main-hand"
                  currentItem={character.equipment["main-hand"]}
                  onEquipItem={handleEquipItem}
                />
                <EquipmentSlot
                  slotType="off-hand"
                  currentItem={character.equipment["off-hand"]}
                  onEquipItem={handleEquipItem}
                />
              </div>
              {character.equipment['main-hand'] && 
               character.equipment['main-hand'].properties.some(p => p.startsWith('Vielseitig')) &&
                <button onClick={() => handleToggleTwoHanded('main-hand')}>
                  {character.equipment['main-hand'].isTwoHanded ? 'Einhändig' : 'Zweihändig'}
                </button>
              }

              <p className="slot-label">Ranged</p>
              <div className="two-column-grid">
                <EquipmentSlot
                  slotType="ranged"
                  currentItem={character.equipment.ranged}
                  onEquipItem={handleEquipItem}
                />
              </div>
            </div>

            <div className="character-model-column">
              <div className="character-viewer">
                <img
                  src={character.model || "https://placeholder.pics/svg/160x300"}
                  alt="Character Model"
                />
              </div>
            </div>

            <div className="stats-column-right">
              <div className="character-title">
                <div className="class-icon-wrapper">
                  <div className="class-icon"></div>
                </div>
                <div>
                  <p className="char-class">
                    Lv {character.level || 1} {character.class.name}
                  </p>
                  <p className="char-race">
                    {character.subrace
                      ? character.subrace.name
                      : character.race.name}
                  </p>
                  <p className="char-background">{character.background.name}</p>
                </div>
              </div>
              <div className="primary-stats">
                {Object.keys(character.stats.abilities).map((key) => (
                  <div
                    key={key}
                    className="stat-block"
                    ref={statRefs[key]}
                    onMouseEnter={() => setHoveredStat(key)}
                    onMouseLeave={() => setHoveredStat(null)}
                  >
                    <span className="stat-value">
                      {character.stats.abilities[key]}
                    </span>
                    <span className="stat-label">{key.toUpperCase()}</span>
                    {hoveredStat === key && (
                      <Tooltip
                        text={ABILITY_DESCRIPTIONS_DE[key]}
                        parentRef={statRefs[key]}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="combat-stats">
                <div className="combat-stat">
                  <span>Nahkampfschaden</span>
                  <span>{meleeDamage}</span>
                </div>
                <div className="combat-stat">
                  <span>Attack Bonus</span>
                  <span>+0</span>
                </div>
                <div className="combat-stat">
                  <span>Hit Points</span>
                  <span>
                    {currentHp}/{maxHp}
                  </span>
                </div>
                <div className="combat-stat">
                  <span>Armour Class</span>
                  <span>{armorClass}</span>
                </div>
                <div className="combat-stat">
                  <span>Bewegungsgeschw.</span>
                  <span>{character.race.speed}m</span>
                </div>
                <div className="combat-stat">
                  <span>Initiative</span>
                  <span>{initiative >= 0 ? `+${initiative}` : initiative}</span>
                </div>
              </div>
            </div>
          </aside>
        )}
        {/* --- ÄNDERUNG ENDE --- */}
      </main>
    </div>
  );
};

export default CharacterSheet;