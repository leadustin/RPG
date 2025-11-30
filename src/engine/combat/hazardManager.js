// src/engine/combat/hazardManager.js
import { d, rollDiceString } from '../../utils/dice';
import { resolveDamage, applyCondition, hasCondition } from './conditionManager';

/**
 * Prüft Interaktionen zwischen Kreaturen und Gefahrenzonen (Hazards).
 * @param {Object} combatant - Die Kreatur, die geprüft wird
 * @param {Array} allCombatants - Liste aller Tokens (um Hazards zu finden)
 * @param {string} triggerType - 'START_TURN', 'END_TURN', 'ENTER'
 */
export const checkHazardInteractions = (combatant, allCombatants, triggerType) => {
    // Finde alle Hazards, die sich auf demselben Feld befinden
    const activeHazards = allCombatants.filter(c => 
        c.type === 'hazard' && 
        c.x === combatant.x && 
        c.y === combatant.y &&
        c.hazardProfile // Das Profil definiert, was der Hazard tut
    );

    let updatedCombatant = { ...combatant };
    let logs = [];

    activeHazards.forEach(hazard => {
        const profile = hazard.hazardProfile;

        // Prüfen, ob dieser Trigger für den Hazard relevant ist
        if (profile.trigger === triggerType || (Array.isArray(profile.trigger) && profile.trigger.includes(triggerType))) {
            
            // 1. SCHADENS-EFFEKT
            if (profile.damage) {
                // Rettungswurf Logik (vereinfacht)
                let damageVal = 0;
                if (profile.damage.dice) {
                    // Würfle Schaden (z.B. 2d6)
                    // Hier vereinfachen wir und nehmen einen Durchschnitt oder würfeln neu
                    // Besser wäre es, den Caster-Stat zu haben, aber der Hazard speichert das ggf. nicht.
                    // Wir nehmen an 'hazard.damageRoll' wurde beim Casten gespeichert oder wir würfeln frisch.
                    damageVal = parseInt(d(profile.damage.dice.replace('d', ''))); // Sehr simple Näherung
                    // Besser: Nutze rollDiceString wenn importierbar
                    const roll = rollDiceString(profile.damage.dice);
                    damageVal = typeof roll === 'object' ? roll.total : roll;
                }

                // Wende Schaden an
                updatedCombatant = resolveDamage(updatedCombatant, damageVal);
                logs.push(`🔥 ${combatant.name} nimmt ${damageVal} Schaden durch ${hazard.name}.`);
            }

            // 2. CONDITION-EFFEKT (z.B. Web -> Restrained)
            if (profile.apply_condition) {
                updatedCombatant = applyCondition(updatedCombatant, profile.apply_condition);
                logs.push(`🕸️ ${combatant.name} ist von ${hazard.name} betroffen (${profile.apply_condition.type}).`);
            }
        }
    });

    return { combatant: updatedCombatant, logs };
};