/**
 * Tabelle für die benötigten Gesamt-EP pro Stufe (D&D 5e).
 */
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
  20: 355000
};

/**
 * Berechnet den Attributsmodifikator für einen gegebenen Attributswert.
 * @param {number} score Der Attributswert (z.B. 14).
 * @returns {number} Der Modifikator (z.B. +2).
 */
export const getModifier = (score) => {
  return Math.floor((score - 10) / 2);
};

/**
 * Ordnet D&D-Fertigkeiten ihren zugehörigen Attributen zu.
 */
const skillToAbilityMap = {
  // Stärke
  "Athletik": "str",
  // Geschicklichkeit
  "Akrobatik": "dex",
  "Fingerfertigkeit": "dex",
  "Heimlichkeit": "dex",
  // Intelligenz
  "Arkanum": "int",
  "Geschichte": "int",
  "Nachforschung": "int",
  "Natur": "int",
  "Religion": "int",
  // Weisheit
  "Tierkunde": "wis",
  "Einblick": "wis",
  "Medizin": "wis",
  "Wahrnehmung": "wis",
  "Überlebenskunst": "wis",
  // Charisma
  "Täuschung": "cha",
  "Einschüchtern": "cha",
  "Darbietung": "cha",
  "Überzeugen": "cha",
};

/**
 * Berechnet den Gesamtbonus für eine bestimmte Fertigkeit.
 * @param {object} character Das Charakterobjekt.
 * @param {string} skillName Der Name der Fertigkeit (z.B. "Heimlichkeit").
 * @returns {number} Der gesamte Fertigkeitsbonus.
 */
export const getSkillBonus = (character, skillName) => {
  if (!character || !character.abilities || !character.background || !character.class) {
      return 0;
  }
  
  const abilityKey = skillToAbilityMap[skillName];
  if (!abilityKey) return 0;

  const abilityScore = character.abilities[abilityKey];
  const modifier = getModifier(abilityScore);

  // Annahme: Übungsbonus ist +2 auf Stufe 1. 
  const proficiencyBonus = 2; 

  const isProficient = [
      ...(character.background.skill_proficiencies || []),
      ...(character.class.skill_proficiencies || []),
      ...(character.skill_proficiencies_choice || [])
  ].includes(skillName);

  return modifier + (isProficient ? proficiencyBonus : 0);
};

/**
 * Formatiert die Attributswerte für die Anzeige.
 */
export const formatAbilityScores = (scores) => {
  return Object.entries(scores)
    .map(([key, value]) => `${key.toUpperCase()}: ${value}`)
    .join(" | ");
};

/**
 * HILFSFUNKTION: Würfelt eine Würfelformel (z.B. "1d8" oder "1d10+2").
 */
export const rollDiceFormula = (formula) => {
  let total = 0;
  // Regex, um den Hauptwürfelteil und den Modifikator zu trennen
  const match = formula.match(/(\d+d\d+)([+-]\d+)?/);

  if (!match) {
    // Fallback für einfache Zahlen (z.B. Heilung)
    return parseInt(formula, 10) || 0;
  }

  const dicePart = match[1]; // z.B. "1d8"
  const modifierPart = match[2]; // z.B. "+2"

  const [numDiceStr, numSidesStr] = dicePart.split("d");
  const numDice = parseInt(numDiceStr, 10) || 1;
  const numSides = parseInt(numSidesStr, 10);

  if (!isNaN(numSides)) {
    for (let i = 0; i < numDice; i++) {
      total += Math.floor(Math.random() * numSides) + 1;
    }
  }

  // Bonus-Teil
  if (modifierPart) {
    total += parseInt(modifierPart, 10);
  }

  return total;
};