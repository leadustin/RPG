// src/components/level_up/InvocationSelection.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { WarlockLogic } from '../../engine/logic/classes/WarlockLogic';
import Tooltip from '../tooltip/Tooltip';
import './LevelUpScreen.css'; // Nutzt bestehende Styles

// Hilfs-Icon-Lader (wiederverwendet)
const iconModules = import.meta.glob('../../assets/images/icons/*.(png|webp|jpg|svg)', { eager: true });
const icons = {};
for (const path in iconModules) {
  icons[path.split('/').pop()] = iconModules[path].default;
}

const InvocationTooltip = ({ feat, status }) => (
    <div className="spell-tooltip-content">
        <div className="spell-tooltip-header">
            <span className="spell-tooltip-name">{feat.name}</span>
            <span className="tag" style={{background: '#9c27b0'}}>Anrufung</span>
        </div>
        {status && <div style={{padding: '5px', color: status === 'locked' ? 'red' : 'lightgreen', fontSize: '0.85rem'}}>{status === 'locked' ? 'Voraussetzung nicht erfüllt' : 'Verfügbar'}</div>}
        <div className="spell-tooltip-description" style={{marginTop: '10px'}}>
            {feat.description}
        </div>
        {feat.prerequisites && (
            <div className="spell-tooltip-footer" style={{marginTop: '10px', borderTop: '1px solid #444', paddingTop: '5px'}}>
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
    
    // Alle existierenden Anrufungen (aus features)
    const existingInvocations = useMemo(() => 
        character.features.filter(fKey => 
            logic.getAllInvocations().some(i => i.key === fKey)
        ), [character, logic]
    );

    // State für Auswahlen
    const [toRemove, setToRemove] = useState(null); // Key des zu entfernenden Features
    const [toAdd, setToAdd] = useState([]); // Array von Keys der neuen Features

    // Alle verfügbaren Anrufungen aus der DB
    const allInvocations = logic.getAllInvocations();

    // Filtern: Was kann gewählt werden?
    const availableOptions = useMemo(() => {
        // Liste der Features, die wir NACH dem Tausch hätten (für Prerequisite-Check von abhängigen Invocations)
        // Vereinfachung: Wir prüfen Prerequisites gegen den Basis-Charakter + die bereits gewählten 'toAdd'
        const currentSelection = [...existingInvocations.filter(k => k !== toRemove), ...toAdd];

        return allInvocations.filter(inv => {
            // Nicht anzeigen, wenn wir es schon haben (außer es steht auf der Remove-Liste)
            if (existingInvocations.includes(inv.key) && toRemove !== inv.key) return false;
            
            // Nicht anzeigen, wenn wir es gerade ausgewählt haben
            if (toAdd.includes(inv.key)) return false;

            return true;
        });
    }, [allInvocations, existingInvocations, toRemove, toAdd, logic]);

    // Handler
    const handleToggleExisting = (key) => {
        if (toRemove === key) setToRemove(null); // Abwählen
        else setToRemove(key); // Zum Entfernen markieren (Max 1)
    };

    const handleToggleAvailable = (inv) => {
        const key = inv.key;
        // Voraussetzung prüfen
        // Wir simulieren den Status "wenn wir diesen wählen würden"
        const tempSelection = [...existingInvocations.filter(k => k !== toRemove), ...toAdd];
        if (!logic.checkInvocationPrerequisite(inv, tempSelection)) {
            // Optional: UI Feedback "Nicht verfügbar"
            return;
        }

        if (toAdd.includes(key)) {
            setToAdd(toAdd.filter(k => k !== key));
        } else {
            // Prüfen ob Platz ist
            const currentCount = existingInvocations.length - (toRemove ? 1 : 0) + toAdd.length;
            if (currentCount < targetCount) {
                setToAdd([...toAdd, key]);
            }
        }
    };

    // Update Parent
    useEffect(() => {
        onSelectionChange({
            remove: toRemove,
            add: toAdd,
            isValid: (existingInvocations.length - (toRemove ? 1 : 0) + toAdd.length) === targetCount
        });
    }, [toRemove, toAdd, existingInvocations, targetCount]);

    // Berechnungen für UI
    const slotsFilled = existingInvocations.length - (toRemove ? 1 : 0) + toAdd.length;
    
    return (
        <div className="feat-sub-selection">
            <div className="choice-header">
                <h4>Mystische Anrufungen <span className="selection-count">({slotsFilled}/{targetCount})</span></h4>
                <p className="small-text">Wähle neue Anrufungen oder tausche eine bestehende aus.</p>
            </div>

            <div className="spell-swap-container" style={{alignItems: 'flex-start'}}>
                
                {/* SPALTE 1: BEREITS BEKANNT */}
                <div className="spell-swap-column" style={{width:'45%'}}>
                    <h5>Bekannt (Klick zum Tauschen)</h5>
                    <div className="spell-grid-layout compact">
                        {existingInvocations.map(key => {
                            const inv = allInvocations.find(i => i.key === key);
                            if (!inv) return null;
                            const iconSrc = icons[inv.icon] || icons['skill_placeholder.png'];
                            const isRemoved = toRemove === key;
                            
                            return (
                                <Tooltip key={key} content={<InvocationTooltip feat={inv} />}>
                                    <div 
                                        className={`spell-selection-card icon-only ${isRemoved ? 'selected-unlearn' : ''}`}
                                        onClick={() => handleToggleExisting(key)}
                                        style={{opacity: isRemoved ? 0.6 : 1}}
                                    >
                                        <img src={iconSrc} alt={inv.name} className="spell-selection-icon" />
                                        {isRemoved && <div className="spell-selection-check">−</div>}
                                    </div>
                                </Tooltip>
                            );
                        })}
                        {existingInvocations.length === 0 && <p className="empty-msg">Keine Anrufungen.</p>}
                    </div>
                </div>

                <div className="spell-swap-arrow" style={{marginTop: '40px'}}>➔</div>

                {/* SPALTE 2: VERFÜGBAR */}
                <div className="spell-swap-column" style={{width:'45%'}}>
                    <h5>Verfügbar (Klick zum Lernen)</h5>
                    <div className="spell-grid-layout compact">
                        {availableOptions.map(inv => {
                            const iconSrc = icons[inv.icon] || icons['skill_placeholder.png'];
                            const isSelected = toAdd.includes(inv.key);
                            // Prüfe Validität live
                            const tempSelection = [...existingInvocations.filter(k => k !== toRemove), ...toAdd];
                            const isValid = logic.checkInvocationPrerequisite(inv, tempSelection);

                            return (
                                <Tooltip key={inv.key} content={<InvocationTooltip feat={inv} status={isValid ? 'available' : 'locked'} />}>
                                    <div 
                                        className={`spell-selection-card icon-only ${isSelected ? 'selected-learn' : ''} ${!isValid ? 'locked' : ''}`}
                                        onClick={() => isValid && handleToggleAvailable(inv)}
                                        style={{filter: isValid ? 'none' : 'grayscale(1) brightness(0.5)', cursor: isValid ? 'pointer' : 'not-allowed'}}
                                    >
                                        <img src={iconSrc} alt={inv.name} className="spell-selection-icon" />
                                        {isSelected && <div className="spell-selection-check">+</div>}
                                    </div>
                                </Tooltip>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};