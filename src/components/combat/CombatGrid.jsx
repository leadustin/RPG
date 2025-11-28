// src/components/combat/CombatGrid.jsx
import React, { useState } from 'react';
import './CombatGrid.css';

const TILE_SIZE = 64; 

export const CombatGrid = ({ 
  width = 12, 
  height = 8, 
  combatants = [], 
  activeCombatantId,
  selectedAction,
  onTileClick,
  movementLeft = 0
}) => {

  const [hoveredTile, setHoveredTile] = useState(null);
  const activeCombatant = combatants.find(c => c.id === activeCombatantId);

  // Distanz Helper (Chebyshev für Grid-Bewegung)
  const getDist = (p1, p2) => Math.max(Math.abs(p1.x - p2.x), Math.abs(p1.y - p2.y));

  // --- NEU: Reichweiten-Helper für Visualisierung ---
  const calculateVisualRange = (action) => {
      if (!action) return 1; // Fallback

      // 1. Eigenschaft "Reichweite" (Reach)
      if (action.properties && action.properties.includes("Reichweite")) {
          return 2; // 3m = 2 Felder
      }

      // 2. Explizite Range (z.B. "24/96")
      if (action.range) {
          const rangeMeters = parseInt(action.range.split('/')[0]);
          if (!isNaN(rangeMeters)) {
              return Math.floor(rangeMeters / 1.5);
          }
      }

      // 3. Enemy "reach" String (z.B. "1,5m")
      if (action.reach) {
          const reachVal = parseFloat(action.reach.replace(',', '.'));
          if (!isNaN(reachVal)) {
              return Math.max(1, Math.floor(reachVal / 1.5));
          }
      }

      return 1; // Standard 1.5m
  };

  // --- OVERLAY ZEICHNEN ---
  const renderOverlay = () => {
      if (!activeCombatant || !hoveredTile || activeCombatant.type !== 'player') return null;

      const startX = activeCombatant.x * TILE_SIZE + TILE_SIZE / 2;
      const startY = activeCombatant.y * TILE_SIZE + TILE_SIZE / 2;
      const endX = hoveredTile.x * TILE_SIZE + TILE_SIZE / 2;
      const endY = hoveredTile.y * TILE_SIZE + TILE_SIZE / 2;

      const dist = getDist(activeCombatant, hoveredTile);
      const isMove = !selectedAction;
      
      let isValid = false;
      if (isMove) {
          // Bewegungsmodus
          isValid = dist <= movementLeft;
      } else {
          // Angriffsmodus: Nutze die berechnete Reichweite der Waffe!
          const attackRange = calculateVisualRange(selectedAction);
          isValid = dist <= attackRange;
      }

      const color = isValid ? "rgba(0, 255, 0, 0.7)" : "rgba(255, 0, 0, 0.7)";

      return (
          <svg style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', pointerEvents:'none', zIndex: 10}}>
              <line x1={startX} y1={startY} x2={endX} y2={endY} stroke={color} strokeWidth="3" strokeDasharray={isValid ? "0" : "5,5"} />
              <g transform={`translate(${endX}, ${endY - 30})`}>
                  <rect x="-30" y="-15" width="60" height="20" fill="rgba(0,0,0,0.8)" rx="4" />
                  <text x="0" y="0" fill="white" fontSize="12" textAnchor="middle" dy="0.3em">{dist} Felder</text>
              </g>
          </svg>
      );
  };

  // --- TILES ---
  const renderTiles = () => {
    const tiles = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const occupied = combatants.find(c => c.x === x && c.y === y && c.hp > 0);
        const dist = activeCombatant ? getDist(activeCombatant, {x,y}) : 999;
        
        let highlight = '';
        
        // Bewegungs-Highlight
        if (activeCombatant?.type === 'player' && !selectedAction && !occupied && dist <= movementLeft && dist > 0) {
            highlight = 'tile-movable';
        }
        
        // Angriffs-Highlight (optional: zeige rote Kacheln nur bei Gegnern in Reichweite)
        if (activeCombatant?.type === 'player' && selectedAction && occupied?.type === 'enemy') {
            const range = calculateVisualRange(selectedAction);
            if (dist <= range) {
                highlight = 'tile-attackable';
            }
        }

        tiles.push(
          <div 
            key={`${x}-${y}`} 
            className={`grid-tile ${highlight}`}
            style={{ 
              left: x * TILE_SIZE, top: y * TILE_SIZE,
              width: TILE_SIZE, height: TILE_SIZE
            }}
            onClick={() => onTileClick && onTileClick(x, y)}
            onMouseEnter={() => setHoveredTile({ x, y })}
            onMouseLeave={() => setHoveredTile(null)}
          />
        );
      }
    }
    return tiles;
  };

  // --- TOKENS ---
  const renderTokens = () => {
    return combatants.map(c => {
      if (c.hp <= 0) return null;
      return (
        <div key={c.id} className={`combat-token ${c.type} ${c.id === activeCombatantId ? 'active' : ''}`}
          style={{
            left: c.x * TILE_SIZE + 4, top: c.y * TILE_SIZE + 4,
            width: TILE_SIZE - 8, height: TILE_SIZE - 8,
            backgroundImage: `url(${c.icon || '/src/assets/react.svg'})`
          }}
          onClick={(e) => {
              e.stopPropagation(); 
              if(onTileClick) onTileClick(c.x, c.y);
          }}
          onMouseEnter={() => setHoveredTile({ x: c.x, y: c.y })}
          onMouseLeave={() => setHoveredTile(null)}
        >
            <div className="hp-bar-mini">
                <div className="hp-fill" style={{width: `${(c.hp / c.maxHp)*100}%`, background: c.type==='enemy'?'red':'green'}}></div>
            </div>
        </div>
      );
    });
  };

  return (
    <div className="combat-grid-container" style={{ width: width * TILE_SIZE, height: height * TILE_SIZE }}>
      <div className="grid-layer">{renderTiles()}</div>
      {renderOverlay()}
      <div className="token-layer">{renderTokens()}</div>
    </div>
  );
};