import React from 'react';
import './CombatLog.css';

export const CombatLog = () => {
    // Beispiel-Logeinträge
    const logEntries = [
        "Ein wilder Goblin erscheint!",
        "Spieler greift an und verursacht 5 Schaden.",
        "Goblin greift an, verfehlt aber.",
        "Runde 2",
        "Spieler landet einen kritischen Treffer für 12 Schaden!",
        "Goblin wurde besiegt.",
    ];

    return (
        <div className="combat-log-container">
            <h4>Log</h4>
            <ul className="log-list">
                {logEntries.map((entry, index) => (
                    <li key={index}>{entry}</li>
                ))}
            </ul>
        </div>
    );
};