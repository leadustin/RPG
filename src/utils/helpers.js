// --- Datei: src/utils/helpers.js ---

export const LEVEL_XP_TABLE = {
  1: 0,
  2: 300,
  3: 900,
  4: 2700,
  5: 6500,
  6: 14000,
  7: 23000,
  8: 34000,
  9: 48000,
  10: 64000,
  11: 85000,
  12: 100000,
  13: 120000,
  14: 140000,
  15: 165000,
  16: 195000,
  17: 225000,
  18: 265000,
  19: 305000,
  20: 355000,
};

export const getModifier = (score) => {
  return Math.floor((score - 10) / 2);
};

export const getProficiencyBonus = (level) => {
  if (level < 5) return 2;
  if (level < 9) return 3;
  if (level < 13) return 4;
  if (level < 17) return 5;
  return 6; // Stufe 17-20
};

// --- NEU HINZUGEFÜGT ---

/**
 * Führt einen einzelnen W20-Wurf aus.
 * @param {object} options - { advantage: boolean, disadvantage: boolean }
 * @returns {number} Das Wurfergebnis.
 */
export const rollD20 = (options = {}) => {
  const roll1 = Math.floor(Math.random() * 20) + 1;
  if (options.advantage && options.disadvantage) {
     return roll1;
  }
  if (!options.advantage && !options.disadvantage) {
    return roll1;
  }
  const roll2 = Math.floor(Math.random() * 20) + 1;
  
  if (options.advantage) {
    return Math.max(roll1, roll2);
  }
  if (options.disadvantage) {
    return Math.min(roll1, roll2);
  }
};

/**
 * Führt einen Würfelwurf basierend auf D&D-Notation aus (z.B. "3d8", "1d10+5").
 * @param {string} diceNotation - Z.B. "3d8", "1d10+5".
 * @returns {number} Nur die Gesamtsumme.
 */
export const rollDiceFormula = (diceNotation) => {
  if (!diceNotation) return 0;

  let total = 0;
  const parts = diceNotation.toLowerCase().split('+');
  
  let dicePart = parts[0];
  let bonus = 0;

  if (parts.length > 1) {
    let bonusCandidate = parts.slice(1).join('+');
    bonus = parseInt(bonusCandidate, 10) || 0;
  }
  
  const match = dicePart.match(/(\d+)d(\d+)/);
  
  if (!match) {
    bonus += parseInt(dicePart.trim(), 10) || 0;
    return bonus;
  }

  const numDice = parseInt(match[1], 10);
  const diceType = parseInt(match[2], 10);

  for (let i = 0; i < numDice; i++) {
    const roll = Math.floor(Math.random() * diceType) + 1;
    total += roll;
  }
  
  return total + bonus;
};