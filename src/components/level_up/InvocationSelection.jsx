// src/components/level_up/InvocationSelection.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { WarlockLogic } from '../../engine/logic/classes/WarlockLogic';
import Tooltip from '../tooltip/Tooltip';
import './LevelUpScreen.css'; 

// Hilfs-Icon-Lader
const iconModules = import.meta.glob('../../assets/images/icons/*.(png|webp|jpg|svg)', { eager: true });
const icons = {};
for (const path in iconModules) {
  icons[path.split('/').pop()] = iconModules[path].default;
}

const InvocationTooltip = ({ feat, status, reason }) => (
    <div className="spell-tooltip-content">
        <div className="spell-tooltip-header">
            <span className="spell-tooltip-name">{feat.name}</span>
            <span className="tag" style={{background: '#9c27b0'}}>Anrufung</span>
        </div>
        {status && (
            <div style={{padding: '5px', color: status === 'locked' ? '#ff6b6b' : '#6bff6b', fontSize: '0.85rem', borderBottom: '1px solid #444'}}>
                {status === 'locked' ? `Gesperrt: ${reason || 'Voraussetzung fehlt'}` : 'Verfügbar'}
            </div>
        )}
        <div className="spell-tooltip-description" style={{marginTop: '10px'}}>
            {feat.description}
        </div>
        {feat.prerequisites && (
            <div className="spell-tooltip-footer" style={{marginTop: '10px', borderTop: '1px solid #444', paddingTop: '5px', fontSize: '0.85em', color:'#ccc'}}>
                <strong>Voraussetzungen:</strong>
                <ul>
                    {feat.prerequisites.level && <li>Level {feat.prerequisites.level}</li>}
                    {feat.prerequisites.feature && <li>Pakt/Merkmal: {feat.prerequisites.feature}</li>}
                    {feat.prerequisites.spell && <li>Zauber: {feat.prerequisites.spell}</li>}
                </ul>
            </div>
        )}
    </div>
);

export const InvocationSelection = ({ character, targetCount, onSelectionChange }) => {
    const { t } = useTranslation();
    const logic = useMemo(() => new WarlockLogic(character), [character]);
    
    // SELECTION STATE
    const [toRemove, setToRemove] = useState(null);
    const [toAdd, setToAdd] = useState([]);

    // DATA LOADING
    const allInvocations = useMemo(() => logic.getAllInvocations(), [logic]);
    const allCharacterFeatures = character.features || [];

    // 1. BEREITS BEKANNTE (Basis-Liste zum Tauschen)
    // WICHTIG: Wir filtern hier, damit nur Features angezeigt werden, die WIRKLICH Invocations sind.
    const knownList = useMemo(() => {
        return allCharacterFeatures
            .map(key => allInvocations.find(i => i.key === key))
            .filter(Boolean); // Entfernt undefined (also Features, die keine Invocations sind)
    }, [allCharacterFeatures, allInvocations]);

    // 2. VERFÜGBARE (Pool zum Lernen)
    const availableList = useMemo(() => {
        // Simulierte Features für den Prerequisite-Check (Alte minus Zu-Entfernende plus Neue)
        const tempFeatures = [...allCharacterFeatures.filter(k => k !== toRemove), ...toAdd];

        return allInvocations.filter(inv => {
            if (allCharacterFeatures.includes(inv.key)) return false; // Bereits gelernt
            return true;
        }).map(inv => {
            const isValid = logic.checkInvocationPrerequisite(inv, tempFeatures);
            return { ...inv, isValid, reason: isValid ? null : 'Voraussetzung nicht erfüllt' };
        });
    }, [allInvocations, allCharacterFeatures, toRemove, toAdd, logic]);

    // BUGFIX: Zähle nur Features, die auch in der Invocation-Liste stehen!
    const currentKnownCount = knownList.length;
    
    const slotsFilled = currentKnownCount - (toRemove ? 1 : 0) + toAdd.length;

    // HANDLERS
    const handleToggleAvailable = (key) => {
        if (toAdd.includes(key)) {
            setToAdd(toAdd.filter(k => k !== key));
        } else {
            if (slotsFilled < targetCount) {
                setToAdd([...toAdd, key]);
            }
        }
    };

    const handleToggleKnown = (key) => {
        if (toRemove === key) {
            setToRemove(null);
        } else {
            setToRemove(key);
        }
    };

    // UPDATE PARENT
    useEffect(() => {
        onSelectionChange({
            remove: toRemove,
            add: toAdd,
            isValid: slotsFilled === targetCount
        });
    }, [toRemove, toAdd, slotsFilled, targetCount, onSelectionChange]); // Dependencies korrigiert

    return (
        <div className="invocation-ui-vertical">
            {/* HEADER STATUS */}
            <div className="inv-status-bar">
                <span>Anrufungen: <strong style={{color: slotsFilled === targetCount ? '#4caf50' : '#d4af37'}}>{slotsFilled} / {targetCount}</strong></span>
                {toRemove && <span className="swap-status">Tausche: <strong>{allInvocations.find(i=>i.key===toRemove)?.name}</strong></span>}
            </div>

            <div className="inv-scroll-container">
                
                {/* SECTION 1: NEUE SKILLS (VERFÜGBARE) */}
                <div className="inv-section">
                    <h5 className="inv-section-title">Verfügbare Anrufungen</h5>
                    <div className="inv-grid">
                        {availableList.sort((a,b) => b.isValid - a.isValid).map(inv => {
                            const iconSrc = icons[inv.icon] || icons['skill_placeholder.png'];
                            const isSelected = toAdd.includes(inv.key);
                            const isLocked = !inv.isValid;
                            // Dimmen wenn voll und nicht ausgewählt und nicht gelockt
                            const isDimmed = !isSelected && slotsFilled >= targetCount && !isLocked;

                            return (
                                <Tooltip key={inv.key} content={<InvocationTooltip feat={inv} status={isLocked ? 'locked' : 'available'} reason={inv.reason} />}>
                                    <div 
                                        className={`inv-compact-card ${isSelected ? 'selected-add' : ''} ${isLocked ? 'locked' : ''} ${isDimmed ? 'dimmed' : ''}`}
                                        onClick={() => !isLocked && handleToggleAvailable(inv.key)}
                                    >
                                        <img src={iconSrc} alt={inv.name} />
                                        {isSelected && <div className="check-marker">+</div>}
                                    </div>
                                </Tooltip>
                            );
                        })}
                    </div>
                </div>

                {/* SECTION 2: BEKANNTE SKILLS (TAUSCHEN) */}
                {knownList.length > 0 && (
                    <div className="inv-section">
                        <h5 className="inv-section-title">Deine Anrufungen (Klick zum Tauschen)</h5>
                        <div className="inv-grid">
                            {knownList.map(inv => {
                                const iconSrc = icons[inv.icon] || icons['skill_placeholder.png'];
                                const isRemoved = toRemove === inv.key;

                                return (
                                    <Tooltip key={inv.key} content={<InvocationTooltip feat={inv} status="available" />}>
                                        <div 
                                            className={`inv-compact-card known ${isRemoved ? 'selected-remove' : ''}`}
                                            onClick={() => handleToggleKnown(inv.key)}
                                        >
                                            <img src={iconSrc} alt={inv.name} />
                                            {isRemoved && <div className="check-marker remove">−</div>}
                                        </div>
                                    </Tooltip>
                                );
                            })}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};