import { getModifier, getProficiencyBonus } from '../../../utils/helpers';

// Skalierung des Kampfkunst-Schadenswürfels (Martial Arts Die)
const MARTIAL_ARTS_DIE = [
  { level: 1, die: '1d4' },
  { level: 5, die: '1d6' },
  { level: 11, die: '1d8' },
  { level: 17, die: '1d10' },
];

/**
 * Kapselt die 5E-Logik für die Mönch-Klasse.
 */
export class MonkLogic {
  constructor(classData, allFeatures) {
    this.classData = classData; // Das Mönch-Objekt aus classes.json
    this.allFeatures = allFeatures; // Die *gesamte* features.json
  }

  getHitPointsPerLevel() {
    return 8;
  }

  getSavingThrowProficiencies() {
    return this.classData.saving_throws; // ['strength', 'dexterity']
  }

  /**
   * Holt die spezifischen Fähigkeiten für die Stufe und Unterklasse.
   */
  getFeaturesForLevel(level, subclassKey) {
    const features = [];
    const baseFeatures = this.classData.features.filter(f => f.level === level);
    features.push(...baseFeatures);

    if (subclassKey) {
      const subclass = this.classData.subclasses.find(sc => sc.key === subclassKey);
      if (subclass) {
        const subclassFeatures = subclass.features.filter(f => f.level === level);
        features.push(...subclassFeatures);
      }
    }
    return features;
  }

  // --- FÄHIGKEITEN-LOGIK ---

  /**
   * Gibt die Anzahl der Ki-Punkte zurück.
   * Regel: Gleich der Mönch-Stufe (ab Stufe 2).
   */
  getKiPoints(level) {
    if (level < 2) return 0;
    return level;
  }

  /**
   * Berechnet den Rettungswurf-SG für Ki-Fähigkeiten (z.B. Betäubender Schlag).
   * Regel: 8 + Übungsbonus + Weisheits-Modifikator
   */
  getKiSaveDC(character) {
    const proficiencyBonus = getProficiencyBonus(character.level);
    const wisModifier = getModifier(character.abilities.wisdom);
    return 8 + proficiencyBonus + wisModifier;
  }

  /**
   * Berechnet die Rüstungsklasse (AC) für 'Ungepanzerte Verteidigung' (Mönch).
   * Regel: 10 + Geschicklichkeit-Mod + Weisheit-Mod (wenn keine Rüstung/Schild getragen wird)
   */
  getUnarmoredDefense(character) {
    const dexModifier = getModifier(character.abilities.dexterity);
    const wisModifier = getModifier(character.abilities.wisdom);
    return 10 + dexModifier + wisModifier;
  }

  /**
   * Gibt den Schadenswürfel für Kampfkunst (unbewaffnet/Mönchswaffe) zurück.
   */
  getMartialArtsDie(level) {
    let die = '1d4';
    for (const entry of MARTIAL_ARTS_DIE) {
      if (level >= entry.level) {
        die = entry.die;
      }
    }
    return die;
  }

  /**
   * Berechnet den Bonus auf die Bewegungsrate durch 'Ungepanzerte Bewegung'.
   */
  getUnarmoredMovementBonus(level) {
    if (level < 2) return 0;
    if (level < 6) return 3; // +3m
    if (level < 10) return 4.5; // +4,5m
    if (level < 14) return 6; // +6m
    if (level < 18) return 7.5; // +7,5m
    return 9; // +9m
  }
  
  /**
   * Berechnet den reduzierten Schaden durch 'Geschosse ablenken' (Stufe 3).
   * Regel: 1W10 + Geschicklichkeits-Mod + Mönch-Level
   */
  getDeflectMissilesReduction(character) {
    const dexModifier = getModifier(character.abilities.dexterity);
    const roll = Math.floor(Math.random() * 10) + 1;
    return roll + dexModifier + character.level;
  }
  
  /**
   * Berechnet die Heilung für 'Ganzheit des Körpers' (Stufe 6 / Weg der Offenen Hand).
   * Regel: 3 * Mönch-Level
   */
  getWholenessOfBodyHeal(level) {
      if (level < 6) return 0;
      return level * 3;
  }
}