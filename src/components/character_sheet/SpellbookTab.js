import React, { useState, useMemo } from 'react';
import './SpellbookTab.css';
import spellsEngine from '../../engine/spellsEngine';
import { WizardLogic } from '../../engine/logic/classes/WizardLogic'; 

const SpellbookTab = ({ character }) => {
    const [selectedSpell, setSelectedSpell] = useState(null);
    const logic = useMemo(() => new WizardLogic(character), [character]);

    // NEU: Hole die gesamten Zauberdaten inklusive Slots
    const spellcastingData = useMemo(() => {
        // Hole die berechneten Daten von der Logic-Klasse
        if (logic.getSpellcastingData) {
             return logic.getSpellcastingData();
        }
        return { slots: [], maxLevel: 0, cantripCount: 0 };
    }, [logic]);


    // Memoisiere die gruppierten Zauber (wie zuvor)
    const spellsByLevel = useMemo(() => {
        if (!character || !logic) {
            return {};
        }
        
        // Hole die Zauberkeys über die Logik
        const knownSpellKeys = logic.getSpellbookSpells(); 
        
        return knownSpellKeys.reduce((acc, spellKey) => {
            const spell = spellsEngine.getSpell(spellKey); 
            
            if (spell) {
                const level = spell.level;
                if (!acc[level]) {
                    acc[level] = [];
                }
                acc[level].push(spell);
            }
            return acc;
        }, {});
    }, [character, logic]);

    const handleSpellClick = (spell) => {
        setSelectedSpell(spell);
    };

    const renderSpellDetails = () => {
        if (!selectedSpell) {
            return <div className="spell-details-placeholder">Wähle einen Zauber aus, um Details anzuzeigen.</div>;
        }

        // Greift auf die 'ui_'-Felder zu, wenn vorhanden, sonst Fallback
        const castingTime = selectedSpell.ui_casting_time || selectedSpell.casting_time;
        const range = selectedSpell.ui_range || selectedSpell.range;
        const duration = selectedSpell.ui_duration || selectedSpell.duration;
        const description = selectedSpell.ui_description || selectedSpell.description;
        const scaling = selectedSpell.ui_scaling || selectedSpell.scaling;
        const components = selectedSpell.components || [];

        return (
            <div className="spell-details">
                <h3>{selectedSpell.name}</h3>
                <p><em>{selectedSpell.school} {selectedSpell.level > 0 ? `(Grad ${selectedSpell.level})` : ' (Zaubertrick)'}</em></p>
                <p><strong>Zauberdauer:</strong> {castingTime}</p>
                <p><strong>Reichweite:</strong> {range}</p>
                <p><strong>Komponenten:</strong> {components.join(', ')}</p>
                <p><strong>Dauer:</strong> {duration}</p>
                <br/>
                <p>{description}</p>
                {scaling && <p><strong>Skalierung:</strong> {scaling}</p>}
            </div>
        );
    };

    // NEU: Funktion zur Anzeige der Zauberslots
    const renderSpellSlots = () => {
        const slots = spellcastingData.slots;
        const maxSpellLevel = spellcastingData.maxLevel;
        const cantripCount = spellcastingData.cantripCount;
        
        const slotDisplays = [];

        // Cantrips (Zaubertricks)
        if (cantripCount > 0) {
            slotDisplays.push(
                <div key="cantrips" className="spell-slot-info cantrip-slot">
                    Bekannte Zaubertricks: <span className="slot-count">{cantripCount}</span>
                </div>
            );
        }

        // Zauberslots (Level 1 bis maxLevel)
        // Wir iterieren bis maxLevel (z.B. Level 1 für einen Stufe 2 Magier)
        for (let i = 0; i < maxSpellLevel; i++) {
            const level = i + 1;
            const maxSlots = slots[i];
            
            // Annahme: Aktuell verfügbare Slots sind gleich Max Slots (kein Zustand für verbrauchte Slots)
            const currentSlots = maxSlots; 

            slotDisplays.push(
                <div key={level} className="spell-slot-info">
                    Grad {level} Slots: <span className="slot-count">{currentSlots}/{maxSlots}</span>
                </div>
            );
        }

        if (slotDisplays.length === 0) {
            return <p className="spell-slot-container">Keine Zauberplätze oder Zaubertricks bekannt.</p>;
        }

        return <div className="spell-slot-container">{slotDisplays}</div>;
    };


    return (
        <div className="spellbook-tab">
            <div className="spell-list-container">
                <h2>Zauberbuch</h2>
                {renderSpellSlots()} {/* NEU: Slots anzeigen */}
                
                {Object.keys(spellsByLevel).sort((a, b) => a - b).map(level => ( 
                    <div key={level} className="spell-level-section">
                        <h3>{level > 0 ? `Grad ${level}` : 'Zaubertricks (Grad 0)'}</h3>
                        <ul className="spell-list">
                            {spellsByLevel[level].map(spell => (
                                <li key={spell.key} onClick={() => handleSpellClick(spell)}>
                                    {spell.name}
                                 </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
            <div className="spell-details-container">
                {renderSpellDetails()}
            </div>
        </div>
    );
};

export default SpellbookTab;