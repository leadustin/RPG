// src/components/character_creation/CreationInvocationSelection.jsx
import React, { useMemo } from 'react';
import { WarlockLogic } from '../../engine/logic/classes/WarlockLogic';
import Tooltip from '../tooltip/Tooltip';
import '../level_up/LevelUpScreen.css'; 

const iconModules = import.meta.glob('../../assets/images/icons/*.(png|webp|jpg|svg)', { eager: true });
const icons = {};
for (const path in iconModules) {
  icons[path.split('/').pop()] = iconModules[path].default;
}

const InvocationTooltip = ({ feat }) => {
    // BEREINIGT: Nur noch Zugriff auf 'prerequisite'
    const req = feat.prerequisite;

    return (
        <div className="spell-tooltip-content">
            <div className="spell-tooltip-header">
                <span className="spell-tooltip-name">{feat.name}</span>
                <span className="tag" style={{background: '#9c27b0'}}>Anrufung / Pakt</span>
            </div>
            <div className="spell-tooltip-description" style={{marginTop: '10px'}}>
                {feat.description}
            </div>
            {req && (
                <div className="spell-tooltip-footer" style={{marginTop: '10px', borderTop: '1px solid #444', paddingTop: '5px', fontSize: '0.85em', color:'#ccc'}}>
                    <strong>Voraussetzungen:</strong>
                    <ul>
                        {req.level && <li>Level {req.level}</li>}
                        {req.feature && <li>Benötigt: {req.feature}</li>}
                        {req.spell && <li>Zauber: {req.spell}</li>}
                    </ul>
                </div>
            )}
        </div>
    );
};

export const CreationInvocationSelection = ({ character, updateCharacter }) => {
    const logic = useMemo(() => new WarlockLogic(character), [character]);
    
    // Alle Invocations laden
    const allInvocations = useMemo(() => logic.getAllInvocations(), [logic]);
    
    // Filtern: Nur was für Level 1 verfügbar ist
    const availableList = useMemo(() => {
        return allInvocations.filter(inv => {
            return logic.checkInvocationPrerequisite(inv, character.features || []);
        });
    }, [allInvocations, logic, character.features]);

    // Aktuell gewählte Invocation finden
    const selectedInvocationKey = (character.features || []).find(f => 
        allInvocations.some(i => i.key === f)
    );

    const handleSelect = (key) => {
        // Bereinige Features von anderen Invocations
        const otherFeatures = (character.features || []).filter(f => 
            !allInvocations.some(i => i.key === f)
        );

        if (selectedInvocationKey === key) {
            updateCharacter({ features: otherFeatures });
        } else {
            updateCharacter({ features: [...otherFeatures, key] });
        }
    };

    return (
        <div className="invocation-ui-vertical" style={{height: 'auto', maxHeight: '600px'}}>
            <div className="inv-status-bar">
                <span>Wähle deine <strong>Eldritch Invocation</strong>:</span>
                <span style={{marginLeft:'10px', color: selectedInvocationKey ? '#4caf50' : '#ccc'}}>
                    {selectedInvocationKey ? '1 / 1 gewählt' : '0 / 1 gewählt'}
                </span>
            </div>

            <div className="inv-grid" style={{marginTop: '15px'}}>
                {availableList.map(inv => {
                    const iconSrc = icons[inv.icon] || icons['skill_placeholder.png'];
                    const isSelected = selectedInvocationKey === inv.key;

                    return (
                        <Tooltip key={inv.key} content={<InvocationTooltip feat={inv} />}>
                            <div 
                                className={`inv-compact-card ${isSelected ? 'selected-add' : ''}`}
                                onClick={() => handleSelect(inv.key)}
                                style={{cursor: 'pointer', border: isSelected ? '2px solid #4caf50' : '1px solid #444'}}
                            >
                                <img src={iconSrc} alt={inv.name} />
                                {isSelected && <div className="check-marker" style={{background:'#4caf50'}}>✓</div>}
                            </div>
                        </Tooltip>
                    );
                })}
            </div>
            
            {selectedInvocationKey && (
                <div style={{marginTop: '15px', padding: '10px', background: 'rgba(76, 175, 80, 0.1)', border: '1px solid #4caf50', borderRadius: '4px'}}>
                    <strong>Gewählt: </strong> 
                    {availableList.find(i => i.key === selectedInvocationKey)?.name}
                </div>
            )}
        </div>
    );
};