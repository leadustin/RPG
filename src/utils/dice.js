// src/utils/dice.js

/**
 * Rollt einen n-seitigen Würfel.
 * @param {number} sides - Anzahl der Seiten (z.B. 20)
 * @returns {number} Ergebnis (1 bis sides)
 */
export const d = (sides) => Math.floor(Math.random() * sides) + 1;

/**
 * Parst einen Würfel-String (z.B. "1d8 + 3", "2d6", "1d4-1") und gibt das Ergebnis zurück.
 * @param {string} diceString - Der String, der gewürfelt werden soll.
 * @returns {object} { total, rolls, breakdown }
 */
export const rollDiceString = (diceString) => {
  if (!diceString) return { total: 0, rolls: [], breakdown: "0" };

  // Entferne Leerzeichen und mache alles lowercase
  const cleanStr = diceString.toLowerCase().replace(/\s/g, '');
  
  // Regex für Format: XdY(+Z) oder XdY(-Z)
  // Gruppen: 1=Anzahl, 2=Seiten, 3=Operator(optional), 4=Modifikator(optional)
  const regex = /^(\d+)d(\d+)([+-])?(\d+)?$/;
  const match = cleanStr.match(regex);

  if (!match) {
    console.warn(`Ungültiges Würfelformat: ${diceString}. Fallback auf festen Wert.`);
    const fixed = parseInt(cleanStr);
    return { total: isNaN(fixed) ? 0 : fixed, rolls: [], breakdown: `${fixed}` };
  }

  const numDice = parseInt(match[1]);
  const numSides = parseInt(match[2]);
  const operator = match[3] || '+';
  const modifier = match[4] ? parseInt(match[4]) : 0;

  let total = 0;
  const rolls = [];

  for (let i = 0; i < numDice; i++) {
    const roll = d(numSides);
    rolls.push(roll);
    total += roll;
  }

  if (operator === '+') {
    total += modifier;
  } else if (operator === '-') {
    total -= modifier;
  }

  // Erstelle einen Text für das Log (z.B. "[4, 2] + 3")
  const breakdown = `[${rolls.join(', ')}] ${modifier > 0 ? operator + ' ' + modifier : ''}`;

  return { total, rolls, breakdown };
};