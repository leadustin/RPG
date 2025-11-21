import React, { useState } from 'react';
import './RestMenu.css';
import { calculateMaxHitDice } from '../../engine/characterEngine';

const RestMenu = ({ character, onShortRest, onLongRest, onClose }) => {
    const [activeTab, setActiveTab] = useState('short');
    const [diceToSpend, setDiceToSpend] = useState(1);
    const [lastActionMessage, setLastActionMessage] = useState(null);

    const maxHitDice = calculateMaxHitDice(character);
    const currentHitDice = character.currentHitDice !== undefined ? character.currentHitDice : maxHitDice;

    const handleShortRestClick = () => {
        if (diceToSpend > currentHitDice) return;
        onShortRest(diceToSpend);
        setLastActionMessage(`Kurze Rast: ${diceToSpend} TW verbraucht.`);
        setDiceToSpend(1); // Reset
    };

    const handleLongRestClick = () => {
        onLongRest();
        setLastActionMessage("Lange Rast: Vollständig erholt.");
        // Optional: Close after long rest? Or let user close.
    };

    const incrementDice = () => {
        if (diceToSpend < currentHitDice) setDiceToSpend(diceToSpend + 1);
    };

    const decrementDice = () => {
        if (diceToSpend > 1) setDiceToSpend(diceToSpend - 1);
    };

    return (
        <div className="rest-menu-overlay">
            <div className="rest-menu-container">
                <div className="rest-menu-header">
                    <h2>Rasten</h2>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </div>

                <div className="rest-tabs">
                    <button
                        className={`rest-tab ${activeTab === 'short' ? 'active' : ''}`}
                        onClick={() => setActiveTab('short')}
                    >
                        Kurze Rast (1 Std)
                    </button>
                    <button
                        className={`rest-tab ${activeTab === 'long' ? 'active' : ''}`}
                        onClick={() => setActiveTab('long')}
                    >
                        Lange Rast (8 Std)
                    </button>
                </div>

                <div className="rest-content">
                    <div className="resource-display">
                        <div className="resource-item">
                            <span className="resource-label">TP</span>
                            <span className="resource-value">{character.stats.hp} / {character.stats.maxHp}</span>
                        </div>
                        <div className="resource-item">
                            <span className="resource-label">Trefferwürfel</span>
                            <span className="resource-value">{currentHitDice} / {maxHitDice}</span>
                        </div>
                    </div>

                    {activeTab === 'short' && (
                        <div className="short-rest-controls">
                            <p>Verbrauche Trefferwürfel, um TP zu heilen.</p>
                            <div className="dice-selector">
                                <button onClick={decrementDice} disabled={diceToSpend <= 1}>-</button>
                                <span>{diceToSpend}</span>
                                <button onClick={incrementDice} disabled={diceToSpend >= currentHitDice}>+</button>
                            </div>
                            <button
                                className="rest-action-button"
                                onClick={handleShortRestClick}
                                disabled={currentHitDice === 0 || character.stats.hp >= character.stats.maxHp}
                            >
                                Würfeln & Heilen
                            </button>
                        </div>
                    )}

                    {activeTab === 'long' && (
                        <div className="long-rest-info">
                            <p>Eine lange Rast stellt alle TP, Zauberplätze und die Hälfte der Trefferwürfel wieder her.</p>
                            <button className="rest-action-button" onClick={handleLongRestClick}>
                                Lange Rast durchführen
                            </button>
                        </div>
                    )}

                    {lastActionMessage && (
                        <div className="rest-log">
                            {lastActionMessage}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RestMenu;
