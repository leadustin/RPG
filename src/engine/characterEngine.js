import allArmor from "../data/items/armor.json";
// *** 1. IMPORT HINZUGEFÜGT ***
import { LEVEL_XP_TABLE } from "../utils/helpers";

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

/**
 * Berechnet die Rüstungsklasse (AC) nach 5e-Regeln.
 * Berücksichtigt angelegte Rüstung, Schilde und Klassen-Features.
 * @param {object} character - Das zentrale Charakter-Objekt.
 * @returns {number} - Die finale Rüstungsklasse.
 */
export const calculateAC = (character) => {
  if (!character || !character.abilities || !character.class) {
    return 10; // Fallback
  }

  // 1. Finale Attribut-Modifikatoren berechnen
  const finalDex =
    character.abilities.dex + getRacialAbilityBonus(character, "dex");
  const dexModifier = getAbilityModifier(finalDex);

  // 2. Ausgerüstete Items
  const equippedArmorData = character.equipment?.armor;

  // Schild-Erkennung
  let equippedShieldData = null;
  let shieldBonus = 0;

  if (
    character.equipment?.["off-hand"] &&
    character.equipment["off-hand"].type === "shield"
  ) {
    equippedShieldData = character.equipment["off-hand"];
    shieldBonus = equippedShieldData.ac || 2;
  } else if (
    character.equipment?.["off-hand"] &&
    character.equipment["off-hand"].slot === "off-hand"
  ) {
    equippedShieldData = character.equipment["off-hand"];
    shieldBonus = equippedShieldData.ac || 2;
  } else if (character.equipment?.shield) {
    equippedShieldData = character.equipment.shield;
    shieldBonus = equippedShieldData.ac || 2;
  } else if (
    character.equipment?.["off-hand"] &&
    character.equipment["off-hand"].ac > 0
  ) {
    equippedShieldData = character.equipment["off-hand"];
    shieldBonus = equippedShieldData.ac;
  }

  // 3. Fall 1: Charakter trägt eine Rüstung
  if (equippedArmorData) {
    let baseAC = equippedArmorData.ac;
    let armorDexBonus = 0;

    const armorName = equippedArmorData.name.toLowerCase();

    if (
      armorName.includes("leder") ||
      armorName.includes("wams") ||
      armorName.includes("elfen-kettenrüstung")
    ) {
      armorDexBonus = dexModifier;
    } else if (
      armorName.includes("kettenhemd") ||
      armorName.includes("schuppenpanzer") ||
      armorName.includes("brustplatte") ||
      armorName.includes("halbplatten")
    ) {
      armorDexBonus = Math.min(dexModifier, 2);
    } else {
      armorDexBonus = 0;
    }

    return baseAC + armorDexBonus + shieldBonus;
  }

  // 4. Fall 2: Charakter trägt KEINE Rüstung
  else {
    let unarmoredAC = 10 + dexModifier;

    if (character.class.key === "barbarian") {
      const finalCon =
        character.abilities.con + getRacialAbilityBonus(character, "con");
      const conModifier = getAbilityModifier(finalCon);
      unarmoredAC = Math.max(unarmoredAC, 10 + dexModifier + conModifier);
    } else if (character.class.key === "monk" && !equippedShieldData) {
      const finalWis =
        character.abilities.wis + getRacialAbilityBonus(character, "wis");
      const wisModifier = getAbilityModifier(finalWis);
      unarmoredAC = Math.max(unarmoredAC, 10 + dexModifier + wisModifier);
    }

    return unarmoredAC + shieldBonus;
  }
};

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

/**
 * Prüft, ob ein Charakter in einer Fertigkeit geübt ist.
 * @param {object} character - Das zentrale Charakter-Objekt.
 * @param {string} skillKey - Der Schlüssel der Fertigkeit (z.B. 'stealth').
 * @returns {boolean} - True, wenn geübt, sonst false.
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
 * @param {object} character - Das zentrale Charakter-Objekt.
 * @param {string} skillKey - Der Schlüssel der Fertigkeit.
 * @returns {number} - Der finale Bonus.
 */
export const calculateSkillBonus = (character, skillKey) => {
  const abilityKey = SKILL_MAP[skillKey];
  const finalAbilityScore =
    character.abilities[abilityKey] +
    getRacialAbilityBonus(character, abilityKey);
  const modifier = getAbilityModifier(finalAbilityScore);

  // Verwendet jetzt das tatsächliche Level des Charakters
  const proficiencyBonus = getProficiencyBonus(character.level || 1);

  if (isProficientInSkill(character, skillKey)) {
    return modifier + proficiencyBonus;
  }

  return modifier;
};

/**
 * Berechnet den Nahkampfschaden basierend auf der Waffe und den Attributen.
 */
export const calculateMeleeDamage = (character) => {
  // *** 3. BUGFIX: Liest von 'character.abilities' statt 'character.stats.abilities' ***
  const strScore =
    character.abilities.str + getRacialAbilityBonus(character, "str");
  const strModifier = getAbilityModifier(strScore);

  // Prüfen, ob eine Waffe in der Haupthand ausgerüstet ist
  const mainHandWeapon = character.equipment["main-hand"];

  if (mainHandWeapon && mainHandWeapon.damage) {
    // Wenn eine Waffe mit Schadenswert vorhanden ist
    let damage = mainHandWeapon.damage;
    const versatileProperty = mainHandWeapon.properties?.find((p) =>
      p.startsWith("Vielseitig")
    );

    // Prüfen, ob die Waffe vielseitig ist und beidhändig geführt wird
    if (versatileProperty && mainHandWeapon.isTwoHanded) {
      const twoHandedDamage = versatileProperty.match(/\((.*?)\)/)?.[1];
      if (twoHandedDamage) {
        damage = twoHandedDamage;
      }
    }

    const modifierString =
      strModifier >= 0 ? `+${strModifier}` : strModifier.toString();
    return `${damage} ${modifierString}`;
  } else {
    // Standard für waffenlosen Schlag (1 + Stärke-Modifikator)
    const unarmedDamage = 1 + strModifier;
    return unarmedDamage.toString();
  }
};

// Deutsche Beschreibungen für die Hauptattribute
export const ABILITY_DESCRIPTIONS_DE = {
  str: "Stärke: Misst die körperliche Kraft. Wichtig für Nahkampfangriffe und Athletik.",
  dex: "Geschicklichkeit: Misst die Agilität, Reflexe und Balance. Wichtig für Rüstungsklasse, Fernkampfangriffe und Akrobatik.",
  con: "Konstitution: Misst die Ausdauer und Lebenskraft. Bestimmt die Trefferpunkte und Widerstandsfähigkeit.",
  int: "Intelligenz: Misst die geistige Schärfe, Gedächtnis und logisches Denken. Wichtig für arkane Magie und Nachforschungen.",
  wis: "Weisheit: Misst die Wahrnehmung, Intuition und Willenskraft. Wichtig für göttliche Magie, Wahrnehmung und Einblick.",
  cha: "Charisma: Misst die Überzeugungskraft, Persönlichkeit und Führungsstärke. Wichtig für soziale Interaktion und einige Magieformen.",
};

// Deutsche Beschreibungen für die Kampfwerte
export const COMBAT_STATS_DESCRIPTIONS_DE = {
  ac: "Gibt an, wie schwer es ist, dich im Kampf zu treffen. Basiert auf 10 + deinem Geschicklichkeits-Modifikator. Rüstung und Schilde können diesen Wert erhöhen.",
  hp: "Deine Lebensenergie. Erreicht sie 0, bist du kampfunfähig. Basiert auf dem Trefferwürfel deiner Klasse und deinem Konstitutions-Modifikator.",
  proficiency:
    "Ein Bonus, den du auf alle Würfe addierst, in denen du geübt bist (Angriffe, Fertigkeiten, etc.). Er steigt mit deinem Charakterlevel an.",
};

// Deutsche Beschreibungen für die Fertigkeiten
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

// --- *** 4. NEUE/WIEDERHERGESTELLTE FUNKTIONEN AB HIER *** ---

/**
 * HILFSFUNKTION: Würfelt eine Würfelformel (z.B. "1d8" oder "1d10+2").
 */
export const rollDiceFormula = (formula) => {
  let total = 0;
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
    // Falls es kein Würfelwurf ist, sondern nur eine Zahl (sollte nicht passieren)
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
};

/**
 * HILFSFUNKTION: Ermittelt die HP-Würfelformel für den Stufenaufstieg.
 */
const getHpRollFormula = (character) => {
  const hitDie = character.class.hit_die || 8; // z.B. 8
  const conMod = getAbilityModifier(
    character.abilities.con + getRacialAbilityBonus(character, "con")
  );

  const formula = `1d${hitDie}`;

  if (conMod === 0) {
    return formula;
  }

  // Fügt den Modifikator hinzu (z.B. "1d8+2" or "1d8-1")
  return `${formula}${conMod > 0 ? "+" : ""}${conMod}`;
};

/**
 * BERECHNET MAXIMALE HP
 * (Wird für Stufenaufstiege benötigt)
 */
export const calculateMaxHP = (character) => {
  if (!character || !character.class || !character.abilities) return 1;

  const finalCon =
    character.abilities.con + getRacialAbilityBonus(character, "con");
  const conMod = getAbilityModifier(finalCon);
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

  if (character.subrace?.key === "hill-dwarf") {
    hp += level;
  }

  return hp;
};

/**
 * PRÜFT AUF STUFENAUFSTIEG
 * (ANGEPASST: Bereitet Stufenaufstieg für Modal vor)
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

    // Bereite die Daten für das Modal vor
    return {
      ...character,
      pendingLevelUp: {
        newLevel: nextLevel,
        hpRollFormula: getHpRollFormula(character),
        isAbilityIncrease: nextLevel % 4 === 0, // Info für später
      },
    };
  }

  // Kein Stufenaufstieg
  return character;
};

/**
 * WENDET STUFENAUFSTIEG AN (NEUE FUNKTION)
 * Wendet die gewürfelten HP und das neue Level an.
 */
export const applyLevelUp = (character, hpRollResult) => {
  if (!character.pendingLevelUp) return character;

  const { newLevel } = character.pendingLevelUp;

  // Alte HP berechnen (basierend auf dem Level *vor* dem Aufstieg)
  const oldMaxHP = calculateMaxHP(character);

  // Nimm den reinen Würfelwurf
  const finalHpGain = hpRollResult;

  const newMaxHP = oldMaxHP + finalHpGain;

  // Aktuelle HP um den *Gewinn* erhöhen (nicht auf max setzen)
  const newCurrentHP = (character.stats.hp || oldMaxHP) + finalHpGain;

  // Entferne das pendingLevelUp-Flag und wende die Stats an
  const { pendingLevelUp, ...restOfCharacter } = character;

  const updatedCharacter = {
    ...restOfCharacter,
    level: newLevel,
    stats: {
      ...character.stats,
      maxHp: newMaxHP,
      hp: newCurrentHP,
    },
  };

  // Wichtig: Erneut prüfen, falls genug EP für *noch* einen Stufenaufstieg vorhanden sind
  return checkForLevelUp(updatedCharacter);
};

/**
 * VERGIBT ERFAHRUNGSPUNKTE (für die ganze Gruppe)
 * (Wiederhergestellt)
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
 * (Wiederhergestellt)
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
