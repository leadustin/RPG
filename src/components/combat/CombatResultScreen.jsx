// src/components/combat/CombatResultScreen.jsx
import React from 'react';
import './CombatResultScreen.css';

export const CombatResultScreen = ({ result, onConfirm }) => {
  const { type, xp, loot } = result;
  const isVictory = type === 'victory';

  return (
    <div className={`combat-result-overlay ${isVictory ? 'victory' : 'defeat'}`}>
      <div className="result-card">
        <h2>{isVictory ? '⚔️ SIEG! ⚔️' : '💀 NIEDERLAGE 💀'}</h2>
        
        <div className="result-content">
          {isVictory ? (
            <>
              <p>Du hast alle Feinde besiegt!</p>
              
              <div className="rewards-section">
                <h3>Belohnungen:</h3>
                <div className="xp-reward">✨ {xp} Erfahrungspunkte</div>
                
                {loot && loot.length > 0 && (
                  <div className="loot-reward">
                    <h4>Beute:</h4>
                    <ul>
                      {loot.map((item, idx) => (
                        <li key={idx}>
                          <span className="loot-icon">📦</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          ) : (
            <p>Du wurdest im Kampf besiegt... (Game Over Logik hier)</p>
          )}
        </div>

        <button className="confirm-btn" onClick={onConfirm}>
          {isVictory ? 'Alles einsammeln & weiter' : 'Zum Hauptmenü'}
        </button>
      </div>
    </div>
  );
};