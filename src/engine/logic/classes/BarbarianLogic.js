import { getModifier, getProficiencyBonus } from '../../../utils/helpers';

/**
 * Kapselt die 5E-Logik für die Barbaren-Klasse.
 */
export class BarbarianLogic {
  constructor(classData, allFeatures) {
    this.classData = classData; // Das Barbar-Objekt aus classes.json
    this.allFeatures = allFeatures; // Die *gesamte* features.json
  }

  getHitPointsPerLevel() {
    return 12;
  }

  getSavingThrowProficiencies() {
    return this.classData.saving_throws; // ['strength', 'constitution']
  }

  /**
   * Holt die Level-basierte Progression für den Kampfrausch.
   * @param {number} level - Die Stufe des Barbaren
   * @returns {object} { uses: number | string, damage_bonus: number }
   */
  getRageStats(level) {
    const entry = this.classData.rage_progression.find(p => p.level === level);
    if (entry) {
      return { uses: entry.uses, damage_bonus: entry.damage_bonus };
    }
    
    // Falls das Level nicht exakt getroffen wird (z.B. Level 4)
    // Finde den höchsten Eintrag, der niedriger als das aktuelle Level ist.
    const progression = this.classData.rage_progression;
    let currentStats = progression[0];
    for (let i = 1; i < progression.length; i++) {
        if (progression[i].level <= level) {
            currentStats = progression[i];
        } else {
            break;
        }
    }
    return { uses: currentStats.uses, damage_bonus: currentStats.damage_bonus };
  }

  /**
   * Berechnet die Rüstungsklasse (AC) für 'Ungepanzerte Verteidigung'.
   * Regel: 10 + Geschicklichkeit-Mod + Konstitution-Mod (wenn keine Rüstung getragen wird)
   * @param {object} character - Das Charakterobjekt (muss abilities haben)
   */
  getUnarmoredDefense(character) {
    const dexModifier = getModifier(character.abilities.dexterity);
    const conModifier = getModifier(character.abilities.constitution);
    return 10 + dexModifier + conModifier;
  }
  
  /**
   * Holt die spezifischen Fähigkeiten für die Stufe und Unterklasse.
   */
  getFeaturesForLevel(level, subclassKey) {
    const features = [];
    
    // Basisfähigkeiten des Barbaren
    const baseFeatures = this.classData.features.filter(f => f.level === level);
    features.push(...baseFeatures);

    // Fähigkeiten der Unterklasse
    if (subclassKey) {
      const subclass = this.classData.subclasses.find(sc => sc.key === subclassKey);
      if (subclass) {
        const subclassFeatures = subclass.features.filter(f => f.level === level);
        features.push(...subclassFeatures);
      }
    }
    return features;
  }

  // --- FÄHIGKEITEN-LOGIK (WIRD VOM KAMPFSYSTEM AUFGERUFEN) ---

  /**
   * Definiert die Effekte von 'Kampfrausch' (Stufe 1).
   */
  applyRageEffects(caster) {
    const rageStats = this.getRageStats(caster.level);
    const effects = [
      { type: 'advantage', on: 'strength_checks' },
      { type: 'advantage', on: 'strength_saves' },
      { type: 'damage_bonus', amount: rageStats.damage_bonus, damage_type: 'melee' },
      { type: 'resistance', damage_type: 'bludgeoning' },
      { type: 'resistance', damage_type: 'piercing' },
      { type: 'resistance', damage_type: 'slashing' },
    ];
    return effects;
  }

  /**
   * Definiert die Effekte von 'Raserei' (Berserker, Stufe 3).
   */
  applyFrenzyEffects(caster) {
    // Erlaubt einen zusätzlichen Nahkampfangriff als Bonusaktion.
    // Die 'combatEngine' muss dies prüfen.
    return { type: 'allow_bonus_action_attack', value: true };
    // Die 'combatEngine' muss auch den 'Erschöpfung'-Status nach Ende des Kampfrausches anwenden.
  }

  /**
   * Prüft 'Gefahrensinn' (Stufe 2).
   * @param {object} effect - Der Effekt, der den Rettungswurf auslöst (z.B. ein Zauber oder eine Falle).
   * @returns {boolean} True, wenn Vorteil gewährt wird.
   */
  hasDangerSenseAdvantage(caster, effect) {
    // Regel: Vorteil auf GE-RW gegen Effekte, die du sehen kannst.
    // (Annahme: 'effect' hat einen Typ, z.B. 'trap' or 'spell')
    // (Annahme: 'caster' hat keinen Status 'blinded', 'deafened', 'incapacitated')
    const isDisabled = caster.hasStatus('blinded') || caster.hasStatus('deafened') || caster.hasStatus('incapacitated');
    
    if (!isDisabled && (effect.type === 'trap' || effect.type === 'spell')) {
      return true;
    }
    return false;
  }
}