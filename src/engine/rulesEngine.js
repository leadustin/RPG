// src/engine/rulesEngine.js
import featuresData from '../data/features.json';

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

  // 2. Hier könnten später Klassen-Features oder Rassen-Traits folgen
  // ...

  return feats;
};

/**
 * Berechnet Bonus-HP durch Feats (z.B. "Tough")
 */
export const getFeatHpBonus = (character) => {
  const features = getAllCharacterFeatures(character);
  let hpBonusPerLevel = 0;

  features.forEach(feat => {
    if (feat.mechanics?.type === 'hp_bonus_per_level') {
      hpBonusPerLevel += feat.mechanics.value || 0;
    }
  });

  // Gesamter HP Bonus = (Bonus pro Level) * (Charakter Level)
  const level = character.level || 1;
  return hpBonusPerLevel * level;
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
      // Hier könnten andere feste Werte addiert werden
    }
  });

  return bonus;
};

/**
 * Prüft, ob ein Talent Übung in einem Skill oder Werkzeug gewährt
 * (z.B. "Skilled", "Crafter", "Musician")
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
    
    // Prüfe statische Proficiencies (z.B. "Crafter" gibt immer bestimmte Tools? Nein, meist Wahl)
    // Falls es statische gäbe:
    // if (feat.mechanics?.proficiencies?.static_list?.includes(skillOrToolKey)) return true;
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