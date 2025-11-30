// src/engine/combat/movementEffects.js
import { getDistance } from './geometry';

/**
 * Berechnet die neue Position für PUSH/PULL Effekte.
 * @param {Object} target - Der Combatant, der bewegt wird
 * @param {Object} source - Der Ursprung des Effekts (meist der Caster)
 * @param {string} type - 'PUSH' oder 'PULL'
 * @param {number} distanceMeters - Distanz in Metern
 * @param {Array} allCombatants - Alle Combatants (um Kollision mit anderen zu vermeiden)
 * @returns {Object} {x, y} Die neue Position
 */
export const calculateForcedMovement = (target, source, type, distanceMeters, allCombatants) => {
    const tilesToMove = Math.floor(distanceMeters / 1.5);
    if (tilesToMove <= 0) return { x: target.x, y: target.y };

    let currentX = target.x;
    let currentY = target.y;

    // Vektor berechnen
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    
    // Normalisieren (ungefähr, für Grid-Bewegung)
    // Wir bestimmen die dominante Achse oder Diagonale
    const length = Math.sqrt(dx*dx + dy*dy);
    if (length === 0) return { x: target.x, y: target.y }; // Gleiche Position

    let dirX = Math.round(dx / length); // -1, 0, 1
    let dirY = Math.round(dy / length); // -1, 0, 1

    // Bei PULL kehren wir die Richtung um
    if (type === 'PULL') {
        dirX = -dirX;
        dirY = -dirY;
    }

    // Schrittweise bewegen und auf Kollision prüfen
    for (let i = 0; i < tilesToMove; i++) {
        const nextX = currentX + dirX;
        const nextY = currentY + dirY;

        // 1. Kollision mit anderen Kreaturen prüfen
        const isOccupied = allCombatants.some(c => c.x === nextX && c.y === nextY && c.hp > 0 && c.id !== target.id);
        
        // 2. Kollision mit Wänden (Optional: Hier müsste man auf die Map-Daten zugreifen)
        // const isWall = mapData[nextY]?.[nextX] === 'wall'; 
        // Für jetzt nehmen wir an: Keine Map-Daten hier verfügbar, also nur Kreaturen-Check.
        
        if (!isOccupied) {
            currentX = nextX;
            currentY = nextY;
        } else {
            // Bewegung stoppt bei Hindernis
            break; 
        }
    }

    return { x: currentX, y: currentY };
};

/**
 * Validiert einen Teleport (z.B. Misty Step).
 * @param {Object} targetCoords - {x, y} Wohin?
 * @param {Array} allCombatants - Ist das Feld frei?
 */
export const isValidTeleport = (targetCoords, allCombatants) => {
    return !allCombatants.some(c => c.x === targetCoords.x && c.y === targetCoords.y && c.hp > 0);
};