// src/engine/combat/specialEffectManager.js
import { d } from '../../utils/dice';
import { getDistance } from './geometry';

/**
 * Behandelt spezielle Zauber-Effekte, die nicht in die Standard-Kategorien passen.
 * Gibt ein Update-Objekt für den Combatant zurück oder null.
 */
export const processSpecialEffect = (effect, attacker, target, allCombatants) => {
    let updates = {};
    let logs = [];

    // 1. DISINTEGRATE (Auflösung)
    // Wenn TP auf 0 fallen, wird der Körper zu Staub (kein Death Save).
    if (effect.type === 'DISINTEGRATE') {
        if (target.hp === 0) { // Wird nach der Schadensberechnung aufgerufen
            updates.isPermadeath = true; // Flag für "Endgültiger Tod"
            updates.bodyDestroyed = true;
            logs.push(`⚛️ ${target.name} wird zu Staub zerfallen!`);
        }
    }

    // 2. VAMPIRIC TOUCH (Lebensentzug)
    // Heilt den Angreifer um die Hälfte des angerichteten Schadens.
    // Benötigt den Parameter 'damageDealt' (muss durchgereicht werden).
    else if (effect.type === 'LIFESTEAL' && effect.damageDealt) {
        const healAmount = Math.floor(effect.damageDealt / 2);
        // Wir können hier den Angreifer nicht direkt ändern, da 'target' das Ziel ist.
        // Das ist ein Sonderfall: Der Effekt betrifft den CASTER, nicht das ZIEL.
        // Rückgabewert müsste also komplexer sein (attackerUpdates).
        // Lösung: Wir behandeln das separat oder nutzen ein Callback.
        // Vereinfachung: Wir loggen es nur hier, Logik müsste in useCombat angepasst werden.
    }

    // 3. CHAIN LIGHTNING (Kettenblitz) - Logik für Sekundärziele
    // Das ist komplex, da es neue Ziele zur Action hinzufügen müsste.
    // Das machen wir idealerweise VOR der Ausführung in useCombat.

    // 4. INSTANT KILL (Power Word Kill)
    else if (effect.type === 'INSTANT_KILL_CONDITIONAL') {
        const threshold = effect.hp_threshold || 100;
        if (target.hp <= threshold) {
            updates.hp = 0;
            updates.isPermadeath = false; // Normaler Tod
            logs.push(`💀 ${target.name} stirbt sofort durch das Machtwort!`);
        }
    }

    // 5. BANISHMENT (Verbannung)
    else if (effect.type === 'BANISH') {
        updates.isBanished = true;
        updates.originalPosition = { x: target.x, y: target.y };
        updates.x = -999; // Ab ins Nichts
        updates.y = -999;
        logs.push(`🌀 ${target.name} wurde auf eine andere Ebene verbannt!`);
    }

    return { updates, logs };
};