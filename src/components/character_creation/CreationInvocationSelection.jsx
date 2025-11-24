// src/components/character_creation/CreationInvocationSelection.jsx
import React, { useMemo } from 'react';
import { WarlockLogic } from '../../engine/logic/classes/WarlockLogic';
import Tooltip from '../tooltip/Tooltip';
// Wir nutzen das existierende CSS vom LevelUp Screen für das Karten-Design
import '../level_up/LevelUpScreen.css'; 

// --- Icon Loader (Vite Glob) ---
const iconModules = import.meta.glob('../../assets/images/icons/*.(png|webp|jpg|svg)', { eager: true });
const icons = {};
for (const path in iconModules) {
  icons[path.split('/').pop()] = iconModules[path].default;
}

// --- Tooltip Komponente ---
const InvocationTooltip = ({ feat }) => (
    <div className="spell-tooltip-content">
        <div className="spell-tooltip-header">
            <span className="spell-tooltip-name">{feat.name}</span>
            <span className="tag" style={{background: '#9c27b0'}}>Anrufung / Pakt</span>
        </div>
        <div className="spell-tooltip-description" style={{marginTop: '10px'}}>
            {feat.description}
        </div>
        {feat.prerequisites && (
            <div className="spell-tooltip-footer" style={{marginTop: '10px', borderTop: '1px solid #444', paddingTop: '5px', fontSize: '0.85em', color:'#ccc'}}>
                <strong>Voraussetzungen:</strong>
                <ul>
                    {feat.prerequisites.level && <li>Level {feat.prerequisites.level}</li>}
                    {feat.prerequisites.feature && <li>Benötigt: {feat.prerequisites.feature}</li>}
                    {feat.prerequisites.spell && <li>Zauber: {feat.prerequisites.spell}</li>}
                </ul>
            </div>
        )}
    </div>
);

// --- Hauptkomponente ---
export const CreationInvocationSelection = ({ character, updateCharacter }) => {
    const logic = useMemo(() => new WarlockLogic(character), [character]);
    
    // Alle Invocations laden
    const allInvocations = useMemo(() => logic.getAllInvocations(), [logic]);
    
    // Filtern: Zeige nur Invocations, deren Voraussetzungen erfüllt sind (Level 1 Logik)
    const availableList = useMemo(() => {
        return allInvocations.filter(inv => {
            return logic.checkInvocationPrerequisite(inv, character.features || []);
        });
    }, [allInvocations, logic, character.features]);

    // Prüfen, welche Invocation bereits gewählt ist
    const selectedInvocationKey = (character.features || []).find(f => 
        allInvocations.some(i => i.key === f)
    );

    const handleSelect = (key) => {
        // Bereinige Features: Entferne alle anderen Invocations (Single Select für Level 1)
        const otherFeatures = (character.features || []).filter(f => 
            !allInvocations.some(i => i.key === f)
        );

        if (selectedInvocationKey === key) {
            // Wenn bereits gewählt -> Abwählen
            updateCharacter({ features: otherFeatures });
        } else {
            // Neu wählen -> Hinzufügen
            updateCharacter({ features: [...otherFeatures, key] });
        }
    };

    return (
        <div className="invocation-ui-vertical" style={{height: 'auto', maxHeight: '600px'}}>
            <div className="inv-status-bar">
                <span>Wähle deine <strong>Eldritch Invocation</strong> (oder Pakt):</span>
                <span style={{marginLeft:'auto', color: selectedInvocationKey ? '#4caf50' : '#ccc'}}>
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