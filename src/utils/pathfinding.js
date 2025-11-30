// src/utils/pathfinding.js

export const getGridKey = (x, y) => `${x},${y}`;

/**
 * Prüft, ob eine direkte Linie zwischen zwei Punkten durch ein Hindernis verläuft.
 */
export const isLineBlocked = (startX, startY, endX, endY, blockedSet) => {
    const dx = endX - startX;
    const dy = endY - startY;
    const distance = Math.sqrt(dx*dx + dy*dy);
    
    // Wir prüfen in feinen Schritten (halbe Kachelgröße)
    const steps = Math.ceil(distance * 2); 
    
    for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const curX = startX + dx * t;
        const curY = startY + dy * t;
        
        const gridX = Math.round(curX);
        const gridY = Math.round(curY);
        
        // Start und Ziel ignorieren wir (man darf an der Wand stehen)
        if ((gridX === Math.round(startX) && gridY === Math.round(startY)) || 
            (gridX === Math.round(endX) && gridY === Math.round(endY))) {
            continue;
        }

        if (blockedSet.has(getGridKey(gridX, gridY))) {
            return true;
        }
    }
    return false;
};

/**
 * Berechnet den Pfad und die Kosten zu einem Ziel.
 * Gibt den tatsächlichen Weg (Array von Punkten) zurück.
 * @returns {Object} { path: [{x,y}, ...], cost: number, valid: boolean }
 */
export const findPath = (startX, startY, endX, endY, blockedSet, width, height) => {
    const targetKey = getGridKey(Math.round(endX), Math.round(endY));
    
    // 1. Ziel selbst blockiert? (Wand oder Gegner)
    if (blockedSet.has(targetKey)) {
        return { path: [], cost: Infinity, valid: false };
    }

    // 2. Direkte Linie frei? (String Pulling - "Baldur's Gate"-Style)
    if (!isLineBlocked(startX, startY, endX, endY, blockedSet)) {
        const dist = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
        return { 
            path: [{x: startX, y: startY}, {x: endX, y: endY}], 
            cost: dist, 
            valid: true 
        };
    }

    // 3. A* Algorithmus für komplexe Wege um Ecken
    const startNode = { x: Math.round(startX), y: Math.round(startY), g: 0, h: 0, parent: null };
    const endGridX = Math.round(endX);
    const endGridY = Math.round(endY);

    const openSet = [startNode];
    const closedSet = new Set();
    
    let foundNode = null;
    let iterations = 0;

    while (openSet.length > 0) {
        if (iterations++ > 1000) break; // Notbremse für Performance

        openSet.sort((a, b) => (a.g + a.h) - (b.g + b.h));
        const current = openSet.shift();
        closedSet.add(getGridKey(current.x, current.y));

        if (current.x === endGridX && current.y === endGridY) {
            foundNode = current;
            break;
        }

        const neighbors = [
            { x: current.x + 1, y: current.y }, { x: current.x - 1, y: current.y },
            { x: current.x, y: current.y + 1 }, { x: current.x, y: current.y - 1 },
            { x: current.x + 1, y: current.y + 1 }, { x: current.x - 1, y: current.y - 1 },
            { x: current.x + 1, y: current.y - 1 }, { x: current.x - 1, y: current.y + 1 }
        ];

        for (const n of neighbors) {
            if (n.x < 0 || n.x >= width || n.y < 0 || n.y >= height) continue;
            if (closedSet.has(getGridKey(n.x, n.y)) || blockedSet.has(getGridKey(n.x, n.y))) continue;
            
            const stepCost = (n.x !== current.x && n.y !== current.y) ? 1.414 : 1;
            const gScore = current.g + stepCost;
            
            const existing = openSet.find(o => o.x === n.x && o.y === n.y);
            if (!existing || gScore < existing.g) {
                const h = Math.sqrt(Math.pow(endGridX - n.x, 2) + Math.pow(endGridY - n.y, 2));
                if (!existing) {
                    openSet.push({ ...n, g: gScore, h, parent: current });
                } else {
                    existing.g = gScore;
                    existing.parent = current;
                }
            }
        }
    }

    if (!foundNode) {
        return { path: [], cost: Infinity, valid: false };
    }

    // Pfad rekonstruieren
    const path = [];
    let curr = foundNode;
    while (curr) {
        path.push({ x: curr.x, y: curr.y });
        curr = curr.parent;
    }
    
    // Der Pfad ist rückwärts, also umdrehen.
    // Wir ersetzen den ersten Punkt durch den exakten Startpunkt und den letzten durch den exakten Endpunkt für smoothe Linien.
    const smoothPath = path.reverse();
    smoothPath[0] = { x: startX, y: startY };
    smoothPath[smoothPath.length - 1] = { x: endX, y: endY };

    return { path: smoothPath, cost: foundNode.g, valid: true };
};

/**
 * Alte Helper-Funktion für Kompatibilität (wird ggf. nicht mehr aktiv genutzt)
 */
export const getReachableTiles = (startX, startY, maxMovement, blockedSet, width, height) => {
    const reachable = new Set();
    const queue = [{ x: Math.round(startX), y: Math.round(startY), dist: 0 }];
    const visited = new Map(); 
    visited.set(getGridKey(Math.round(startX), Math.round(startY)), 0);

    while (queue.length > 0) {
        const current = queue.shift();
        const neighbors = [
            { x: current.x + 1, y: current.y }, { x: current.x - 1, y: current.y },
            { x: current.x, y: current.y + 1 }, { x: current.x, y: current.y - 1 },
            { x: current.x + 1, y: current.y + 1 }, { x: current.x - 1, y: current.y - 1 },
            { x: current.x + 1, y: current.y - 1 }, { x: current.x - 1, y: current.y + 1 }
        ];

        for (const n of neighbors) {
            const key = getGridKey(n.x, n.y);
            if (n.x < 0 || n.x >= width || n.y < 0 || n.y >= height) continue;
            if (blockedSet.has(key)) continue;

            const stepCost = (n.x !== current.x && n.y !== current.y) ? 1.414 : 1;
            const newDist = current.dist + stepCost;
            
            if (newDist <= maxMovement) {
                if (!visited.has(key) || visited.get(key) > newDist) {
                    visited.set(key, newDist);
                    reachable.add(key);
                    queue.push({ ...n, dist: newDist });
                }
            }
        }
    }
    return reachable;
};

export const getPathLength = (startX, startY, endX, endY, blockedSet, width, height) => {
    const res = findPath(startX, startY, endX, endY, blockedSet, width, height);
    return res.cost;
};