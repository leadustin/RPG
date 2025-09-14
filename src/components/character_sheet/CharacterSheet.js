import React, { useState, useEffect, useMemo } from "react";
import { useDrop } from "react-dnd";
import "./CharacterSheet.css";
import {
  getAbilityModifier,
  calculateInitialHP,
  calculateAC,
} from "../../engine/characterEngine";
import InventoryItem from "./InventoryItem";
import EquipmentSlot from "./EquipmentSlot";
import { ItemTypes } from "../../dnd/itemTypes";

const CharacterSheet = ({
  character,
  onClose,
  handleEquipItem,
  handleUnequipItem,
}) => {
  const [activeNav, setActiveNav] = useState("Inventory");
  const [activePortrait, setActivePortrait] = useState("");
  const [collapsedInventories, setCollapsedInventories] = useState({});

  // Move useMemo before the early return
  const currentWeight = useMemo(() => {
    if (!character || !character.inventory) return 0;
    
    // Gehe durch alle Items im Inventar und summiere ihr Gewicht
    return character.inventory.reduce((total, item) => {
      // Stelle sicher, dass das Item und das Gewicht existieren und eine Zahl sind
      if (item && typeof item.weight === "number") {
        return total + item.weight;
      }
      return total;
    }, 0);
  }, [character]); // Neu berechnen, wenn sich das character object ändert

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

  const [{ canDrop, isOver }, drop] = useDrop(
    () => ({
      accept: [
        ItemTypes.WEAPON,
        ItemTypes.ARMOR,
        ItemTypes.ACCESSORY,
        ItemTypes.CLOTH,
      ],
      drop: (item) => handleUnequipItem(item, item.equippedIn),
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
        canDrop: !!monitor.canDrop(),
      }),
    }),
    [handleUnequipItem]
  );

  if (!character) {
    return null;
  }

  // Berechne die maximale Tragekapazität (typische D&D 5e Regel)
  const maxWeight = character.abilities.strength * 15;

  // --- KORREKTUR: Fehlende Funktion wiederhergestellt ---
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

  return (
    <div className="game-ui">
      <header>
        <nav className="main-nav">
          <button
            className={`nav-btn ${activeNav === "Inventory" ? "active" : ""}`}
            onClick={() => setActiveNav("Inventory")}
          >
            Inventory
          </button>
        </nav>
        <div className="party-gold">
          <span>Party Gold</span>
          <span className="gold-amount">{character.gold || 188}</span>
        </div>
        <button onClick={onClose} className="close-btn">
          X
        </button>
      </header>

      <main className="main-content">
        <aside className="left-sidebar">
          <div
            className={`character-portrait ${
              activePortrait === character.name ? "active" : ""
            }`}
            onClick={() => setActivePortrait(character.name)}
          >
            <img
              src={character.portrait || "https://i.imgur.com/gplS3xv.png"}
              alt={`${character.name} Portrait`}
            />
            <div className="hp-bar">
              <div
                className="hp-current"
                style={{ width: `${(currentHp / maxHp) * 100}%` }}
              ></div>
              <span>
                {currentHp} / {maxHp}
              </span>
            </div>
          </div>
        </aside>

        <section ref={drop} className="inventory-section">
          <div className="inventory-header">
            <h2>Inventory</h2>
            <button className="filter-btn">Filters</button>
          </div>

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
                <div className={`weight-display ${currentWeight > maxWeight ? 'encumbered' : ''}`}>
                Gewicht: {currentWeight.toFixed(1)} / {maxWeight} Pfund
              </div>
                <span className="toggle-icon">
                  {collapsedInventories[character.name] ? "+" : "-"}
                </span>
              </div>
            </div>
            <div className="inventory-grid">
              {character.inventory.map((item, index) => (
                <InventoryItem key={`${item.id}-${index}`} item={item} />
              ))}
            </div>
          </div>
        </section>

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
                slotType="amulet"
                currentItem={character.equipment.amulet}
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
                slotType="cloak"
                currentItem={character.equipment.cloak}
                onEquipItem={handleEquipItem}
              />
              <EquipmentSlot
                slotType="gloves"
                currentItem={character.equipment.gloves}
                onEquipItem={handleEquipItem}
              />
              <EquipmentSlot
                slotType="belt"
                currentItem={character.equipment.belt}
                onEquipItem={handleEquipItem}
              />
              <EquipmentSlot
                slotType="boots"
                currentItem={character.equipment.boots}
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
              <div className="stat-block">
                <span className="stat-value">
                  {character.stats.abilities.str}
                </span>
                <span className="stat-label">STR</span>
              </div>
              <div className="stat-block">
                <span className="stat-value">
                  {character.stats.abilities.dex}
                </span>
                <span className="stat-label">DEX</span>
              </div>
              <div className="stat-block">
                <span className="stat-value">
                  {character.stats.abilities.con}
                </span>
                <span className="stat-label">CON</span>
              </div>
              <div className="stat-block">
                <span className="stat-value">
                  {character.stats.abilities.int}
                </span>
                <span className="stat-label">INT</span>
              </div>
              <div className="stat-block">
                <span className="stat-value">
                  {character.stats.abilities.wis}
                </span>
                <span className="stat-label">WIS</span>
              </div>
              <div className="stat-block">
                <span className="stat-value">
                  {character.stats.abilities.cha}
                </span>
                <span className="stat-label">CHA</span>
              </div>
            </div>
            <div className="combat-stats">
              <div className="combat-stat">
                <span>Melee Damage</span>
                <span>N/A</span>
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
                <span>Movement Speed</span>
                <span>{character.race.speed}m</span>
              </div>
              <div className="combat-stat">
                <span>Initiative</span>
                <span>{initiative >= 0 ? `+${initiative}` : initiative}</span>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default CharacterSheet;