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
  if (level < 5) return 2;
  if (level < 9) return 3;
  if (level < 13) return 4;
  if (level < 17) return 5;
  return 6; // Stufe 17-20
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

  // 4. Aus dem Hintergrund (falls vorhanden)
  
  return profs;
};

/**
 * Berechnet Angriffs- und Schadensmodifikatoren für eine Waffe basierend auf 5e Regeln.
 * Berücksichtigt: Finesse, Fernkampf, Übung (Proficiency).
 */
export const calculateWeaponStats = (character, weapon) => {
  // Sicherheitscheck: Ohne Charakter oder Waffe keine Berechnung
  if (!character || !weapon) return { toHit: 0, damageMod: 0, ability: 'str', isProficient: false };

  // Attribute holen (Fallback auf 10, falls Struktur anders ist)
  const stats = character.stats?.abilities || character.stats || { str: 10, dex: 10 };
  const strMod = getAbilityModifier(stats.str || 10);
  const dexMod = getAbilityModifier(stats.dex || 10);
  const profBonus = getProficiencyBonus(character.level || 1);

  // 1. Attribut bestimmen (STR oder DEX)
  let abilityMod = strMod;
  let usedAbility = 'str';

  const isRanged = weapon.range_type === 'ranged';
  // Manche Items haben properties als Array, manche nicht -> Sicherstellen
  const props = weapon.properties || [];
  const isFinesse = props.includes('Finesse');

  if (isRanged) {
    // Fernkampf nutzt DEX (Ausnahme Wurfwaffen, hier vereinfacht)
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
  // Wir holen die gesammelte Liste aller Proficiencies des Charakters
  const allProfs = getCharacterProficiencies(character);
  
  let isProficient = false;
  
  // Check auf Kategorie (z.B. "simple", "martial")
  if (weapon.category && allProfs.includes(weapon.category)) isProficient = true;
  // Check auf spezifische ID (z.B. "longsword")
  if (weapon.id && allProfs.includes(weapon.id)) isProficient = true;
  
  // Fallback Check für Standard D&D Klassenlogik (vereinfacht für Prototyp)
  const className = character.class?.key || "";
  const martialClasses = ["fighter", "paladin", "ranger", "barbarian"];
  
  // Wenn Klasse Martial Weapons kann und Waffe Martial ist -> Proficient
  if (weapon.category === "martial" && martialClasses.includes(className)) isProficient = true;
  
  // Fast alle Klassen können Simple Weapons
  if (weapon.category === "simple") isProficient = true;

  // 3. Endwerte berechnen
  // Angriffswurf: W20 + Attributsmod + (falls geübt) Proficiency Bonus
  let toHit = abilityMod + (isProficient ? profBonus : 0);
  
  // Schaden: Würfel + Attributsmod (bei Offhand ohne Stil 0, hier Standard)
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

/**
 * Bestimmt das Zauberattribut basierend auf der Klasse.
 */
export const getSpellcastingAbility = (characterClass) => {
    const key = typeof characterClass === 'string' ? characterClass : characterClass?.key;
    
    switch (key) {
        case 'wizard':
        case 'rogue': // Arcane Trickster
        case 'fighter': // Eldritch Knight
            return 'int';
        case 'cleric':
        case 'druid':
        case 'ranger':
        case 'monk': // Manche Subklassen
            return 'wis';
        case 'bard':
        case 'paladin':
        case 'sorcerer':
        case 'warlock':
            return 'cha';
        default:
            return 'int'; // Fallback
    }
};

/**
 * Berechnet den Zauber-Angriffsbonus.
 * Formel: Übungsbonus + Attributsmodifikator
 */
export const calculateSpellAttackBonus = (character) => {
    if (!character || !character.class) return 0;
    
    const abilityKey = getSpellcastingAbility(character.class);
    const abilityScore = character.stats.abilities[abilityKey] || 10;
    const mod = getAbilityModifier(abilityScore);
    const prof = getProficiencyBonus(character.level || 1);
    
    return mod + prof;
};

/**
 * Berechnet den Zauber-Rettungswurf-SG (Difficulty Class / DC).
 * Formel: 8 + Übungsbonus + Attributsmodifikator
 */
export const calculateSpellSaveDC = (character) => {
    if (!character || !character.class) return 8; // Basis
    
    const attackBonus = calculateSpellAttackBonus(character);
    return 8 + attackBonus;
};