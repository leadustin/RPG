// src/engine/combat/conditionManager.js

/**
 * Standard-Definitionen für Conditions (erweiterbar)
 * Hier können später Flags wie 'grants_advantage' hinterlegt werden.
 */
export const CONDITION_TYPES = {
  BLINDED: 'BLINDED',
  CHARMED: 'CHARMED',
  DEAFENED: 'DEAFENED',
  FRIGHTENED: 'FRIGHTENED',
  GRAPPLED: 'GRAPPLED',
  INCAPACITATED: 'INCAPACITATED',
  INVISIBLE: 'INVISIBLE',
  PARALYZED: 'PARALYZED',
  PETRIFIED: 'PETRIFIED',
  POISONED: 'POISONED',
  PRONE: 'PRONE',
  RESTRAINED: 'RESTRAINED',
  STUNNED: 'STUNNED',
  UNCONSCIOUS: 'UNCONSCIOUS',
  // Spezielle Zauber-Conditions
  HEX: 'HEX',
  HUNTERS_MARK: 'HUNTERS_MARK',
  BANE: 'BANE',
  BLESS: 'BLESS'
};

/**
 * Wendet einen Zustand auf einen Combatant an.
 * Prüft auf Duplikate und aktualisiert ggf. die Dauer.
 */
export const applyCondition = (combatant, conditionData) => {
  const existingConditionIndex = combatant.activeConditions.findIndex(c => c.type === conditionData.type);
  let newConditions = [...combatant.activeConditions];

  if (existingConditionIndex >= 0) {
    // Wenn Zustand existiert: Dauer überschreiben, falls neue Dauer länger ist
    if (conditionData.duration > newConditions[existingConditionIndex].duration) {
      newConditions[existingConditionIndex] = { ...conditionData };
    }
  } else {
    newConditions.push(conditionData);
  }

  return {
    ...combatant,
    activeConditions: newConditions
  };
};

/**
 * Prüft, ob ein Combatant einen bestimmten Zustand hat.
 */
export const hasCondition = (combatant, type) => {
  return combatant.activeConditions.some(c => c.type === type);
};

/**
 * Verarbeitet Schaden unter Berücksichtigung von TempHP.
 * TempHP werden vor den echten HP abgezogen.
 */
export const resolveDamage = (combatant, damageAmount) => {
  let remainingDamage = damageAmount;
  let newTempHp = combatant.tempHp || 0;

  // 1. Temp HP abziehen
  if (newTempHp > 0) {
    const absorb = Math.min(newTempHp, remainingDamage);
    newTempHp -= absorb;
    remainingDamage -= absorb;
  }

  // 2. Echte HP abziehen
  let newHp = combatant.hp;
  if (remainingDamage > 0) {
    newHp = Math.max(0, combatant.hp - remainingDamage);
  }

  return {
    ...combatant,
    hp: newHp,
    tempHp: newTempHp
  };
};

/**
 * Verarbeitet temporäre HP (z.B. False Life).
 * Temp HP stapeln nicht! Es gilt immer der höhere Wert.
 */
export const applyTempHp = (combatant, amount) => {
  const currentTemp = combatant.tempHp || 0;
  return {
    ...combatant,
    tempHp: Math.max(currentTemp, amount)
  };
};

/**
 * Wird am Ende/Start eines Zuges aufgerufen, um Condition-Dauer zu reduzieren.
 */
export const tickConditions = (combatant) => {
  const nextConditions = combatant.activeConditions
    .map(c => ({ ...c, duration: c.duration - 1 }))
    .filter(c => c.duration > 0); // Entferne abgelaufene

  return {
    ...combatant,
    activeConditions: nextConditions
  };
};