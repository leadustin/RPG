// src/engine/characterEngine.jsx
import allClassData from "../data/classes.json";
import { LEVEL_XP_TABLE, rollDiceFormula } from "../utils/helpers";

// Import der RulesEngine für ausgelagerte Mechaniken
import { 
  getFeatHpBonus, 
  checkFeatProficiency, 
  getInitiativeBonusFromFeats,
  getUnarmedDamageDie,
  hasSavageAttacker,
  hasHealerStabilizeBonus,
  getHealerFeatHealingFormula,
  hasLuckyFeat,
  getCrafterDiscount
} from "./rulesEngine"; 

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
 */
export const getRacialAbilityBonus = (character, abilityKey) => {
  if (!character) return 0;

  if (character.background_options?.bonuses) {
     return character.background_options.bonuses[abilityKey] || 0;
  }

  if (
    character.ability_bonus_assignments &&
    character.ability_bonus_assignments[abilityKey]
  ) {
    return character.ability_bonus_assignments[abilityKey];
  }

  return 0;
};

/**
 * Berechnet die maximalen Lebenspunkte auf Stufe 1 (oder Basis).
 */
export const calculateInitialHP = (character) => {
  if (!character.class) return 0; 

  const finalCon =
    character.abilities.con + getRacialAbilityBonus(character, "con");
  const conModifier = getAbilityModifier(finalCon);
  
  let hp = character.class.hit_die + conModifier;

  if (character.race?.key === "dwarf") {
    hp += 1;
  }

  hp += getFeatHpBonus(character);

  return hp;
};

/**
 * Berechnet die Rüstungsklasse (AC) nach 5e-Regeln.
 */
export const calculateAC = (character) => {
  if (!character || !character.abilities || !character.class) {
    return 10; 
  }

  const finalDex =
    character.abilities.dex + getRacialAbilityBonus(character, "dex");
  const dexModifier = getAbilityModifier(finalDex);

  const equippedArmorData = character.equipment?.armor;

  let shieldBonus = 0;
  const offHand = character.equipment?.["off-hand"] || character.equipment?.shield;
  
  if (offHand && (offHand.type === "shield" || (offHand.ac && offHand.ac > 0))) {
      shieldBonus = offHand.ac || 2;
  }

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
  } else {
    let unarmoredAC = 10 + dexModifier;

    if (character.class.key === "barbarian") {
      const finalCon =
        character.abilities.con + getRacialAbilityBonus(character, "con");
      const conModifier = getAbilityModifier(finalCon);
      unarmoredAC = Math.max(unarmoredAC, 10 + dexModifier + conModifier);
    } else if (character.class.key === "monk" && shieldBonus === 0) {
      const finalWis =
        character.abilities.wis + getRacialAbilityBonus(character, "wis");
      const wisModifier = getAbilityModifier(finalWis);
      unarmoredAC = Math.max(unarmoredAC, 10 + dexModifier + wisModifier);
    }
    
    return unarmoredAC + shieldBonus;
  }
};

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

/**
 * Prüft, ob ein Charakter in einer Fertigkeit geübt ist.
 */
export const isProficientInSkill = (character, skillKey) => {
  const {
    race,
    background,
    skill_proficiencies_choice,
  } = character;

  if (background?.skills && background.skills.includes(skillKey)) {
    return true;
  }

  if (
    race && race.traits &&
    race.traits.some(
      (trait) => trait.name === "Geschärfte Sinne" && skillKey === "perception"
    )
  ) {
    return true;
  }

  if (
    skill_proficiencies_choice &&
    skill_proficiencies_choice.includes(skillKey)
  ) {
    return true;
  }
  
  if (checkFeatProficiency(character, skillKey)) {
      return true;
  }

  return false;
};

/**
 * Berechnet den finalen Bonus für eine bestimmte Fertigkeit.
 */
export const calculateSkillBonus = (character, skillKey) => {
  const abilityKey = SKILL_MAP[skillKey];
  const finalAbilityScore =
    character.abilities[abilityKey] +
    getRacialAbilityBonus(character, abilityKey);
  const modifier = getAbilityModifier(finalAbilityScore);

  const proficiencyBonus = getProficiencyBonus(character.level || 1);

  if (isProficientInSkill(character, skillKey)) {
    return modifier + proficiencyBonus;
  }

  return modifier;
};

/**
 * Berechnet die Initiative.
 */
export const calculateInitiative = (character) => {
    const finalDex = character.abilities.dex + getRacialAbilityBonus(character, "dex");
    let initBonus = getAbilityModifier(finalDex);
    
    const pb = getProficiencyBonus(character.level || 1);
    initBonus += getInitiativeBonusFromFeats(character, pb);
    
    return initBonus;
};

/**
 * Berechnet den Nahkampfschaden (Anzeige).
 */
export const calculateMeleeDamage = (character) => {
  const strScore =
    character.abilities.str + getRacialAbilityBonus(character, "str");
  const strModifier = getAbilityModifier(strScore);

  const modifierString =
      strModifier >= 0 ? `+${strModifier}` : strModifier.toString();

  const mainHandWeapon = character.equipment?.["main-hand"];

  if (mainHandWeapon && mainHandWeapon.damage) {
    let damage = mainHandWeapon.damage;
    const versatileProperty = mainHandWeapon.properties?.find((p) =>
      p.startsWith("Vielseitig")
    );

    if (versatileProperty && mainHandWeapon.isTwoHanded) {
      const twoHandedDamage = versatileProperty.match(/\((.*?)\)/)?.[1];
      if (twoHandedDamage) {
        damage = twoHandedDamage;
      }
    }

    return `${damage} ${modifierString}`;
  } else {
    // Prüfe auf Tavern Brawler
    const upgradedDie = getUnarmedDamageDie(character); 

    if (upgradedDie) {
        return `${upgradedDie} ${modifierString}`;
    }

    const unarmedDamage = 1 + strModifier;
    return unarmedDamage.toString();
  }
};

/**
 * Führt einen echten Schadenswurf durch (inkl. Wilder Angreifer).
 */
export const performMeleeDamageRoll = (character, isCritical = false) => {
  const damageString = calculateMeleeDamage(character);
  
  if (!damageString.includes('d')) {
      const staticDmg = parseInt(damageString);
      return {
          total: staticDmg,
          rolls: [],
          formula: damageString,
          isSavageAttacker: false,
          logMessage: `Schaden: ${staticDmg} (Fest)`
      };
  }

  const parts = damageString.split(' ');
  const dicePart = parts[0]; 
  const modPart = parts.length > 1 ? parts[1] : "+0"; 

  let rollDice = dicePart;
  if (isCritical) {
    const [count, type] = dicePart.split('d');
    rollDice = `${parseInt(count) * 2}d${type}`;
  }

  const hasSavage = hasSavageAttacker(character);
  
  let result1 = rollDiceFormula(rollDice);
  let finalDiceTotal = result1;
  let msg = `Würfelt ${rollDice}: [${result1}]`;

  if (hasSavage) {
    let result2 = rollDiceFormula(rollDice);
    finalDiceTotal = Math.max(result1, result2);
    msg = `Wilder Angreifer (${rollDice}): Würfelt [${result1}] und [${result2}]. Nutze [${finalDiceTotal}].`;
  }

  const modifier = parseInt(modPart.replace('+', '')); 
  const totalDamage = finalDiceTotal + modifier;

  if (modifier !== 0) {
    msg += ` Modifikator (${modPart}) = ${totalDamage} Gesamtschaden.`;
  } else {
    msg += ` = ${totalDamage} Gesamtschaden.`;
  }

  return {
    total: totalDamage,
    rolls: hasSavage ? [result1, finalDiceTotal] : [result1],
    formula: damageString,
    isSavageAttacker: hasSavage,
    logMessage: msg
  };
};

// --- SPEZIAL-FUNKTIONEN (Heiler, Glück, Crafter) ---

export const performHealerKitHealingRoll = (character) => {
  const formulaType = getHealerFeatHealingFormula(character);
  if (!formulaType) return null;

  const diceResult = rollDiceFormula("1d6");
  const pb = getProficiencyBonus(character.level || 1);
  const wisScore = character.abilities.wis + getRacialAbilityBonus(character, "wis");
  const wisMod = getAbilityModifier(wisScore);

  const totalHeal = diceResult + pb + wisMod;

  return {
    total: totalHeal,
    breakdown: `1d6 (${diceResult}) + PB (${pb}) + WIS (${wisMod})`,
    isStabilizeBonus: hasHealerStabilizeBonus(character) 
  };
};

export const calculateMaxLuckyPoints = (character) => {
  if (!hasLuckyFeat(character)) return 0;
  return getProficiencyBonus(character.level || 1);
};

export const calculateItemPriceForCharacter = (character, basePrice) => {
  const discountPercent = getCrafterDiscount(character); 
  if (discountPercent > 0) {
    const discount = Math.floor(basePrice * discountPercent);
    return Math.max(0, basePrice - discount);
  }
  return basePrice;
};

// --- LEVEL UP LOGIK ---

const getHpRollFormula = (character) => {
  const hitDie = character.class.hit_die || 8; 
  const conMod = getAbilityModifier(
    character.abilities.con + getRacialAbilityBonus(character, "con")
  );

  const formula = `1d${hitDie}`;
  if (conMod === 0) return formula;
  return `${formula}${conMod > 0 ? "+" : ""}${conMod}`;
};

const getMasteryCountForLevel = (masteryData, level) => {
  if (!masteryData) return 0;
  let currentMax = 0;
  let bestLevel = 0;

  for (const key in masteryData) {
    if (key.startsWith("level_") && key.endsWith("_count")) {
      const levelKey = parseInt(key.split('_')[1]);
      if (level >= levelKey && levelKey > bestLevel) {
        bestLevel = levelKey;
        currentMax = masteryData[key];
      }
    }
  }
  return currentMax;
};

// +++ NEU: Liest Zauber-Progression direkt aus der JSON-Datenstruktur +++
const getSpellsKnownCount = (classData, level) => {
  // 1. Warlock (Pact Magic)
  if (classData.pact_magic_progression) {
    const prog = classData.pact_magic_progression.find(p => p.level === level);
    return prog ? prog.spells_known : 0;
  }

  // 2. Standard Spellcasting (Bard, Ranger, Sorcerer)
  if (classData.spellcasting && classData.spellcasting.spells_known_progression) {
    return classData.spellcasting.spells_known_progression[level - 1] || 0;
  }

  return 0; // Kleriker, Druide, Paladin, Magier haben andere Mechaniken
};

const getCantripsKnownCount = (classData, level) => {
  if (!classData?.spellcasting?.cantrip_progression) return 0;
  return classData.spellcasting.cantrip_progression[level - 1] || 0;
};


export const checkForLevelUp = (character) => {
  const level = character.level || 1;
  const experience = character.experience || 0;

  if (level >= 20 || character.pendingLevelUp) {
    return character;
  }

  const nextLevel = level + 1;
  const xpForNextLevel = LEVEL_XP_TABLE[nextLevel];

  if (experience >= xpForNextLevel) {
    console.log(`STUFENAUFSTIEG ANSTEHEND: ${character.name} -> Stufe ${nextLevel}`);

    const classData = allClassData.find(c => c.key === character.class.key);
    
    const isAbilityIncrease = classData?.features.some(f =>
      f.level === nextLevel && f.name.toLowerCase().includes("fähigkeitspunkte")
    );
    
    const isSubclassChoice = classData?.features.some(f => 
      f.level === nextLevel && (f.name.includes("Archetyp") || f.name.includes("Tradition") || f.name.includes("Zirkel") || f.name.includes("Pfad") || f.name.includes("Eid") || f.name.includes("Ursprung") || f.name.includes("Schutzpatron"))
    );

    const currentMastery = getMasteryCountForLevel(classData?.weapon_mastery, level);
    const newMastery = getMasteryCountForLevel(classData?.weapon_mastery, nextLevel);
    const isMasteryIncrease = newMastery > currentMastery;

    // +++ NEU: Datengetriebene Zauber-Berechnung +++
    let newCantripsToLearn = 0;
    let newSpellsToLearn = 0;
    const isWizard = character.class.key === 'wizard';

    if (classData) { 
        // Cantrips
        const currentCantrips = getCantripsKnownCount(classData, level);
        const nextCantrips = getCantripsKnownCount(classData, nextLevel);
        newCantripsToLearn = Math.max(0, nextCantrips - currentCantrips);

        // Known Spells (Datengetrieben)
        const currentKnown = getSpellsKnownCount(classData, level);
        const nextKnown = getSpellsKnownCount(classData, nextLevel);
        newSpellsToLearn = Math.max(0, nextKnown - currentKnown);
        
        // Magier Sonderregel (immer +2 ins Buch)
        if (isWizard) {
            newSpellsToLearn = 2; 
        }
    }

    return {
      ...character,
      pendingLevelUp: {
        newLevel: nextLevel,
        hpRollFormula: getHpRollFormula(character),
        isAbilityIncrease, 
        isSubclassChoice: isSubclassChoice && !character.subclassKey, 
        isMasteryIncrease,
        newMasteryCount: newMastery,
        
        // Zauber-Infos
        newCantripsToLearn,
        newSpellsToLearn,
        isWizard
      },
    };
  }

  return character;
};


export const applyLevelUp = (character, hpRollResult, levelUpChoices) => {
  if (!character.pendingLevelUp) return character;

  const { newLevel } = character.pendingLevelUp;

  // --- ASI & Feats ---
  const newAbilities = { ...character.abilities };
  let newFeats = [...(character.feats || [])];
  let newFeatChoices = { ...(character.feat_choices || {}) };

  if (levelUpChoices?.asi) {
    for (const key in levelUpChoices.asi) {
      if (newAbilities[key] !== undefined) {
        newAbilities[key] += levelUpChoices.asi[key];
      }
    }
  }
  if (levelUpChoices?.feat) {
      newFeats.push(levelUpChoices.feat.key);
      if (levelUpChoices.feat.selections) {
          newFeatChoices[levelUpChoices.feat.key] = levelUpChoices.feat.selections;
      }
  }

  // --- Subklasse ---
  const newSubclassKey = levelUpChoices?.subclassKey || character.subclassKey;

  // --- NEU: Zauber speichern ---
  let newCantripsKnown = [...(character.cantrips_known || [])];
  let newSpellsKnown = [...(character.spells_known || [])];
  let newSpellbook = [...(character.spellbook || [])];

  if (levelUpChoices?.newSpells) {
      if (levelUpChoices.newSpells.cantrips) {
          newCantripsKnown = [...newCantripsKnown, ...levelUpChoices.newSpells.cantrips];
      }
      
      if (levelUpChoices.newSpells.spells) {
          if (character.class.key === 'wizard') {
              // Magier: Ins Zauberbuch
              newSpellbook = [...newSpellbook, ...levelUpChoices.newSpells.spells];
          } else {
              // Andere: Zu bekannten Zaubern
              newSpellsKnown = [...newSpellsKnown, ...levelUpChoices.newSpells.spells];
          }
      }
  }

  // --- Waffenmeisterschaften ---
  let newMasteries = character.weapon_mastery_choices || [];
  if (levelUpChoices?.weapon_mastery_choices) {
      newMasteries = levelUpChoices.weapon_mastery_choices;
  }

  // --- Features & HP ---
  const oldMaxHP = character.stats.maxHp;
  let finalHpGain = hpRollResult;
  if (character.race.key === "dwarf") {
    finalHpGain += 1;
  }
  const newMaxHP = oldMaxHP + finalHpGain;

  const classData = allClassData.find(c => c.key === character.class.key);
  let allNewFeatures = []; 
  if (classData) {
     allNewFeatures = classData.features.filter(f => f.level === newLevel);
     if (newSubclassKey && classData.subclasses) {
        const sc = classData.subclasses.find(s => s.key === newSubclassKey);
        if (sc) {
            allNewFeatures = [...allNewFeatures, ...sc.features.filter(f => f.level === newLevel)];
        }
     }
  }

  const { pendingLevelUp, ...restOfCharacter } = character;

  const updatedCharacter = {
    ...restOfCharacter,
    level: newLevel,
    abilities: newAbilities, 
    subclassKey: newSubclassKey,
    feats: newFeats,
    feat_choices: newFeatChoices,
    weapon_mastery_choices: newMasteries,
    
    // Zauberlisten updaten
    cantrips_known: newCantripsKnown,
    spells_known: newSpellsKnown,
    spellbook: newSpellbook,

    stats: {
      ...character.stats,
      maxHp: newMaxHP,
      hp: newMaxHP,
    },
    features: [
      ...(character.features || []), 
      ...allNewFeatures             
    ],
  };

  return checkForLevelUp(updatedCharacter);
};

// Deutsche Beschreibungen (Content)
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
  acrobatics: "Akrobatik (Geschicklichkeit): Die Fähigkeit, auf den Beinen zu bleiben, Sprünge zu meistern und akrobatische Manöver auszuführen.",
  animal_handling: "Tierkunde (Weisheit): Die Fähigkeit, Tiere zu beruhigen, zu verstehen und zu kontrollieren.",
  arcana: "Arkanum (Intelligenz): Das Wissen über Magie, magische Kreaturen, Zauber und arkane Symbole.",
  athletics: "Athletik (Stärke): Die Fähigkeit, zu klettern, springen, schwimmen und körperliche Kraft anzuwenden.",
  deception: "Täuschung (Charisma): Die Fähigkeit, die Wahrheit zu verbergen, sei es durch Lügen, Verkleidung oder Ablenkung.",
  history: "Geschichte (Intelligenz): Das Wissen über historische Ereignisse, legendäre Personen und vergangene Zivilisationen.",
  insight: "Einblick (Weisheit): Die Fähigkeit, die wahren Absichten einer Kreatur durch Körpersprache und Verhalten zu erkennen.",
  intimidation: "Einschüchtern (Charisma): Die Fähigkeit, andere durch Drohungen, feindselige Handlungen und körperliche Präsenz zu beeinflussen.",
  investigation: "Nachforschungen (Intelligenz): Die Fähigkeit, nach Hinweisen zu suchen, Schlussfolgerungen zu ziehen und Details zu analysieren.",
  medicine: "Medizin (Weisheit): Die Fähigkeit, Verletzungen zu stabilisieren, Krankheiten zu diagnostizieren und Wunden zu behandeln.",
  nature: "Naturkunde (Intelligenz): Das Wissen über Gelände, Pflanzen, Tiere und das Wetter.",
  perception: "Wahrnehmung (Weisheit): Die Fähigkeit, etwas zu sehen, zu hören, zu riechen oder auf andere Weise wahrzunehmen.",
  performance: "Darbietung (Charisma): Die Fähigkeit, ein Publikum durch Musik, Tanz, Schauspiel oder eine andere Form der Unterhaltung zu fesseln.",
  persuasion: "Überzeugen (Charisma): Die Fähigkeit, andere durch Takt, Freundlichkeit und gute Argumente zu beeinflussen.",
  religion: "Religion (Intelligenz): Das Wissen über Gottheiten, religiöse Riten, heilige Symbole und die Ebenen der Existenz.",
  sleight_of_hand: "Fingerfertigkeit (Geschicklichkeit): Die Fähigkeit, Taschendiebstahl zu begehen, Schlösser zu knacken und andere manuelle Tricks auszuführen.",
  stealth: "Heimlichkeit (Geschicklichkeit): Die Fähigkeit, sich ungesehen und ungehört an anderen vorbeizuschleichen.",
  survival: "Überlebenskunst (Weisheit): Die Fähigkeit, Spuren zu lesen, in der Wildnis zu jagen, Gefahren zu vermeiden und den Weg zu finden.",
};

// Weiterleitungs-Funktionen
export const grantExperienceToParty = (party, defeatedEnemies) => {
  const totalXp = defeatedEnemies.reduce((sum, enemy) => sum + (enemy.xp || 0), 0);
  if (totalXp === 0) return party;
  const partySize = party.length;
  if (partySize === 0) return party;
  const xpPerMember = Math.floor(totalXp / partySize);
  if (xpPerMember === 0) return party;
  console.log(`Die Gruppe erhält ${totalXp} EP (${xpPerMember} pro Mitglied).`);
  return party.map((character) => {
    const updatedChar = { ...character, experience: (character.experience || 0) + xpPerMember };
    return checkForLevelUp(updatedChar);
  });
};

export const grantXpToCharacter = (character, xpAmount) => {
  if (!xpAmount || xpAmount <= 0) return character;
  console.log(`${character.name} erhält ${xpAmount} EP.`);
  const updatedChar = { ...character, experience: (character.experience || 0) + xpAmount };
  return checkForLevelUp(updatedChar);
};