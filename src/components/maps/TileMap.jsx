// src/components/maps/TileMap.jsx
import React, { useEffect, useRef, useState } from 'react';
import PlayerCharacter from '../worldmap/PlayerCharacter';
import './TileMap.css';

const mapModules = import.meta.glob('../../data/maps/*.json', { eager: true });
const availableMaps = {};
for (const path in mapModules) {
  const fileName = path.split('/').pop(); 
  availableMaps[fileName] = mapModules[path].default || mapModules[path];
}

const tilesetModules = import.meta.glob('../../assets/images/tilesets/*.{png,jpg,jpeg,webp}', { eager: true });
const availableTilesets = {};
for (const path in tilesetModules) {
  const fileName = path.split('/').pop(); 
  const module = tilesetModules[path];
  availableTilesets[fileName] = module.default || module;
}

export const TileMap = ({ mapFile, character, onLeaveLocation, onInteract }) => {
    const canvasRef = useRef(null);
    const [mapData, setMapData] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // 1. MAP DATEN LADEN
    useEffect(() => {
        setIsLoaded(false);
        if (!mapFile) return;
        const data = availableMaps[mapFile];
        if (data) {
            setMapData(data);
        } else {
            console.error(`Karte "${mapFile}" nicht gefunden.`);
        }
    }, [mapFile]);

    // 2. ZEICHNEN (Bleibt gleich, nur der Vollständigkeit halber hier)
    useEffect(() => {
        if (!mapData || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        const rawImageName = mapData.tilesets[0].image; 
        const tilesetImageName = rawImageName.split('/').pop();
        const tilesetSrc = availableTilesets[tilesetImageName];

        if (!tilesetSrc) return;

        const tileset = new Image();
        tileset.src = tilesetSrc;

        tileset.onload = () => {
            const { tilewidth, tileheight, width, height, layers } = mapData;
            const tilesetColumns = mapData.tilesets[0].columns || Math.floor(tileset.width / tilewidth);
            
            canvas.width = width * tilewidth;
            canvas.height = height * tileheight;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            layers.forEach(layer => {
                if (layer.type !== 'tilelayer' || !layer.visible) return;
                for (let i = 0; i < layer.data.length; i++) {
                    const tileId = layer.data[i];
                    if (tileId === 0) continue; 
                    const destX = (i % width) * tilewidth;
                    const destY = Math.floor(i / width) * tileheight;
                    const firstGid = mapData.tilesets[0].firstgid || 1;
                    const localTileId = tileId - firstGid; 
                    const sourceX = (localTileId % tilesetColumns) * tilewidth;
                    const sourceY = Math.floor(localTileId / tilesetColumns) * tileheight;
                    ctx.drawImage(tileset, sourceX, sourceY, tilewidth, tileheight, destX, destY, tilewidth, tileheight);
                }
            });
            setIsLoaded(true);
        };
    }, [mapData]);

    // +++ NEU: Klick-Handler +++
    const handleCanvasClick = (e) => {
        if (!mapData || !onInteract) return;

        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        
        // Mausposition relativ zum Canvas berechnen
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        // In Tile-Koordinaten umrechnen
        const tileX = Math.floor(x / mapData.tilewidth);
        const tileY = Math.floor(y / mapData.tileheight);

        console.log(`Klick auf Tile: ${tileX}, ${tileY}`);

        // Prüfen ob ein Event an dieser Stelle liegt
        if (mapData.events) {
            const event = mapData.events.find(ev => ev.x === tileX && ev.y === tileY);
            if (event) {
                console.log("Event gefunden:", event);
                onInteract(event);
            }
        }
    };
    // +++ ENDE NEU +++

    if (!mapData) return <div className="tilemap-loading">Lade Karte...</div>;

    return (
        <div className="tilemap-container">
            <canvas 
                ref={canvasRef} 
                style={{ maxWidth: '100%', maxHeight: '100%', cursor: 'pointer' }} // Cursor zeigt Klickbarkeit
                onContextMenu={(e) => e.preventDefault()}
                onClick={handleCanvasClick} // <--- Handler hinzufügen
            />
            
            {isLoaded && (
                <PlayerCharacter position={character.position} />
            )}
            
            <div className="map-ui-overlay">
                {/* Overlay UI wenn nötig */}
            </div>
        </div>
    );
};