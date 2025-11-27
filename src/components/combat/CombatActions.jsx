// src/components/combat/CombatActions.jsx
import React from 'react';
import './CombatActions.css';

export const CombatActions = ({ 
  combatState, 
  onAttack, 
  onDash, 
  onEndTurn,
  playerWeapons = [] // Array von Waffen aus dem Inventar
}) => {
  const { turnResources, combatants, turnIndex } = combatState;
  const activeCombatant = combatants[turnIndex];
  
  // Zeige UI nur, wenn Spieler am Zug ist
  if (activeCombatant?.type !== 'player') {
    return null;
  }

  return (
    <div className="combat-actions-bar">
      {/* Status Anzeige */}
      <div className="resources-display">
        <div className={`res-pill ${turnResources.hasAction ? 'active' : 'used'}`}>
          Aktion
        </div>
        <div className={`res-pill ${turnResources.hasBonusAction ? 'active' : 'used'}`}>
          Bonusaktion
        </div>
        <div className="res-text">
          Bewegung: {turnResources.movementLeft} ft
        </div>
      </div>

      {/* Aktions Buttons */}
      <div className="actions-row">
        {/* Waffenauswahl / Angriff */}
        <div className="weapon-select-group">
            {playerWeapons.length > 0 ? (
                playerWeapons.map((weapon, idx) => (
                    <button 
                        key={idx}
                        className="action-btn attack"
                        disabled={!turnResources.hasAction}
                        onClick={() => onAttack(weapon)} // Übergibt Waffe an Parent
                        title={weapon.name}
                    >
                        ⚔️ {weapon.name}
                    </button>
                ))
            ) : (
                <button 
                    className="action-btn attack"
                    disabled={!turnResources.hasAction}
                    onClick={() => onAttack(null)} // Waffenlos
                >
                    👊 Waffenlos
                </button>
            )}
        </div>

        <button 
            className="action-btn utility" 
            disabled={!turnResources.hasAction}
            onClick={onDash}
        >
            🏃 Sprinten (Dash)
        </button>
        
        {/* Platzhalter für mehr Aktionen wie "Verstecken" oder Zauber */}
      </div>

      <button className="end-turn-btn" onClick={onEndTurn}>
        Zug beenden ⌛
      </button>
    </div>
  );
};