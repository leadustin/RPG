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
  if (typeof score !== 'number') return 0;
  return Math.floor((score - 10) / 2);
};

/**
 * (NEU & ERFORDERLICH)
 * Berechnet den Übungsbonus (Proficiency Bonus) basierend auf dem Charakter-Level.
 * @param {number} level Das Charakter-Level
 * @returns {number} Der Übungsbonus (z.B. +2 auf Level 1-4)
 */
export const getProficiencyBonus = (level) => {
  if (level < 5) return 2;
  if (level < 9) return 3;
  if (level < 13) return 4;
  if (level < 17) return 5;
  return 6;
};

/**
 * Bildet Fertigkeitsnamen auf die zugehörigen Attributs-Kürzel ab.
 */
export const skillToAbilityMap = {
  // Stärke
  "Athletik": "str",
  // Geschicklichkeit
  "Akrobatik": "dex",
  "Fingerfertigkeit": "dex",
  "Heimlichkeit": "dex",
  // Intelligenz
  "Arkanum": "int",
  "Geschichte": "int",
  "Nachforschungen": "int",
  "Naturkunde": "int",
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
 * (KORRIGIERT & FINAL)
 * Berechnet den Gesamtbonus für eine bestimmte Fertigkeit dynamisch.
 * @param {object} character Das Charakterobjekt (muss abilities, level, race, class, background haben).
 * @param {string} skillName Der Name der Fertigkeit (z.B. "Heimlichkeit").
 * @returns {number} Der gesamte Fertigkeitsbonus.
 */
export const getSkillBonus = (character, skillName) => {
  if (!character || !character.abilities || !character.background || !character.class || !character.race || !character.level) {
      console.error("getSkillBonus: Charakter-Objekt ist unvollständig.", character);
      return 0;
  }
  
  const abilityKey = skillToAbilityMap[skillName];
  if (!abilityKey) {
      console.error(`getSkillBonus: Ke Nü-Sleutel (Key) für Fertigkeit '${skillName}' gefunden.`);
      return 0;
  }

  const abilityScore = character.abilities[abilityKey];
  const modifier = getModifier(abilityScore);

  // KORREKTUR 1: Übungsbonus dynamisch vom Level ableiten.
  const proficiencyBonus = getProficiencyBonus(character.level); 

  // KORREKTUR 2: Alle Quellen für Übung prüfen (Rasse, Klasse, Hintergrund).
  // Wir gehen davon aus, dass *gewählte* Fertigkeiten in einem 'chosen'-Array gespeichert sind.
  const allProficiencies = [
      ...(character.race.skill_proficiencies || []), // Feste Rassen-Boni (z.B. Elf -> Wahrnehmung)
      ...(character.race.skill_proficiencies_options?.chosen || []), // Gewählte Rassen-Boni (z.B. Halb-Elf)
      ...(character.class.skill_proficiencies_options?.chosen || []), // Gewählte Klassen-Boni
      ...(character.background.skill_proficiencies || []) // Feste Hintergrund-Boni
  ];

  const isProficient = allProficiencies.includes(skillName);

  return isProficient ? (modifier + proficiencyBonus) : modifier;
};