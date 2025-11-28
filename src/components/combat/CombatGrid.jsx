// src/components/combat/CombatGrid.jsx
import React from 'react';
import './CombatGrid.css';

// Standardgröße eines Feldes in Pixeln
const TILE_SIZE = 64; 

export const CombatGrid = ({ 
  width = 10, 
  height = 10, 
  backgroundImg, 
  combatants = [], // Default leeres Array um Absturz zu verhindern
  activeCombatantId,
  onTileClick,
  onCombatantClick 
}) => {

  // Hilfsfunktion: Grid-Zellen rendern
  const renderTiles = () => {
    const tiles = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // KORREKTUR: Zugriff direkt auf c.x und c.y (statt c.position.x)
        const occupied = combatants.find(c => c.x === x && c.y === y);
        
        tiles.push(
          <div 
            key={`${x}-${y}`} 
            className={`grid-tile ${onTileClick ? 'interactive' : ''}`}
            style={{ 
              width: TILE_SIZE, 
              height: TILE_SIZE,
              left: x * TILE_SIZE,
              top: y * TILE_SIZE,
              // Optional: Roter Rand wenn besetzt (zum Debuggen)
              // border: occupied ? '1px solid red' : '1px solid #ccc'
            }}
            onClick={() => onTileClick && onTileClick(x, y)} // KORREKTUR: x, y direkt übergeben
          >
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

      if (isDead) return null; 

      return (
        <div
          key={combatant.id}
          className={`combat-token ${combatant.type} ${isActive ? 'active' : ''}`}
          style={{
            width: TILE_SIZE - 8,
            height: TILE_SIZE - 8,
            // KORREKTUR: Zugriff direkt auf x/y
            left: (combatant.x || 0) * TILE_SIZE + 4,
            top: (combatant.y || 0) * TILE_SIZE + 4,
            backgroundImage: `url(${combatant.icon || '/assets/placeholder_token.png'})`
          }}
          onClick={(e) => {
            e.stopPropagation();
            onCombatantClick && onCombatantClick(combatant);
          }}
          title={`${combatant.name} (${combatant.hp} HP)`}
        >
          {/* Kleiner HP Balken */}
          <div className="hp-bar-mini" style={{
              position: 'absolute', bottom: -5, left: 0, width: '100%', height: '4px', background: '#333'
          }}>
            <div 
              className="hp-fill" 
              style={{ 
                  width: `${(combatant.hp / combatant.maxHp) * 100}%`,
                  height: '100%',
                  backgroundColor: combatant.type === 'enemy' ? 'red' : 'green'
              }}
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
        position: 'relative', // Wichtig für absolute Positionierung der Kinder
        margin: '0 auto',
        backgroundImage: backgroundImg ? `url(${backgroundImg})` : 'none',
        backgroundSize: 'cover',
        backgroundColor: '#3a3a3a' // Fallback Farbe
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