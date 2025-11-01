import React, { useState } from 'react';
import { rollDiceFormula } from '../../engine/characterEngine';
import './LevelUpModal.css';

export const LevelUpModal = ({ character, onConfirm }) => {
  const [isRolling, setIsRolling] = useState(false);
  const [rollResult, setRollResult] = useState(null);

  if (!character || !character.pendingLevelUp) {
    return null;
  }

  const { newLevel, hpRollFormula } = character.pendingLevelUp;

  const handleRoll = () => {
    if (isRolling) return;

    setIsRolling(true);
    setRollResult(null);

    // Simuliere Würfelgeräusch/Animation
    let rollCount = 0;
    const interval = setInterval(() => {
      rollCount++;
      // Zeige zufällige Zahlen während des Würfelns
      setRollResult(Math.floor(Math.random() * 8) + 1);
      
      if (rollCount > 10) { // Dauer der Animation
        clearInterval(interval);
        
        // Berechne das *echte* Ergebnis
        const finalRoll = rollDiceFormula(hpRollFormula);
        setRollResult(finalRoll);
        setIsRolling(false);
      }
    }, 100);
  };

  const handleConfirm = () => {
    if (isRolling || rollResult === null) return;
    onConfirm(rollResult);
  };

  return (
    <div className="modal-backdrop">
      <div className="levelup-modal">
        <h2>Stufenaufstieg!</h2>
        <p className="levelup-subtitle">{character.name} steigt auf Stufe {newLevel} auf!</p>
        
        <div className="hp-roll-section">
          <h3>Neue Trefferpunkte</h3>
          <p>Dein Wurf: {hpRollFormula}</p>
          
          <div className="dice-roll-area">
            {rollResult !== null && (
              <span className={`dice-result ${isRolling ? 'rolling' : ''}`}>
                {rollResult}
              </span>
            )}
          </div>
          
          {rollResult === null ? (
            <button onClick={handleRoll} disabled={isRolling} className="roll-button">
              {isRolling ? 'Würfeln...' : 'Würfeln!'}
            </button>
          ) : (
            <button onClick={handleConfirm} disabled={isRolling} className="confirm-button">
              Bestätigen
            </button>
          )}
        </div>
        
        {/* TODO: Füge hier Bereiche für Attribut- oder Fähigkeitsauswahl hinzu,
            wenn (newLevel % 4 === 0) */}
            
      </div>
    </div>
  );
};