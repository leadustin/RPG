// src/components/combat/CombatGrid.jsx
import React, { useState, useMemo, Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Line, Html, MapControls, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { getMapData } from '../../utils/mapRegistry';
import { getMapImageUrl } from '../../utils/imageRegistry';
import { parseTiledCollisions } from '../../utils/mapLoader';

// --- GEOMETRIEN ---
const tileGeometry = new THREE.PlaneGeometry(0.95, 0.95);
const borderGeometrySource = new THREE.PlaneGeometry(1, 1);
const borderGeometry = new THREE.EdgesGeometry(borderGeometrySource);

// --- MAP BACKGROUND ---
const MapBackground = ({ width, height, imageUrl }) => {
    const texture = useTexture(imageUrl);
    const centerX = (width - 1) / 2;
    const centerY = -(height - 1) / 2;
    return (
        <mesh position={[centerX, centerY, -0.02]}> 
            <planeGeometry args={[width, height]} />
            <meshBasicMaterial map={texture} />
        </mesh>
    );
};

// --- VISUAL TILE ---
const VisualTile = ({ x, y, highlight, isHovered, blocked }) => {
    const posY = -y;
    let color = "#222"; 
    let opacity = 0.1; 
    let zPos = 0;

    if (blocked) return null;

    if (highlight === 'movable') { color = "#3498db"; opacity = 0.5; } 
    if (highlight === 'attackable') { color = "#e74c3c"; opacity = 0.5; } 
    if (highlight === 'aoe_target') { color = "#e67e22"; opacity = 0.6; } 

    if (isHovered) {
        color = highlight ? color : "#aaa";
        opacity = 0.4;
        zPos = 0.05;
    }

    if (!highlight && !isHovered) return null;

    return (
        <group position={[x, posY, zPos]}>
            <mesh geometry={tileGeometry}>
                <meshBasicMaterial color={color} transparent opacity={opacity} side={THREE.DoubleSide} />
            </mesh>
            <lineSegments geometry={borderGeometry}>
                <lineBasicMaterial color="#333" transparent opacity={0.2} />
            </lineSegments>
        </group>
    );
};

// --- INTERACTION PLANE (Mit Drag) ---
const InteractionPlane = ({ width, height, onClick, onHover, onDragMove, onDragEnd }) => {
    const centerX = (width - 1) / 2;
    const centerY = -(height - 1) / 2;
    return (
        <mesh 
            position={[centerX, centerY, 0]} 
            visible={false} 
            onClick={(e) => { e.stopPropagation(); onClick(e.point.x, -e.point.y); }}
            onPointerMove={(e) => {
                e.stopPropagation();
                onHover(Math.round(e.point.x), -Math.round(e.point.y));
                if (onDragMove) onDragMove(e.point.x, -e.point.y);
            }}
            onPointerUp={(e) => {
                e.stopPropagation();
                if (onDragEnd) onDragEnd();
            }}
            onPointerOut={() => onHover(null)}
        >
            <planeGeometry args={[width, height]} />
        </mesh>
    );
};

// --- TOKEN (Mit Drag Start) ---
const Token = ({ combatant, isActive, onDragStart }) => {
    const groupRef = useRef();
    const isEnemy = combatant.type === 'enemy';
    const color = isEnemy ? '#c0392b' : '#2980b9';
    
    const targetPos = new THREE.Vector3(combatant.x, -combatant.y, 0.1);
    const [initialPos] = useState([combatant.x, -combatant.y, 0.1]);

    useFrame((state, delta) => {
        if (groupRef.current) {
            groupRef.current.position.lerp(targetPos, delta * 3.0);
        }
    });

    return (
        <group 
            ref={groupRef} 
            position={initialPos}
            onPointerDown={(e) => {
                e.stopPropagation();
                // Linksklick auf eigenen Token startet Drag
                if (e.button === 0 && isActive && !isEnemy) {
                    if (onDragStart) onDragStart(combatant.id);
                }
            }}
        >
            <mesh><circleGeometry args={[0.4, 32]} /><meshBasicMaterial color={color} /></mesh>
            <mesh position={[0, 0.5, 0]}><planeGeometry args={[0.8, 0.1]} /><meshBasicMaterial color="black" /></mesh>
            <mesh position={[-0.4 + (0.8 * (combatant.hp / combatant.maxHp)) / 2, 0.5, 0.01]}>
                <planeGeometry args={[0.8 * (combatant.hp / combatant.maxHp), 0.08]} /><meshBasicMaterial color={isEnemy ? '#e74c3c' : '#2ecc71'} />
            </mesh>
            {isActive && <mesh position={[0, 0, -0.01]}><ringGeometry args={[0.45, 0.5, 32]} /><meshBasicMaterial color="#f1c40f" /></mesh>}
            <Html position={[0, -0.6, 0]} center style={{pointerEvents:'none', whiteSpace: 'nowrap', zIndex: 0}}>
                <div style={{ background:'rgba(0,0,0,0.8)', color:'white', padding:'2px 5px', borderRadius:'4px', fontSize:'11px', textShadow: '0 1px 2px black', userSelect: 'none' }}>{combatant.name}</div>
            </Html>
        </group>
    );
};

// --- PATH RULER (Die blaue Schlange) ---
const PathRuler = ({ path, cost, valid }) => {
    if (!path || path.length < 2) return null;
    const points = useMemo(() => path.map(p => new THREE.Vector3(p.x, -p.y, 0.2)), [path]);
    const endPoint = points[points.length - 1];
    const color = valid ? "#3498db" : "#e74c3c";

    // NEU: Umrechnung in Meter (1 Feld = 1.5m)
    const distanceInMeters = (cost * 1.5).toFixed(1);

    return (
        <group>
            <Line points={points} color={color} lineWidth={4} />
            <mesh position={endPoint}>
                <circleGeometry args={[0.3, 16]} />
                <meshBasicMaterial color={color} opacity={0.5} transparent />
            </mesh>
            <Html position={endPoint} center style={{pointerEvents:'none'}}>
                <div style={{
                    background: color, color: 'white', fontWeight: 'bold',
                    padding: '4px 8px', borderRadius: '12px', fontSize: '12px',
                    whiteSpace: 'nowrap', boxShadow: '0 2px 4px rgba(0,0,0,0.4)'
                }}>
                    {distanceInMeters} m
                </div>
            </Html>
        </group>
    );
};

// --- GEPLANTE AKTION (Gelbe Linie) ---
const PlannedActionLine = ({ start, end, label }) => {
    if (!start || !end) return null;
    const points = useMemo(() => [
        new THREE.Vector3(start.x, -start.y, 0.2),
        new THREE.Vector3(end.x, -end.y, 0.2)
    ], [start, end]);

    return (
        <group>
            <Line points={points} color="#f1c40f" lineWidth={3} dashed dashScale={10} gapSize={5} />
            <mesh position={[end.x, -end.y, 0.2]}>
                <circleGeometry args={[0.15, 16]} />
                <meshBasicMaterial color="#f1c40f" />
            </mesh>
            <Html position={[(start.x + end.x) / 2, -(start.y + end.y) / 2, 0.2]} center style={{pointerEvents:'none'}}>
                <div style={{ background: '#f1c40f', color: 'black', fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.5)', whiteSpace: 'nowrap' }}>{label}</div>
            </Html>
        </group>
    );
};

// --- SCENE ---
const CombatScene = ({ 
    width, height, combatants, activeCombatantId, 
    selectedAction, movementLeft, onTileClick, 
    hoveredTile, setHoveredTile, queuedAction,
    mapImage, blockedTiles,
    // DRAG PROPS
    dragState, onTokenDragStart, onGridDragMove, onGridDragEnd
}) => {
    
    const activeCombatant = combatants.find(c => c.id === activeCombatantId);
    const centerX = (width - 1) / 2;
    const centerY = -(height - 1) / 2;
    const getDist = (p1, p2) => Math.max(Math.abs(p1.x - p2.x), Math.abs(p1.y - p2.y));

    const tiles = [];
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const occupied = combatants.find(c => c.x === x && c.y === y && c.hp > 0);
            const isBlocked = blockedTiles.some(t => t.x === x && t.y === y);
            
            let highlight = null;
            const isHovered = hoveredTile && hoveredTile.x === x && hoveredTile.y === y;

            // Bewegungshighlight entfernt, da jetzt Drag!
            // Wir zeigen nur Angriffs-Reichweite und AoE
            if (activeCombatant?.type === 'player' && selectedAction && !queuedAction) {
                 const dist = getDist(activeCombatant, {x, y});
                 const range = selectedAction.range_m ? Math.floor(selectedAction.range_m/1.5) : 1;
                 if (dist <= range) {
                    highlight = occupied?.type === 'enemy' ? 'attackable' : 'aoe_target';
                 }
            }

            if (highlight || isHovered) {
                tiles.push(
                    <VisualTile 
                        key={`${x}-${y}`} x={x} y={y} 
                        isHovered={isHovered} highlight={highlight}
                        blocked={isBlocked}
                    />
                );
            }
        }
    }

    let planStart = null;
    let planEnd = null;
    if (queuedAction && activeCombatant) {
        planStart = { x: activeCombatant.x, y: activeCombatant.y };
        if (queuedAction.targetCoords) planEnd = queuedAction.targetCoords;
        else if (queuedAction.targetIds?.length > 0) {
            const t = combatants.find(c => c.id === queuedAction.targetIds[0]);
            if (t) planEnd = { x: t.x, y: t.y };
        }
    }

    return (
        <>
            <MapControls 
                makeDefault
                enableRotate={false} 
                screenSpacePanning={true}
                minZoom={10} 
                maxZoom={100}
                target={[centerX, centerY, 0]} 
                // Deaktivieren bei Drag
                enabled={!dragState?.isDragging}
                // Rechte Maus für Pan
                mouseButtons={{ LEFT: null, MIDDLE: null, RIGHT: THREE.MOUSE.PAN }}
            />
            <ambientLight intensity={1} />
            
            {mapImage && <MapBackground width={width} height={height} imageUrl={mapImage} />}

            <InteractionPlane 
                width={width} height={height} 
                onClick={onTileClick}
                onHover={(x, y) => setHoveredTile(x !== null ? {x, y} : null)}
                onDragMove={onGridDragMove}
                onDragEnd={onGridDragEnd}
            />

            {/* NEU: Pfad beim Ziehen anzeigen */}
            {dragState && dragState.isDragging && (
                <PathRuler 
                    path={dragState.path} 
                    cost={dragState.cost} 
                    valid={dragState.valid} 
                />
            )}

            <group>{tiles}</group>
            
            <group>
                {combatants.filter(c => c.hp > 0).map(c => (
                    <Token 
                        key={c.id} 
                        combatant={c} 
                        isActive={c.id === activeCombatantId} 
                        onDragStart={onTokenDragStart} // Event weitergeben
                    />
                ))}
            </group>
            {planStart && planEnd && (
                <PlannedActionLine start={planStart} end={planEnd} label={queuedAction.action.name} />
            )}
        </>
    );
};

// --- MAIN ---
export const CombatGrid = (props) => {
  const [hoveredTile, setHoveredTile] = useState(null);
  const mapData = useMemo(() => props.mapId ? getMapData(props.mapId) : null, [props.mapId]);
  const mapImage = useMemo(() => {
      if (!mapData) return null;
      const imgLayer = mapData.layers.find(l => l.type === 'imagelayer');
      return imgLayer ? getMapImageUrl(imgLayer.image) : null;
  }, [mapData]);
  const blockedTiles = useMemo(() => mapData ? parseTiledCollisions(mapData, mapData.width, mapData.height, mapData.tilewidth) : [], [mapData]);
  const w = mapData?.width || props.width || 12;
  const h = mapData?.height || props.height || 8;
  const centerX = (w - 1) / 2;
  const centerY = -((h - 1) / 2);

  return (
    <div 
        className="combat-grid-container-3d" 
        style={{ width: '100%', height: '600px', background: '#1a1a1a', position: 'relative' }}
        onContextMenu={(e) => { 
            e.preventDefault(); 
            if (props.onContextMenu) props.onContextMenu(); 
        }}
    >
      <Canvas orthographic camera={{ zoom: 40, position: [centerX, centerY, 100], near: 0.1, far: 1000 }}>
        <Suspense fallback={<Html center><div style={{color:'white'}}>Lade Karte...</div></Html>}>
            <CombatScene 
                {...props} 
                width={w} height={h}
                mapImage={mapImage} blockedTiles={blockedTiles}
                hoveredTile={hoveredTile} setHoveredTile={setHoveredTile} 
            />
        </Suspense>
      </Canvas>
    </div>
  );
};