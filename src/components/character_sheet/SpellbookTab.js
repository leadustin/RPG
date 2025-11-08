import React, { useState, useMemo } from 'react';
import './SpellbookTab.css';
import spellsEngine from '../../engine/spellsEngine'; // Importiere die Instanz
import { WizardLogic } from '../../engine/logic/classes/WizardLogic'; // Importiere die Logik

const SpellbookTab = ({ character }) => {
    const [selectedSpell, setSelectedSpell] = useState(null);

    // Erstelle eine Logik-Instanz, um auf die Zauberliste zuzugreifen
    const logic = useMemo(() => new WizardLogic(character), [character]);

    // Memoisiere die gruppierten Zauber, um sie nicht bei jedem Rendern neu zu berechnen
    const spellsByLevel = useMemo(() => {
        if (!character || !logic) {
            return {};
        }

        // Wir holen die Zauber direkt von der Logik-Klasse
        // (Diese Funktion wurde repariert, um das Level des Charakters zu nutzen)
        const knownSpellKeys = logic.getSpellbookSpells(); 

        return knownSpellKeys.reduce((acc, spellKey) => {
            // KORREKTUR: getSpell(spellKey) statt getSpellById(spellId)
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
    }, [character, logic]); // Abhängig von character und logic

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

    return (
        <div className="spellbook-tab">
            <div className="spell-list-container">
                <h2>Zauberbuch</h2>
                {/* Sortiere die Level numerisch */}
                {Object.keys(spellsByLevel).sort((a, b) => a - b).map(level => (
                    <div key={level} className="spell-level-section">
                        <h3>{level > 0 ? `Grad ${level}` : 'Zaubertricks (Grad 0)'}</h3>
                        <ul className="spell-list">
                            {spellsByLevel[level].map(spell => (
                                // KORREKTUR: spell.key statt spell.id
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