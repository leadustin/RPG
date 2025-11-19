// src/utils/helpers.jsx

/**
 * Tabelle für die benötigten Gesamt-EP pro Stufe (D&D 5e).
 */
export const LEVEL_XP_TABLE = {
  1: 0, 2: 300, 3: 900, 4: 2700, 5: 6500, 6: 14000, 7: 23000, 8: 34000, 9: 48000, 10: 64000,
  11: 85000, 12: 100000, 13: 120000, 14: 140000, 15: 165000, 16: 195000, 17: 225000, 18: 265000, 19: 305000, 20: 355000
};

/**
 * Mapping der deutschen Fertigkeitsnamen auf die Attribute.
 * WICHTIG: Muss exportiert werden, damit SummaryPanel darauf zugreifen kann.
 */
export const SKILL_MAP = {
  "Athletik": "str",
  "Akrobatik": "dex", "Fingerfertigkeit": "dex", "Heimlichkeit": "dex",
  "Arkanum": "int", "Geschichte": "int", "Nachforschungen": "int", "Nachforschung": "int", "Natur": "int", "Naturkunde": "int", "Religion": "int",
  "Umgang mit Tieren": "wis", "Tierkunde": "wis", "Einblick": "wis", "Medizin": "wis", "Wahrnehmung": "wis", "Überlebenskunst": "wis",
  "Täuschung": "cha", "Einschüchtern": "cha", "Auftreten": "cha", "Darbietung": "cha", "Überzeugen": "cha", "Überreden": "cha"
};

/**
 * Anzeigenamen für die Fertigkeiten (Deutsch).
 */
export const SKILL_NAMES_DE = {
  "Athletik": "Athletik",
  "Akrobatik": "Akrobatik", "Fingerfertigkeit": "Fingerfertigkeit", "Heimlichkeit": "Heimlichkeit",
  "Arkanum": "Arkanum", "Geschichte": "Geschichte", "Nachforschungen": "Nachforschungen", "Nachforschung": "Nachforschungen", "Natur": "Naturkunde", "Naturkunde": "Naturkunde", "Religion": "Religion",
  "Umgang mit Tieren": "Umgang mit Tieren", "Tierkunde": "Umgang mit Tieren", "Einblick": "Motiv erkennen", "Medizin": "Heilkunde", "Wahrnehmung": "Wahrnehmung", "Überlebenskunst": "Überlebenskunst",
  "Täuschung": "Täuschung", "Einschüchtern": "Einschüchtern", "Auftreten": "Auftreten", "Darbietung": "Auftreten", "Überzeugen": "Überzeugen", "Überreden": "Überzeugen"
};

/**
 * Tooltips für Attribute.
 */
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
    "Akrobatik": "Balance halten, Stürze abfangen.",
    "Fingerfertigkeit": "Taschendiebstahl, Schlösser knacken.",
    "Arkanum": "Wissen über Magie und Ebenen.",
    "Geschichte": "Wissen über vergangene Ereignisse.",
    "Nachforschungen": "Hinweise finden, Deduktion.",
    "Naturkunde": "Wissen über Pflanzen, Tiere, Wetter.",
    "Religion": "Wissen über Götter und Riten.",
    "Umgang mit Tieren": "Tiere beruhigen oder lenken.",
    "Einblick": "Lügen erkennen, Absichten durchschauen.",
    "Medizin": "Erste Hilfe, Krankheiten erkennen.",
    "Überlebenskunst": "Spurenlesen, Jagen, Orientierung.",
    "Täuschung": "Lügen, Verkleiden, Hochstapelei.",
    "Einschüchtern": "Andere durch Drohungen beeinflussen.",
    "Auftreten": "Unterhalten durch Musik, Tanz, Schauspiel.",
    "Überzeugen": "Andere diplomatisch beeinflussen."
};

export const COMBAT_STATS_DESCRIPTIONS_DE = {
    ac: "Rüstungsklasse: Wie schwer es ist, dich zu treffen.",
    hp: "Trefferpunkte: Wie viel Schaden du aushältst.",
    proficiency: "Übungsbonus: Wird auf geübte Würfe addiert."
};

/**
 * Berechnet den Attributsmodifikator.
 */
export const getModifier = (score) => {
    if (score === undefined || score === null) return 0;
    return Math.floor((score - 10) / 2);
};

/**
 * Berechnet den Übungsbonus basierend auf dem Charakterlevel.
 */
export const getProficiencyBonus = (level) => Math.ceil(1 + (level / 4));

/**
 * Berechnet die Start-TP.
 * FIX: Behandelt hit_die als Zahl ODER String.
 */
export const calculateInitialHP = (char) => {
    if (!char || !char.class || !char.abilities) return 0;
    
    const conMod = getModifier(char.abilities.con);
    
    // Sicherer Zugriff auf hit_die
    let hitDieMax = 8; // Default
    const rawHitDie = char.class.hit_die;

    if (typeof rawHitDie === 'number') {
        // Wenn es bereits eine Zahl ist (z.B. 12 aus classes.json)
        hitDieMax = rawHitDie;
    } else if (typeof rawHitDie === 'string') {
        // Wenn es ein String ist (z.B. "1d12" oder "d12")
        // Entferne alles was keine Zahl ist
        const numericPart = rawHitDie.replace(/\D/g, '');
        hitDieMax = parseInt(numericPart, 10) || 8;
    }

    // Auf Level 1 erhält man das Maximum des Trefferwürfels + CON
    return hitDieMax + conMod;
};

/**
 * Berechnet die Rüstungsklasse (vereinfacht).
 */
export const calculateAC = (char) => {
    if (!char || !char.abilities) return 10;
    // Hier könnte man später Rüstung aus dem Inventar einbeziehen
    return 10 + getModifier(char.abilities.dex); 
};

/**
 * Berechnet Volksboni für Attribute.
 * (Wird für PHB 2024 eigentlich nicht mehr gebraucht, da Boni im Hintergrund sind, 
 * aber für Rückwärtskompatibilität behalten).
 */
export const getRacialAbilityBonus = (char, ability) => {
    if (char.background_options?.bonuses) {
        return char.background_options.bonuses[ability] || 0;
    }
    return 0; 
};

/**
 * Prüft, ob ein Charakter in einer Fertigkeit geübt ist.
 */
export const isProficientInSkill = (char, skill) => {
    if (!char) return false;
    
    // Sammle alle Quellen von Übungen
    const profs = [
        ...(char.background?.skills || []), // PHB 2024 Backgrounds
        ...(char.background?.skill_proficiencies || []), // Alte Backgrounds
        ...(char.class?.skill_proficiencies || []),
        ...(char.skill_proficiencies_choice || [])
    ];

    // Prüfe auf exakten Namen oder Kleinbuchstaben
    return profs.some(p => p === skill || p.toLowerCase() === skill.toLowerCase());
};

/**
 * Berechnet den Gesamtbonus für eine Fertigkeit.
 */
export const calculateSkillBonus = (character, skillName) => {
  if (!character || !character.abilities) return 0;
  
  const abilityKey = SKILL_MAP[skillName];
  if (!abilityKey) return 0;

  const abilityScore = character.abilities[abilityKey];
  const modifier = getModifier(abilityScore);
  const proficiencyBonus = getProficiencyBonus(1); // Annahme Level 1

  const isProficient = isProficientInSkill(character, skillName);

  // Expertise Check (doppelter Übungsbonus)
  const isExpertise = character.expertise_choices?.includes(skillName);
  
  let totalBonus = modifier;
  if (isProficient) totalBonus += proficiencyBonus;
  if (isExpertise) totalBonus += proficiencyBonus; // Nochmal addieren für Expertise

  return totalBonus;
};

/**
 * Würfelt eine Formel wie "1d8+2".
 */
export const rollDiceFormula = (formula) => {
  if (!formula) return 0;
  // String erzwingen, falls Zahl übergeben wird
  const formulaStr = String(formula);
  
  let total = 0;
  const match = formulaStr.match(/(\d+d\d+)([+-]\d+)?/);
  
  if (!match) return parseInt(formulaStr, 10) || 0;

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

// Alte Funktion für Kompatibilität beibehalten, falls sie noch woanders importiert wird
export const getSkillBonus = calculateSkillBonus;