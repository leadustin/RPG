// src/engine/combat/geometry.js

/**
 * Berechnet die Distanz zwischen zwei Punkten (Chebyshev-Distanz für D&D 5e Grid).
 * Diagonalen kosten 1 Bewegungseinheit, genau wie vertikal/horizontal.
 */
export const getDistance = (p1, p2) => Math.max(Math.abs(p1.x - p2.x), Math.abs(p1.y - p2.y));

/**
 * Bestimmt die betroffenen Kacheln basierend auf der Form des Effekts.
 * @param {Object} origin - {x, y} des Zauberers
 * @param {Object} target - {x, y} des Ziels (Klickpunkt)
 * @param {Object} shapeData - { type: 'CONE'|'LINE'|'CUBE'|'SPHERE', size_m: number }
 * @param {Array} combatants - Liste aller Combatants (für Kollisions-Checks, optional)
 * @returns {Array} Array von {x, y} Objekten
 */
export const getAffectedTiles = (origin, target, shapeData) => {
    const tiles = [];
    const sizeTiles = Math.floor((shapeData.size_m || 0) / 1.5); // Umrechnung Meter -> Felder (1.5m)
    
    if (!shapeData.type || shapeData.type === 'POINT') {
        return [target]; // Nur das angeklickte Feld
    }

    // 1. RADIUS / SPHÄRE (z.B. Fireball)
    if (shapeData.type === 'SPHERE' || shapeData.type === 'CYLINDER' || shapeData.radius_m) {
        // Wir scannen eine Bounding Box um das Ziel
        const r = shapeData.radius_m ? Math.floor(shapeData.radius_m / 1.5) : sizeTiles;
        for (let x = target.x - r; x <= target.x + r; x++) {
            for (let y = target.y - r; y <= target.y + r; y++) {
                if (getDistance(target, { x, y }) <= r) {
                    tiles.push({ x, y });
                }
            }
        }
    }

    // 2. KEGEL (z.B. Burning Hands)
    // Einfache 5e Approximation: Ursprung ist Caster, Richtung ist Klick.
    // Ein Kegel breitet sich so weit aus, wie er lang ist.
    else if (shapeData.type === 'CONE') {
        const dx = target.x - origin.x;
        const dy = target.y - origin.y;
        
        // Bestimme Hauptrichtung (N, S, E, W, oder Diagonalen)
        // Hier vereinfacht: 4 Hauptrichtungen + 4 Diagonalen
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        
        // Scan-Bereich um den Caster
        const r = sizeTiles;
        for (let x = origin.x - r; x <= origin.x + r; x++) {
            for (let y = origin.y - r; y <= origin.y + r; y++) {
                const dist = getDistance(origin, {x,y});
                if (dist > 0 && dist <= r) {
                    const tileAngle = Math.atan2(y - origin.y, x - origin.x) * 180 / Math.PI;
                    let angleDiff = Math.abs(tileAngle - angle);
                    if (angleDiff > 180) angleDiff = 360 - angleDiff;
                    
                    // Ein 90 Grad Kegel (45 Grad zu jeder Seite der Hauptrichtung)
                    if (angleDiff <= 45) {
                        tiles.push({ x, y });
                    }
                }
            }
        }
    }

    // 3. LINIE (z.B. Lightning Bolt)
    else if (shapeData.type === 'LINE') {
        const length = sizeTiles;
        const dx = target.x - origin.x;
        const dy = target.y - origin.y;
        
        // Normalisieren für Richtung
        const dist = Math.sqrt(dx*dx + dy*dy);
        const dirX = dx / dist;
        const dirY = dy / dist;

        // Raycasting
        for (let i = 1; i <= length; i++) {
            tiles.push({
                x: Math.round(origin.x + dirX * i),
                y: Math.round(origin.y + dirY * i)
            });
        }
    }

    // 4. WÜRFEL (z.B. Thunderwave)
    // In 5e entscheidet der Caster, an welcher Fläche des Würfels er steht.
    // Vereinfachung: Klickpunkt ist das Zentrum des Würfels.
    else if (shapeData.type === 'CUBE') {
        const r = Math.floor(sizeTiles / 2); 
        for (let x = target.x - r; x <= target.x + r; x++) {
            for (let y = target.y - r; y <= target.y + r; y++) {
                tiles.push({ x, y });
            }
        }
    }

    return tiles;
};