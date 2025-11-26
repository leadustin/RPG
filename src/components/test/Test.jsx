// src/components/test/Test.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useDrop } from 'react-dnd';
import { useTranslation } from 'react-i18next';
import './Test.css';

// --- Imports aus CharacterSheet ---
import InventoryPanel from '../character_sheet/InventoryPanel';
import EquipmentSlot from '../character_sheet/EquipmentSlot';
import AbilitiesTab from '../character_sheet/AbilitiesTab';
import SpellbookTab from '../character_sheet/SpellbookTab';
import Tooltip from '../tooltip/Tooltip';
import { ItemTypes } from "../../dnd/itemTypes";
import allClassData from "../../data/classes.json";

// --- Logik & Helper ---
import {
    getAbilityModifier,
    calculateInitialHP,
    calculateAC,
    calculateMeleeDamage,
    getRacialAbilityBonus,
    ABILITY_DESCRIPTIONS_DE,
    calculateSkillBonus,
    SKILL_MAP,
    SKILL_DESCRIPTIONS_DE
} from "../../engine/characterEngine";
import { LEVEL_XP_TABLE } from "../../utils/helpers";

// Statische Daten
const ATTRIBUTE_ORDER = ["str", "dex", "con", "int", "wis", "cha"];
const SKILLS_BY_ATTRIBUTE = { str: [], dex: [], con: [], int: [], wis: [], cha: [] };
for (const [skillKey, attrKey] of Object.entries(SKILL_MAP)) {
  if (SKILLS_BY_ATTRIBUTE[attrKey]) SKILLS_BY_ATTRIBUTE[attrKey].push(skillKey);
}

const Test = ({ 
    onClose, 
    character, 
    party = [],
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
    
    // State
    const [displayCharacter, setDisplayCharacter] = useState(character);
    const [activeTab, setActiveTab] = useState("Inventory");
    const [activeStatTab, setActiveStatTab] = useState("Stats");

    // Sync Props
    useEffect(() => {
        if (character) setDisplayCharacter(character);
    }, [character]);

    const currentParty = party.length > 0 ? party : (character ? [character] : []);

    // --- Logik für Class Tabs (Spells vs Abilities) ---
    const hasSpellcasting = useMemo(() => {
        if (!displayCharacter?.class) return false;
        const cls = allClassData.find(c => c.key === displayCharacter.class.key);
        return !!cls?.spellcasting; 
    }, [displayCharacter]);

    const classTabKey = hasSpellcasting ? "Spells" : "Abilities";
    const getClassTabLabel = () => {
        if (!displayCharacter?.class?.key) return "Fähigkeiten";
        const key = displayCharacter.class.key;
        if (hasSpellcasting) return "Zauberbuch"; // Vereinfacht
        return "Fähigkeiten";
    };

    // --- Enhanced Equip Logic (Pfeile/Köcher) ---
    const enhancedHandleEquipItem = (item, slotType) => {
        if (item.type === 'ammo') {
            const currentAmmoSlot = displayCharacter.equipment.ammo;
            if (currentAmmoSlot && currentAmmoSlot.type === 'quiver') {
                handleFillQuiver(item);
            } else {
                console.warn("Kein Köcher ausgerüstet!");
            }
            return;
        }
        handleEquipItem(item, slotType); 
    };

    // --- Drag & Drop für Inventar ---
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

    // --- Helper für 2-Hand Waffen ---
    const getTwoHandedDisplayItem = () => {
        if (!displayCharacter) return null;
        const mainHand = displayCharacter.equipment["main-hand"];
        if (!mainHand || mainHand.type !== "weapon") return null;
        const isTwoHanded = mainHand.properties && 
            (mainHand.properties.includes("Zweihändig") || mainHand.properties.some((p) => p.startsWith("Vielseitig") && mainHand.isTwoHanded));
        
        if (isTwoHanded && !displayCharacter.equipment["off-hand"]) {
          return { ...mainHand, isTwoHandedDisplay: true };
        }
        return null;
    };

    // --- Berechnungen für Stats ---
    if (!displayCharacter) return null;

    const maxHp = displayCharacter.stats.maxHp || calculateInitialHP(displayCharacter);
    const currentHp = displayCharacter.stats.hp !== undefined ? displayCharacter.stats.hp : maxHp;
    const armorClass = calculateAC(displayCharacter);
    const meleeDamage = calculateMeleeDamage(displayCharacter);
    const finalModifiers = {};
    ATTRIBUTE_ORDER.forEach((key) => {
      const finalScore = displayCharacter.abilities[key] + getRacialAbilityBonus(displayCharacter, key);
      finalModifiers[key] = getAbilityModifier(finalScore);
    });

    return (
        <div className="character-view-overlay" onClick={onClose}>
            <div className="character-view-container" onClick={(e) => e.stopPropagation()}>
                
                {/* --- LINKE SPALTE: Portraits --- */}
                <div className="character-view-box cv-sidebar">
                    {currentParty.map((member) => {
                        const isActive = member.id === displayCharacter.id || (member.name === displayCharacter.name);
                        return (
                            <div 
                                key={member.id || member.name}
                                className={`cv-portrait-wrapper ${isActive ? 'active' : ''}`}
                                onClick={() => setDisplayCharacter(member)}
                            >
                                <div className="cv-portrait-frame">
                                    {member.portrait ? (
                                        <img src={member.portrait} alt={member.name} className="cv-portrait-image" />
                                    ) : (
                                        <div className="cv-portrait-placeholder">?</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* --- RECHTE SPALTE: Navigation & Content --- */}
                <div className="cv-right-column">
                    
                    {/* 1. Navigation (Zentrierte Box) */}
                    <div className="cv-nav-box">
                        <button className={`cv-nav-btn ${activeTab === "Inventory" ? "active" : ""}`} onClick={() => setActiveTab("Inventory")}>
                            Inventar
                        </button>
                        <button className={`cv-nav-btn ${activeTab === classTabKey ? "active" : ""}`} onClick={() => setActiveTab(classTabKey)}>
                            {getClassTabLabel()}
                        </button>
                        <button className={`cv-nav-btn ${activeTab === "Alchemy" ? "active" : ""}`} onClick={() => setActiveTab("Alchemy")}>
                            Alchemie
                        </button>
                    </div>

                    {/* 2. Hauptinhalt (Darunter) */}
                    <div className="cv-content-box">
                        
                        {/* TAB: INVENTAR */}
                        {activeTab === "Inventory" && (
                            <div className="cv-inventory-layout">
                                
                                {/* Spalte 1: Inventar Liste */}
                                <div className="cv-inventory-list-area" ref={drop}>
                                    <InventoryPanel 
                                        inventory={displayCharacter.inventory}
                                        currency={displayCharacter.wallet}
                                        onEquip={enhancedHandleEquipItem} 
                                        onUnequip={handleUnequipItem}
                                        handleUnpackItem={handleUnpackItem}
                                        handleDestroyItem={handleDestroyItem}
                                    />
                                </div>

                                {/* Spalte 2: Ausrüstung & Stats (Paperdoll) */}
                                <div className="cv-paperdoll-grid">
                                    
                                    {/* Links: Slots */}
                                    <div className="cv-col-slots-left">
                                        <p className="slot-label">Rüstung</p>
                                        <div className="two-column-grid">
                                            <EquipmentSlot slotType="head" currentItem={displayCharacter.equipment.head} onEquipItem={enhancedHandleEquipItem} />
                                            <EquipmentSlot slotType="amulet" currentItem={displayCharacter.equipment.amulet} onEquipItem={enhancedHandleEquipItem} />
                                            <EquipmentSlot slotType="armor" currentItem={displayCharacter.equipment.armor} onEquipItem={enhancedHandleEquipItem} />
                                            <EquipmentSlot slotType="cloak" currentItem={displayCharacter.equipment.cloak} onEquipItem={enhancedHandleEquipItem} />
                                            <EquipmentSlot slotType="gloves" currentItem={displayCharacter.equipment.gloves} onEquipItem={enhancedHandleEquipItem} />
                                            <EquipmentSlot slotType="boots" currentItem={displayCharacter.equipment.boots} onEquipItem={enhancedHandleEquipItem} />
                                            <EquipmentSlot slotType="ring1" currentItem={displayCharacter.equipment.ring1} onEquipItem={enhancedHandleEquipItem} />
                                            <EquipmentSlot slotType="ring2" currentItem={displayCharacter.equipment.ring2} onEquipItem={enhancedHandleEquipItem} />
                                        </div>
                                        <p className="slot-label">Waffen</p>
                                        <div className="two-column-grid">
                                            <EquipmentSlot slotType="main-hand" currentItem={displayCharacter.equipment["main-hand"]} onEquipItem={enhancedHandleEquipItem} />
                                            <EquipmentSlot slotType="off-hand" currentItem={getTwoHandedDisplayItem() || displayCharacter.equipment["off-hand"]} onEquipItem={enhancedHandleEquipItem} isTwoHandedDisplay={!!getTwoHandedDisplayItem()} />
                                            <EquipmentSlot slotType="ranged" currentItem={displayCharacter.equipment.ranged} onEquipItem={enhancedHandleEquipItem} />
                                            <EquipmentSlot slotType="ammo" currentItem={displayCharacter.equipment.ammo} onEquipItem={enhancedHandleEquipItem} onFillQuiver={handleFillQuiver} onUnloadQuiver={handleUnloadQuiver} />
                                        </div>
                                    </div>

                                    {/* Mitte: Charakter Modell */}
                                    <div className="cv-col-model-center">
                                        <img src={displayCharacter.model || "https://placeholder.pics/svg/160x300"} alt="Character Model" />
                                    </div>

                                    {/* Rechts: Stats */}
                                    <div className="cv-col-stats-right">
                                        <div style={{display:'flex', gap:5, marginBottom: 10, justifyContent: 'center'}}>
                                            <button className={`cv-nav-btn ${activeStatTab === "Stats" ? "active" : ""}`} style={{fontSize:'0.8em', padding: '4px 8px'}} onClick={() => setActiveStatTab("Stats")}>Stats</button>
                                            <button className={`cv-nav-btn ${activeStatTab === "Kampf" ? "active" : ""}`} style={{fontSize:'0.8em', padding: '4px 8px'}} onClick={() => setActiveStatTab("Kampf")}>Kampf</button>
                                        </div>

                                        {activeStatTab === "Stats" && (
                                            <>
                                            {Object.keys(displayCharacter.abilities).map((key) => {
                                                const finalScore = displayCharacter.abilities[key] + getRacialAbilityBonus(displayCharacter, key);
                                                return (
                                                    <div key={key} className="cv-stat-block">
                                                        <span className="cv-stat-lbl">{key.toUpperCase()}</span>
                                                        <span className="cv-stat-val">{finalScore} ({getAbilityModifier(finalScore)})</span>
                                                    </div>
                                                );
                                            })}
                                            </>
                                        )}

                                        {activeStatTab === "Kampf" && (
                                            <>
                                                <div className="cv-stat-block"><span className="cv-stat-lbl">HP</span><span className="cv-stat-val" style={{color:'#e05050'}}>{currentHp}/{maxHp}</span></div>
                                                <div className="cv-stat-block"><span className="cv-stat-lbl">RK</span><span className="cv-stat-val" style={{color:'#ffd700'}}>{armorClass}</span></div>
                                                <div className="cv-stat-block"><span className="cv-stat-lbl">Schaden</span><span className="cv-stat-val">{meleeDamage}</span></div>
                                            </>
                                        )}
                                    </div>

                                </div>
                            </div>
                        )}

                        {/* TAB: SPELLS/ABILITIES */}
                        {(activeTab === "Spells" || activeTab === "Abilities") && (
                            <div style={{height:'100%', overflow:'auto'}}>
                                {hasSpellcasting ? (
                                    <SpellbookTab character={displayCharacter} onUpdateCharacter={onUpdateCharacter} />
                                ) : (
                                    <AbilitiesTab character={displayCharacter} />
                                )}
                            </div>
                        )}

                        {/* TAB: ALCHEMY */}
                        {activeTab === "Alchemy" && (
                            <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100%', color:'#777', fontStyle:'italic'}}>
                                Alchemie System folgt...
                            </div>
                        )}

                    </div>
                </div>

            </div>
        </div>
    );
};

export default Test;