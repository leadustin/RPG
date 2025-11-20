// src/engine/characterEngine.jsx
import allClassData from "../data/classes.json";
import { LEVEL_XP_TABLE } from "../utils/helpers";

// NEU: Import der RulesEngine für ausgelagerte Mechaniken
import { 
  getFeatHpBonus, 
  checkFeatProficiency, 
  getInitiativeBonusFromFeats 
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
 * (PHB 2024 Update: Boni kommen primär aus background_options)
 */
export const getRacialAbilityBonus = (character, abilityKey) => {
  if (!character) return 0;

  // 1. Priorität: Neue Background-Optionen (PHB 2024)
  if (character.background_options?.bonuses) {
     return character.background_options.bonuses[abilityKey] || 0;
  }

  // 2. Fallback: Legacy System (Rasse/Manuell, z.B. für alte 5e Inhalte)
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
  if (!character.class) return 0; // Race ist nicht mehr zwingend für Basis-HP, aber Con

  const finalCon =
    character.abilities.con + getRacialAbilityBonus(character, "con");
  const conModifier = getAbilityModifier(finalCon);
  
  // Basis HP: Hit Die + Con Mod
  let hp = character.class.hit_die + conModifier;

  // Zwerge (+1 HP) - Legacy Check
  if (character.race?.key === "dwarf") {
    hp += 1;
  }

  // NEU: RulesEngine für Feat-Boni (z.B. "Tough")
  hp += getFeatHpBonus(character);

  return hp;
};

/**
 * Berechnet die Rüstungsklasse (AC) nach 5e-Regeln.
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

  // Schild-Erkennung (Vereinfacht)
  let shieldBonus = 0;
  const offHand = character.equipment?.["off-hand"] || character.equipment?.shield;
  
  if (offHand) {
     if (offHand.type === "shield" || (offHand.ac && offHand.ac > 0)) {
         shieldBonus = offHand.ac || 2;
     }
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
      // Leichte Rüstung: Voller Dex-Bonus
      armorDexBonus = dexModifier;
    } else if (
      armorName.includes("kettenhemd") ||
      armorName.includes("schuppenpanzer") ||
      armorName.includes("brustplatte") ||
      armorName.includes("halbplatten")
    ) {
      // Mittelschwere Rüstung: Max +2 Dex
      armorDexBonus = Math.min(dexModifier, 2);
    } else {
      // Schwere Rüstung: Kein Dex-Bonus
      armorDexBonus = 0;
    }

    return baseAC + armorDexBonus + shieldBonus;
  }

  // 4. Fall 2: Charakter trägt KEINE Rüstung (Unarmored Defense)
  else {
    let unarmoredAC = 10 + dexModifier;

    if (character.class.key === "barbarian") {
      const finalCon =
        character.abilities.con + getRacialAbilityBonus(character, "con");
      const conModifier = getAbilityModifier(finalCon);
      unarmoredAC = Math.max(unarmoredAC, 10 + dexModifier + conModifier);
    } else if (character.class.key === "monk" && shieldBonus === 0) {
      // Mönch verliert Unarmored Defense, wenn er ein Schild trägt
      const finalWis =
        character.abilities.wis + getRacialAbilityBonus(character, "wis");
      const wisModifier = getAbilityModifier(finalWis);
      unarmoredAC = Math.max(unarmoredAC, 10 + dexModifier + wisModifier);
    }

    // Hinweis: Draconic Sorcerer AC (13+Dex) könnte hier via RulesEngine ergänzt werden
    
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

/**
 * Prüft, ob ein Charakter in einer Fertigkeit geübt ist.
 * Berücksichtigt jetzt Hintergrund, Rasse, Klasse UND Talente.
 */
export const isProficientInSkill = (character, skillKey) => {
  const {
    race,
    background,
    skill_proficiencies_choice,
  } = character;

  // 1. Übung durch Hintergrund (PHB 2024: 'skills' Array mit Keys)
  if (background?.skills && background.skills.includes(skillKey)) {
    return true;
  }

  // 2. Übung durch Volk (z.B. Elfen in Wahrnehmung)
  if (
    race && race.traits &&
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

  // 4. NEU: RulesEngine für Feats (Skilled, Crafter, etc.)
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

  // Verwendet das tatsächliche Level des Charakters
  const proficiencyBonus = getProficiencyBonus(character.level || 1);

  if (isProficientInSkill(character, skillKey)) {
    return modifier + proficiencyBonus;
  }

  return modifier;
};

/**
 * Berechnet die Initiative (DEX + Boni wie "Alert").
 */
export const calculateInitiative = (character) => {
    const finalDex = character.abilities.dex + getRacialAbilityBonus(character, "dex");
    let initBonus = getAbilityModifier(finalDex);
    
    // NEU: Bonus durch "Alert" Feat (benötigt Proficiency Bonus)
    const pb = getProficiencyBonus(character.level || 1);
    initBonus += getInitiativeBonusFromFeats(character, pb);
    
    return initBonus;
};

/**
 * Berechnet den Nahkampfschaden basierend auf der Waffe und den Attributen.
 */
export const calculateMeleeDamage = (character) => {
  const strScore =
    character.abilities.str + getRacialAbilityBonus(character, "str");
  const strModifier = getAbilityModifier(strScore);

  // Prüfen, ob eine Waffe in der Haupthand ausgerüstet ist
  const mainHandWeapon = character.equipment?.["main-hand"];

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
    // (Hier könnte man später Tavern Brawler Logik einfügen via RulesEngine)
    const unarmedDamage = 1 + strModifier;
    return unarmedDamage.toString();
  }
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

/**
 * HILFSFUNKTION: Ermittelt die HP-Würfelformel für den Stufenaufstieg.
 */
const getHpRollFormula = (character) => {
  const hitDie = character.class.hit_die || 8; 
  const conMod = getAbilityModifier(
    character.abilities.con + getRacialAbilityBonus(character, "con")
  );

  const formula = `1d${hitDie}`;
  if (conMod === 0) return formula;
  return `${formula}${conMod > 0 ? "+" : ""}${conMod}`;
};


/**
 * Findet die korrekte Anzahl an Meisterschaften für die aktuelle Stufe.
 */
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


/**
 * PRÜFT AUF STUFENAUFSTIEG
 */
export const checkForLevelUp = (character) => {
  const level = character.level || 1;
  const experience = character.experience || 0;

  if (level >= 20 || character.pendingLevelUp) {
    return character;
  }

  const nextLevel = level + 1;
  const xpForNextLevel = LEVEL_XP_TABLE[nextLevel];

  if (experience >= xpForNextLevel) {
    console.log(`STUFENAUFSTIEG ANSTEHEND: ${character.name} ist bereit für Stufe ${nextLevel}!`);

    const classData = allClassData.find(c => c.key === character.class.key);
    
    // Prüfen auf Subklassen-Wahl
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

    // Prüfen auf ASI
    const isAbilityIncrease = classData?.features.some(f =>
      f.level === nextLevel &&
      f.name.toLowerCase() === "fähigkeitspunkte / merkmal"
    );
    
    // Prüfen auf Waffenmeisterschaft
    const currentMasteryCount = getMasteryCountForLevel(classData?.weapon_mastery, level);
    const newMasteryCount = getMasteryCountForLevel(classData?.weapon_mastery, nextLevel);
    const isMasteryIncrease = newMasteryCount > currentMasteryCount;

    if (isMasteryIncrease) {
        console.log(`Neue Waffenmeisterschaft freigeschaltet auf Stufe ${nextLevel}! (Anzahl: ${newMasteryCount})`);
    }

    return {
      ...character,
      pendingLevelUp: {
        newLevel: nextLevel,
        hpRollFormula: getHpRollFormula(character),
        isAbilityIncrease: isAbilityIncrease, 
        isSubclassChoice: isSubclassChoiceLevel && !character.subclassKey, 
        isMasteryIncrease: isMasteryIncrease,
        newMasteryCount: newMasteryCount,
        currentMasteryCount: currentMasteryCount 
      },
    };
  }

  return character;
};


/**
 * WENDET STUFENAUFSTIEG AN
 */
export const applyLevelUp = (character, hpRollResult, levelUpChoices) => {
  if (!character.pendingLevelUp) return character;

  const { newLevel } = character.pendingLevelUp;

  // --- ASI anwenden ---
  const newAbilities = { ...character.abilities };
  if (levelUpChoices?.asi) {
    console.log("Wende ASI an:", levelUpChoices.asi);
    for (const key in levelUpChoices.asi) {
      if (newAbilities[key] !== undefined) {
        newAbilities[key] += levelUpChoices.asi[key];
      }
    }
  }

  // --- Subklasse anwenden ---
  const newSubclassKey = levelUpChoices?.subclassKey || character.subclassKey;

  // --- Neue Fähigkeiten sammeln ---
  const classData = allClassData.find(c => c.key === character.class.key);
  let newFeatures = [];
  let newSubclassFeatures = [];

  if (classData) {
    newFeatures = classData.features.filter(f => f.level === newLevel);
    
    if (newSubclassKey && classData.subclasses) {
      const subclassData = classData.subclasses.find(sc => sc.key === newSubclassKey);
      if (subclassData && subclassData.features) {
        newSubclassFeatures = subclassData.features.filter(f => f.level === newLevel);
      }
    }
  }

  const allNewFeatures = [...newFeatures, ...newSubclassFeatures];
  
  if (allNewFeatures.length > 0) {
    console.log(`Neue Fähigkeiten für ${character.name} auf Stufe ${newLevel}:`, allNewFeatures.map(f => f.name));
  }

  // --- HP berechnen ---
  const oldMaxHP = character.stats.maxHp;
  let finalHpGain = hpRollResult;

  // Zwerge erhalten +1 HP pro Stufe
  if (character.race?.key === "dwarf") {
    finalHpGain += 1;
  }
  
  // Hinweis: Hier könnte man später auch +2 HP für "Tough" Feat addieren, 
  // wenn die RulesEngine erweitert wird. Aktuell wird es bei calculateInitialHP global draufgerechnet, 
  // aber beim Level-Up addieren wir hier nur den Zuwachs.

  const newMaxHP = oldMaxHP + finalHpGain;

  // --- Charakter Update ---
  const { pendingLevelUp, ...restOfCharacter } = character;

  const updatedCharacter = {
    ...restOfCharacter,
    level: newLevel,
    abilities: newAbilities, 
    subclassKey: newSubclassKey,
    stats: {
      ...character.stats,
      maxHp: newMaxHP,
      hp: newMaxHP,
    },
    features: [
      ...(character.features || []), // Alte Features
      ...allNewFeatures             // Neue Features
    ],
  };

  // Erneut prüfen, falls noch mehr EP vorhanden sind
  return checkForLevelUp(updatedCharacter);
};

/**
 * VERGIBT ERFAHRUNGSPUNKTE
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