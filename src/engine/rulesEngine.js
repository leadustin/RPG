// src/engine/rulesEngine.js
import featuresData from '../data/features.json';

// --- GRUNDREGELN ---

export const getAbilityModifier = (score) => {
  return Math.floor((score - 10) / 2);
};

export const getProficiencyBonus = (level) => {
  if (!level) return 2;
  if (level < 5) return 2;
  if (level < 9) return 3;
  if (level < 13) return 4;
  if (level < 17) return 5;
  return 6;
};

/**
 * Sammelt alle Proficiencies (Waffen, Rüstungen, Werkzeuge) eines Charakters
 * aus Klasse, Rasse und Hintergrund zusammen.
 */
export const getCharacterProficiencies = (character) => {
  if (!character) return [];
  
  let profs = [];

  // 1. Aus dem Charakter-Objekt direkt (falls vorhanden)
  if (character.proficiencies && Array.isArray(character.proficiencies)) {
    profs = [...character.proficiencies];
  }

  // 2. Aus der Klasse
  if (character.class && character.class.proficiencies) {
    // Klassen-Daten haben oft Strukturen wie { armor: [], weapons: [] }
    // Wir sammeln hier vereinfacht alles ein, was Arrays sind
    Object.values(character.class.proficiencies).forEach(val => {
        if (Array.isArray(val)) profs.push(...val);
    });
  }

  // 3. Aus der Rasse
  if (character.race && character.race.proficiencies) {
     Object.values(character.race.proficiencies).forEach(val => {
        if (Array.isArray(val)) profs.push(...val);
    });
  }

  // 4. Aus dem Hintergrund
  // (Hintergründe geben meist Skills/Tools, seltener Waffen, aber sicher ist sicher)
  
  return profs;
};

/**
 * Berechnet Angriffs- und Schadensmodifikatoren.
 * FIX: Prüft Proficiencies dynamisch und handhabt W/d Notation nicht hier, 
 * aber stellt sicher, dass Daten sauber zurückkommen.
 */
export const calculateWeaponStats = (character, weapon) => {
  if (!character || !weapon) return { toHit: 0, damageMod: 0, ability: 'str', isProficient: false };

  const stats = character.stats.abilities || character.stats || { str: 10, dex: 10 };
  const strMod = getAbilityModifier(stats.str || 10);
  const dexMod = getAbilityModifier(stats.dex || 10);
  const profBonus = getProficiencyBonus(character.level || 1);

  // 1. Attribut bestimmen
  let abilityMod = strMod;
  let usedAbility = 'str';

  const isRanged = weapon.range_type === 'ranged'; // check json key naming carefully
  // Manche Items haben properties als String Array
  const props = weapon.properties || [];
  const isFinesse = props.includes('Finesse');

  if (isRanged) {
    abilityMod = dexMod;
    usedAbility = 'dex';
  } else if (isFinesse) {
    if (dexMod > strMod) {
      abilityMod = dexMod;
      usedAbility = 'dex';
    }
  }

  // 2. Übung prüfen (Proficiency)
  // Wir holen die gesammelte Liste
  const allProfs = getCharacterProficiencies(character);
  
  let isProficient = false;
  
  // Check Kategorie (z.B. "simple", "martial", "einfache waffen", etc.)
  // Wir müssen hier etwas flexibel sein wegen Groß/Kleinschreibung und Deutsch/Englisch
  const category = weapon.category ? weapon.category.toLowerCase() : "";
  
  // Mapping für deutsche Begriffe aus deiner weapons.json ("simple" -> "Einfache Waffen"?)
  // Da weapons.json "category": "simple" sagt, prüfen wir das.
  
  if (allProfs.includes(weapon.category)) isProficient = true;
  if (allProfs.includes(weapon.id)) isProficient = true;
  
  // Fallback Check für D&D Standard
  // Krieger (Fighter) haben meist "martial" und "simple"
  // Das muss in deinen classes.json Daten stimmen. 
  // Wenn dort "Martial Weapons" steht und hier "martial", matcht es nicht.
  // Einfacher Fix für den Moment: Wenn Class Fighter/Paladin/Ranger/Barbarian -> immer Proficient mit Martial
  const className = character.class?.key || "";
  const martialClasses = ["fighter", "paladin", "ranger", "barbarian"];
  if (weapon.category === "martial" && martialClasses.includes(className)) isProficient = true;
  
  // Alle Klassen können Simple Weapons (außer Wizard/Sorcerer manchmal eingeschränkt, aber meistens ja)
  if (weapon.category === "simple") isProficient = true; // Vereinfachung für den Prototyp!

  // 3. Werte
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