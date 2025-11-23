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
 * Berechnet Initiative-Boni durch Talente.
 * Z.B. für das Talent "Wachsam" (Alert).
 */
export const calculateFeatInitiativeBonus = (character) => {
  const feats = getAllCharacterFeats(character);
  let initBonus = 0;

  feats.forEach(feat => {
    if (feat.mechanics && feat.mechanics.type === 'initiative_bonus') {
      initBonus += feat.mechanics.value || 0;
    }
  });

  return initBonus;
};

/**
 * Berechnet Bewegungsraten-Boni durch Talente.
 * Z.B. "Mobile" (Beweglich).
 */
export const calculateFeatSpeedBonus = (character) => {
  const feats = getAllCharacterFeats(character);
  let speedBonus = 0;

  feats.forEach(feat => {
    if (feat.mechanics && feat.mechanics.type === 'speed_bonus') {
      speedBonus += feat.mechanics.value || 0;
    }
  });

  return speedBonus;
};

/**
 * Berechnet passive Boni (z.B. Passive Wahrnehmung) durch Talente.
 * Z.B. "Observant" (Aufmerksam).
 * Nutzung: calculateFeatPassiveBonus(char, 'perception')
 */
export const calculateFeatPassiveBonus = (character, skillKey) => {
  const feats = getAllCharacterFeats(character);
  let passiveBonus = 0;

  feats.forEach(feat => {
    // Prüfen ob es ein passiver Bonus ist UND ob er für den gewünschten Skill gilt (oder global ist)
    if (feat.mechanics && feat.mechanics.type === 'passive_bonus') {
        // Wenn kein spezifischer Skill gefordert ist oder der Skill übereinstimmt
        if (!feat.mechanics.skill || feat.mechanics.skill === skillKey) {
            passiveBonus += feat.mechanics.value || 0;
        }
    }
  });

  return passiveBonus;
};

/**
 * Prüft, ob ein Charakter ein bestimmtes Talent besitzt.
 * Nützlich für UI-Checks oder Bedingungen.
 */
export const hasFeat = (character, featKey) => {
    const feats = getAllCharacterFeats(character);
    return feats.some(f => f.key === featKey);
};