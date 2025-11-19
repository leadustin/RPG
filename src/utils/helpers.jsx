// src/utils/helpers.jsx

/**
 * Tabelle für die benötigten Gesamt-EP pro Stufe (D&D 5e).
 */
export const LEVEL_XP_TABLE = {
  1: 0, 2: 300, 3: 900, 4: 2700, 5: 6500, 6: 14000, 7: 23000, 8: 34000, 9: 48000, 10: 64000,
  11: 85000, 12: 100000, 13: 120000, 14: 140000, 15: 165000, 16: 195000, 17: 225000, 18: 265000, 19: 305000, 20: 355000
};

/**
 * Ordnet D&D-Fertigkeiten ihren zugehörigen Attributen zu.
 * WICHTIG: Muss exportiert werden als SKILL_MAP!
 */
export const SKILL_MAP = {
  "Athletik": "str",
  "Akrobatik": "dex", "Fingerfertigkeit": "dex", "Heimlichkeit": "dex",
  "Arkanum": "int", "Geschichte": "int", "Nachforschung": "int", "Natur": "int", "Religion": "int",
  "Umgang mit Tieren": "wis", "Tierkunde": "wis", "Einblick": "wis", "Medizin": "wis", "Wahrnehmung": "wis", "Überlebenskunst": "wis",
  "Täuschung": "cha", "Einschüchtern": "cha", "Auftreten": "cha", "Darbietung": "cha", "Überzeugen": "cha", "Überreden": "cha"
};

// Deutsche Anzeigenamen
export const SKILL_NAMES_DE = {
  "Athletik": "Athletik",
  "Akrobatik": "Akrobatik", "Fingerfertigkeit": "Fingerfertigkeit", "Heimlichkeit": "Heimlichkeit",
  "Arkanum": "Arkanum", "Geschichte": "Geschichte", "Nachforschung": "Nachforschung", "Natur": "Natur", "Religion": "Religion",
  "Umgang mit Tieren": "Umgang mit Tieren", "Tierkunde": "Umgang mit Tieren", "Einblick": "Motiv erkennen", "Medizin": "Heilkunde", "Wahrnehmung": "Wahrnehmung", "Überlebenskunst": "Überlebenskunst",
  "Täuschung": "Täuschung", "Einschüchtern": "Einschüchtern", "Auftreten": "Auftreten", "Darbietung": "Auftreten", "Überzeugen": "Überzeugen", "Überreden": "Überzeugen"
};

// Beschreibungen für Tooltips
export const ABILITY_DESCRIPTIONS_DE = {
    str: "Stärke: Körperkraft, Athletik.",
    dex: "Geschicklichkeit: Gewandtheit, Reflexe, Balance.",
    con: "Konstitution: Gesundheit, Ausdauer, Lebenskraft.",
    int: "Intelligenz: Gedächtnis, Logik, Bildung.",
    wis: "Weisheit: Wahrnehmung, Intuition, Willenskraft.",
    cha: "Charisma: Persönlichkeit, Überzeugungskraft, Führung."
};

export const SKILL_DESCRIPTIONS_DE = {
    "Athletik": "Klettern, Springen, Schwimmen.",
    "Heimlichkeit": "Verbergen, lautlos bewegen.",
    "Wahrnehmung": "Umgebung bemerken, Lauschen.",
    // ... weitere nach Bedarf
};

export const COMBAT_STATS_DESCRIPTIONS_DE = {
    ac: "Rüstungsklasse: Wie schwer es ist, dich zu treffen.",
    hp: "Trefferpunkte: Wie viel Schaden du aushältst.",
    proficiency: "Übungsbonus: Wird auf geübte Würfe addiert."
};

export const getModifier = (score) => Math.floor((score - 10) / 2);

export const getProficiencyBonus = (level) => Math.ceil(1 + (level / 4));

export const calculateInitialHP = (char) => {
    if (!char || !char.class || !char.abilities) return 0;
    // Einfache Logik: HitDie Max + CON
    const conMod = getModifier(char.abilities.con);
    const hitDie = parseInt(char.class.hit_die?.replace('d', '') || 8);
    return hitDie + conMod;
};

export const calculateAC = (char) => {
    if (!char || !char.abilities) return 10;
    return 10 + getModifier(char.abilities.dex); // Basis ohne Rüstung
};

export const getRacialAbilityBonus = (char, ability) => {
    // Vereinfacht, da im PHB 2024 Boni im Background sind, aber alte Logik ggf. noch da ist
    return 0; 
};

export const isProficientInSkill = (char, skill) => {
    if (!char) return false;
    const profs = [
        ...(char.background?.skills || []), // PHB 2024
        ...(char.class?.skill_proficiencies || []),
        ...(char.skill_proficiencies_choice || [])
    ];
    // Mapping prüfen (falls im JSON englische Keys stehen)
    return profs.includes(skill) || profs.includes(skill.toLowerCase());
};

export const calculateSkillBonus = (character, skillName) => {
  if (!character || !character.abilities) return 0;
  
  const abilityKey = SKILL_MAP[skillName];
  if (!abilityKey) return 0;

  const abilityScore = character.abilities[abilityKey];
  const modifier = getModifier(abilityScore);
  const proficiencyBonus = getProficiencyBonus(1); 

  const isProficient = isProficientInSkill(character, skillName);

  return modifier + (isProficient ? proficiencyBonus : 0);
};

export const rollDiceFormula = (formula) => {
  let total = 0;
  const match = formula.match(/(\d+d\d+)([+-]\d+)?/);
  if (!match) return parseInt(formula, 10) || 0;

  const dicePart = match[1]; 
  const modifierPart = match[2]; 
  const [numDiceStr, numSidesStr] = dicePart.split("d");
  const numDice = parseInt(numDiceStr, 10) || 1;
  const numSides = parseInt(numSidesStr, 10);

  if (!isNaN(numSides)) {
    for (let i = 0; i < numDice; i++) {
      total += Math.floor(Math.random() * numSides) + 1;
    }
  }
  if (modifierPart) total += parseInt(modifierPart, 10);
  return total;
};