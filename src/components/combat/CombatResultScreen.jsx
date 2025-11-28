// src/components/combat/CombatResultScreen.jsx
import React from 'react';
import './CombatResultScreen.css';

export const CombatResultScreen = ({ result, onClose, onLoadGame, onMainMenu }) => {
    const isVictory = result === 'victory';

    return (
        <div className="combat-result-overlay">
            <div className={`combat-result-box ${isVictory ? 'victory' : 'defeat'}`}>
                <h2>{isVictory ? "Sieg!" : "Niederlage"}</h2>
                <p>
                    {isVictory 
                        ? "Alle Gegner wurden besiegt." 
                        : "Deine Reise endet hier..."}
                </p>
                
                <div className="result-buttons" style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
                    {/* Bei Sieg (falls angezeigt) einfach weiter */}
                    {isVictory && (
                        <button onClick={onClose} className="btn-result">Weiter</button>
                    )}

                    {/* Bei Niederlage: Optionen */}
                    {!isVictory && (
                        <>
                            {onLoadGame && (
                                <button onClick={onLoadGame} className="btn-result">
                                    Spielstand laden
                                </button>
                            )}
                            <button onClick={onMainMenu} className="btn-result danger">
                                Hauptmenü
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};