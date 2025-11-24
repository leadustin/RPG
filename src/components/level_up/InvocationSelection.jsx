// src/components/level_up/InvocationSelection.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { WarlockLogic } from '../../engine/logic/classes/WarlockLogic';
import Tooltip from '../tooltip/Tooltip';
import './LevelUpScreen.css'; 

const iconModules = import.meta.glob('../../assets/images/icons/*.(png|webp|jpg|svg)', { eager: true });
const icons = {};
for (const path in iconModules) {
  icons[path.split('/').pop()] = iconModules[path].default;
}

const InvocationTooltip = ({ feat, status, reason }) => {
    // BEREINIGT: Nur 'prerequisite'
    const req = feat.prerequisite;

    return (
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
            {req && (
                <div className="spell-tooltip-footer" style={{marginTop: '10px', borderTop: '1px solid #444', paddingTop: '5px', fontSize: '0.85em', color:'#ccc'}}>
                    <strong>Voraussetzungen:</strong>
                    <ul>
                        {req.level && <li>Level {req.level}</li>}
                        {req.feature && <li>Pakt/Merkmal: {req.feature}</li>}
                        {req.spell && <li>Zauber: {req.spell}</li>}
                    </ul>
                </div>
            )}
        </div>
    );
};

export const InvocationSelection = ({ character, targetCount, onSelectionChange }) => {
    const { t } = useTranslation();
    const logic = useMemo(() => new WarlockLogic(character), [character]);
    
    const [toRemove, setToRemove] = useState(null);
    const [toAdd, setToAdd] = useState([]);

    const allInvocations = useMemo(() => logic.getAllInvocations(), [logic]);
    const allCharacterFeatures = character.features || [];

    const knownList = useMemo(() => {
        return allCharacterFeatures
            .map(key => allInvocations.find(i => i.key === key))
            .filter(Boolean);
    }, [allCharacterFeatures, allInvocations]);

    const availableList = useMemo(() => {
        const tempFeatures = [...allCharacterFeatures.filter(k => k !== toRemove), ...toAdd];

        return allInvocations.filter(inv => {
            if (allCharacterFeatures.includes(inv.key)) return false;
            return true;
        }).map(inv => {
            const isValid = logic.checkInvocationPrerequisite(inv, tempFeatures);
            return { ...inv, isValid, reason: isValid ? null : 'Voraussetzung nicht erfüllt' };
        });
    }, [allInvocations, allCharacterFeatures, toRemove, toAdd, logic]);

    const currentKnownCount = knownList.length;
    const slotsFilled = currentKnownCount - (toRemove ? 1 : 0) + toAdd.length;

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

    useEffect(() => {
        onSelectionChange({
            remove: toRemove,
            add: toAdd,
            isValid: slotsFilled === targetCount
        });
    }, [toRemove, toAdd, slotsFilled, targetCount, onSelectionChange]);

    return (
        <div className="invocation-ui-vertical">
            <div className="inv-status-bar">
                <span>Anrufungen: <strong style={{color: slotsFilled === targetCount ? '#4caf50' : '#d4af37'}}>{slotsFilled} / {targetCount}</strong></span>
                {toRemove && <span className="swap-status">Tausche: <strong>{allInvocations.find(i=>i.key===toRemove)?.name}</strong></span>}
            </div>

            <div className="inv-scroll-container">
                <div className="inv-section">
                    <h5 className="inv-section-title">Verfügbare Anrufungen</h5>
                    <div className="inv-grid">
                        {availableList.sort((a,b) => b.isValid - a.isValid).map(inv => {
                            const iconSrc = icons[inv.icon] || icons['skill_placeholder.png'];
                            const isSelected = toAdd.includes(inv.key);
                            const isLocked = !inv.isValid;
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