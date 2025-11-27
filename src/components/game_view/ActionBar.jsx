// src/components/game_view/ActionBar.jsx
import React, { useState, useMemo, useRef, useEffect } from 'react';
import './ActionBar.css';
import OptionsMenu from './OptionsMenu';
import Tooltip from '../tooltip/Tooltip';
import spellsEngine from '../../engine/spellsEngine';
// NEU: Import für Warlock Logik
import { WarlockLogic } from '../../engine/logic/classes/WarlockLogic';

// +++ NEU: Daten für Feature-Lookup importieren +++
import allClassData from '../../data/classes.json';
import featuresData from '../../data/features.json';

// --- ICONS LADEN ---
const iconModules = import.meta.glob('../../assets/images/icons/*.(png|webp|jpg|svg)', { eager: true });
const classIconModules = import.meta.glob('../../assets/images/classes/*.png', { eager: true });
const masteryIconModules = import.meta.glob('../../assets/images/weaponmasteries/*.png', { eager: true });

const getIconSrc = (iconName, type = 'generic') => {
    if (!iconName) return null;
    let modules = iconModules;
    if (type === 'class') modules = classIconModules;
    if (type === 'mastery') modules = masteryIconModules;
    for (const path in modules) {
        if (path.includes(iconName)) return modules[path].default;
    }
    return null;
};

const PLACEHOLDER_ICON = getIconSrc('skill_placeholder.png');

// --- STANDARD AKTIONEN ---
const BASE_ACTIONS = [
    { name: 'Angriff', description: 'Führe einen Nah- oder Fernkampfangriff aus.', icon: 'sword_icon.png' },
    { name: 'Spurt', description: 'Verdopple deine Bewegungsrate für diesen Zug.', icon: 'boot_icon.png' },
    { name: 'Rückzug', description: 'Bewegung provoziert keine Gelegenheitsangriffe.', icon: 'shield_icon.png' },
    { name: 'Verstecken', description: 'Mache einen Geschicklichkeitswurf (Heimlichkeit).', icon: 'hood_icon.png' },
    { name: 'Schubsen', description: 'Stoße eine Kreatur weg oder werfe sie zu Boden.', icon: 'hand_icon.png' },
    { name: 'Helfen', description: 'Gewähre einem Verbündeten Vorteil.', icon: 'help_icon.png' },
    { name: 'Springen', description: 'Springe weit oder hoch.', icon: 'jump_icon.png' },
];

// --- FILTER LOGIK ---
const isActiveFeature = (feat) => {
    if (!feat) return false;
    if (feat.action_type) return true;
    if (feat.feature_type === 'metamagic') return true;
    if (feat.mechanics) {
        const m = feat.mechanics;
        const activeTypes = ['cast_spell', 'at_will_spell', 'limited_use_spell', 'ki_spell', 'ki_attack', 'summon_pact_weapon', 'wild_shape_upgrade', 'toggle_aura_choice', 'healing_pool', 'perform_ritual', 'musician_inspiration'];
        if (activeTypes.includes(m.type)) return true;
    }
    return false;
};

const isConsumable = (item) => {
    if (!item) return false;
    const type = item.type?.toLowerCase() || '';
    return ['potion', 'scroll', 'food', 'consumable', 'drink'].some(t => type.includes(t)) || item.consumable === true;
};

function ActionBar({ onSaveGame, onLoadGame, onToggleCharacterSheet, character, onRestClick, onSlotClick, selectedAction, disabled = false }) {
    const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
    
    // Tabs & View State
    const [activeTab, setActiveTab] = useState('Inventar'); 
    const [tabBeforeOptions, setTabBeforeOptions] = useState('Inventar');
    const [viewMode, setViewMode] = useState('multi'); 

    const [visibleRows, setVisibleRows] = useState(2);
    const [dividers, setDividers] = useState([5, 11]); 
    
    const TOTAL_COLS = 16;
    const MIN_COL_WIDTH = 0; 
    const SLOT_WIDTH = 47; 

    const gridRef = useRef(null);
    const dragRef = useRef(null);
    const isOverlapping = dividers[0] === dividers[1];

    const classTabName = character?.class?.name || "Klasse";

    // --- DATEN SAMMELN ---
    const mainHandWeapon = character?.equipment?.['main-hand'] || null;
    const rangedWeapon = character?.equipment?.['ranged'] || null;

    const slotsData = useMemo(() => {
        const standard = [];
        const passive = [];
        
        BASE_ACTIONS.forEach(base => {
            let icon = getIconSrc(base.icon) || getIconSrc(base.name.toLowerCase()) || PLACEHOLDER_ICON;
            standard.push({ ...base, uiType: 'Aktion', iconSrc: icon });
        });

        // +++ NEU: Helper Funktion zum Auflösen von Features +++
        const resolveFeature = (featIdentifier) => {
            // Falls es schon ein Objekt ist (Legacy Support), direkt zurückgeben
            if (typeof featIdentifier === 'object' && featIdentifier !== null) return featIdentifier;

            const charClass = allClassData.find(c => c.key === character?.class?.key);
            
            // 1. Suche in Klassen-Features
            let found = charClass?.features?.find(f => (f.key === featIdentifier || f.name === featIdentifier));
            
            // 2. Suche in Subklassen-Features
            if (!found && character?.subclassKey && charClass?.subclasses) {
                const subclass = charClass.subclasses.find(sc => sc.key === character.subclassKey);
                found = subclass?.features?.find(f => (f.key === featIdentifier || f.name === featIdentifier));
            }

            // 3. Suche in globalen Features
            if (!found) {
                found = featuresData.find(f => (f.key === featIdentifier || f.name === featIdentifier));
            }
            return found;
        };

        if (character?.features) {
            character.features.forEach(featIdentifier => {
                // Feature auflösen
                const featData = resolveFeature(featIdentifier);
                
                // Falls nichts gefunden wurde, überspringen (oder Dummy anzeigen)
                if (!featData) return;

                let featIcon = getIconSrc(featData.icon) || PLACEHOLDER_ICON;
                if (featIcon === PLACEHOLDER_ICON && character.class?.icon) {
                        const cIcon = getIconSrc(character.class.icon, 'class');
                        if (cIcon) featIcon = cIcon;
                }

                if (isActiveFeature(featData)) {
                    let typeLabel = featData.action_type === 'bonus_action' ? "Bonusaktion" : (featData.action_type === 'reaction' ? "Reaktion" : "Merkmal");
                    standard.push({ name: featData.name, description: featData.description, uiType: typeLabel, iconSrc: featIcon });
                } else {
                    passive.push({ name: featData.name, description: featData.description, uiType: 'Passiv', iconSrc: featIcon });
                }
            });
        }

        if (character?.weapon_mastery_choices) {
            character.weapon_mastery_choices.forEach(mastery => {
                passive.push({
                    name: `Meisterschaft: ${mastery}`,
                    description: `Waffenmeisterschaft für ${mastery}`,
                    uiType: 'Passiv',
                    iconSrc: getIconSrc(mastery, 'mastery') || PLACEHOLDER_ICON
                });
            });
        }

        const spells = [];
        
        // 1. Zaubertricks
        (character?.cantrips_known || []).forEach(key => {
            const spell = spellsEngine.getSpell(key);
            if (spell) spells.push({ ...spell, uiType: 'Zaubertrick', iconSrc: getIconSrc(spell.icon) || PLACEHOLDER_ICON });
        });

        // 2. Normale Zauber (Prepared oder Known)
        let prepared = (character?.spells_prepared && character.spells_prepared.some(k => k !== null)) 
            ? character.spells_prepared.filter(k => k !== null) 
            : [...(character?.spells_known || [])];

        // 3. NEU: Warlock Patron Zauber (PHB 2024) hinzufügen
        if (character?.class?.key === 'warlock') {
            try {
                const warlockLogic = new WarlockLogic(character);
                const patronSpells = warlockLogic.getAlwaysPreparedPatronSpells();
                patronSpells.forEach(key => {
                    if (!prepared.includes(key)) {
                        prepared.push(key);
                    }
                });
            } catch (e) {
                console.error("Fehler beim Laden der Hexenmeister Patron-Zauber:", e);
            }
        }

        // 4. Alle Zauber in UI-Objekte umwandeln
        prepared.forEach(key => {
            const spell = spellsEngine.getSpell(key);
            if (spell) spells.push({ ...spell, uiType: `Zauber (${spell.level})`, iconSrc: getIconSrc(spell.icon) || PLACEHOLDER_ICON });
        });

        const items = [];
        (character?.inventory || []).forEach(item => {
            if (isConsumable(item)) {
                items.push({ name: item.name, description: item.description, uiType: 'Gegenstand', iconSrc: getIconSrc(item.icon) || PLACEHOLDER_ICON, count: item.quantity || 1 });
            }
        });

        return { standard, spells, items, passive };
    }, [character]);

    // --- HANDLER ---
    const handleSlotClick = (action) => {
        // Wenn disabled (z.B. nicht im Kampf), normal Inventar öffnen
        if (disabled || !onSlotClick) {
            console.log("Slot geklickt:", action);
            return;
        }
        // Im Kampf: Aktion an GameView weitergeben
        onSlotClick(action);
    };

    const handleTabClick = (tabName) => {
        if (activeTab === tabName && viewMode !== 'multi') {
            setActiveTab(null); 
            setViewMode('multi');
            return;
        }
        setActiveTab(tabName);
        setTabBeforeOptions(tabName);

        if (tabName === 'Allgem.') setViewMode('standard');
        else if (tabName === classTabName) setViewMode('spells');
        else if (tabName === 'Gegenst.') setViewMode('items');
        else if (tabName === 'Passiv') setViewMode('passive');
        else setViewMode('multi'); 
    };

    const handleInventoryClick = () => {
        handleTabClick('Inventar'); 
        onToggleCharacterSheet();
    };

    const handleMouseDown = (index) => (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragRef.current = index;
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e) => {
        if (dragRef.current === null || !gridRef.current) return;
        const gridRect = gridRef.current.getBoundingClientRect();
        const relX = (e.clientX - gridRect.left) / gridRect.width;
        const colIndex = Math.round(relX * TOTAL_COLS);
        setDividers(prev => {
            const newDividers = [...prev];
            if (dragRef.current === 0) {
                const max = prev[1] - MIN_COL_WIDTH;
                newDividers[0] = Math.max(MIN_COL_WIDTH, Math.min(colIndex, max));
            } else {
                const min = prev[0] + MIN_COL_WIDTH;
                newDividers[1] = Math.max(min, Math.min(colIndex, TOTAL_COLS - MIN_COL_WIDTH));
            }
            return newDividers;
        });
    };

    const handleMouseUp = () => {
        dragRef.current = null;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    // --- RENDERER ---
    const getTabClassName = (n) => `hotbar-tab ${activeTab === n ? 'active' : ''}`;
    const EmptySlot = () => <div className="hotbar-slot"></div>;
    
    const isSlotSelected = (action) => {
        if (!selectedAction) return false;
        // Vergleich nach Name (da Aktionen verschiedene Quellen haben können)
        return selectedAction.name === action.name;
    };

    const FilledSlot = ({ action }) => (
        <Tooltip content={
            <div className="action-tooltip">
                <h4>{action.name}</h4>
                <div style={{ fontSize: '0.8em', color: '#ffd700' }}>{action.uiType}</div>
                <p>{action.description || "Keine Beschreibung."}</p>
            </div>
        }>
            <div 
                className={`hotbar-slot action-filled ${isSlotSelected(action) ? 'selected' : ''}`}
                onClick={() => handleSlotClick(action)}
                style={{ cursor: disabled ? 'default' : 'pointer' }}
            >
                <img src={action.iconSrc} alt={action.name} />
                {action.count > 1 && <span className="slot-count">{action.count}</span>}
            </div>
        </Tooltip>
    );

    const EquippedItemSlot = ({ item }) => {
        if (!item) return <EmptySlot />;
        const iconSrc = getIconSrc(item.icon) || PLACEHOLDER_ICON;
        
        // Equipment als Aktion verpacken
        const weaponAction = {
            name: item.name,
            description: item.description,
            type: 'weapon',
            item: item,
            uiType: 'Waffe',
            iconSrc: iconSrc
        };
        
        return (
            <Tooltip item={item}>
                <div 
                    className={`hotbar-slot equipped ${isSlotSelected(weaponAction) ? 'selected' : ''}`}
                    onClick={() => handleSlotClick(weaponAction)}
                    style={{ cursor: disabled ? 'default' : 'pointer' }}
                >
                    <img src={iconSrc} alt={item.name} />
                </div>
            </Tooltip>
        );
    };

    // Render Logic für 'multi' (Spaltenbegrenzt)
    const renderSectionMulti = (actions, colCount) => {
        if (colCount <= 0) return null;
        const slots = [];
        for (let c = 0; c < colCount; c++) {
            for (let r = 0; r < visibleRows; r++) {
                const idx = (c * visibleRows) + r;
                const action = actions[idx];
                slots.push(<div key={`${c}-${r}`} className="grid-cell">{action ? <FilledSlot action={action} /> : <EmptySlot />}</div>);
            }
        }
        return slots;
    };

    // Render Logic für 'single' (Scrollbar + Volles Grid)
    const renderSectionSingle = (actions) => {
        const slots = [];
        // Mindestens 16 Spalten (volle Bildschirmbreite), oder mehr wenn viele Items
        const minCols = 16;
        const neededCols = Math.ceil(actions.length / visibleRows);
        const colCount = Math.max(minCols, neededCols);
        
        for (let c = 0; c < colCount; c++) {
            for (let r = 0; r < visibleRows; r++) {
                const idx = (c * visibleRows) + r;
                const action = actions[idx];
                // Rendert FilledSlot ODER EmptySlot, damit das Grid immer sichtbar ist
                slots.push(
                    <div key={`${c}-${r}`} className="grid-cell">
                        {action ? <FilledSlot action={action} /> : <EmptySlot />}
                    </div>
                );
            }
        }
        return slots;
    };

    const colCounts = [dividers[0], dividers[1] - dividers[0], TOTAL_COLS - dividers[1]];

    return (
        <>
            <div className="ui-container">
                <div className="hotbar-container">
                    <div className="hotbar ui-panel">
                        <div className="global-controls">
                            <div className="global-control-icon" onClick={onRestClick} title="Rasten">R</div>
                            <div className="global-control-icon"></div><div className="global-control-icon"></div><div className="global-control-icon"></div><div className="global-control-icon"></div>
                        </div>

                        <div className="hotbar-main-area">
                            <div className="left-side-slots-integrated">
                                <div className="side-slot-column">
                                    <EquippedItemSlot item={mainHandWeapon} />
                                    <div className="hotbar-slot hotbar-slot-half"></div><div className="hotbar-slot hotbar-slot-half"></div>
                                </div>
                                <div className="side-slot-column">
                                    <EquippedItemSlot item={rangedWeapon} />
                                    <div className="hotbar-slot hotbar-slot-half"></div><div className="hotbar-slot hotbar-slot-half"></div>
                                </div>
                            </div>

                            <div className="main-grid-wrapper" style={{ '--rows': visibleRows }}>
                                
                                {viewMode === 'multi' && (
                                    <div className="multi-section-grid" ref={gridRef}>
                                        <div className="grid-section" style={{ width: `${colCounts[0] * SLOT_WIDTH}px` }}>
                                            <div className="section-inner">{renderSectionMulti(slotsData.standard, colCounts[0])}</div>
                                        </div>
                                        <div className="grid-divider divider-left">
                                            <div className={`divider-handle ${isOverlapping ? 'pos-top' : ''}`} onMouseDown={handleMouseDown(0)}></div>
                                        </div>
                                        <div className="grid-section" style={{ width: `${colCounts[1] * SLOT_WIDTH}px` }}>
                                            <div className="section-inner">{renderSectionMulti(slotsData.spells, colCounts[1])}</div>
                                        </div>
                                        <div className="grid-divider divider-right">
                                            <div className={`divider-handle ${isOverlapping ? 'pos-bottom' : ''}`} onMouseDown={handleMouseDown(1)}></div>
                                        </div>
                                        <div className="grid-section" style={{ width: `${colCounts[2] * SLOT_WIDTH}px` }}>
                                            <div className="section-inner">{renderSectionMulti(slotsData.items, colCounts[2])}</div>
                                        </div>
                                    </div>
                                )}

                                {viewMode !== 'multi' && (
                                    <div className="single-section-scroll">
                                        <div className="section-inner">
                                            {viewMode === 'standard' && renderSectionSingle(slotsData.standard)}
                                            {viewMode === 'spells' && renderSectionSingle(slotsData.spells)}
                                            {viewMode === 'items' && renderSectionSingle(slotsData.items)}
                                            {viewMode === 'passive' && renderSectionSingle(slotsData.passive)}
                                        </div>
                                    </div>
                                )}

                            </div>
                        </div>

                        <div className="hotbar-footer">
                            <div className="hotbar-tab-container">
                                <div className={getTabClassName('Inventar')} onClick={handleInventoryClick}>Inventar</div>
                                <div className={getTabClassName('Allgem.')} onClick={() => handleTabClick('Allgem.')}>Allgem.</div>
                                <div className={getTabClassName(classTabName)} onClick={() => handleTabClick(classTabName)}>{classTabName}</div>
                                <div className={getTabClassName('Gegenst.')} onClick={() => handleTabClick('Gegenst.')}>Gegenst.</div>
                                <div className={getTabClassName('Passiv')} onClick={() => handleTabClick('Passiv')}>Passiv</div>
                                <div className={getTabClassName('Optionen')} onClick={() => {setTabBeforeOptions(activeTab); setActiveTab('Optionen'); setIsOptionsModalOpen(true);}}>Optionen</div>
                            </div>
                            <div className="hotbar-row-controls">
                                <button className="hotbar-row-button" onClick={() => setVisibleRows(Math.max(2, visibleRows - 1))} disabled={visibleRows === 2}>-</button>
                                <button className="hotbar-row-button" onClick={() => setVisibleRows(Math.min(3, visibleRows + 1))} disabled={visibleRows === 3}>+</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {isOptionsModalOpen && <OptionsMenu onSave={onSaveGame} onLoad={onLoadGame} onClose={() => {setIsOptionsModalOpen(false); setActiveTab(tabBeforeOptions);}} showSaveLoadControls={true} />}
        </>
    );
}

export default ActionBar;