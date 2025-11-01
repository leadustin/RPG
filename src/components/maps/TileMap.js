// src/components/maps/TileMap.js

import React, { useEffect, useRef, useState } from 'react';
// KORREKTUR 2: Import ohne geschweifte Klammern
import PlayerCharacter from '../worldmap/PlayerCharacter';
import './TileMap.css';

// KORREKTUR 1: Eine robustere Ladefunktion für JSON-Dateien aus dem src-Verzeichnis
// Diese Funktion sagt Webpack explizit, welche Dateien es berücksichtigen soll.
function mapLoader(fileName) {
  const cache = {};
  const req = require.context('../../data/maps', false, /\.json$/);
  req.keys().forEach(key => {
    cache[key.replace('./', '')] = req(key);
  });
  return cache[fileName];
}

const loadTileset = (imageName) => {
  return import(`../../assets/images/tilesets/${imageName}`);
};

export const TileMap = ({ mapFile, character, onLeaveLocation, onUpdatePosition }) => {
    const canvasRef = useRef(null);
    const [mapData, setMapData] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);

    // Lade die Map-Daten mit der neuen, stabilen Ladefunktion
    useEffect(() => {
        setIsLoaded(false);
        if (!mapFile) return;
        
        const data = mapLoader(mapFile);
        if (data) {
            setMapData(data);
        } else {
            console.error(`Karte "${mapFile}" konnte nicht im Ordner src/data/maps gefunden werden!`);
        }
    }, [mapFile]);

    // Zeichne die Karte, wenn Daten vorhanden sind
    useEffect(() => {
        if (!mapData || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const tileset = new Image();
        
        loadTileset(mapData.tilesets[0].image)
            .then(imageModule => {
                tileset.src = imageModule.default;
            })
            .catch(error => console.error("Tileset konnte nicht geladen werden:", error));

        tileset.onload = () => {
            const { tilewidth, tileheight, width, layers } = mapData;
            const tilesetColumns = mapData.tilesets[0].columns;
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            layers.forEach(layer => {
                if (layer.type !== 'tilelayer' || !layer.visible) return;

                for (let i = 0; i < layer.data.length; i++) {
                    const tileId = layer.data[i];
                    if (tileId === 0) continue;

                    const destX = (i % width) * tilewidth;
                    const destY = Math.floor(i / width) * tileheight;
                    
                    const sourceX = ((tileId - 1) % tilesetColumns) * tilewidth;
                    const sourceY = Math.floor((tileId - 1) / tilesetColumns) * tileheight;

                    ctx.drawImage(
                        tileset,
                        sourceX, sourceY, tilewidth, tileheight,
                        destX, destY, tilewidth, tileheight
                    );
                }
            });
            setIsLoaded(true);
        };
    }, [mapData]);

    if (!mapData) return <div>Lade Karte...</div>;

    return (
        <div className="tilemap-container">
            <canvas 
                ref={canvasRef} 
                width={mapData.width * mapData.tilewidth} 
                height={mapData.height * mapData.tileheight} 
            />
            {isLoaded && <PlayerCharacter position={character.position} />}
            <button className="leave-button" onClick={onLeaveLocation}>Ort verlassen</button>
        </div>
    );
};