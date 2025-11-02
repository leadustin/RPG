import React, { useState, useEffect, useMemo, useRef } from "react";
import { useDrop } from "react-dnd";
import "./CharacterSheet.css";
import Tooltip from "../tooltip/Tooltip";
import {
  getAbilityModifier,
  calculateInitialHP,
  calculateAC,
  calculateMeleeDamage,
  ABILITY_DESCRIPTIONS_DE,
  getRacialAbilityBonus, // <-- KORREKTUR: Import hinzugefügt
} from "../../engine/characterEngine";
import { LEVEL_XP_TABLE } from "../../utils/helpers";
import InventoryItem from "./InventoryItem";
import EquipmentSlot from "./EquipmentSlot";
import { ItemTypes } from "../../dnd/itemTypes";
import InventoryFilter from "./InventoryFilter";
import allClassData from "../../data/classes.json";

const CharacterSheet = ({
  character,
  onClose,
  handleEquipItem,
  handleUnequipItem,
  handleToggleTwoHanded,
}) => {
  const [activeTab, setActiveTab] = useState("Inventory");
  const [activeStatTab, setActiveStatTab] = useState("Stats"); // "Stats", "Kampf", "Details"
  const [activePortrait, setActivePortrait] = useState("");
  const [collapsedInventories, setCollapsedInventories] = useState({});
  const [activeFilter, setActiveFilter] = useState("all");

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
    return character.inventory.filter(
      (item) => item && item.type === activeFilter
    );
  }, [character, activeFilter]);

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

  const [hoveredStat, setHoveredStat] = useState(null);
  const strRef = useRef(null);
  const dexRef = useRef(null);
  const conRef = useRef(null);
  const intRef = useRef(null);
  const wisRef = useRef(null);
  const chaRef = useRef(null);

  const statRefs = {
    str: strRef,
    dex: dexRef,
    con: conRef,
    int: intRef,
    wis: wisRef,
    cha: chaRef,
  };

  const [hoveredInfo, setHoveredInfo] = useState(null); // 'race', 'classIcon', 'subclass', 'class'
  const raceRef = useRef(null);
  const classIconRef = useRef(null);
  const subclassRef = useRef(null);
  const classRef = useRef(null);

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

  const getClassIcon = () => {
    if (!character || !character.class || !character.class.icon) {
      return "";
    }
    try {
      return require(`../../assets/images/classes/${character.class.icon}`);
    } catch (e) {
      console.error("Class icon not found:", character.class.icon);
      return "";
    }
  };

  if (!character) {
    return null;
  }

  // KORREKTUR: Berechne finale Stärke für Gewicht
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

  // KORREKTUR: Berechne finale Geschicklichkeit für Initiative
  const finalDexForInit = character.abilities.dex + getRacialAbilityBonus(character, 'dex');
  const initiative = getAbilityModifier(finalDexForInit);
  
  const meleeDamage = calculateMeleeDamage(character);

  const currentExp = character.experience || 0;
  const nextLevel = (character.level || 1) + 1;
  const expForNextLevel = nextLevel <= 20 ? LEVEL_XP_TABLE[nextLevel] : "MAX";
  const classData = character.class.key
    ? allClassData.find((c) => c.key === character.class.key)
    : null;
  const subclassData =
    classData && character.subclassKey
      ? classData.subclasses.find((sc) => sc.key === character.subclassKey)
      : null;
  const subclassName = subclassData?.name;
  const raceInfo = character.subrace || character.race;

  return (
    <div className="game-ui">
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
            <img src={character.portrait} alt={`${character.name} Portrait`} />

            <div className="hp-bar-wrapper">
              <div
                className="hp-current"
                style={{ width: `${(currentHp / maxHp) * 100}%` }}
              ></div>
              <span className="hp-text">{`${currentHp} / ${maxHp}`}</span>
            </div>
          </div>
        </aside>

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

        {activeTab === "Spells" && (
          <section className="spells-section">
            <div className="spells-header">
              <h2>Zauberbuch</h2>
            </div>
            <div className="spells-content">
              <p>Hier werden bald die Zauber angezeigt.</p>
            </div>
          </section>
        )}

        {activeTab === "Inventory" && (
          <aside className="right-panel-character-sheet">
            <div className="equipment-column-left">
              <p className="slot-label">Ausrüstung</p>
              <div className="two-column-grid">
                <EquipmentSlot
                  slotType="head"
                  currentItem={character.equipment.head}
                  onEquipItem={enhancedHandleEquipItem}
                />
                <EquipmentSlot
                  slotType="amulet"
                  currentItem={character.equipment.amulet}
                  onEquipItem={enhancedHandleEquipItem}
                />
                <EquipmentSlot
                  slotType="armor"
                  currentItem={character.equipment.armor}
                  onEquipItem={enhancedHandleEquipItem}
                />
                <EquipmentSlot
                  slotType="cloth"
                  currentItem={character.equipment.cloth}
                  onEquipItem={enhancedHandleEquipItem}
                />
                <EquipmentSlot
                  slotType="cloak"
                  currentItem={character.equipment.cloak}
                  onEquipItem={enhancedHandleEquipItem}
                />
                <EquipmentSlot
                  slotType="gloves"
                  currentItem={character.equipment.gloves}
                  onEquipItem={enhancedHandleEquipItem}
                />
                <EquipmentSlot
                  slotType="belt"
                  currentItem={character.equipment.belt}
                  onEquipItem={enhancedHandleEquipItem}
                />
                <EquipmentSlot
                  slotType="boots"
                  currentItem={character.equipment.boots}
                  onEquipItem={enhancedHandleEquipItem}
                />
                <EquipmentSlot
                  slotType="ring1"
                  currentItem={character.equipment.ring1}
                  onEquipItem={enhancedHandleEquipItem}
                />
                <EquipmentSlot
                  slotType="ring2"
                  currentItem={character.equipment.ring2}
                  onEquipItem={enhancedHandleEquipItem}
                />
              </div>

              <p className="slot-label">Melee</p>
              <div className="two-column-grid">
                <EquipmentSlot
                  slotType="main-hand"
                  currentItem={character.equipment["main-hand"]}
                  onEquipItem={enhancedHandleEquipItem}
                />
                <EquipmentSlot
                  slotType="off-hand"
                  currentItem={
                    getTwoHandedDisplayItem() || character.equipment["off-hand"]
                  }
                  onEquipItem={enhancedHandleEquipItem}
                  isTwoHandedDisplay={!!getTwoHandedDisplayItem()}
                />
              </div>

              {character.equipment["main-hand"] &&
                character.equipment["main-hand"].properties?.some((p) =>
                  p.startsWith("Vielseitig")
                ) && (
                  <button
                    onClick={() => handleToggleTwoHanded("main-hand")}
                    className="toggle-btn"
                    disabled={character.equipment["off-hand"] !== null}
                  >
                    {character.equipment["main-hand"].isTwoHanded
                      ? "Einhändig"
                      : "Zweihändig"}
                    {character.equipment["off-hand"] && " (Off-Hand räumen)"}
                  </button>
                )}

              {canTwoWeaponFight() && (
                <div className="combat-style-indicator">
                  <span className="style-active">⚔️ Two-Weapon Fighting</span>
                </div>
              )}

              <p className="slot-label">Ranged</p>
              <div className="two-column-grid">
                <EquipmentSlot
                  slotType="ranged"
                  currentItem={character.equipment.ranged}
                  onEquipItem={enhancedHandleEquipItem}
                />
              </div>
            </div>

            <div className="character-model-column">
              <div className="character-viewer">
                <img
                  src={
                    character.model || "https://placeholder.pics/svg/160x300"
                  }
                  alt="Character Model"
                />
              </div>
            </div>

            <div className="stats-column-right">
              {/* TAB-NAVIGATION (Unverändert) */}
              <div className="stat-tab-nav">
                <button
                  className={`stat-tab-btn ${
                    activeStatTab === "Stats" ? "active" : ""
                  }`}
                  onClick={() => setActiveStatTab("Stats")}
                >
                  Stats
                </button>
                <button
                  className={`stat-tab-btn ${
                    activeStatTab === "Kampf" ? "active" : ""
                  }`}
                  onClick={() => setActiveStatTab("Kampf")}
                >
                  Kampf
                </button>
                <button
                  className={`stat-tab-btn ${
                    activeStatTab === "Details" ? "active" : ""
                  }`}
                  onClick={() => setActiveStatTab("Details")}
                >
                  Details
                </button>
              </div>

              {/* TAB-INHALT (Angepasst) */}
              <div className="stat-tab-content">
                
                {/* INHALT FÜR TAB 1: STATS (Angepasst) */}
                {activeStatTab === "Stats" && (
                  <React.Fragment>
                    
                    {/* *** 2. ZENTRIERTE STRUKTUR MIT TOOLTIPS *** */}
                    <div className="character-info-centered">
                      
                      {/* 1. Rasse */}
                      <p 
                        className="char-race-centered tooltip-hover" // Klasse für CSS hinzugefügt
                        ref={raceRef}
                        onMouseEnter={() => setHoveredInfo('race')}
                        onMouseLeave={() => setHoveredInfo(null)}
                      >
                        {character.subrace
                          ? character.subrace.name
                          : character.race.name}
                      </p>
                      {hoveredInfo === 'race' && (
                        <Tooltip
                          text={raceInfo.description || raceInfo.name}
                          parentRef={raceRef}
                        />
                      )}

                      {/* 2. Klassen-Icon */}
                      <div 
                        className="class-icon-wrapper-centered tooltip-hover" // Klasse für CSS hinzugefügt
                        ref={classIconRef}
                        onMouseEnter={() => setHoveredInfo('classIcon')}
                        onMouseLeave={() => setHoveredInfo(null)}
                      >
                        <div className="class-icon">
                          <img
                            src={getClassIcon()}
                            alt={`${character.class.name} icon`}
                          />
                        </div>
                      </div>
                      {hoveredInfo === 'classIcon' && (
                        <Tooltip
                          text={character.class.name}
                          parentRef={classIconRef}
                        />
                      )}

                      {/* 3. Subklasse (nur wenn vorhanden) */}
                      {subclassName && (
                        <p 
                          className="char-subclass-centered tooltip-hover" // Klasse für CSS hinzugefügt
                          ref={subclassRef}
                          onMouseEnter={() => setHoveredInfo('subclass')}
                          onMouseLeave={() => setHoveredInfo(null)}
                        >
                          {subclassName}
                        </p>
                      )}
                      {hoveredInfo === 'subclass' && subclassData && (
                        <Tooltip
                          text={subclassData.description || subclassName}
                          parentRef={subclassRef}
                        />
                      )}
                      
                      {/* 4. Klasse + Level */}
                      <p 
                        className="char-class-centered tooltip-hover" // Klasse für CSS hinzugefügt
                        ref={classRef}
                        onMouseEnter={() => setHoveredInfo('class')}
                        onMouseLeave={() => setHoveredInfo(null)}
                      >
                        Lv {character.level || 1} {character.class.name}
                      </p>
                      {hoveredInfo === 'class' && (
                        <Tooltip
                          text={character.class.description || character.class.name}
                          parentRef={classRef}
                        />
                      )}
                      
                      {/* 5. Hintergrund (ohne Tooltip laut Anforderung) */}
                      <p className="char-background-centered">
                          {character.background.name}
                      </p>
                    </div>

                    {/* KORREKTUR: Attributs-Stats */}
                    <div className="primary-stats">
                      {/* KORRIGIERT: Iteriere über character.abilities (Basiswerte) statt character.stats.abilities */}
                      {Object.keys(character.abilities).map((key) => {
                        // KORRIGIERT: Berechne den finalen Wert (Basis + Rassenbonus)
                        const finalScore = character.abilities[key] + getRacialAbilityBonus(character, key);
                        
                        return (
                          <div
                            key={key}
                            className="stat-block"
                            ref={statRefs[key]}
                            onMouseEnter={() => setHoveredStat(key)}
                            onMouseLeave={() => setHoveredStat(null)}
                          >
                            <span className="stat-value">
                              {/* KORRIGIERT: Zeige den berechneten finalen Wert an */}
                              {finalScore}
                            </span>
                            <span className="stat-label">{key.toUpperCase()}</span>
                            {hoveredStat === key && (
                              <Tooltip
                                text={ABILITY_DESCRIPTIONS_DE[key]}
                                parentRef={statRefs[key]}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </React.Fragment>
                )}

                {/* ... (Restliche Tabs 'Kampf' und 'Details' bleiben unverändert) ... */}
                {/* INHALT FÜR TAB 2: KAMPF (Unverändert) */}
                {activeStatTab === "Kampf" && (
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
                    <div className="combat-stat">
                      <span>Erfahrung</span>
                      <span>
                        {currentExp}
                        {expForNextLevel !== "MAX" ? `/${expForNextLevel}` : " (MAX)"}
                      </span>
                    </div>
                  </div>
                )}

                {/* INHALT FÜR TAB 3: DETAILS (Jetzt leer) */}
                {activeStatTab === "Details" && (
                  <div className="details-tab-content">
                    <p>Weitere Details (z.B. Fähigkeiten, Resistenzen) können hier angezeigt werden.</p>
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