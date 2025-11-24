// src/components/character_sheet/SpellbookTab.jsx
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDrag, useDrop } from 'react-dnd';
import './SpellbookTab.css';
import spellsEngine from '../../engine/spellsEngine';
import { ItemTypes } from '../../dnd/itemTypes';
import { getAbilityModifier, getRacialAbilityBonus } from '../../engine/characterEngine';
import { WarlockLogic } from '../../engine/logic/classes/WarlockLogic';
import Tooltip from '../tooltip/Tooltip';

// --- ICONS LADEN ---
const iconModules = import.meta.glob('../../assets/images/icons/*.(png|webp|jpg|svg)', { eager: true });
const spellIcons = {};
for (const path in iconModules) {
  const fileName = path.split('/').pop();
  spellIcons[fileName] = iconModules[path].default;
}

// --- DRAGGABLE SPELL ICON ---
const DraggableSpell = ({ spell, isPrepared, onToggle, isAlwaysPrepared }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: ItemTypes.SPELL,
        item: { spell, origin: 'book' },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    const iconSrc = spellIcons[spell.icon] || spellIcons['skill_placeholder.png'];

    // Visuelles Feedback für Hexenmeister oder "Always Prepared" Zauber
    const cardClass = `spell-card ${isPrepared ? 'prepared-in-book' : ''} ${isAlwaysPrepared ? 'always-known' : ''}`;

    return (
        <div ref={drag} className={`spell-item-wrapper ${isDragging ? 'dragging' : ''}`}>
            <Tooltip content={<SpellTooltipContent spell={spell} />}>
                <div 
                    className={cardClass}
                    onClick={() => onToggle && onToggle(spell)} 
                    style={{ cursor: onToggle ? 'pointer' : 'default' }}
                >
                    <img src={iconSrc} alt={spell.name} />
                    {isPrepared && <div className="prepared-marker">✓</div>}
                </div>
            </Tooltip>
        </div>
    );
};

// --- INVOCATION CARD (Nicht draggable, nur Info) ---
const InvocationCard = ({ invocation }) => {
    const iconSrc = spellIcons[invocation.icon] || spellIcons['skill_placeholder.png'];

    return (
        <Tooltip content={<InvocationTooltipContent invocation={invocation} />}>
            <div className="spell-card always-known" style={{ borderColor: '#9c27b0' }}>
                <img src={iconSrc} alt={invocation.name} />
            </div>
        </Tooltip>
    );
};

// --- PREPARED SLOT ---
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

// --- PACT SLOT TOKEN (Für Warlock) ---
const PactSlotToken = ({ isUsed, level }) => (
    <div className={`pact-slot-token ${isUsed ? 'used' : 'available'}`}>
        <div className="token-inner">
            <span className="slot-level-text">{level}</span>
        </div>
        <span className="token-label">{isUsed ? 'Verbraucht' : 'Bereit'}</span>
    </div>
);

// --- TOOLTIP CONTENT (ZAUBER) ---
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

// --- TOOLTIP CONTENT (ANRUFUNG) ---
const InvocationTooltipContent = ({ invocation }) => (
    <div className="spell-tooltip">
        <h4>{invocation.name}</h4>
        <div className="spell-meta">
            <span className="tag" style={{background: '#9c27b0', padding: '2px 6px', borderRadius: '4px', fontSize: '0.8em'}}>Anrufung</span>
        </div>
        <p style={{marginTop: '10px'}}>{invocation.description}</p>
        {invocation.prerequisites && (
             <div style={{marginTop: '10px', fontSize: '0.8em', color: '#aaa', borderTop: '1px solid #444', paddingTop: '4px'}}>
                 <strong>Voraussetzungen:</strong>
                 {invocation.prerequisites.level && <span> Level {invocation.prerequisites.level} </span>}
                 {invocation.prerequisites.feature && <span> • {invocation.prerequisites.feature} </span>}
                 {invocation.prerequisites.spell && <span> • {invocation.prerequisites.spell} </span>}
             </div>
        )}
    </div>
);

const SpellbookTab = ({ character, onUpdateCharacter }) => {
    const { t } = useTranslation();
    const isWarlock = character?.class?.key === 'warlock';

    // --- LOGIC: COMMON ---
    
    const knownSpells = useMemo(() => {
        const spellbookSpells = character.spellbook || [];
        const knownSpellsList = character.spells_known || [];
        const bookKeys = [...spellbookSpells, ...knownSpellsList];
        
        const uniqueKeys = [...new Set(bookKeys)];
        return uniqueKeys.map(key => spellsEngine.getSpell(key)).filter(Boolean);
    }, [character.spellbook, character.spells_known]);

    const cantrips = useMemo(() => {
        const keys = character.cantrips_known || [];
        return keys.map(key => spellsEngine.getSpell(key)).filter(Boolean);
    }, [character.cantrips_known]);

    const spellsByLevel = useMemo(() => {
        const grouped = {};
        knownSpells.forEach(s => {
            if (!grouped[s.level]) grouped[s.level] = [];
            grouped[s.level].push(s);
        });
        return grouped;
    }, [knownSpells]);

    // --- LOGIC: PREPARED CASTERS ---
    const maxPrepared = useMemo(() => {
        if (!character || isWarlock) return 0;
        const level = character.level || 1;
        let abilityKey = 'int'; 
        if (['cleric', 'druid', 'ranger'].includes(character.class?.key)) abilityKey = 'wis';
        if (character.class?.key === 'paladin') abilityKey = 'cha';
        
        const score = character.abilities[abilityKey] + getRacialAbilityBonus(character, abilityKey);
        const mod = getAbilityModifier(score);
        
        const levelFactor = character.class?.key === 'paladin' ? Math.floor(level / 2) : level;
        return Math.max(1, levelFactor + mod);
    }, [character, isWarlock]);

    const preparedSpells = useMemo(() => {
        if (isWarlock) return [];
        const rawList = character.spells_prepared || [];
        const slots = new Array(maxPrepared).fill(null);
        rawList.slice(0, maxPrepared).forEach((key, i) => {
            if (key) slots[i] = spellsEngine.getSpell(key);
        });
        return slots;
    }, [character.spells_prepared, maxPrepared, isWarlock]);

    const preparedCount = preparedSpells.filter(Boolean).length;

    // --- ACTIONS ---
    const handlePrepareSpell = (spell, targetIndex) => {
        if (!onUpdateCharacter || isWarlock) return;
        if (spell.level === 0) return; 

        let newPreparedList = [...(character.spells_prepared || [])];
        if (newPreparedList.length < maxPrepared) {
            const diff = maxPrepared - newPreparedList.length;
            for(let i=0; i<diff; i++) newPreparedList.push(null);
        }

        const existingIndex = newPreparedList.indexOf(spell.key);
        if (existingIndex !== -1) newPreparedList[existingIndex] = null;

        if (typeof targetIndex !== 'number') {
            const freeIndex = newPreparedList.indexOf(null);
            if (freeIndex !== -1) newPreparedList[freeIndex] = spell.key;
            else return; 
        } else {
            newPreparedList[targetIndex] = spell.key;
        }
        onUpdateCharacter({ ...character, spells_prepared: newPreparedList });
    };

    const handleUnprepareSpell = (indexToRemove) => {
        if (!onUpdateCharacter) return;
        let newPreparedList = [...(character.spells_prepared || [])];
        if (indexToRemove < newPreparedList.length) {
            newPreparedList[indexToRemove] = null;
            onUpdateCharacter({ ...character, spells_prepared: newPreparedList });
        }
    };

    // --- LOGIC: WARLOCK SPECIFIC (PHB 2024) ---
    const warlockData = useMemo(() => {
        if (!isWarlock) return null;
        // Wichtig: Features übergeben, falls undefined im character objekt
        const safeCharacter = { ...character, features: character.features || [] };
        const logic = new WarlockLogic(safeCharacter);
        
        const pactLevel = logic.getPactSlotLevel();
        const maxSlots = logic.getPactSlotCount();
        const currentSlots = character.resources?.pact_magic_slots ?? maxSlots; 

        // 1. Spells & Patron Spells
        const manuallyLearnedSpells = knownSpells;
        const patronSpellKeys = logic.getAlwaysPreparedPatronSpells();
        const patronSpells = patronSpellKeys.map(key => spellsEngine.getSpell(key)).filter(Boolean);

        const combinedSpells = [...manuallyLearnedSpells];
        patronSpells.forEach(pSpell => {
            if (!combinedSpells.find(s => s.key === pSpell.key)) {
                combinedSpells.push(pSpell);
            }
        });

        const mysticArcanumSpells = combinedSpells.filter(s => s.level >= 6);
        const pactSpellsPool = combinedSpells.filter(s => s.level >= 1 && s.level <= 5);
        
        const patronSpellsToDisplay = pactSpellsPool.filter(s => patronSpellKeys.includes(s.key));
        const learnedSpellsToDisplay = pactSpellsPool.filter(s => !patronSpellKeys.includes(s.key));

        // 2. Invocations laden
        const invocations = logic.getAvailableInvocations();

        return { 
            pactLevel, 
            maxSlots, 
            currentSlots, 
            mysticArcanumSpells, 
            patronSpellsToDisplay,
            learnedSpellsToDisplay,
            patronSpellKeys,
            invocations // NEU
        };
    }, [character, isWarlock, knownSpells]);

    // --- RENDER ---
    return (
        <div className="spellbook-tab-bg3">
            
            {/* 1. CANTRIPS */}
            {cantrips.length > 0 && (
                <div className="sb-section cantrips-section">
                    <h3 className="sb-header">Zaubertricks <span className="sb-subinfo">(Immer verfügbar)</span></h3>
                    <div className="sb-grid">
                        {cantrips.map(spell => (
                             <DraggableSpell key={spell.key} spell={spell} isPrepared={true} isAlwaysPrepared={true} />
                        ))}
                    </div>
                </div>
            )}

            {/* 2.a WARLOCK: PAKTMAGIE */}
            {isWarlock && warlockData && (
                <>
                    <div className="sb-section pact-magic-section">
                        <div className="preparation-header warlock-header">
                            <div>
                                <h3>Paktmagie</h3>
                                <div className="sb-subinfo">Alle Paktzauber werden auf <strong>Grad {warlockData.pactLevel}</strong> gewirkt.</div>
                            </div>
                            <div className="pact-slots-container">
                                {Array.from({ length: warlockData.maxSlots }).map((_, i) => (
                                    <PactSlotToken 
                                        key={i} 
                                        level={warlockData.pactLevel} 
                                        isUsed={i >= warlockData.currentSlots} 
                                    />
                                ))}
                            </div>
                        </div>
                        
                        <div className="spellbook-list-section">
                            
                            {/* Patron Zauber */}
                            {warlockData.patronSpellsToDisplay.length > 0 && (
                                <div className="warlock-spell-group" style={{ marginBottom: '20px' }}>
                                    <h4 className="level-header"><span className="roman-level">Patron-Zauber</span><span className="line"></span></h4>
                                    <div className="sb-grid">
                                        {warlockData.patronSpellsToDisplay.map(spell => (
                                            <DraggableSpell key={spell.key} spell={spell} isPrepared={true} isAlwaysPrepared={true} onToggle={null} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Gelernte Paktzauber */}
                            <div className="warlock-spell-group">
                                <h4 className="level-header"><span className="roman-level">Gelernte Paktzauber</span><span className="line"></span></h4>
                                <div className="sb-grid">
                                    {warlockData.learnedSpellsToDisplay.map(spell => (
                                        <DraggableSpell key={spell.key} spell={spell} isPrepared={true} isAlwaysPrepared={false} onToggle={null} />
                                    ))}
                                    {warlockData.learnedSpellsToDisplay.length === 0 && <div className="empty-msg">Keine weiteren Zauber gelernt.</div>}
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* WARLOCK: MYSTISCHE ANRUFUNGEN (NEU) */}
                    {warlockData.invocations.length > 0 && (
                        <div className="sb-section invocations-section">
                            <h3 className="sb-header">Mystische Anrufungen</h3>
                            <div className="sb-grid">
                                {warlockData.invocations.map(inv => (
                                    <InvocationCard key={inv.key} invocation={inv} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* WARLOCK: MYSTISCHES ARKANUM */}
                    {warlockData.mysticArcanumSpells.length > 0 && (
                        <div className="sb-section mystic-arcanum-section">
                            <h3 className="sb-header">Mystisches Arkanum <span className="sb-subinfo">(1x pro Langer Rast)</span></h3>
                            <div className="sb-grid">
                                {warlockData.mysticArcanumSpells.map(spell => (
                                    <DraggableSpell key={spell.key} spell={spell} isPrepared={true} />
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* 2.b STANDARD: VORBEREITUNG */}
            {!isWarlock && (
                <>
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
                            {preparedSpells.map((spell, i) => (
                                <PreparedSlot key={i} index={i} spell={spell} onDrop={handlePrepareSpell} onRemove={handleUnprepareSpell} />
                            ))}
                        </div>
                    </div>

                    <div className="sb-section spellbook-list-section">
                        <h3 className="sb-header">Zauberbuch / Verfügbar</h3>
                        <div className="spellbook-scroll-area">
                            {Object.keys(spellsByLevel).sort((a, b) => a - b).map(level => (
                                <div key={level} className="level-group">
                                    <h4 className="level-header"><span className="roman-level">Grad {level}</span><span className="line"></span></h4>
                                    <div className="sb-grid">
                                        {spellsByLevel[level].map(spell => {
                                            const isPrep = (character.spells_prepared || []).includes(spell.key);
                                            return <DraggableSpell key={spell.key} spell={spell} isPrepared={isPrep} onToggle={(s) => handlePrepareSpell(s)} />;
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default SpellbookTab;