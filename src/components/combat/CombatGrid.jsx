// src/components/combat/CombatGrid.jsx
// src/components/combat/CombatGrid.jsx
// TODO: Lichtsystem & Fog of War implementieren
//       - Unterstützung für Lichtquellen (z.B. Zauber 'Licht', Fackeln)
//       - Berechnung von hellem/dämmrigem Licht und Sichtlinien
//       - Visualisierung von Radien um Tokens (z.B. Detect Magic 9m, Paladin Auren)
// TODO: Interaktive Objekte rendern
//       - Türen (offen/geschlossen) visuell darstellen
//       - Klick-Handler für Interaktionen mit Objekten (z.B. Truhen, Hebel)
// TODO: Geometrie für Kegel (Cones) und Linien (Lines) implementieren
//       - 'handleCombatTileClick' muss Richtung erkennen (Mausposition relativ zum Caster)
//       - Berechnung der betroffenen Tiles für Kegel (z.B. Burning Hands) und Linien (z.B. Lightning Bolt)
// TODO: Sichtblockaden (Obscurement) implementieren
//       - Prüfen, ob Tokens (wie 'fog_cloud' oder 'darkness') auf der Linie zwischen Caster und Ziel liegen.
//       - Falls ja: 'target' ist nicht sichtbar (kann nicht angewählt werden oder hat Vorteil/Nachteil).
// TODO: Schwieriges Gelände (Difficult Terrain) implementieren
//       - Bewegungskosten für bestimmte Tiles verdoppeln (2 Bewegungspunkte pro Feld).
//       - Prüfen, ob ein 'Grease'-Token auf dem Feld liegt.
import React, { useState, useEffect, useRef } from 'react';
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
  
  // Floating Text State & Ref
  const [floatingTexts, setFloatingTexts] = useState([]);
  const prevCombatantsRef = useRef(combatants);

  // Überwachung auf HP-Änderungen (Floating Text Logic unverändert)
  useEffect(() => {
      const newTexts = [];
      const prevCombatants = prevCombatantsRef.current;

      combatants.forEach(current => {
          const prev = prevCombatants.find(p => p.id === current.id);
          if (prev && prev.hp !== current.hp) {
              const diff = current.hp - prev.hp;
              const isDamage = diff < 0;
              const absDiff = Math.abs(diff);
              newTexts.push({
                  id: Date.now() + Math.random(),
                  x: current.x, y: current.y,
                  text: absDiff.toString(),
                  type: isDamage ? 'damage' : 'heal'
              });
          }
      });

      if (newTexts.length > 0) {
          setFloatingTexts(prev => [...prev, ...newTexts]);
          setTimeout(() => {
              setFloatingTexts(prev => prev.filter(t => !newTexts.find(nt => nt.id === t.id)));
          }, 1200);
      }
      prevCombatantsRef.current = combatants;
  }, [combatants]);

  // Distanz Helper (Chebyshev Distanz für Grid-Bewegung)
  const getDist = (p1, p2) => Math.max(Math.abs(p1.x - p2.x), Math.abs(p1.y - p2.y));

  // +++ NEU: Berechnung des Radius in Tiles +++
  const getActionRadiusInTiles = (action) => {
      if (!action?.target?.radius_m) return 0;
      // 1.5m entspricht 1 Feld
      return Math.floor(action.target.radius_m / 1.5);
  };

  const calculateVisualRange = (action) => {
      if (!action) return 1; 
      // Neu: Check auf range_m im JSON
      if (action.range_m) return Math.floor(action.range_m / 1.5);

      const source = action.item || action;
      const props = source.properties || [];
      if (props.includes("Reichweite")) return 2; 
      if (source.range) {
          const rangeMeters = parseInt(source.range.split('/')[0]);
          if (!isNaN(rangeMeters)) return Math.floor(rangeMeters / 1.5);
      }
      return 1; 
  };

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
          isValid = dist <= movementLeft;
      } else {
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

  const renderTiles = () => {
    const tiles = [];
    const actionRadius = getActionRadiusInTiles(selectedAction);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const occupied = combatants.find(c => c.x === x && c.y === y && c.hp > 0);
        const distToPlayer = activeCombatant ? getDist(activeCombatant, {x,y}) : 999;
        
        let highlight = '';
        
        // 1. Bewegungsmodus
        if (activeCombatant?.type === 'player' && !selectedAction) {
            if (!occupied && distToPlayer <= movementLeft && distToPlayer > 0) {
                highlight = 'tile-movable';
            }
        }
        
        // 2. Angriffsmodus
        if (activeCombatant?.type === 'player' && selectedAction) {
            const range = calculateVisualRange(selectedAction);
            
            // +++ NEU: Flächenzauber-Logik +++
            if (actionRadius > 0 && hoveredTile) {
                // Berechne Distanz vom Mauszeiger (Zentrum der Explosion) zu diesem Tile (x,y)
                const distToImpact = getDist(hoveredTile, {x, y});
                
                // Prüfe, ob Mauszeiger in Reichweite des Spielers ist
                const impactInRange = getDist(activeCombatant, hoveredTile) <= range;

                // Markiere alles im Radius, wenn der Mittelpunkt gültig ist
                if (impactInRange && distToImpact <= actionRadius) {
                    highlight = 'tile-aoe-target'; // Neue CSS-Klasse benötigt!
                }
            } 
            // Standard Einzelziel-Logik (Fallback)
            else if (occupied?.type === 'enemy' && distToPlayer <= range) {
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

  // ... (renderTokens und renderFloatingTexts bleiben unverändert) ...
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

  const renderFloatingTexts = () => {
      return floatingTexts.map(ft => (
          <div 
              key={ft.id} 
              className={`floating-text ${ft.type}`}
              style={{
                  left: ft.x * TILE_SIZE + (TILE_SIZE / 2),
                  top: ft.y * TILE_SIZE,
                  marginLeft: '-10px'
              }}
          >
              {ft.type === 'damage' ? `-${ft.text}` : `+${ft.text}`}
          </div>
      ));
  };

  return (
    <div className="combat-grid-container" style={{ width: width * TILE_SIZE, height: height * TILE_SIZE }}>
      <div className="grid-layer">{renderTiles()}</div>
      {renderOverlay()}
      <div className="token-layer">{renderTokens()}</div>
      <div className="floating-text-container">{renderFloatingTexts()}</div>
    </div>
  );
};