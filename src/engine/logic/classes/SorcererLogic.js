import { getModifier, getProficiencyBonus } from '../../../utils/helpers';

// Zauberplätze (identisch mit Magier)
const FULL_CASTER_SLOTS = [
  { level: 1, slots: { 1: 2 } }, { level: 2, slots: { 1: 3 } }, { level: 3, slots: { 1: 4, 2: 2 } },
  { level: 4, slots: { 1: 4, 2: 3 } }, { level: 5, slots: { 1: 4, 2: 3, 3: 2 } }, { level: 6, slots: { 1: 4, 2: 3, 3: 3 } },
  { level: 7, slots: { 1: 4, 2: 3, 3: 3, 4: 1 } }, { level: 8, slots: { 1: 4, 2: 3, 3: 3, 4: 2 } },
  { level: 9, slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 } }, { level: 10, slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 } },
  { level: 11, slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 } }, { level: 12, slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 } },
  { level: 13, slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 } }, { level: 14, slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 } },
  { level: 15, slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 } }, { level: 16, slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 } },
  { level: 17, slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 1 } }, { level: 18, slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 1, 7: 1, 8: 1, 9: 1 } },
  { level: 19, slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 1, 8: 1, 9: 1 } },
  { level: 20, slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 2, 8: 1, 9: 1 } },
];

// Bekannte Zauber (Spells Known) Progression für Zauberer
const SORCERER_SPELLS_KNOWN = [
  { level: 1, known: 2 }, { level: 2, known: 3 }, { level: 3, known: 4 }, { level: 4, known: 5 },
  { level: 5, known: 6 }, { level: 6, known: 7 }, { level: 7, known: 8 }, { level: 8, known: 9 },
  { level: 9, known: 10 }, { level: 10, known: 11 }, { level: 11, known: 12 }, { level: 12, known: 12 },
  { level: 13, known: 13 }, { level: 14, known: 13 }, { level: 15, known: 14 }, { level: 16, known: 14 },
  { level: 17, known: 15 }, { level: 18, known: 15 }, { level: 19, known: 15 }, { level: 20, known: 15 },
];

/**
 * Kapselt die 5E-Logik für die Zauberer-Klasse.
 */
export class SorcererLogic {
  constructor(classData, allSpells) {
    this.classData = classData; // Das Zauberer-Objekt aus classes.json
    this.allSpells = allSpells; // Die *gesamte* spells.json
    
    // Filtert alle Zauber heraus, die in ihrem "classes"-Array "sorcerer" enthalten
    this.classSpells = this.allSpells.filter(spell => spell.classes && spell.classes.includes('sorcerer'));
  }

  getHitPointsPerLevel() {
    return 6;
  }

  getSpellcastingAbility() {
    return 'charisma';
  }
  
  getSavingThrowProficiencies() {
    return this.classData.saving_throws; // ['constitution', 'charisma']
  }

  getAllClassSpells() {
    return this.classSpells;
  }

  getCantrips() {
    return this.classSpells.filter(spell => spell.level === 0);
  }

  getLearnableSpells() {
     return this.classSpells.filter(spell => spell.level > 0);
  }

  /**
   * Gibt die Anzahl der Zaubertricks zurück, die auf einer Stufe bekannt sind.
   */
  getKnownCantripsCount(level) {
    if (level < 4) return 4;
    if (level < 10) return 5;
    return 6;
  }

  /**
   * Gibt die Gesamtanzahl der Zauber zurück, die auf einer Stufe bekannt sind.
   */
  getKnownSpellsCount(level) {
    const entry = SORCERER_SPELLS_KNOWN.find(p => p.level === level);
    return entry ? entry.known : 0;
  }

  getSpellSlots(level) {
    const entry = FULL_CASTER_SLOTS.find(p => p.level === level);
    return entry ? entry.slots : {};
  }

  getSpellSaveDC(character) {
    const proficiencyBonus = getProficiencyBonus(character.level);
    const chaModifier = getModifier(character.abilities.charisma);
    return 8 + proficiencyBonus + chaModifier;
  }

  getSpellAttackBonus(character) {
    const proficiencyBonus = getProficiencyBonus(character.level);
    const chaModifier = getModifier(character.abilities.charisma);
    return proficiencyBonus + chaModifier;
  }

  /**
   * Gibt die Anzahl der Zauberpunkte (Sorcery Points) für ein Level zurück.
   * Regel: Gleich dem Zauberer-Level (ab Stufe 2).
   */
  getSorceryPoints(level) {
    if (level < 2) return 0;
    return level;
  }

  /**
   * Gibt die Anzahl der Metamagie-Optionen zurück, die gewählt werden können.
   */
  getMetamagicOptionsCount(level) {
    if (level < 3) return 0;
    if (level < 10) return 2;
    if (level < 17) return 3;
    return 4;
  }

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
}