// src/components/character_sheet/SpellbookTab.jsx
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDrag, useDrop } from 'react-dnd';
import './SpellbookTab.css';
import spellsEngine from '../../engine/spellsEngine';
import { ItemTypes } from '../../dnd/itemTypes';
import { getAbilityModifier, getRacialAbilityBonus } from '../../engine/characterEngine';
import Tooltip from '../tooltip/Tooltip';

// --- ICONS LADEN ---
const iconModules = import.meta.glob('../../assets/images/icons/*.(png|webp|jpg|svg)', { eager: true });
const spellIcons = {};
for (const path in iconModules) {
  const fileName = path.split('/').pop();
  spellIcons[fileName] = iconModules[path].default;
}

// --- DRAGGABLE SPELL ICON (Quelle: Liste unten) ---
const DraggableSpell = ({ spell, isPrepared, onToggle }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: ItemTypes.SPELL,
        item: { spell, origin: 'book' }, // Origin hilft uns zu wissen, woher er kommt
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    const iconSrc = spellIcons[spell.icon] || spellIcons['skill_placeholder.png'];

    return (
        <div ref={drag} className={`spell-item-wrapper ${isDragging ? 'dragging' : ''}`}>
            <Tooltip content={<SpellTooltipContent spell={spell} />}>
                <div 
                    className={`spell-card ${isPrepared ? 'prepared-in-book' : ''}`}
                    onClick={() => onToggle && onToggle(spell)} 
                >
                    <img src={iconSrc} alt={spell.name} />
                    {isPrepared && <div className="prepared-marker">✓</div>}
                </div>
            </Tooltip>
        </div>
    );
};

// --- PREPARED SLOT (Ziel: Oben) ---
// Auch draggable, um Zauber innerhalb der Leiste zu verschieben (Optional, hier als Drop Target)
const PreparedSlot = ({ spell, index, onDrop, onRemove }) => {
    const [{ isOver }, drop] = useDrop(() => ({
        accept: ItemTypes.SPELL,
        drop: (item) => onDrop(item.spell, index),
        collect: (monitor) => ({
            isOver: !!monitor.isOver(),
        }),
    }));

    const iconSrc = spell ? (spellIcons[spell.icon] || spellIcons['skill_placeholder.png']) : null;

    return (
        <div ref={drop} className={`prepared-slot ${isOver ? 'is-over' : ''} ${spell ? 'filled' : 'empty'}`}>
            {spell ? (
                <Tooltip content={<SpellTooltipContent spell={spell} />}>
                    <div className="slot-content">
                        <img src={iconSrc} alt={spell.name} />
                        <div className="remove-overlay" onClick={(e) => { e.stopPropagation(); onRemove(index); }}>✕</div>
                    </div>
                </Tooltip>
            ) : (
                <div className="slot-placeholder"></div>
            )}
        </div>
    );
};

// --- TOOLTIP CONTENT ---
const SpellTooltipContent = ({ spell }) => (
    <div className="spell-tooltip">
        <h4>{spell.name}</h4>
        <div className="spell-meta">
            <span>{spell.level === 0 ? 'Zaubertrick' : `Grad ${spell.level}`}</span>
            <span>• {spell.school}</span>
        </div>
        <p>{spell.ui_description || spell.description}</p>
        <div className="spell-stats">
            {spell.casting_time && <div>Zeit: {spell.casting_time}</div>}
            {spell.range && <div>RW: {spell.range}</div>}
            {spell.duration && <div>Dauer: {spell.duration}</div>}
        </div>
    </div>
);

const SpellbookTab = ({ character, onUpdateCharacter }) => {
    const { t } = useTranslation();

    // 1. Maximale vorbereitete Zauber berechnen
    const maxPrepared = useMemo(() => {
        if (!character) return 1;
        const level = character.level || 1;
        let abilityKey = 'int'; // Standard Wizard
        if (character.class?.key === 'cleric' || character.class?.key === 'druid') abilityKey = 'wis';
        if (character.class?.key === 'paladin') abilityKey = 'cha';
        // Sorcerer, Bard, Warlock, Ranger bereiten nicht vor (Known Spells), aber wir nutzen die Logik hier generisch
        
        const score = character.abilities[abilityKey] + getRacialAbilityBonus(character, abilityKey);
        const mod = getAbilityModifier(score);
        
        const levelFactor = character.class?.key === 'paladin' ? Math.floor(level / 2) : level;
        return Math.max(1, levelFactor + mod);
    }, [character]);

    // 2. Aktuell vorbereitete Zauber laden (mit fester Array-Größe und 'null' für Lücken)
    const preparedSpells = useMemo(() => {
        const rawList = character.spells_prepared || [];
        // Wir erstellen ein Array der Länge 'maxPrepared'.
        // Wenn rawList kleiner ist, füllen wir auf. Wenn größer (durch Level Down?), schneiden wir ab.
        // WICHTIG: Wir müssen sicherstellen, dass 'rawList' auch 'null' enthalten darf, 
        // um Lücken zu repräsentieren.
        
        const slots = new Array(maxPrepared).fill(null);
        
        rawList.slice(0, maxPrepared).forEach((key, i) => {
            if (key) {
                slots[i] = spellsEngine.getSpell(key);
            }
        });
        return slots;
    }, [character.spells_prepared, maxPrepared]);

    // 3. Alle verfügbaren Zauber (Zauberbuch) laden
    const knownSpells = useMemo(() => {
        const bookKeys = character.spellbook || character.spells_known || [];
        const uniqueKeys = [...new Set(bookKeys)];
        return uniqueKeys.map(key => spellsEngine.getSpell(key)).filter(Boolean);
    }, [character.spellbook, character.spells_known]);

    const cantrips = useMemo(() => {
        const keys = character.cantrips_known || [];
        return keys.map(key => spellsEngine.getSpell(key)).filter(Boolean);
    }, [character.cantrips_known]);


    // --- ACTIONS ---

    // Wird aufgerufen, wenn ein Zauber auf einen Slot (targetIndex) gezogen wird
    const handlePrepareSpell = (spell, targetIndex) => {
        if (!onUpdateCharacter) return;
        if (spell.level === 0) return; 

        // Kopie der aktuellen Liste (oder erstelle neue mit nulls)
        let newPreparedList = [...(character.spells_prepared || [])];
        
        // Sicherstellen, dass das Array groß genug ist
        if (newPreparedList.length < maxPrepared) {
            const diff = maxPrepared - newPreparedList.length;
            for(let i=0; i<diff; i++) newPreparedList.push(null);
        }

        // Prüfen, ob der Zauber schon woanders liegt -> dort entfernen (verschieben)
        const existingIndex = newPreparedList.indexOf(spell.key);
        if (existingIndex !== -1) {
            newPreparedList[existingIndex] = null;
        }

        // An neuer Position einfügen (überschreibt was auch immer dort war)
        // Wenn kein targetIndex übergeben wurde (z.B. durch Klick), suchen wir den ersten freien Slot
        if (typeof targetIndex !== 'number') {
            const freeIndex = newPreparedList.indexOf(null);
            if (freeIndex !== -1) {
                newPreparedList[freeIndex] = spell.key;
            } else {
                console.log("Keine freien Slots mehr.");
                return; 
            }
        } else {
            // Gezieltes Drop
            newPreparedList[targetIndex] = spell.key;
        }

        // Bereinigen: Wir speichern 'null' in der DB, damit die Positionen erhalten bleiben?
        // Ja, für dieses UI-Verhalten ist das notwendig.
        onUpdateCharacter({ ...character, spells_prepared: newPreparedList });
    };

    // Entfernen aus einem spezifischen Slot
    const handleUnprepareSpell = (indexToRemove) => {
        if (!onUpdateCharacter) return;
        let newPreparedList = [...(character.spells_prepared || [])];
        
        // Sicherstellen dass Index existiert
        if (indexToRemove < newPreparedList.length) {
            newPreparedList[indexToRemove] = null;
            onUpdateCharacter({ ...character, spells_prepared: newPreparedList });
        }
    };

    // --- GROUPING ---
    const spellsByLevel = useMemo(() => {
        const grouped = {};
        knownSpells.forEach(s => {
            if (!grouped[s.level]) grouped[s.level] = [];
            grouped[s.level].push(s);
        });
        return grouped;
    }, [knownSpells]);

    // Zähle tatsächliche Zauber (nicht nulls)
    const preparedCount = preparedSpells.filter(Boolean).length;

    return (
        <div className="spellbook-tab-bg3">
            
            {/* OBERER BEREICH: CANTRIPS */}
            {cantrips.length > 0 && (
                <div className="sb-section cantrips-section">
                    <h3 className="sb-header">Zaubertricks <span className="sb-subinfo">(Immer verfügbar)</span></h3>
                    <div className="sb-grid">
                        {cantrips.map(spell => (
                             <DraggableSpell key={spell.key} spell={spell} isPrepared={true} />
                        ))}
                    </div>
                </div>
            )}

            {/* MITTLERER BEREICH: VORBEREITUNG (Slots) */}
            <div className="sb-section preparation-section">
                <div className="preparation-header">
                    <h3>Vorbereitete Zauber</h3>
                    <div className="prep-counter">
                        <span className={`count ${preparedCount >= maxPrepared ? 'full' : ''}`}>
                            {preparedCount}
                        </span>
                        <span className="divider">/</span>
                        <span className="max">{maxPrepared}</span>
                    </div>
                </div>
                
                <div className="prepared-slots-row">
                    {/* Wir iterieren über das vorberechnete Array (das nulls enthält) */}
                    {preparedSpells.map((spell, i) => (
                        <PreparedSlot 
                            key={i} 
                            index={i} 
                            spell={spell} 
                            onDrop={handlePrepareSpell} 
                            onRemove={handleUnprepareSpell}
                        />
                    ))}
                </div>
            </div>

            {/* UNTERER BEREICH: ZAUBERBUCH LISTE */}
            <div className="sb-section spellbook-list-section">
                <h3 className="sb-header">Zauberbuch</h3>
                <div className="spellbook-scroll-area">
                    {Object.keys(spellsByLevel).sort((a, b) => a - b).map(level => (
                        <div key={level} className="level-group">
                            <h4 className="level-header">
                                <span className="roman-level">Grad {level}</span>
                                <span className="line"></span>
                            </h4>
                            <div className="sb-grid">
                                {spellsByLevel[level].map(spell => {
                                    // Prüfen ob der Key IRGENDWO im Prepared Array ist
                                    const isPrep = (character.spells_prepared || []).includes(spell.key);
                                    return (
                                        <DraggableSpell 
                                            key={spell.key} 
                                            spell={spell} 
                                            isPrepared={isPrep} 
                                            onToggle={(s) => handlePrepareSpell(s)} // Klick füllt ersten freien Slot
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                    {knownSpells.length === 0 && (
                        <div className="empty-book-msg">Keine Zauber im Zauberbuch.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SpellbookTab;