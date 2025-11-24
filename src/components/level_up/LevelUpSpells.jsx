// src/components/level_up/LevelUpSpells.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import spellsData from '../../data/spells.json';
import Tooltip from '../tooltip/Tooltip';
import './LevelUpScreen.css'; 

// Icons laden
const iconModules = import.meta.glob('../../assets/images/icons/*.(png|webp|jpg|svg)', { eager: true });
const icons = {};
for (const path in iconModules) {
  icons[path.split('/').pop()] = iconModules[path].default;
}

// Tooltip Komponente
const SpellTooltip = ({ spell, t }) => (
    <div className="spell-tooltip-content">
        <div className="spell-tooltip-header">
            <span className="spell-tooltip-name">{spell.name}</span>
            <span className="tag" style={{background: '#4a90e2'}}>
                {spell.level === 0 ? "Zaubertrick" : `Grad ${spell.level}`}
            </span>
        </div>
        <div className="spell-tooltip-meta-grid">
            <div className="meta-item"><span className="label">Zeit:</span> <span className="value">{spell.ui_casting_time || spell.casting_time}</span></div>
            <div className="meta-item"><span className="label">RW:</span> <span className="value">{spell.ui_range || spell.range}</span></div>
        </div>
        <div className="spell-tooltip-description" style={{marginTop: '10px'}}>
            {spell.ui_description || spell.description}
        </div>
    </div>
);

export const LevelUpSpells = ({ 
    character, 
    cantripsCount, 
    spellsCount, 
    maxSpellLevel, 
    canSwap, 
    onUpdate 
}) => {
    const { t } = useTranslation();
    const classKey = character.class.key;

    // STATE
    const [selectedCantrips, setSelectedCantrips] = useState([]);
    const [selectedSpells, setSelectedSpells] = useState([]);
    
    // Swap State
    const [swapUnlearn, setSwapUnlearn] = useState(null); 
    const [swapLearn, setSwapLearn] = useState(null);     

    // DATEN LADEN
    const knownSpellKeys = useMemo(() => {
        return [...(character.cantrips_known || []), ...(character.spells_known || []), ...(character.spellbook || [])];
    }, [character]);

    const availableCantrips = useMemo(() => spellsData.filter(s => 
        s.level === 0 && 
        s.classes.includes(classKey) && 
        !knownSpellKeys.includes(s.key)
    ), [classKey, knownSpellKeys]);

    const availableSpells = useMemo(() => spellsData.filter(s => 
        s.level > 0 && 
        s.level <= maxSpellLevel && 
        s.classes.includes(classKey) && 
        !knownSpellKeys.includes(s.key)
    ).sort((a,b) => a.level - b.level), [classKey, knownSpellKeys, maxSpellLevel]);

    const swappableSpells = useMemo(() => {
        if (!canSwap) return [];
        return (character.spells_known || [])
            .map(key => spellsData.find(s => s.key === key))
            .filter(s => s && s.level > 0 && s.level <= maxSpellLevel);
    }, [character, canSwap, maxSpellLevel]);


    // HANDLER
    const handleCantripToggle = (key) => {
        if (selectedCantrips.includes(key)) setSelectedCantrips(prev => prev.filter(k => k !== key));
        else if (selectedCantrips.length < cantripsCount) setSelectedCantrips(prev => [...prev, key]);
    };

    const handleSpellInteraction = (key) => {
        if (swapUnlearn) {
            if (swapLearn === key) setSwapLearn(null);
            else setSwapLearn(key);
            return;
        }

        if (selectedSpells.includes(key)) {
            setSelectedSpells(prev => prev.filter(k => k !== key));
        } else {
            if (selectedSpells.length < spellsCount) {
                setSelectedSpells(prev => [...prev, key]);
            }
        }
    };

    const handleSwapToggle = (key) => {
        if (swapUnlearn === key) {
            setSwapUnlearn(null);
            setSwapLearn(null);
        } else {
            setSwapUnlearn(key);
        }
    };

    // Update Parent
    useEffect(() => {
        onUpdate({
            newCantrips: selectedCantrips,
            newSpells: selectedSpells,
            swap: (swapUnlearn && swapLearn) ? { unlearn: swapUnlearn, learn: swapLearn } : null
        });
    }, [selectedCantrips, selectedSpells, swapUnlearn, swapLearn]);

    // Helper Render
    const renderCard = (spell, isSelected, isLocked, type, onClick) => {
        const iconSrc = icons[spell.icon] || icons['skill_placeholder.png'];
        let statusClass = "";
        let marker = "";

        if (isSelected) {
            if (type === 'remove') { statusClass = "selected-remove"; marker = "−"; }
            else if (type === 'swap-add') { statusClass = "selected-swap"; marker = "⇄"; }
            else { statusClass = "selected-add"; marker = "+"; }
        } else if (isLocked) {
            statusClass = "dimmed";
        }

        return (
            <Tooltip key={spell.key} content={<SpellTooltip spell={spell} t={t} />}>
                <div 
                    className={`inv-compact-card ${statusClass}`}
                    onClick={() => !isLocked && onClick(spell.key)}
                >
                    <img src={iconSrc} alt={spell.name} />
                    
                    {/* Text entfernt - Icon Only */}
                    
                    {/* Level Badge (wird per CSS positioniert) */}
                    {spell.level > 0 && <span className="level-badge">{spell.level}</span>}
                    
                    {isSelected && <div className={`check-marker ${type === 'remove' ? 'remove' : ''}`}>{marker}</div>}
                </div>
            </Tooltip>
        );
    };

    const unlearnName = swapUnlearn ? spellsData.find(s => s.key === swapUnlearn)?.name : "";

    return (
        <div className="invocation-ui-vertical">
            {/* HEADER */}
            <div className="inv-status-bar">
                <div style={{display:'flex', gap:'15px'}}>
                    {cantripsCount > 0 && <span>Tricks: <strong style={{color: selectedCantrips.length === cantripsCount ? '#4caf50' : '#d4af37'}}>{selectedCantrips.length}/{cantripsCount}</strong></span>}
                    {spellsCount > 0 && <span>Zauber: <strong style={{color: selectedSpells.length === spellsCount ? '#4caf50' : '#d4af37'}}>{selectedSpells.length}/{spellsCount}</strong></span>}
                </div>
                {swapUnlearn && <span className="swap-status">Tausche: <strong>{unlearnName}</strong></span>}
            </div>

            <div className="inv-scroll-container">
                
                {/* 1. ZAUBERTRICKS */}
                {cantripsCount > 0 && (
                    <div className="inv-section">
                        <h5 className="inv-section-title">Verfügbare Zaubertricks</h5>
                        <div className="inv-grid">
                            {availableCantrips.map(s => renderCard(s, selectedCantrips.includes(s.key), (!selectedCantrips.includes(s.key) && selectedCantrips.length >= cantripsCount), 'add', handleCantripToggle))}
                        </div>
                    </div>
                )}

                {/* 2. ZAUBER (LERNEN & TAUSCHEN) */}
                {(spellsCount > 0 || canSwap) && (
                    <div className="inv-section">
                        <h5 className="inv-section-title">
                            {swapUnlearn ? "Wähle Ersatz-Zauber" : "Verfügbare Zauber"}
                        </h5>
                        <div className="inv-grid">
                            {availableSpells.map(s => {
                                const isSelectedAsNew = selectedSpells.includes(s.key);
                                const isSelectedAsSwap = swapLearn === s.key;
                                const isDimmed = !isSelectedAsNew && !isSelectedAsSwap && (
                                    swapUnlearn ? false : (selectedSpells.length >= spellsCount)
                                );
                                return renderCard(s, isSelectedAsNew || isSelectedAsSwap, isDimmed, isSelectedAsSwap ? 'swap-add' : 'add', handleSpellInteraction);
                            })}
                        </div>
                    </div>
                )}

                {/* 3. BEKANNTE ZAUBER (NUR WENN TAUSCH MÖGLICH) */}
                {canSwap && swappableSpells.length > 0 && (
                    <div className="inv-section">
                        <h5 className="inv-section-title">Deine Zauber (Klick zum Tauschen)</h5>
                        <div className="inv-grid">
                            {swappableSpells.map(s => 
                                renderCard(s, swapUnlearn === s.key, false, 'remove', handleSwapToggle)
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};