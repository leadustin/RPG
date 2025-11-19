// src/components/maps/TileMap.jsx
import React, { useEffect, useRef, useState } from 'react';
import PlayerCharacter from '../worldmap/PlayerCharacter';
import './TileMap.css';

// +++ VITE-LADE-LOGIK (Maps) +++
// Lädt alle .json Dateien aus dem maps Ordner sofort (eager: true)
const mapModules = import.meta.glob('../../data/maps/*.json', { eager: true });

// Erstellt ein Lookup-Objekt: { "elfenwacht.json": { ...Daten... }, ... }
const availableMaps = {};
for (const path in mapModules) {
  const fileName = path.split('/').pop(); // Extrahiert z.B. "test_map.json" aus dem Pfad
  availableMaps[fileName] = mapModules[path].default || mapModules[path];
}

// +++ VITE-LADE-LOGIK (Tilesets) +++
// Lädt alle Bilder aus dem tilesets Ordner
const tilesetModules = import.meta.glob(
  '../../assets/images/tilesets/*.{png,jpg,jpeg,webp}', 
  { eager: true }
);

// Erstellt ein Lookup-Objekt: { "tileset.png": "/src/assets/.../tileset.png", ... }
const availableTilesets = {};
for (const path in tilesetModules) {
  const fileName = path.split('/').pop(); // Extrahiert z.B. "dungeon.png"
  availableTilesets[fileName] = tilesetModules[path].default;
}

export const TileMap = ({ mapFile, character, onLeaveLocation, onUpdatePosition }) => {
    const canvasRef = useRef(null);
    const [mapData, setMapData] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // 1. MAP DATEN LADEN
    useEffect(() => {
        setIsLoaded(false);
        if (!mapFile) return;
        
        // Zugriff über das vorbereitete Lookup-Objekt
        const data = availableMaps[mapFile];
        
        if (data) {
            setMapData(data);
        } else {
            console.error(`Karte "${mapFile}" konnte nicht geladen werden. Verfügbare Maps:`, Object.keys(availableMaps));
        }
    }, [mapFile]);

    // 2. KARTE ZEICHNEN
    useEffect(() => {
        if (!mapData || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        // Den Dateinamen des Tilesets aus der JSON holen (z.B. "tileset.png")
        const tilesetImageName = mapData.tilesets[0].image; 
        
        // URL aus unserem Lookup-Objekt holen
        const tilesetSrc = availableTilesets[tilesetImageName];

        if (!tilesetSrc) {
            console.error(`Tileset-Bild "${tilesetImageName}" nicht gefunden in assets/images/tilesets/. Verfügbar:`, Object.keys(availableTilesets));
            return;
        }

        const tileset = new Image();
        tileset.src = tilesetSrc;

        tileset.onload = () => {
            const { tilewidth, tileheight, width, layers } = mapData;
            // Fallback falls 'columns' fehlt (manche Tiled-Versionen speichern das anders)
            const tilesetColumns = mapData.tilesets[0].columns || Math.floor(tileset.width / tilewidth);
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            layers.forEach(layer => {
                if (layer.type !== 'tilelayer' || !layer.visible) return;

                for (let i = 0; i < layer.data.length; i++) {
                    const tileId = layer.data[i];
                    if (tileId === 0) continue; // 0 bedeutet "kein Tile"

                    // Zielposition auf dem Canvas
                    const destX = (i % width) * tilewidth;
                    const destY = Math.floor(i / width) * tileheight;
                    
                    // Quellposition im Tileset-Bild (tileId ist 1-basiert in Tiled export)
                    // Wir ziehen 1 ab, um den 0-basierten Index zu bekommen, ABER
                    // man muss prüfen ob 'firstgid' berücksichtigt werden muss. 
                    // Für einfache Maps mit 1 Tileset ist oft tileId - 1 korrekt.
                    const localTileId = tileId - 1; 

                    const sourceX = (localTileId % tilesetColumns) * tilewidth;
                    const sourceY = Math.floor(localTileId / tilesetColumns) * tileheight;

                    ctx.drawImage(
                        tileset,
                        sourceX, sourceY, tilewidth, tileheight,
                        destX, destY, tilewidth, tileheight
                    );
                }
            });
            setIsLoaded(true);
        };

        tileset.onerror = (err) => {
            console.error("Fehler beim Laden des Tileset-Bildes:", err);
        };

    }, [mapData]);

    if (!mapData) return <div className="tilemap-loading">Lade Karte...</div>;

    return (
        <div className="tilemap-container">
            <canvas 
                ref={canvasRef} 
                width={mapData.width * mapData.tilewidth} 
                height={mapData.height * mapData.tileheight} 
            />
            {isLoaded && <PlayerCharacter position={character.position} />}
            
            <div className="map-ui-overlay">
                <button className="leave-button" onClick={onLeaveLocation}>Ort verlassen</button>
            </div>
        </div>
    );
};