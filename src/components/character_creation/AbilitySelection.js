// src/components/AbilitySelection.js
import React, { useState, useEffect } from 'react';
import './AbilitySelection.css';
import './PanelDetails.css';
// WICHTIG: Wir importieren jetzt die korrekte Funktion aus der Engine
import { getRacialAbilityBonus } from '../engine/characterEngine';

const ABILITIES = ['str', 'dex', 'con', 'int', 'wis', 'cha'];
const POINT_COST = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };

export const AbilitySelection = ({ character, updateCharacter }) => {
  const [scores, setScores] = useState(character.abilities);
  const [points, setPoints] = useState(27);

  useEffect(() => {
    const spentPoints = ABILITIES.reduce((total, abi) => total + POINT_COST[scores[abi]], 0);
    setPoints(27 - spentPoints);
    updateCharacter({ abilities: scores });
  }, [scores]); // updateCharacter wurde hier bereits korrekt entfernt

  const handleScoreChange = (ability, delta) => {
    const currentScore = scores[ability];
    const newScore = currentScore + delta;

    if (newScore < 8 || newScore > 15) return;

    const costChange = POINT_COST[newScore] - POINT_COST[currentScore];
    if (points - costChange >= 0) {
      setScores({ ...scores, [ability]: newScore });
    }
  };

  // ### DIESE LOKALE, FEHLERHAFTE FUNKTION WURDE ENTFERNT ###
  // const getRacialBonus = (ability) => { ... };

  return (
    <div className="ability-selection-container">
      <div className="points-display">
        Verbleibende Punkte: <span>{points}</span>
      </div>
      <ul className="ability-list features-list">
        {ABILITIES.map(abi => {
          // Die Komponente nutzt jetzt die importierte Funktion aus der Engine
          const racialBonus = getRacialAbilityBonus(character, abi);
          const finalScore = scores[abi] + racialBonus;
          return (
            <li key={abi} className="ability-item">
              <strong>{abi.toUpperCase()}</strong>
              <div className="ability-controls">
                <button onClick={() => handleScoreChange(abi, -1)} disabled={scores[abi] <= 8}>-</button>
                <span className="base-score">{scores[abi]}</span>
                <button onClick={() => handleScoreChange(abi, 1)} disabled={scores[abi] >= 15 || points < (POINT_COST[scores[abi] + 1] - POINT_COST[scores[abi]])}>+</button>
              </div>
              <div className="ability-modifier">
                (Bonus: {racialBonus > 0 ? `+${racialBonus}` : racialBonus})
              </div>
              <div className="final-score">
                {finalScore}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
