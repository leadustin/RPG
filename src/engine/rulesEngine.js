// src/engine/rulesEngine.js
import featuresData from '../data/features.json';

// --- GRUNDREGELN (CORE RULES) ---
// Diese Logik lag vorher in der characterEngine, gehört aber hierhin.

/**
 * Berechnet den Modifikator für einen Attributswert.
 * Formel: (Wert - 10) / 2, abgerundet.
 */
export const getAbilityModifier = (score) => {
  return Math.floor((score - 10) / 2);
};

/**
 * Gibt den Übungsbonus (Proficiency Bonus) für ein gegebenes Level zurück.
 */
export const getProficiencyBonus = (level) => {
  if (!level) return 2;
  if (level < 5) return 2;
  if (level < 9) return 3;
  if (level < 13) return 4;
  if (level < 17) return 5;
  return 6; // Stufe 17-20
};

/**
 * Berechnet Angriffs- und Schadensmodifikatoren für eine Waffe basierend auf 5e Regeln.
 * Berücksichtigt: Finesse, Fernkampf, Übung (Proficiency).
 */
export const calculateWeaponStats = (character, weapon) => {
  if (!character || !weapon) return { toHit: 0, damageMod: 0, ability: 'str', isProficient: false };

  const stats = character.stats || { str: 10, dex: 10 };
  const strMod = getAbilityModifier(stats.str);
  const dexMod = getAbilityModifier(stats.dex);
  const profBonus = getProficiencyBonus(character.level || 1);

  // 1. Attribut bestimmen (STR oder DEX)
  let abilityMod = strMod;
  let usedAbility = 'str';

  const isRanged = weapon.range_type === 'ranged';
  const isFinesse = weapon.properties && weapon.properties.includes('Finesse');

  if (isRanged) {
    // Fernkampf nutzt DEX (außer Wurfwaffen, aber das vereinfachen wir hier erstmal auf DEX/STR Wahl)
    abilityMod = dexMod;
    usedAbility = 'dex';
  } else if (isFinesse) {
    // Finesse nutzt das höhere von beiden
    if (dexMod > strMod) {
      abilityMod = dexMod;
      usedAbility = 'dex';
    }
  }

  // 2. Übung prüfen (Proficiency)
  // Wir prüfen, ob der Charakter Übung mit der Kategorie (simple/martial) oder der Waffe selbst hat
  let isProficient = false;
  
  // Array der Proficiencies aus dem Charakter laden (Fallback auf leeres Array)
  const charProfs = character.proficiencies || []; 
  
  // Check Kategorie (z.B. "simple", "martial")
  if (weapon.category && charProfs.includes(weapon.category)) {
    isProficient = true;
  }
  // Check spezifische Waffe (z.B. "longsword")
  if (weapon.id && charProfs.includes(weapon.id)) {
    isProficient = true;
  }

  // 3. Werte zusammenrechnen
  let toHit = abilityMod + (isProficient ? profBonus : 0);
  let damageMod = abilityMod; 

  return {
    toHit,
    damageMod,
    usedAbility,
    isProficient
  };
};

// --- HELPER FÜR FEATURES (Legacy / Übergang) ---
// HINWEIS: Diese Funktionen werden nach und nach in spezialisierte Engines (featsEngine, etc.) verschoben.
// getFeatHpBonus wurde bereits entfernt und liegt nun in featsEngine.js.

/**
 * Hilfsfunktion: Holt alle aktiven Features/Feats eines Charakters.
 * (Kombiniert Hintergrund-Feats, Rassen-Feats, Klassen-Features)
 */
export const getAllCharacterFeatures = (character) => {
  const feats = [];

  // 1. Hintergrund-Feat
  if (character.background?.feat) {
    const featData = featuresData.find(f => f.key === character.background.feat);
    if (featData) feats.push(featData);
  }

  // 2. Level-Up Feats
  if (character.feats && Array.isArray(character.feats)) {
    character.feats.forEach(featKey => {
      const featData = featuresData.find(f => f.key === featKey);
      if (featData) feats.push(featData);
    });
  }

  return feats;
};

/**
 * Berechnet Initiative-Bonus durch Feats (z.B. "Alert")
 */
export const getInitiativeBonusFromFeats = (character, proficiencyBonus) => {
  const features = getAllCharacterFeatures(character);
  let bonus = 0;

  features.forEach(feat => {
    if (feat.mechanics?.type === 'initiative_bonus') {
      if (feat.mechanics.value === 'proficiency_bonus') {
        bonus += proficiencyBonus;
      }
    }
  });

  return bonus;
};

/**
 * Prüft, ob ein Talent Übung in einem Skill oder Werkzeug gewährt
 */
export const checkFeatProficiency = (character, skillOrToolKey) => {
  const features = getAllCharacterFeatures(character);
  
  // Durchsuche alle Feats nach Mechanics
  for (const feat of features) {
    // Prüfe dynamische Auswahlen (die in character.feat_choices gespeichert sind)
    if (character.feat_choices && character.feat_choices[feat.key]) {
      const choices = Object.values(character.feat_choices[feat.key]);
      if (choices.includes(skillOrToolKey)) {
        return true;
      }
    }
  }
  
  return false;
};

/**
 * Sammelt alle Zauber, die durch Feats gewährt wurden (z.B. "Magic Initiate")
 */
export const getFeatSpells = (character) => {
  const features = getAllCharacterFeatures(character);
  let spells = { cantrips: [], level1: [] };

  features.forEach(feat => {
    if (feat.mechanics?.type === 'magic_initiate') {
      const choices = character.feat_choices?.[feat.key];
      if (choices) {
        Object.entries(choices).forEach(([key, spellId]) => {
          if (!spellId) return;
          if (key.startsWith('cantrip')) spells.cantrips.push(spellId);
          if (key.startsWith('spell')) spells.level1.push(spellId);
        });
      }
    }
  });

  return spells;
};

export const getUnarmedDamageDie = (character) => {
  const features = getAllCharacterFeatures(character);
  
  for (const feat of features) {
    if (feat.mechanics?.type === 'unarmed_upgrade') {
      return feat.mechanics.damage_dice; 
    }
  }
  return null; 
};

/**
 * Prüft, ob der Charakter das Talent "Wilder Angreifer" hat.
 */
export const hasSavageAttacker = (character) => {
  const features = getAllCharacterFeatures(character);
  return features.some(f => f.mechanics?.type === 'damage_reroll_advantage');
};

// --- HEILKUNDIGER (HEALER) ---

export const hasHealerStabilizeBonus = (character) => {
  const features = getAllCharacterFeatures(character);
  return features.some(f => f.mechanics?.type === 'healer_feat_utility');
};

export const getHealerFeatHealingFormula = (character) => {
  const features = getAllCharacterFeatures(character);
  const feat = features.find(f => f.mechanics?.type === 'healer_feat_utility');
  
  if (!feat) return null;
  return feat.mechanics.healing_amount || "1d6"; 
};

// --- GLÜCKSPILZ (LUCKY) ---

export const hasLuckyFeat = (character) => {
  const features = getAllCharacterFeatures(character);
  return features.some(f => f.mechanics?.type === 'resource_lucky_points');
};

// --- HANDWERKER (CRAFTER) ---

export const getCrafterDiscount = (character) => {
  const features = getAllCharacterFeatures(character);
  const feat = features.find(f => f.mechanics?.type === 'crafter_utility');
  
  if (feat && feat.mechanics.shopping_discount) {
      if (feat.mechanics.shopping_discount === "20_percent") return 0.20;
  }
  return 0;
};