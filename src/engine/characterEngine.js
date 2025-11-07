// --- Datei: src/engine/characterEngine.js ---

import allArmor from "../data/items/armor.json";
import allClassData from "../data/classes.json";
import { LEVEL_XP_TABLE } from "../utils/helpers";

// --- NEU: Alle 12 Klassen-Logik-Module importieren ---
import { BarbarianLogic } from "./logic/classes/BarbarianLogic.js";
import { BardLogic } from "./logic/classes/BardLogic.js";
import { ClericLogic } from "./logic/classes/ClericLogic.js";
import { DruidLogic } from "./logic/classes/DruidLogic.js";
import { FighterLogic } from "./logic/classes/FighterLogic.js";
import { MonkLogic } from "./logic/classes/MonkLogic.js";
import { PaladinLogic } from "./logic/classes/PaladinLogic.js";
import { RangerLogic } from "./logic/classes/RangerLogic.js";
import { RogueLogic } from "./logic/classes/RogueLogic.js";
import { SorcererLogic } from "./logic/classes/SorcererLogic.js";
import { WarlockLogic } from "./logic/classes/WarlockLogic.js";
import { WizardLogic } from "./logic/classes/WizardLogic.js";

// --- WIEDERHERGESTELLT: Konstanten für die UI ---
// (Diese wurden von den character_creation-Komponenten benötigt)

export const ABILITY_DESCRIPTIONS_DE = {
  str: "Mächtige Krieger und Athleten. Stärke misst rohe körperliche Kraft.",
  dex: "Gewandte Schurken und Bogenschützen. Geschicklichkeit misst Agilität, Reflexe und Gleichgewicht.",
  con: "Zähe Kämpfer und Abenteurer. Konstitution misst Gesundheit, Ausdauer und Lebenskraft.",
  int: "Gelehrte Magier und Taktiker. Intelligenz misst geistige Schärfe, Gedächtnis und analytisches Denken.",
  wis: "Wahrnehmende Kleriker und Waldläufer. Weisheit misst Wahrnehmung, Intuition und Einklang mit der Welt.",
  cha: "Einflussreiche Barden und Zauberer. Charisma misst Selbstvertrauen, Eloquenz und Willenskraft.",
};

export const COMBAT_STATS_DESCRIPTIONS_DE = {
  hp: "Trefferpunkte (TP): Zeigt an, wie viel Schaden du einstecken kannst. Bei 0 TP bist du kampfunfähig.",
  ac: "Rüstungsklasse (RK): Repräsentiert deine Verteidigung. Ein Angreifer muss diesen Wert mit seinem Angriffswurf übertreffen, um dich zu treffen.",
  speed: "Bewegungsrate: Die Distanz (in Metern), die du in einer Runde zurücklegen kannst.",
  proficiency: "Übungsbonus (ÜB): Ein Bonus, den du auf alle Würfe addierst, in denen du 'geübt' bist (z.B. Angriffe, Rettungswürfe, Fertigkeiten). Er steigt mit deinem Level.",
  initiative: "Initiative: Ein Geschicklichkeitswurf, der bestimmt, wann du in der Reihenfolge eines Kampfes dran bist.",
};

export const SKILL_MAP = {
  athletics: "str",
  acrobatics: "dex",
  sleight_of_hand: "dex",
  stealth: "dex",
  arcana: "int",
  history: "int",
  investigation: "int",
  nature: "int",
  religion: "int",
  animal_handling: "wis",
  insight: "wis",
  medicine: "wis",
  perception: "wis",
  survival: "wis",
  deception: "cha",
  intimidation: "cha",
  performance: "cha",
  persuasion: "cha",
};

export const SKILL_NAMES_DE = {
  athletics: "Athletik",
  acrobatics: "Akrobatik",
  sleight_of_hand: "Fingerfertigkeit",
  stealth: "Heimlichkeit",
  arcana: "Arkanes Wissen",
  history: "Geschichte",
  investigation: "Nachforschungen",
  nature: "Naturkunde",
  religion: "Religion",
  animal_handling: "Tierkunde",
  insight: "Menschenkenntnis",
  medicine: "Heilkunde",
  perception: "Wahrnehmung",
  survival: "Überlebenskunst",
  deception: "Täuschung",
  intimidation: "Einschüchtern",
  performance: "Auftreten",
  persuasion: "Überzeugen",
};

export const SKILL_DESCRIPTIONS_DE = {
  athletics: "Stärke (Athletik) - Wurf für körperliche Anstrengungen wie Klettern, Springen oder Schwimmen.",
  acrobatics: "Geschicklichkeit (Akrobatik) - Wurf, um das Gleichgewicht zu halten, auf schmalen Graten zu balancieren oder Fesseln zu entkommen.",
  sleight_of_hand: "Geschicklichkeit (Fingerfertigkeit) - Wurf für Taschendiebstahl, das Verstecken von Gegenständen oder das Manipulieren von Schlössern.",
  stealth: "Geschicklichkeit (Heimlichkeit) - Wurf, um unbemerkt zu schleichen oder dich zu verstecken.",
  arcana: "Intelligenz (Arkanes Wissen) - Wurf, um dich an Wissen über Zauber, magische Gegenstände, Kreaturen oder die Ebenen zu erinnern.",
  history: "Intelligenz (Geschichte) - Wurf, um dich an Wissen über historische Ereignisse, legendäre Personen, Königreiche oder Kriege zu erinnern.",
  investigation: "Intelligenz (Nachforschungen) - Wurf, um Hinweise zu finden, Abzüge zu machen oder Rätsel zu lösen.",
  nature: "Intelligenz (Naturkunde) - Wurf, um dich an Wissen über Gelände, Pflanzen, Tiere oder das Wetter zu erinnern.",
  religion: "Intelligenz (Religion) - Wurf, um dich an Wissen über Gottheiten, Rituale, Kulte oder heilige Symbole zu erinnern.",
  animal_handling: "Weisheit (Tierkunde) - Wurf, um ein Tier zu beruhigen, seine Absichten zu lesen oder es zu kontrollieren.",
  insight: "Weisheit (Menschenkenntnis) - Wurf, um die wahren Absichten einer Kreatur zu erkennen oder eine Lüge zu durchschauen.",
  medicine: "Weisheit (Heilkunde) - Wurf, um einen Verwundeten zu stabilisieren, eine Krankheit zu diagnostizieren oder Verletzungen zu untersuchen.",
  perception: "Weisheit (Wahrnehmung) - Wurf, um verborgene Dinge zu sehen, zu hören oder zu riechen.",
  survival: "Weisheit (Überlebenskunst) - Wurf, um Spuren zu lesen, zu jagen, in der Wildnis zu navigieren oder Gefahren vorherzusehen.",
  deception: "Charisma (Täuschung) - Wurf, um die Wahrheit zu verschleiern, andere irrezuführen oder eine Verkleidung aufrechtzuerhalten.",
  intimidation: "Charisma (Einschüchtern) - Wurf, um andere durch Drohungen, feindselige Handlungen oder deine bloße Präsenz zu beeinflussen.",
  performance: "Charisma (Auftreten) - Wurf, um ein Publikum zu unterhalten, sei es durch Musik, Tanz, Schauspiel oder Geschichtenerzählen.",
  persuasion: "Charisma (Überzeugen) - Wurf, um andere durch Takt, Freundlichkeit oder gute Argumente zu beeinflussen.",
};

// --- Kern-Engine-Funktionen ---

/**
 * Berechnet den Modifikator für einen Attributswert.
 */
export const getAbilityModifier = (score) => {
  return Math.floor((score - 10) / 2);
};

/**
 * Gibt den Übungsbonus für ein gegebenes Level zurück.
 */
export const getProficiencyBonus = (level) => {
  if (level < 5) return 2;
  if (level < 9) return 3;
  if (level < 13) return 4;
  if (level < 17) return 5;
  return 6; // Stufe 17-20
};

/**
 * Holt den vom Spieler zugewiesenen Attributsbonus für ein Attribut.
 * Unterstützt sowohl fixe als auch floating Boni.
 */
export const getRacialAbilityBonus = (character, abilityKey) => {
  if (!character) return 0;
  let totalBonus = 0;
  if (
    character.ability_bonus_assignments &&
    character.ability_bonus_assignments[abilityKey]
  ) {
    totalBonus += character.ability_bonus_assignments[abilityKey];
  }
  return totalBonus;
};

/**
 * Holt die Startausrüstung basierend auf der Klasse.
 */
export const getStartingEquipment = (classKey) => {
  const classData = allClassData.find((c) => c.key === classKey);
  return classData ? classData.starting_equipment : [];
};

/**
 * Erstellt und weist die korrekte Klassen-Logik-Instanz einem Charakter zu.
 */
const assignClassLogic = (character) => {
  switch (character.classKey) {
    case 'barbarian':
      return new BarbarianLogic(character);
    case 'bard':
      return new BardLogic(character);
    case 'cleric':
      return new ClericLogic(character);
    case 'druid':
      return new DruidLogic(character);
    case 'fighter':
      return new FighterLogic(character);
    case 'monk':
      return new MonkLogic(character);
    case 'paladin':
      return new PaladinLogic(character);
    case 'ranger':
      return new RangerLogic(character);
    case 'rogue':
      return new RogueLogic(character);
    case 'sorcerer':
      return new SorcererLogic(character);
    case 'warlock':
      return new WarlockLogic(character);
    case 'wizard':
      return new WizardLogic(character);
    default:
      console.error(`Unbekannte classKey: ${character.classKey}.`);
      return null; 
  }
};

/**
 * ERSTELLT EINEN NEUEN CHARAKTER (Stufe 1)
 */
export const createCharacter = (
  name,
  raceData,
  classKey,
  backgroundData,
  abilities,
  abilityAssignments,
  portrait
) => {
  const classData = allClassData.find((c) => c.key === classKey);
  const conMod = getAbilityModifier(
    abilities.constitution +
      (abilityAssignments.constitution || 0)
  );

  let character = {
    id: `player_${new Date().getTime()}`,
    name: name,
    level: 1,
    experience: 0,
    classKey: classKey,
    subclass: null,
    race: raceData.key,
    background: backgroundData.key,
    abilities: {
      strength: abilities.strength + (abilityAssignments.strength || 0),
      dexterity: abilities.dexterity + (abilityAssignments.dexterity || 0),
      constitution: abilities.constitution + (abilityAssignments.constitution || 0),
      intelligence: abilities.intelligence + (abilityAssignments.intelligence || 0),
      wisdom: abilities.wisdom + (abilityAssignments.wisdom || 0),
      charisma: abilities.charisma + (abilityAssignments.charisma || 0),
    },
    ability_bonus_assignments: abilityAssignments,
    portrait: portrait,
    inventory: {},
    equipment: {},
    // (Skills, Proficiencies müssen hier von Rasse/Klasse/Hintergrund gesammelt werden)
    proficiencies: {
      skills: [...(backgroundData.skills || []), ...(classData.proficiencies.skills.from || [])], // (Vereinfacht, Auswahl fehlt)
      // (Weitere proficiencies...)
    },
  };

  // Klassen-Logik zuweisen
  character.classLogic = assignClassLogic(character);

  // HP-Berechnung
  const hpBonus = character.classLogic.getHitPointBonus ? character.classLogic.getHitPointBonus() : 0;
  const maxHp = classData.hit_die + conMod + hpBonus;
  
  character.hp = maxHp;
  character.maxHp = maxHp;

  // Ressourcen initialisieren
  character.resources = {
    concentration: { spellKey: null },
    rage_uses: { 
      current: character.classLogic.getMaxRageUses ? character.classLogic.getMaxRageUses(1) : 0, 
      max: character.classLogic.getMaxRageUses ? character.classLogic.getMaxRageUses(1) : 0
    },
    bardic_inspiration: {
      current: character.classLogic.getMaxInspirationUses ? character.classLogic.getMaxInspirationUses() : 0,
      max: character.classLogic.getMaxInspirationUses ? character.classLogic.getMaxInspirationUses() : 0
    },
    ki_points: {
      current: character.classLogic.getMaxKiPoints ? character.classLogic.getMaxKiPoints(1) : 0,
      max: character.classLogic.getMaxKiPoints ? character.classLogic.getMaxKiPoints(1) : 0
    },
    sorcery_points: {
      current: character.classLogic.getMaxSorceryPoints ? character.classLogic.getMaxSorceryPoints(1) : 0,
      max: character.classLogic.getMaxSorceryPoints ? character.classLogic.getMaxSorceryPoints(1) : 0
    },
    // (Weitere Ressourcen...)
  };

  // Zauberplätze und Features
  character.spellSlots = getSpellSlots(1, classData.caster_type);
  character.features = getFeaturesForLevel(1, classKey, null);

  return character;
};


// --- ZAUBERPLATZ-TABELLEN (Unverändert) ---
const FULL_CASTER_SLOTS = [
  { level: 1, slots: { 1: 2 } }, { level: 2, slots: { 1: 3 } }, { level: 3, slots: { 1: 4, 2: 2 } },
  { level: 4, slots: { 1: 4, 2: 3 } }, { level: 5, slots: { 1: 4, 2: 3, 3: 2 } }, { level: 6, slots: { 1: 4, 2: 3, 3: 3 } },
  { level: 7, slots: { 1: 4, 2: 3, 3: 3, 4: 1 } }, { level: 8, slots: { 1: 4, 2: 3, 3: 3, 4: 2 } },
  { level: 9, slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 } }, { level: 10, slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 } },
  { level: 11, slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 } }, { level: 12, slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 } },
  { level: 13, slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 } }, { level: 14, slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 } },
  { level: 15, slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 } }, { level: 16, slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 } },
  { level: 17, slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 1 } }, { level: 18, slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 1, 7: 1, 8: 1, 9: 1 } },
  { level: 19, slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 1, 8: 1, 9: 1 } }, { level: 20, slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 2, 8: 1, 9: 1 } }
];
const HALF_CASTER_SLOTS = [
  { level: 1, slots: {} }, { level: 2, slots: { 1: 2 } }, { level: 3, slots: { 1: 3 } },
  { level: 4, slots: { 1: 3 } }, { level: 5, slots: { 1: 4, 2: 2 } }, { level: 6, slots: { 1: 4, 2: 2 } },
  { level: 7, slots: { 1: 4, 2: 3 } }, { level: 8, slots: { 1: 4, 2: 3 } },
  { level: 9, slots: { 1: 4, 2: 3, 3: 2 } }, { level: 10, slots: { 1: 4, 2: 3, 3: 2 } },
  { level: 11, slots: { 1: 4, 2: 3, 3: 3 } }, { level: 12, slots: { 1: 4, 2: 3, 3: 3 } },
  { level: 13, slots: { 1: 4, 2: 3, 3: 3, 4: 1 } }, { level: 14, slots: { 1: 4, 2: 3, 3: 3, 4: 1 } },
  { level: 15, slots: { 1: 4, 2: 3, 3: 3, 4: 2 } }, { level: 16, slots: { 1: 4, 2: 3, 3: 3, 4: 2 } },
  { level: 17, slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 } }, { level: 18, slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 } },
  { level: 19, slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 } }, { level: 20, slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 } }
];
const THIRD_CASTER_SLOTS = [
  { level: 1, slots: {} }, { level: 2, slots: {} }, { level: 3, slots: { 1: 2 } },
  { level: 4, slots: { 1: 3 } }, { level: 5, slots: { 1: 3 } }, { level: 6, slots: { 1: 3 } },
  { level: 7, slots: { 1: 4, 2: 2 } }, { level: 8, slots: { 1: 4, 2: 2 } }, { level: 9, slots: { 1: 4, 2: 2 } },
  { level: 10, slots: { 1: 4, 2: 3 } }, { level: 11, slots: { 1: 4, 2: 3 } }, { level: 12, slots: { 1: 4, 2: 3 } },
  { level: 13, slots: { 1: 4, 2: 3, 3: 2 } }, { level: 14, slots: { 1: 4, 2: 3, 3: 2 } }, { level: 15, slots: { 1: 4, 2: 3, 3: 2 } },
  { level: 16, slots: { 1: 4, 2: 3, 3: 3 } }, { level: 17, slots: { 1: 4, 2: 3, 3: 3 } }, { level: 18, slots: { 1: 4, 2: 3, 3: 3 } },
  { level: 19, slots: { 1: 4, 2: 3, 3: 3, 4: 1 } }, { level: 20, slots: { 1: 4, 2: 3, 3: 3, 4: 1 } }
];
const PACT_MAGIC_SLOTS = [
  { level: 1, count: 1, slot_level: 1 }, { level: 2, count: 2, slot_level: 1 }, { level: 3, count: 2, slot_level: 2 },
  { level: 4, count: 2, slot_level: 2 }, { level: 5, count: 2, slot_level: 3 }, { level: 6, count: 2, slot_level: 3 },
  { level: 7, count: 2, slot_level: 4 }, { level: 8, count: 2, slot_level: 4 }, { level: 9, count: 2, slot_level: 5 },
  { level: 10, count: 2, slot_level: 5 }, { level: 11, count: 3, slot_level: 5 }, { level: 12, count: 3, slot_level: 5 },
  { level: 13, count: 3, slot_level: 5 }, { level: 14, count: 3, slot_level: 5 }, { level: 15, count: 3, slot_level: 5 },
  { level: 16, count: 3, slot_level: 5 }, { level: 17, count: 4, slot_level: 5 }, { level: 18, count: 4, slot_level: 5 },
  { level: 19, count: 4, slot_level: 5 }, { level: 20, count: 4, slot_level: 5 }
];

export const getSpellSlots = (level, casterType) => {
  let table;
  switch (casterType) {
    case 'full':
      table = FULL_CASTER_SLOTS;
      break;
    case 'half':
      table = HALF_CASTER_SLOTS;
      break;
    case 'third':
      table = THIRD_CASTER_SLOTS;
      break;
    case 'pact':
      table = PACT_MAGIC_SLOTS;
      const pactEntry = table.find((p) => p.level === level);
      return pactEntry ? { pact: { count: pactEntry.count, level: pactEntry.slot_level } } : {};
    default:
      return {};
  }
  const entry = table.find((p) => p.level === level);
  return entry ? entry.slots : {};
};

/**
 * Holt alle neuen Features für ein bestimmtes Level.
 */
export const getFeaturesForLevel = (level, classKey, subclassKey) => {
  const classData = allClassData.find((c) => c.key === classKey);
  if (!classData) return [];

  const features = [];
  const baseFeatures = classData.features.filter((f) => f.level === level);
  features.push(...baseFeatures.map(f => f.key)); 

  if (subclassKey) {
    const subclass = classData.subclasses.find((sc) => sc.key === subclassKey);
    if (subclass) {
      const subclassFeatures = subclass.features.filter((f) => f.level === level);
      features.push(...subclassFeatures.map(f => f.key));
    }
  }
  return features;
};

/**
 * PRÜFT, OB EIN STUFENAUFSTIEG VERFÜGBAR IST
 */
export const checkForLevelUp = (character) => {
  const nextLevel = (character.level || 0) + 1;
  const xpRequired = LEVEL_XP_TABLE[nextLevel];

  if (xpRequired && character.experience >= xpRequired) {
    console.log(`${character.name} kann auf Stufe ${nextLevel} aufsteigen!`);
    return { ...character, canLevelUp: true }; 
  }
  return character;
};

/**
 * FÜHRT EINEN STUFENAUFSTIEG DURCH
 */
export const levelUpCharacter = (character, choices = {}) => {
  const newLevel = character.level + 1;
  const classData = allClassData.find((c) => c.key === character.classKey);
  
  let newSubclassKey = character.subclass;
  const subclassChoiceLevel = classData.features.find(f => f.name.includes("Archetyp") || f.name.includes("Domäne") || f.name.includes("Zirkel"))?.level;
  if (newLevel === subclassChoiceLevel && choices.subclassKey) {
    newSubclassKey = choices.subclassKey;
  }

  const allNewFeatures = getFeaturesForLevel(newLevel, character.classKey, newSubclassKey);

  const conMod = getAbilityModifier(character.abilities.constitution);
  const hpBonusPerLevel = character.classLogic.getHitPointBonus ? character.classLogic.getHitPointBonus() : 0;
  const hpRoll = (classData.hit_die / 2 + 1); 
  const newHp = character.maxHp + hpRoll + conMod + hpBonusPerLevel;

  const newSlots = getSpellSlots(newLevel, classData.caster_type);

  // Aktualisiertes Charakter-Objekt
  const updatedCharacter = {
    ...character,
    level: newLevel,
    subclass: newSubclassKey,
    hp: newHp + (character.hp - character.maxHp), 
    maxHp: newHp,
    spellSlots: newSlots,
    canLevelUp: false, 
    features: [
      ...(character.features || []), 
      ...allNewFeatures            
    ],
    // Ressourcen-Maximalwerte aktualisieren
    resources: {
      ...character.resources,
      rage_uses: { 
        ...character.resources.rage_uses,
        max: character.classLogic.getMaxRageUses ? character.classLogic.getMaxRageUses(newLevel) : 0
      },
      bardic_inspiration: {
        ...character.resources.bardic_inspiration,
        max: character.classLogic.getMaxInspirationUses ? character.classLogic.getMaxInspirationUses() : 0 
      },
      ki_points: {
        ...character.resources.ki_points,
        max: character.classLogic.getMaxKiPoints ? character.classLogic.getMaxKiPoints(newLevel) : 0
      },
      sorcery_points: {
        ...character.resources.sorcery_points,
        max: character.classLogic.getMaxSorceryPoints ? character.classLogic.getMaxSorceryPoints(newLevel) : 0
      },
    }
  };

  return checkForLevelUp(updatedCharacter);
};

/**
 * VERGIBT ERFAHRUNGSPUNKTE (für die ganze Gruppe)
 */
export const grantExperienceToParty = (party, defeatedEnemies) => {
  const totalXp = defeatedEnemies.reduce(
    (sum, enemy) => sum + (enemy.xp || 0),
    0
  );
  if (totalXp === 0) return party;

  const partySize = party.length;
  if (partySize === 0) return party;

  const xpPerMember = Math.floor(totalXp / partySize);
  if (xpPerMember === 0) return party;

  console.log(`Die Gruppe erhält ${totalXp} EP (${xpPerMember} pro Mitglied).`);

  const updatedParty = party.map((character) => {
    const updatedChar = {
      ...character,
      experience: (character.experience || 0) + xpPerMember,
    };
    return checkForLevelUp(updatedChar);
  });

  return updatedParty;
};

/**
 * GIBT EINEM CHARAKTER EP
 */
export const grantExperience = (character, amount) => {
  const updatedCharacter = {
    ...character,
    experience: (character.experience || 0) + amount,
  };
  return checkForLevelUp(updatedCharacter);
};