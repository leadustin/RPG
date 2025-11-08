import React, { useState, useMemo } from 'react';
import './SpellbookTab.css';
import SpellsEngine from '../../engine/spellsEngine';

// Erstelle eine Instanz der SpellsEngine, um auf die Zauber zuzugreifen
const spellsEngine = new SpellsEngine();

const SpellbookTab = ({ character }) => {
    const [selectedSpell, setSelectedSpell] = useState(null);

    // Memoisiere die gruppierten Zauber, um sie nicht bei jedem Rendern neu zu berechnen
    const spellsByLevel = useMemo(() => {
        if (!character || !character.knownSpells) {
            return {};
        }

        return character.knownSpells.reduce((acc, spellId) => {
            const spell = spellsEngine.getSpellById(spellId); // Methode anpassen, falls nötig
            if (spell) {
                const level = spell.level;
                if (!acc[level]) {
                    acc[level] = [];
                }
                acc[level].push(spell);
            }
            return acc;
        }, {});
    }, [character]);

    const handleSpellClick = (spell) => {
        setSelectedSpell(spell);
    };

    const renderSpellDetails = () => {
        if (!selectedSpell) {
            return <div className="spell-details-placeholder">Wähle einen Zauber aus, um Details anzuzeigen.</div>;
        }

        // NEU: Greift auf die 'ui_'-Felder zu, wenn vorhanden, sonst Fallback
        const castingTime = selectedSpell.ui_casting_time || selectedSpell.casting_time;
        const range = selectedSpell.ui_range || selectedSpell.range;
        const duration = selectedSpell.ui_duration || selectedSpell.duration;
        const description = selectedSpell.ui_description || selectedSpell.description;
        const scaling = selectedSpell.ui_scaling || selectedSpell.scaling; // ui_scaling ist neu
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
                {Object.keys(spellsByLevel).sort().map(level => (
                    <div key={level} className="spell-level-section">
                        <h3>{level > 0 ? `Grad ${level}` : 'Cantrips (Grad 0)'}</h3>
                        <ul className="spell-list">
                            {spellsByLevel[level].map(spell => (
                                <li key={spell.id} onClick={() => handleSpellClick(spell)}>
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