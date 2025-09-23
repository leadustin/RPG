// src/utils/helpers.js

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