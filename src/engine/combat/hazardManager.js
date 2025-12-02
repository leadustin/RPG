// src/engine/combat/hazardManager.js
import { d, rollDiceString } from '../../utils/dice';
import { resolveDamage, applyCondition } from './conditionManager';

/**
 * Prüft Interaktionen zwischen Kreaturen und Gefahrenzonen (Hazards).
 * Regelkonform für 1-Feld-Hazards (Cloud of Daggers).
 */
export const checkHazardInteractions = (combatant, allCombatants, triggerType) => {
    // 1. Finde Hazards auf EXAKT demselben Feld (gerundet)
    // Ignoriere den Hazard selbst (kein Friendly Fire auf sich selbst)
    const activeHazards = allCombatants.filter(c => 
        c.type === 'hazard' && 
        c.id !== combatant.id && // WICHTIG: Nicht sich selbst angreifen!
        Math.round(c.x) === Math.round(combatant.x) && // X runden
        Math.round(c.y) === Math.round(combatant.y) && // Y runden
        c.hazardProfile 
    );

    let updatedCombatant = { ...combatant };
    let logs = [];

    activeHazards.forEach(hazard => {
        const profile = hazard.hazardProfile;

        // Prüfen ob Trigger passt (z.B. "START_TURN" oder "ENTER")
        if (profile.trigger === triggerType || (Array.isArray(profile.trigger) && profile.trigger.includes(triggerType))) {
            
            // A) SCHADENS-EFFEKT
            if (profile.damage) {
                let damageVal = 0;
                if (profile.damage.dice) {
                    const roll = rollDiceString(profile.damage.dice);
                    damageVal = typeof roll === 'object' ? roll.total : roll;
                } else if (typeof profile.damage === 'number') {
                    damageVal = profile.damage;
                }

                updatedCombatant = resolveDamage(updatedCombatant, damageVal);
                logs.push(`🔥 ${combatant.name} nimmt ${damageVal} Schaden durch ${hazard.name}.`);
            }

            // B) ZUSTANDS-EFFEKT (z.B. Web -> Restrained)
            if (profile.apply_condition) {
                updatedCombatant = applyCondition(updatedCombatant, profile.apply_condition);
                logs.push(`🕸️ ${combatant.name} ist von ${hazard.name} betroffen (${profile.apply_condition.type}).`);
            }
        }
    });

    return { combatant: updatedCombatant, logs };
};