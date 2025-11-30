// src/utils/mapLoader.js

/**
 * Prüft, ob ein Punkt (x, y) innerhalb eines Polygons liegt.
 * Ray-Casting Algorithmus.
 */
function isPointInPolygon(point, vs) {
    // point = {x, y}
    // vs = Array von {x, y} Punkten des Polygons
    
    let x = point.x, y = point.y;
    let inside = false;
    
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        let xi = vs[i].x, yi = vs[i].y;
        let xj = vs[j].x, yj = vs[j].y;
        
        let intersect = ((yi > y) !== (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    
    return inside;
}

/**
 * Wandelt Tiled-JSON-Daten in ein Grid-Array um.
 * @param {Object} mapData - Das JSON aus Tiled
 * @param {number} gridWidth - Breite in Kacheln (z.B. 20)
 * @param {number} gridHeight - Höhe in Kacheln (z.B. 20)
 * @param {number} tileSize - Pixelgröße einer Kachel (z.B. 100)
 * @returns {Array} Ein Array von Objekten { x, y, blocked }
 */
export const parseTiledCollisions = (mapData, gridWidth, gridHeight, tileSize = 100) => {
    const collisionLayer = mapData.layers.find(l => l.type === 'objectgroup');
    const blockedTiles = [];

    // Wenn keine Kollisionen definiert sind, ist alles begehbar
    if (!collisionLayer || !collisionLayer.objects) return [];

    // Alle Polygone aus der Map extrahieren und absolut positionieren
    const obstacles = collisionLayer.objects.map(obj => {
        return obj.polygon.map(p => ({
            x: obj.x + p.x,
            y: obj.y + p.y
        }));
    });

    // Jedes Feld des Grids prüfen
    for (let y = 0; y < gridHeight; y++) {
        for (let x = 0; x < gridWidth; x++) {
            // Mittelpunkt der Kachel in Pixeln berechnen
            const tileCenterX = (x * tileSize) + (tileSize / 2);
            const tileCenterY = (y * tileSize) + (tileSize / 2);

            // Prüfen, ob dieser Punkt in IRGENDEINEM Hindernis liegt
            const isBlocked = obstacles.some(poly => 
                isPointInPolygon({x: tileCenterX, y: tileCenterY}, poly)
            );

            if (isBlocked) {
                blockedTiles.push({ x, y });
            }
        }
    }

    return blockedTiles;
};