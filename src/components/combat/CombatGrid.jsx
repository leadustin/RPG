
// src/components/combat/CombatGrid.jsx
import React from 'react';
import './CombatGrid.css'; // Wir brauchen auch ein CSS dazu

// Standardgröße eines Feldes in Pixeln (für Berechnung)
const TILE_SIZE = 64; 

export const CombatGrid = ({ 
  width = 10, 
  height = 10, 
  backgroundImg, 
  combatants, 
  activeCombatantId,
  onTileClick,
  onCombatantClick 
}) => {

  // Hilfsfunktion: Grid-Zellen rendern
  const renderTiles = () => {
    const tiles = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Prüfen, ob eine Figur hier steht (für Blockaden-Visualisierung etc.)
        const occupied = combatants.find(c => c.position.x === x && c.position.y === y);
        
        tiles.push(
          <div 
            key={`${x}-${y}`} 
            className={`grid-tile ${onTileClick ? 'interactive' : ''}`}
            style={{ 
              width: TILE_SIZE, 
              height: TILE_SIZE,
              left: x * TILE_SIZE,
              top: y * TILE_SIZE
            }}
            onClick={() => onTileClick && onTileClick({ x, y })}
          >
            {/* Optional: Koordinaten anzeigen zum Debuggen */}
            {/* <span className="debug-coord">{x},{y}</span> */}
          </div>
        );
      }
    }
    return tiles;
  };

  // Hilfsfunktion: Figuren (Tokens) rendern
  const renderTokens = () => {
    return combatants.map(combatant => {
      const isActive = combatant.id === activeCombatantId;
      const isDead = combatant.hp <= 0;

      // Wenn tot, vielleicht nicht rendern oder als Leiche
      if (isDead) return null; 

      return (
        <div
          key={combatant.id}
          className={`combat-token ${combatant.type} ${isActive ? 'active' : ''}`}
          style={{
            width: TILE_SIZE - 8, // Etwas kleiner als das Feld
            height: TILE_SIZE - 8,
            left: combatant.position.x * TILE_SIZE + 4,
            top: combatant.position.y * TILE_SIZE + 4,
            backgroundImage: `url(${combatant.icon || '/assets/placeholder_token.png'})` // Pfad anpassen
          }}
          onClick={(e) => {
            e.stopPropagation();
            onCombatantClick && onCombatantClick(combatant);
          }}
          title={`${combatant.name} (${combatant.hp} HP)`}
        >
          <div className="hp-bar-mini">
            <div 
              className="hp-fill" 
              style={{ width: `${(combatant.hp / combatant.maxHp) * 100}%` }}
            />
          </div>
        </div>
      );
    });
  };

  return (
    <div 
      className="combat-grid-container"
      style={{ 
        width: width * TILE_SIZE, 
        height: height * TILE_SIZE,
        backgroundImage: backgroundImg ? `url(${backgroundImg})` : 'none',
        backgroundSize: 'cover'
      }}
    >
      <div className="grid-overlay">
        {renderTiles()}
      </div>
      <div className="token-layer">
        {renderTokens()}
      </div>
    </div>
  );
};