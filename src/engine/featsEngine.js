// src/engine/featsEngine.js
import featuresData from '../data/features.json';

/**
 * Holt alle aktiven Features/Feats eines Charakters.
 * (Kombiniert Hintergrund-Feats, Rassen-Feats, Klassen-Features und gewählte Feats)
 */
export const getAllCharacterFeats = (character) => {
  const feats = [];

  // 1. Hintergrund-Feat
  if (character.background?.feat) {
    const featData = featuresData.find(f => f.key === character.background.feat);
    if (featData) feats.push(featData);
  }

  // 2. Level-Up Feats (aus dem Array der gewählten Feats)
  if (character.feats && Array.isArray(character.feats)) {
    character.feats.forEach(featKey => {
      const featData = featuresData.find(f => f.key === featKey);
      if (featData) feats.push(featData);
    });
  }

  // Hier könnten später auch Rassen-Features hinzugefügt werden, 
  // falls diese wie Feats behandelt werden sollen.

  return feats;
};

/**
 * Berechnet die gesamten Bonus-HP durch Talente.
 * Unterstützt: "Tough" (Zäh) und ähnliche Mechaniken.
 */
export const calculateFeatHpBonus = (character) => {
  const feats = getAllCharacterFeats(character);
  let hpBonusPerLevel = 0;
  let flatHpBonus = 0;

  feats.forEach(feat => {
    if (!feat.mechanics) return;

    // Typ: hp_bonus_per_level (wie bei Tough / Zäh)
    if (feat.mechanics.type === 'hp_bonus_per_level') {
      hpBonusPerLevel += feat.mechanics.value || 0;
    }
    
    // Typ: flat_hp_bonus (falls es Talente gibt, die pauschal HP geben)
    if (feat.mechanics.type === 'flat_hp_bonus') {
      flatHpBonus += feat.mechanics.value || 0;
    }
  });

  // Gesamter HP Bonus = (Bonus pro Level * Charakter Level) + Pauschale Boni
  const level = character.level || 1;
  return (hpBonusPerLevel * level) + flatHpBonus;
};

/**
 * Prüft, ob ein Charakter ein bestimmtes Talent besitzt.
 * Nützlich für UI-Checks oder Bedingungen.
 */
export const hasFeat = (character, featKey) => {
    const feats = getAllCharacterFeats(character);
    return feats.some(f => f.key === featKey);
};

