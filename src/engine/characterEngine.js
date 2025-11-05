import allArmor from "../data/items/armor.json";
import allClassData from "../data/classes.json";
import { LEVEL_XP_TABLE } from "../utils/helpers";

// --- IMPORTS FÜR ALLE 12 KLASSEN ---
import * as barbarianLogic from "./classLogic/barbarian.js";
import * as monkLogic from "./classLogic/monk.js";
import * as fighterLogic from "./classLogic/fighter.js";
import * as wizardLogic from "./classLogic/wizard.js";
import * as clericLogic from "./classLogic/cleric.js";
import * as rogueLogic from "./classLogic/rogue.js";
import * as paladinLogic from "./classLogic/paladin.js";
import * as rangerLogic from "./classLogic/ranger.js";
import * as bardLogic from "./classLogic/bard.js";
import * as druidLogic from "./classLogic/druid.js";
import * as sorcererLogic from "./classLogic/sorcerer.js";
import * as warlockLogic from "./classLogic/warlock.js";
// (Alle Klassen sind importiert)

/**
 * (NEU) Ein Mapping, das Klassen-Keys den importierten Logik-Modulen zuweist.
 * Dies ist das Herzstück unseres modularen Ansatzes.
 */
const classLogics = {
  barbarian: barbarianLogic,
  monk: monkLogic,
  fighter: fighterLogic,
  wizard: wizardLogic,
  cleric: clericLogic,
  rogue: rogueLogic,
  paladin: paladinLogic,
  ranger: rangerLogic,
  bard: bardLogic,
  druid: druidLogic,
  sorcerer: sorcererLogic,
  warlock: warlockLogic,
};

/**
 * (NEU) Holt das richtige Logikmodul für die Klasse eines Charakters.
 * @param {string} classKey - Der Key der Klasse (z.B. "barbarian").
 * @returns {object | null} - Das importierte Modul oder null, falls nicht gefunden.
 */
const getClassLogicModule = (classKey) => {
  // `classKey` kann ein Objekt (aus character creation) oder ein String (aus Savegame) sein
  const key = typeof classKey === 'object' ? classKey.key : classKey;
  return classLogics[key] || null;
};

// --- BESTEHENDE FUNKTIONEN (Unverändert) ---

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
  // *** 2. KORRIGIERT (D&D 5e geht bis +6) ***
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

  // Fixe Boni (z.B. bei Menschen)
  if (
    character.ability_bonus_assignments &&
    character.ability_bonus_assignments[abilityKey]
  ) {
    totalBonus += character.ability_bonus_assignments[abilityKey];
  }

  // Floating Boni (z.B. bei Halbelfen)
  if (
    character.race?.ability_bonuses?.floating &&
    character.floating_bonus_assignments
  ) {
    const floatingBonuses = character.race.ability_bonuses.floating;
    const bonusIndex = character.floating_bonus_assignments[abilityKey];

    if (bonusIndex !== undefined && floatingBonuses[bonusIndex] !== undefined) {
      totalBonus += floatingBonuses[bonusIndex];
    }
  }

  return totalBonus;
};

/**
 * Berechnet die maximalen Lebenspunkte auf Stufe 1.
 * (Unverändert - wird bei Charaktererstellung genutzt)
 */
export const calculateInitialHP = (character) => {
  if (!character.class || !character.race) return 0;

  const finalCon =
    character.abilities.con + getRacialAbilityBonus(character, "con");
  const conModifier = getAbilityModifier(finalCon);
  let hp = character.class.hit_die + conModifier;

  if (character.subrace?.key === "hill-dwarf") {
    hp += 1;
  }
  return hp;
};

// --- NEUE STAT-PIPELINE FUNKTIONEN ---

/**
 * (NEU) Berechnet die Basis-Stats eines Charakters.
 * (Basis-Attribute + Rassenboni), aber *vor* Klassen-Features oder Ausrüstung.
 * @param {object} character - Das Charakterobjekt.
 * @returns {object} - Ein Objekt mit den berechneten Basis-Stats.
 */
const calculateBaseStats = (character) => {
  const abilities = {
    strength: character.abilities.str + getRacialAbilityBonus(character, "str"),
    dexterity: character.abilities.dex + getRacialAbilityBonus(character, "dex"),
    constitution: character.abilities.con + getRacialAbilityBonus(character, "con"),
    intelligence: character.abilities.int + getRacialAbilityBonus(character, "int"),
    wisdom: character.abilities.wis + getRacialAbilityBonus(character, "wis"),
    charisma: character.abilities.cha + getRacialAbilityBonus(character, "cha"),
  };

  return {
    ...abilities,
    // Standard-AC ist 10 + Geschicklichkeits-Modifikator
    armorClass: 10 + getAbilityModifier(abilities.dexterity),
    // Standard-Geschwindigkeit (Annahme: 9 Meter, Rassenboni fehlen noch)
    speed: 9, 
    initiativeBonus: getAbilityModifier(abilities.dexterity),
    initiativeAdvantage: false,
  };
};

/**
 * (NEU) Berechnet die finalen, modifizierten Stats eines Charakters.
 * Dies ist die zentrale "Dirigenten"-Funktion, die alle Modifikatoren anwendet.
 * @param {object} character - Das Charakterobjekt.
 * @returns {object} - Das finale Stats-Objekt.
 */
export const calculateFinalStats = (character) => {
  if (!character || !character.abilities || !character.class) {
    console.error("calculateFinalStats: Charakter-Objekt ist unvollständig.", character);
    return calculateBaseStats(character || {}); // Fallback
  }

  // 1. Beginne mit Basis-Stats (Attribute + Rassenboni)
  let stats = calculateBaseStats(character);

  // 2. (Platzhalter) Attributssteigerungen (ASI) vom Level-Up anwenden
  // stats = applyAbilityScoreIncreases(character, stats);

  // 3. KLASSENLOGIK ANWENDEN (Passive Stats)
  // Holt das Modul (z.B. barbarian.js) und ruft dessen Funktion auf.
  const logicModule = getClassLogicModule(character.class);
  if (logicModule && logicModule.applyPassiveStatModifiers) {
    stats = logicModule.applyPassiveStatModifiers(character, stats);
  }

  // 4. (Platzhalter) AUSRÜSTUNG MODIFIKATOREN (z.B. +1 Schwert)
  // stats = applyEquipmentModifiers(character, stats);

  // 5. (Platzhalter) Temporäre Effekte (Buffs/Debuffs) anwenden
  // stats = applyTemporaryEffects(character, stats);

  return stats;
};

// --- MODIFIZIERTE BESTEHENDE FUNKTIONEN (Nutzen jetzt die Stat-Pipeline) ---

/**
 * Berechnet die Rüstungsklasse (AC) nach 5e-Regeln.
 * (MODIFIZIERT, um Druiden-Restriktion und Kampfstil "Verteidigung" zu nutzen)
 * @param {object} character - Das zentrale Charakter-Objekt.
 * @returns {number} - Die finale Rüstungsklasse.
 */
export const calculateAC = (character) => {
  if (!character || !character.abilities || !character.class) {
    return 10; // Fallback
  }

  // 1. Hol alle finalen Stats (Attribute, passive ACs, Flags wie 'armorRestriction' und 'fightingStyle')
  const finalStats = calculateFinalStats(character);
  const dexModifier = getAbilityModifier(finalStats.dexterity);

  // 2. Ausrüstung
  const equippedArmor = character.equipment?.armor;
  const equippedShield = character.equipment?.["off-hand"] || character.equipment?.shield;

  // 3. Druiden-Restriktion
  const isDruidRestricted = (finalStats.armorRestriction === "no_metal_armor");

  // 4. Schild-Bonus berechnen
  let shieldBonus = 0;
  if (equippedShield && (equippedShield.type === "shield" || equippedShield.slot === "off-hand" || equippedShield.ac > 0)) {
      // Prüfen, ob das Schild aus Metall ist (Annahme: Item-Daten haben `material: "metal"` oder wir prüfen den Namen)
      const isShieldMetal = (equippedShield.material === 'metal') || 
                            equippedShield.name.toLowerCase().includes('metall') || 
                            equippedShield.name.toLowerCase().includes('stahl');
      
      // Wenn der Druide kein Metallschild tragen darf
      if (!(isDruidRestricted && isShieldMetal)) {
          shieldBonus = equippedShield.ac || 2;
      }
  }

  // 5. Basis-AC bestimmen (Rüstung vs. Passiv)
  // Beginnt mit der besten passiven AC (z.B. 10+Dex, 10+Dex+Con, 13+Dex)
  let calculatedAC = finalStats.armorClass; 

  if (equippedArmor) {
      // Rüstung ist ausgerüstet
      const armorName = equippedArmor.name.toLowerCase();
      // Annahme: `material: "metal"` oder Namensprüfung
      const isArmorMetal = (
          equippedArmor.material === 'metal' ||
          armorName.includes("kettenhemd") ||
          armorName.includes("schuppenpanzer") ||
          armorName.includes("brustplatte") ||
          armorName.includes("halbplatten") ||
          armorName.includes("plattenpanzer") ||
          armorName.includes("kettenrüstung")
      );

      // WENN Druide UND Metallrüstung, *ignoriere* die Rüstung.
      // `calculatedAC` bleibt die passive AC (10+Dex).
      if (!(isDruidRestricted && isArmorMetal)) {
          // Rüstung darf getragen werden
          let armorBaseAC = equippedArmor.ac;
          let armorDexBonus = 0;

          // (Nutzt deine Logik aus der Originaldatei)
          if (armorName.includes("leder") || armorName.includes("wams") || armorName.includes("elfen-kettenrüstung")) { // Leicht
              armorDexBonus = dexModifier;
          } else if (armorName.includes("kettenhemd") || armorName.includes("schuppenpanzer") || armorName.includes("brustplatte") || armorName.includes("halbplatten")) { // Mittel
              armorDexBonus = Math.min(dexModifier, 2);
          }
          // (Schwere Rüstung = 0 Dex)

          const armorAC = armorBaseAC + armorDexBonus;
          
          // Nimm den höheren Wert (Rüstung ODER passive AC)
          calculatedAC = Math.max(calculatedAC, armorAC);
      }
  }

  // 6. Kampfstil "Verteidigung" anwenden
  // (Wird von fighter.js/ranger.js in finalStats.fightingStyle gesetzt)
  if (finalStats.fightingStyle === 'defense' && equippedArmor) {
      calculatedAC += 1;
  }
  
  // 7. Schild addieren (wurde bereits auf Druiden-Kompatibilität geprüft)
  return calculatedAC + shieldBonus;
};


// --- BESTEHENDE KONSTANTEN (Unverändert) ---

// Eine Zuordnung aller Fertigkeiten zu ihren Hauptattributen
export const SKILL_MAP = {
  acrobatics: "dex",
  animal_handling: "wis",
  arcana: "int",
  athletics: "str",
  deception: "cha",
  history: "int",
  insight: "wis",
  intimidation: "cha",
  investigation: "int",
  medicine: "wis",
  nature: "int",
  perception: "wis",
  performance: "cha",
  persuasion: "cha",
  religion: "int",
  sleight_of_hand: "dex",
  stealth: "dex",
  survival: "wis",
};

// Deutsche Namen für die Anzeige
export const SKILL_NAMES_DE = {
  acrobatics: "Akrobatik",
  animal_handling: "Tierkunde",
  arcana: "Arkanum",
  athletics: "Athletik",
  deception: "Täuschung",
  history: "Geschichte",
  insight: "Einblick",
  intimidation: "Einschüchtern",
  investigation: "Nachforschungen",
  medicine: "Medizin",
  nature: "Naturkunde",
  perception: "Wahrnehmung",
  performance: "Darbietung",
  persuasion: "Überzeugen",
  religion: "Religion",
  sleight_of_hand: "Fingerfertigkeit",
  stealth: "Heimlichkeit",
  survival: "Überlebenskunst",
};

// --- BESTEHENDE FUNKTIONEN (Angepasst oder Unverändert) ---

/**
 * Prüft, ob ein Charakter in einer Fertigkeit geübt ist.
 * (Unverändert)
 */
export const isProficientInSkill = (character, skillKey) => {
  const {
    race,
    class: charClass,
    background,
    skill_proficiencies_choice,
  } = character;

  // 1. Übung durch Hintergrund
  if (
    background.skill_proficiencies
      .map((s) => s.toLowerCase())
      .includes(SKILL_NAMES_DE[skillKey].toLowerCase())
  ) {
    return true;
  }
  // 2. Übung durch Volk (z.B. Elfen in Wahrnehmung)
  if (
    race.traits.some(
      (trait) => trait.name === "Geschärfte Sinne" && skillKey === "perception"
    )
  ) {
    return true;
  }
  // 3. Übung durch die Klassen-Auswahl
  if (
    skill_proficiencies_choice &&
    skill_proficiencies_choice.includes(skillKey)
  ) {
    return true;
  }

  return false;
};


/**
 * Berechnet den finalen Bonus für eine bestimmte Fertigkeit.
 * (MODIFIZIERT, um Expertise (Schurke/Barde) und Hansdampf (Barde) zu unterstützen)
 */
export const calculateSkillBonus = (character, skillKey) => {
  // 1. Hol die finalen Stats (beinhaltet Rasse, ASI, Klassen-Features)
  const finalStats = calculateFinalStats(character);

  const abilityKey = SKILL_MAP[skillKey];
  if (!abilityKey) return 0; // Failsafe

  // 2. Nutze den korrekten Attributs-Key (str, dex, con etc.)
  const shortAbilityKey = abilityKey.substring(0, 3);
  
  // 3. Hol den finalen Wert aus den Stats
  const finalAbilityScore = finalStats[shortAbilityKey];
  const modifier = getAbilityModifier(finalAbilityScore);

  // 4. Hol den Übungsbonus
  const proficiencyBonus = getProficiencyBonus(character.level || 1);
  
  // 5. Prüfe auf Übung
  const isProficient = isProficientInSkill(character, skillKey);

  if (isProficient) {
    // 6. PRÜFE AUF EXPERTISE (Schurke, Barde)
    // (finalStats.expertiseSkills wird von rogue.js/bard.js bereitgestellt)
    if (finalStats.expertiseSkills && finalStats.expertiseSkills.includes(skillKey)) {
      // Doppelter Übungsbonus
      return modifier + (proficiencyBonus * 2);
    } else {
      // Normaler Übungsbonus
      return modifier + proficiencyBonus;
    }
  } else {
    // 7. PRÜFE AUF HANSDAMPF (Barde)
    // (finalStats.jackOfAllTrades wird von bard.js bereitgestellt)
    if (finalStats.jackOfAllTrades) {
      // Halber Übungsbonus (abgerundet)
      return modifier + Math.floor(proficiencyBonus / 2);
    } else {
      // Kein Bonus
      return modifier;
    }
  }
}; // Refaktoriert

/**
 * (WIEDERHERGESTELLT) Berechnet den Nahkampfschaden als String für die Anzeige.
 * (STARK MODIFIZIERT, um Finesse/Mönch-Logik zu nutzen)
 */
export const calculateMeleeDamage = (character) => {
  const finalStats = calculateFinalStats(character);
  const mainHandWeapon = character.equipment["main-hand"];

  // 1. Bestimme das korrekte Attribut (STR oder DEX)
  const [attributeKey, attributeModifier] = getBestAttackAttribute(character, mainHandWeapon, finalStats);
  
  // 2. Bestimme Schadenswürfel
  let damage = "1"; // Standard (waffenlos)
  let isMonkUnarmed = false;
  
  // Mönch: Unbewaffneter Schlag
  if (character.class.key === 'monk' && !mainHandWeapon) {
      // (Annahme: Mönch-Schadenstabelle muss hier implementiert werden)
      // z.B. 1d4 auf Lvl 1, 1d6 auf Lvl 5...
      damage = "1d4"; // Platzhalter für Mönch Lvl 1
      isMonkUnarmed = true;
  }
  // Mönch: Mönchswaffe
  else if (character.class.key === 'monk' && isMonkWeapon(mainHandWeapon)) {
      damage = mainHandWeapon.damage;
      // (Hier müsste die Logik rein, die den Waffenschaden mit dem
      // unbewaffneten Schaden des Mönchs vergleicht und den höheren nimmt)
  }
  // Normale Waffe
  else if (mainHandWeapon && mainHandWeapon.damage) {
      damage = mainHandWeapon.damage;
      // (Vielseitig-Logik bleibt erhalten)
      const versatileProperty = mainHandWeapon.properties?.find((p) =>
          p.startsWith("Vielseitig")
      );
      if (versatileProperty && mainHandWeapon.isTwoHanded) {
          const twoHandedDamage = versatileProperty.match(/\((.*?)\)/)?.[1];
          if (twoHandedDamage) {
              damage = twoHandedDamage;
          }
      }
  }

  // 3. Füge Modifikator hinzu (außer bei waffenlosem Schlag, der KEIN Mönch ist)
  let modifierString = "";
  if (attributeModifier > 0) {
      modifierString = `+${attributeModifier}`;
  } else if (attributeModifier < 0) {
      modifierString = attributeModifier.toString();
  }
  
  // Standard-waffenloser Schlag (Nicht-Mönch) erhält *keinen* Modifikator auf den Schaden (1 + 0)
  if (!mainHandWeapon && !isMonkUnarmed) {
      return "1"; 
  }

  return `${damage}${modifierString}`;
};

/**
 * (NEU) Interne Hilfsfunktion: Prüft, ob eine Waffe eine Mönchswaffe ist.
 * (Basierend auf D&D 5e-Regeln)
 */
const isMonkWeapon = (weapon) => {
    if (!weapon) return false;
    // 1. Kurzschwerter sind Mönchswaffen
    if (weapon.key === 'shortsword') return true; // (Annahme: key)
    
    // 2. Einfache Nahkampfwaffen
    // (Annahme: `weapon.category === 'simple'` und `weapon.type === 'melee_weapon'`)
    if (weapon.category === 'simple' && weapon.type === 'melee_weapon') {
        // ...die nicht zweihändig oder schwer sind
        if (!weapon.properties?.includes('two_handed') && !weapon.properties?.includes('heavy')) {
            return true;
        }
    }
    return false;
};

/**
 * (NEU) Interne Hilfsfunktion: Ermittelt das beste Attribut (STR vs DEX) und dessen Modifikator.
 * @returns {[string, number]} - z.B. ["dexterity", 4]
 */
const getBestAttackAttribute = (character, weapon, finalStats) => {
    const strMod = getAbilityModifier(finalStats.strength);
    const dexMod = getAbilityModifier(finalStats.dexterity);

    // 1. Fernkampfwaffen nutzen *immer* DEX
    // (Annahme: `weapon.type === 'ranged_weapon'`)
    if (weapon && weapon.type === 'ranged_weapon') {
        return ['dexterity', dexMod];
    }
    
    // 2. Finesse-Waffen nutzen den HÖHEREN Wert
    // (Annahme: `weapon.properties` ist ein Array)
    if (weapon && weapon.properties?.includes('finesse')) {
        if (dexMod > strMod) {
            return ['dexterity', dexMod];
        } else {
            return ['strength', strMod];
        }
    }
    
    // 3. Mönche nutzen den HÖHEREN Wert für unbewaffnete Schläge oder Mönchswaffen
    if (character.class.key === 'monk' && (!weapon || isMonkWeapon(weapon))) {
        if (dexMod > strMod) {
            return ['dexterity', dexMod];
        } else {
            return ['strength', strMod];
        }
    }

    // 4. Standard: Alle anderen Nahkampfangriffe nutzen STR
    return ['strength', strMod];
};


/**
 * (NEU) Ermittelt die Modifikatoren für einen Angriffswurf.
 * (STARK MODIFIZIERT, um Finesse/Mönch/Fernkampf zu nutzen)
 */
export const getAttackModifiers = (character, weapon, target) => {
  const finalStats = calculateFinalStats(character);
  const proficiencyBonus = getProficiencyBonus(character.level || 1);

  // 1. Bestimme das korrekte Attribut (STR oder DEX)
  const [attributeKey, attributeModifier] = getBestAttackAttribute(character, weapon, finalStats);
  
  // 2. Prüfe auf Übung
  // (Annahme: Charakter ist mit ausgerüsteter Waffe geübt. Muss erweitert werden)
  const isProficient = true; 
  let bonus = attributeModifier;
  if (isProficient) {
    bonus += proficiencyBonus;
  }
  
  // (Waldläufer-Kampfstil "Bogenschießen")
  if (finalStats.fightingStyle === 'archery' && weapon?.type === 'ranged_weapon') {
      bonus += 2;
  }
  
  // 3. Initialisiere das Wurf-Objekt
  let rollData = {
    bonus: bonus,
    advantage: false,
    disadvantage: false,
  };

  // 4. Konsultiere die Klassenmodule (z.B. Tollkühner Angriff)
  const eventData = {
    type: 'before_attack_roll',
    target: target,
    weapon: weapon,
    attackType: (attributeKey === 'strength' ? 'melee_weapon_str' : 'melee_weapon_dex'), // Hilfsinformation für Barbar
    // `askForReckless` signalisiert der UI, den Barbaren zu fragen.
    askForReckless: (character.class.key === 'barbarian' && character.level >= 2)
  };

  const modifiedEvent = dispatchGameEvent('before_attack_roll', eventData, character);

  // 5. Wende die Ergebnisse des Events an
  if (modifiedEvent.advantage) {
    rollData.advantage = true;
  }
  if (modifiedEvent.disadvantage) {
    rollData.disadvantage = true;
  }

  return rollData;
};

// =================================================================
// --- HIER IST DIE 2. ÄNDERUNG ---
// (Signatur von `calculateAttackDamage` angepasst, um `rollData` und `gameState`
//  für "Hinterhältiger Angriff" zu übergeben)
// =================================================================

/**
 * (NEU) Berechnet den finalen Schaden für einen erfolgreichen Treffer.
 * (STARK MODIFIZIERT, um Finesse/Mönch-Schaden und flachen Bonusschaden zu nutzen)
 * @param {object} character - Der angreifende Charakter.
 * @param {object} weapon - Die Waffe (oder null für 'unbewaffnet').
 * @param {object} target - Das Ziel.
 * @param {boolean} isCritical - Ob der Treffer ein kritischer Treffer ist.
 * @param {object} rollData - (NEU) Das Ergebnis von `getAttackModifiers` (enthält { advantage: bool }).
 * @param {object} gameState - (NEU) Der aktuelle Spielstatus (enthält Positionen).
 * @returns {object} - { totalDamage: number, damageType: string, canSmite: boolean }
 */
export const calculateAttackDamage = (character, weapon, target, isCritical, rollData = {}, gameState = {}) => {
  const finalStats = calculateFinalStats(character);
  
  // 1. Basis-Schaden und Attribut
  const [attributeKey, attributeModifier] = getBestAttackAttribute(character, weapon, finalStats);
  let damageFormula = "1"; // Waffenloser Schlag
  let isMonkUnarmed = false;

  // Mönch: Unbewaffneter Schlag
  if (character.class.key === 'monk' && !weapon) {
      damageFormula = "1d4"; // Platzhalter
      isMonkUnarmed = true;
  }
  // Mönch: Mönchswaffe
  else if (character.class.key === 'monk' && isMonkWeapon(weapon)) {
      damageFormula = weapon.damage;
      // (Vergleichslogik Waffe vs. Kampfkunstwürfel fehlt noch)
  }
  // Normale Waffe
  else if (weapon && weapon.damage) {
      damageFormula = weapon.damage;
      // (Vielseitig-Logik)
      const versatileProperty = weapon.properties?.find((p) => p.startsWith("Vielseitig"));
      if (versatileProperty && weapon.isTwoHanded) {
          const twoHandedDamage = versatileProperty.match(/\((.*?)\)/)?.[1];
          if (twoHandedDamage) damageFormula = twoHandedDamage;
      }
  }

  // 2. Würfle den Basisschaden
  let baseDamage = rollDiceFormula(damageFormula);
  
  // Füge Modifikator hinzu (außer bei Standard-waffenlos)
  if (weapon || isMonkUnarmed) {
      baseDamage += attributeModifier;
  }

  if (isCritical) {
      baseDamage += rollDiceFormula(damageFormula.split(/[+-]/)[0]); // Nur Würfel verdoppeln
  }

  // 3. Sammle alle passiven Boni und Reaktionen über ein Event
  const attackType = (weapon?.type === 'ranged_weapon' ? 'ranged_weapon' : 
                     (attributeKey === 'strength' ? 'melee_weapon_str' : 'melee_weapon_dex'));
                     
  const eventData = {
    type: 'attack_hit',
    target: target,
    weapon: weapon,
    isCritical: isCritical,
    attacker: character.id, 
    attackType: attackType, // Wichtig für Barbar
    rollData: rollData,     // <-- HINZUGEFÜGT (für Hinterhältiger Angriff)
    gameState: gameState,   // <-- HINZUGEFÜGT (für Hinterhältiger Angriff)
    
    // `askForSmite` signalisiert der UI, den Paladin zu fragen.
    askForSmite: (character.class.key === 'paladin' && character.level >= 2),
    // `askForSneakAttack` (falls optional, oft automatisch)
    askForSneakAttack: (character.class.key === 'rogue' && character.level >= 1)
  };

  const modifiedEvent = dispatchGameEvent('attack_hit', eventData, character);
  
  // 4. Addiere alle Boni aus dem Event
  let bonusDamageDice = 0; // Schaden, der gewürfelt wird (z.B. Smite, Sneak)
  let flatBonusDamage = 0; // Flacher Schaden (z.B. Rage)

  if (modifiedEvent.bonusDamage) {
      // (z.B. Koloss-Töter, Göttlicher Schlag, Hinterhältiger Angriff)
      bonusDamageDice += rollDiceFormula(modifiedEvent.bonusDamage);
      if (isCritical && modifiedEvent.bonusDamageCrit) {
          bonusDamageDice += rollDiceFormula(modifiedEvent.bonusDamageCrit);
      }
  }
  
  // (NEUE HINZUFÜGUNG FÜR KAMPFRAUSCH)
  if (modifiedEvent.flatBonusDamage) {
      flatBonusDamage += modifiedEvent.flatBonusDamage;
      // (Flacher Schaden wird normalerweise nicht bei Crit verdoppelt)
  }

  // 5. Verarbeite optionale Reaktionen
  const canSmite = modifiedEvent.canReact === 'divine_smite';
  const canSneakAttack = modifiedEvent.canReact === 'sneak_attack'; 
  
  return {
      totalDamage: baseDamage + bonusDamageDice + flatBonusDamage,
      damageType: weapon?.damage_type || 'bludgeoning',
      canSmite: canSmite,
      canSneakAttack: canSneakAttack,
  };
};


// --- BESTEHENDE KONSTANTEN (Unverändert) ---

export const ABILITY_DESCRIPTIONS_DE = {
  str: "Stärke: Misst die körperliche Kraft. Wichtig für Nahkampfangriffe und Athletik.",
  dex: "Geschicklichkeit: Misst die Agilität, Reflexe und Balance. Wichtig für Rüstungsklasse, Fernkampfangriffe und Akrobatik.",
  con: "Konstitution: Misst die Ausdauer und Lebenskraft. Bestimmt die Trefferpunkte und Widerstandsfähigkeit.",
  int: "Intelligenz: Misst die geistige Schärfe, Gedächtnis und logisches Denken. Wichtig für arkane Magie und Nachforschungen.",
  wis: "Weisheit: Misst die Wahrnehmung, Intuition und Willenskraft. Wichtig für göttliche Magie, Wahrnehmung und Einblick.",
  cha: "Charisma: Misst die Überzeugungskraft, Persönlichkeit und Führungsstärke. Wichtig für soziale Interaktion und einige Magieformen.",
};

export const COMBAT_STATS_DESCRIPTIONS_DE = {
  ac: "Gibt an, wie schwer es ist, dich im Kampf zu treffen. Basiert auf 10 + deinem Geschicklichkeits-Modifikator. Rüstung und Schilde können diesen Wert erhöhen.",
  hp: "Deine Lebensenergie. Erreicht sie 0, bist du kampfunfähig. Basiert auf dem Trefferwürfel deiner Klasse und deinem Konstitutions-Modifikator.",
  proficiency:
    "Ein Bonus, den du auf alle Würfe addierst, in denen du geübt bist (Angriffe, Fertigkeiten, etc.). Er steigt mit deinem Charakterlevel an.",
};

export const SKILL_DESCRIPTIONS_DE = {
  acrobatics:
    "Akrobatik (Geschicklichkeit): Die Fähigkeit, auf den Beinen zu bleiben, Sprünge zu meistern und akrobatische Manöver auszuführen.",
  animal_handling:
    "Tierkunde (Weisheit): Die Fähigkeit, Tiere zu beruhigen, zu verstehen und zu kontrollieren.",
  arcana:
    "Arkanum (Intelligenz): Das Wissen über Magie, magische Kreaturen, Zauber und arkane Symbole.",
  athletics:
    "Athletik (Stärke): Die Fähigkeit, zu klettern, springen, schwimmen und körperliche Kraft anzuwenden.",
  deception:
    "Täuschung (Charisma): Die Fähigkeit, die Wahrheit zu verbergen, sei es durch Lügen, Verkleidung oder Ablenkung.",
  history:
    "Geschichte (Intelligenz): Das Wissen über historische Ereignisse, legendäre Personen und vergangene Zivilisationen.",
  insight:
    "Einblick (Weisheit): Die Fähigkeit, die wahren Absichten einer Kreatur durch Körpersprache und Verhalten zu erkennen.",
  intimidation:
    "Einschüchtern (Charisma): Die Fähigkeit, andere durch Drohungen, feindselige Handlungen und körperliche Präsenz zu beeinflussen.",
  investigation:
    "Nachforschungen (Intelligenz): Die Fähigkeit, nach Hinweisen zu suchen, Schlussfolgerungen zu ziehen und Details zu analysieren.",
  medicine:
    "Medizin (Weisheit): Die Fähigkeit, Verletzungen zu stabilisieren, Krankheiten zu diagnostizieren und Wunden zu behandeln.",
  nature:
    "Naturkunde (Intelligenz): Das Wissen über Gelände, Pflanzen, Tiere und das Wetter.",
  perception:
    "Wahrnehmung (Weisheit): Die Fähigkeit, etwas zu sehen, zu hören, zu riechen oder auf andere Weise wahrzunehmen.",
  performance:
    "Darbietung (Charisma): Die Fähigkeit, ein Publikum durch Musik, Tanz, Schauspiel oder eine andere Form der Unterhaltung zu fesseln.",
  persuasion:
    "Überzeugen (Charisma): Die Fähigkeit, andere durch Takt, Freundlichkeit und gute Argumente zu beeinflussen.",
  religion:
    "Religion (Intelligenz): Das Wissen über Gottheiten, religiöse Riten, heilige Symbole und die Ebenen der Existenz.",
  sleight_of_hand:
    "Fingerfertigkeit (Geschicklichkeit): Die Fähigkeit, Taschendiebstahl zu begehen, Schlösser zu knacken und andere manuelle Tricks auszuführen.",
  stealth:
    "Heimlichkeit (Geschicklichkeit): Die Fähigkeit, sich ungesehen und ungehört an anderen vorbeizuschleichen.",
  survival:
    "Überlebenskunst (Weisheit): Die Fähigkeit, Spuren zu lesen, in der Wildnis zu jagen, Gefahren zu vermeiden und den Weg zu finden.",
};

// --- NEUE/WIEDERHERGESTELLTE FUNKTIONEN AB HIER ---
// (Unverändert)

/**
 * HILFSFUNKTION: Würfelt eine Würfelformel (z.B. "1d8" oder "1d10+2").
 */
export const rollDiceFormula = (formula) => {
  let total = 0;
  
  if (!formula || typeof formula !== 'string') {
      console.error("Ungültige Würfelformel:", formula);
      return 0;
  }
  
  const parts = formula.split(/([+-])/); // Trennt nach + oder -

  // Würfel-Teil (z.B. "1d8")
  const dicePart = parts[0];
  const [numDiceStr, numSidesStr] = dicePart.split("d");
  const numDice = parseInt(numDiceStr, 10) || 1;
  const numSides = parseInt(numSidesStr, 10);

  if (!isNaN(numSides)) {
    for (let i = 0; i < numDice; i++) {
      total += Math.floor(Math.random() * numSides) + 1;
    }
  } else {
    // Falls es kein Würfelwurf ist, sondern nur eine Zahl (z.B. "1")
    total += parseInt(dicePart, 10) || 0;
  }

  // Bonus-Teil (z.B. "+2" oder "-1")
  if (parts[1] && parts[2]) {
    const operator = parts[1];
    const bonus = parseInt(parts[2], 10);
    if (!isNaN(bonus)) {
      if (operator === "+") {
        total += bonus;
      } else if (operator === "-") {
        total -= bonus;
      }
    }
  }

  return total;
}; // Leicht verbessert für "1" (waffenlos)

/**
 * HILFSFUNKTION: Ermittelt die HP-Würfelformel für den Stufenaufstieg.
 * (MODIFIZIERT, um `calculateFinalStats` zu nutzen)
 */
const getHpRollFormula = (character) => {
  // 1. Hol die finalen Stats
  const finalStats = calculateFinalStats(character);
  // 2. Hol den finalen CON-Modifikator
  const conMod = getAbilityModifier(finalStats.constitution);
  
  const hitDie = character.class.hit_die || 8; // z.B. 8
  const formula = `1d${hitDie}`;

  if (conMod === 0) {
    return formula;
  }

  // Fügt den Modifikator hinzu (z.B. "1d8+2" or "1d8-1")
  return `${formula}${conMod > 0 ? "+" : ""}${conMod}`;
}; // Refaktoriert

/**
 * BERECHNET MAXIMALE HP
 * (MODIFIZIERT, um Drakonische Widerstandsfähigkeit (Zauberer) zu nutzen)
 */
export const calculateMaxHP = (character) => {
  if (!character || !character.class || !character.abilities) return 1;

  // 1. Hol die finalen Stats (wichtig für Lvl 20 Barbar, Zauberer etc.)
  const finalStats = calculateFinalStats(character);
  // 2. Nutze den finalen CON-Wert
  const conMod = getAbilityModifier(finalStats.constitution);
  
  const level = character.level || 1;
  const hitDieValue = character.class.hit_die || 8;

  // Level 1: Max. Würfelwert + KON
  let hp = hitDieValue + conMod;

  // Level 2+: Durchschnittlicher Wurf (aufgerundet) + KON
  if (level > 1) {
    // D&D 5e Durchschnitt: (Würfel / 2) + 1. (z.B. d8 -> 4 + 1 = 5)
    const avgRoll = Math.floor(hitDieValue / 2) + 1;
    hp += (avgRoll + conMod) * (level - 1);
  }

  // 3. ADDITION: Wende passive HP-Boni von Klassen an
  // (Wird von sorcerer.js bereitgestellt für Drakonische Blutlinie)
  if (finalStats.maxHpBonus) {
      hp += finalStats.maxHpBonus;
  }

  // (Unveränderte Logik für Zwerg)
  if (character.subrace?.key === "hill-dwarf") {
    hp += level;
  }

  return hp;
};


/**
 * PRÜFT AUF STUFENAUFSTIEG
 * (Unverändert - Deine Logik ist aktuell)
 */
export const checkForLevelUp = (character) => {
  // Stelle sicher, dass level und experience existieren
  const level = character.level || 1;
  const experience = character.experience || 0;

  if (level >= 20 || character.pendingLevelUp) {
    return character; // Max. Level oder bereits ein Stufenaufstieg ausstehend
  }

  const nextLevel = level + 1;
  const xpForNextLevel = LEVEL_XP_TABLE[nextLevel];

  if (experience >= xpForNextLevel) {
    // STUFENAUFSTIEG AUSSTEHEND!
    console.log(
      `STUFENAUFSTIEG ANSTEHEND: ${character.name} ist bereit für Stufe ${nextLevel}!`
    );

    // *** 2. ZUSÄTZLICHE DATEN FÜR DAS MODAL SAMMELN ***
    const classData = allClassData.find(c => c.key === (character.class.key || character.class));
    
    // Prüfen, ob eine Subklassen-Wahl ansteht (basierend auf Feature-Namen)
    const isSubclassChoiceLevel = classData?.features.some(f => 
      f.level === nextLevel && (
        f.name.toLowerCase().includes("archetyp") || 
        f.name.toLowerCase().includes("pfad") || 
        f.name.toLowerCase().includes("domäne") || 
        f.name.toLowerCase().includes("zirkel") || 
        f.name.toLowerCase().includes("kolleg") || 
        f.name.toLowerCase().includes("tradition") || 
        f.name.toLowerCase().includes("eid") || 
        f.name.toLowerCase().includes("ursprung") || 
        f.name.toLowerCase().includes("schutzpatron")
      )
    );

    // Bereite die Daten für das Modal vor
    return {
      ...character,
      pendingLevelUp: {
        newLevel: nextLevel,
        hpRollFormula: getHpRollFormula(character),
        isAbilityIncrease: nextLevel % 4 === 0, // Info für ASI
        // Nur als Subklassen-Wahl markieren, wenn noch keine Subklasse gewählt wurde
        isSubclassChoice: isSubclassChoiceLevel && !character.subclassKey, 
      },
    };
  }

  // Kein Stufenaufstieg
  return character;
};

/**
 * WENDET STUFENAUFSTIEG AN (NEUE FUNKTION)
 * (Unverändert - Deine Logik ist aktuell)
 */
export const applyLevelUp = (character, hpRollResult, levelUpChoices) => {
  if (!character.pendingLevelUp) return character;

  const { newLevel } = character.pendingLevelUp;

  // --- Start: ASI anwenden ---
  const newAbilities = { ...character.abilities };
  if (levelUpChoices?.asi) {
    console.log("Wende ASI an:", levelUpChoices.asi);
    for (const key in levelUpChoices.asi) {
      if (newAbilities[key] !== undefined) {
        newAbilities[key] += levelUpChoices.asi[key];
      }
    }
  }
  // --- Ende: ASI anwenden ---

  // --- Start: Subklasse anwenden ---
  // Nimm die neue Subklasse, falls eine gewählt wurde, sonst behalte die alte
  const newSubclassKey = levelUpChoices?.subclassKey || character.subclassKey;
  // --- Ende: Subklasse anwenden ---


  // --- Start: Neue Fähigkeiten hinzufügen ---
  const classData = allClassData.find(c => c.key === (character.class.key || character.class));
  let newFeatures = [];
  let newSubclassFeatures = [];

  if (classData) {
    // 2. Finde alle Features der Hauptklasse für das newLevel
    newFeatures = classData.features.filter(f => f.level === newLevel);
    
    // 3. Finde Features der Subklasse (basierend auf der newSubclassKey)
    if (newSubclassKey && classData.subclasses) {
      const subclassData = classData.subclasses.find(sc => sc.key === newSubclassKey);
      if (subclassData && subclassData.features) {
        newSubclassFeatures = subclassData.features.filter(f => f.level === newLevel);
      }
    }
  }

  // 4. Kombiniere alle neuen Fähigkeiten
  const allNewFeatures = [...newFeatures, ...newSubclassFeatures];
  
  if (allNewFeatures.length > 0) {
    console.log(`Neue Fähigkeiten für ${character.name} auf Stufe ${newLevel}:`, allNewFeatures.map(f => f.name));
  }
  // --- Ende: Neue Fähigkeiten hinzufügen ---

  // Alte HP berechnen (basierend auf dem Level *vor* dem Aufstieg)
  // WICHTIG: Wir müssen den *neuen* Charakter (mit ggf. neuem CON) nutzen, um die alte HP zu berechnen
  const oldMaxHP = calculateMaxHP({ ...character, level: newLevel -1, abilities: newAbilities });

  // Nimm den reinen Würfelwurf
  const finalHpGain = hpRollResult;

  const newMaxHP = oldMaxHP + finalHpGain;

  // Entferne das pendingLevelUp-Flag und wende die Stats an
  const { pendingLevelUp, ...restOfCharacter } = character;

  const updatedCharacter = {
    ...restOfCharacter,
    level: newLevel,
    abilities: newAbilities, // <-- NEUE Abilities (mit ASI)
    subclassKey: newSubclassKey,
    stats: {
      ...character.stats,
      maxHp: newMaxHP,
      hp: newMaxHP, // HP werden voll aufgefüllt bei Level Up
    },
    // 5. Füge die neuen Fähigkeiten zu den bestehenden hinzu
    features: [
      ...(character.features || []), // Alte Features
      ...allNewFeatures             // Neue Features
    ],
  };

  // Wichtig: Erneut prüfen, falls genug EP für *noch* einen Stufenaufstieg vorhanden sind
  return checkForLevelUp(updatedCharacter);
}; // HP-Logik leicht angepasst

/**
 * VERGIBT ERFAHRUNGSPUNKTE (für die ganze Gruppe)
 * (Unverändert)
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
 * (Unverändert)
 */
export const grantXpToCharacter = (character, xpAmount) => {
  if (!xpAmount || xpAmount <= 0) {
    return character;
  }
  console.log(`${character.name} erhält ${xpAmount} EP.`);
  const updatedChar = {
    ...character,
    experience: (character.experience || 0) + xpAmount,
  };
  return checkForLevelUp(updatedChar);
};


// --- NEUE FUNKTIONEN ZUR SPIELSTEUERUNG (Dirigent) ---

/**
 * Holt die Daten für einen Rettungswurf (Bonus, Vorteil, etc.).
 * (MODIFIZIERT, um `dispatchGameEvent` für "Gefahrensinn", "Entrinnen", "Aura des Schutzes" usw. zu nutzen)
 * @param {object} character - Das zentrale Charakter-Objekt.
 * @param {object} saveInfo - Details zum Wurf, z.B. { ability: 'dexterity', effect: 'half_damage_on_save' }
 * @returns {object} - Ein Objekt mit allen Wurfdaten, z.B. { bonus: 5, advantage: true, hasEvasion: true }
 */
export const getSavingThrow = (character, saveInfo) => {
  const { ability, effect } = saveInfo; // z.B. ability: 'dexterity', effect: 'half_damage_on_save'
  
  // 1. Hol die finalen Stats
  const finalStats = calculateFinalStats(character);
  const abilityKey = ability.substring(0, 3); // 'dexterity' -> 'dex'

  // 2. Berechne den Basis-Bonus
  const modifier = getAbilityModifier(finalStats[abilityKey]);
  const proficiencyBonus = getProficiencyBonus(character.level || 1);
  
  // 3. Finde Klassen-Daten für geübte Rettungswürfe
  const charClass = allClassData.find(c => c.key === (character.class.key || character.class));
  const isProficient = charClass.saving_throws.includes(ability); // Prüft 'dexterity'

  let totalBonus = modifier;
  if (isProficient) {
    totalBonus += proficiencyBonus;
  }

  // 4. Aura des Schutzes (Paladin)
  // (Diese Aura wirkt auf den Paladin selbst UND Verbündete in der Nähe)
  if (finalStats.aura?.type === 'saving_throw' && finalStats.aura?.bonus > 0) {
    totalBonus += finalStats.aura.bonus;
  }
  // (HINWEIS: Hier müsste die Engine auch die Auren von nahen Verbündeten prüfen)

  // 5. Erstelle das Basis-Wurfobjekt
  let rollData = {
    bonus: totalBonus,
    advantage: false,
    disadvantage: false,
    hasEvasion: false
  };

  // 6. Konsultiere die Klassenmodule (Gefahrensinn, Entrinnen)
  const eventData = {
    type: 'saving_throw',
    ability: ability, // 'dexterity'
    effect: effect   // 'half_damage_on_save'
  };
  
  // Rufe den "Dirigenten" auf, um alle "Spezialisten" zu fragen
  const modifiedEvent = dispatchGameEvent('saving_throw', eventData, character);

  // 7. Wende die Ergebnisse des Events an
  if (modifiedEvent.advantage) {
    rollData.advantage = true;
  }
  if (modifiedEvent.hasEvasion) {
    rollData.hasEvasion = true;
  }
  // (Andere Modifikatoren wie `canReact: 'indomitable_reroll'` [Kämpfer] würden hier auch zurückkommen)

  return rollData;
};


/**
 * (NEU) Holt alle verfügbaren Aktionen (Aktion, Bonusaktion etc.)
 * die dem Charakter durch seine Klasse zur Verfügung stehen.
 * @param {object} character - Das Charakterobjekt.
 * @returns {Array<object>} - Eine Liste von Aktions-Objekten für die UI.
 */
export const getCharacterActions = (character) => {
  let actions = [];

  // 1. (Platzhalter) Standardaktionen (Angriff, Spurt etc.)
  // actions.push(...getStandardActions());

  // 2. Klassenspezifische Aktionen holen
  const logicModule = getClassLogicModule(character.class);
  if (logicModule && logicModule.getActiveSkills) {
    actions = actions.concat(logicModule.getActiveSkills(character));
  }

  // 3. (Platzhalter) Aktionen von Gegenständen
  // actions = actions.concat(getItemActions(character));

  return actions;
};

/**
 * (NEU) Leitet Spiel-Ereignisse an das zuständige Klassenmodul weiter.
 * Dies wird für Fähigkeiten wie "Gefahrensinn" oder "Unnachgiebiger Zorn" benötigt.
 * @param {string} eventType - Art des Ereignisses (z.B. 'saving_throw', 'damage_taken').
 * @param {object} data - Die Ereignisdaten (z.B. { type: 'dexterity' }).
 * @param {object} character - Der Charakter, der das Ereignis erlebt.
 * @returns {object} - Die potenziell modifizierten Ereignisdaten.
 */
export const dispatchGameEvent = (eventType, data, character) => {
  const logicModule = getClassLogicModule(character.class);

  if (logicModule && logicModule.handleGameEvent) {
    // Leite das Event an das Klassenmodul (z.B. barbarian.js) weiter
    return logicModule.handleGameEvent(eventType, data, character);
  }

  // Wenn kein Modul das Ereignis behandelt, gib die Originaldaten zurück.
  return data;
};

/**
 * (NEU) Holt die Zauber-Fähigkeiten eines Charakters (Vorbereitung, Anzahl, etc.)
 * @param {object} character - Das Charakterobjekt.
 * @returns {object | null} - Ein Objekt mit Zauber-Informationen oder null.
 */
export const getSpellcastingCapabilities = (character) => {
    const logicModule = getClassLogicModule(character.class);
    
    // Prüfen, ob das Modul überhaupt Zauber-Logik besitzt
    if (logicModule && logicModule.getSpellcastingInfo) {
        const finalStats = calculateFinalStats(character);
        return logicModule.getSpellcastingInfo(character, finalStats);
    }

    // Klasse ist kein Zauberwirker
    return null;
};