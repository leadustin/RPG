import { getModifier, getProficiencyBonus } from '../../../utils/helpers';

// Zauberplätze (Halb-Zauberwirker - Paladin, Waldläufer)
const HALF_CASTER_SLOTS = [
  { level: 1, slots: {} },
  { level: 2, slots: { 1: 2 } },
  { level: 3, slots: { 1: 3 } },
  { level: 4, slots: { 1: 3 } },
  { level: 5, slots: { 1: 4, 2: 2 } },
  { level: 6, slots: { 1: 4, 2: 2 } },
  { level: 7, slots: { 1: 4, 2: 3 } },
  { level: 8, slots: { 1: 4, 2: 3 } },
  { level: 9, slots: { 1: 4, 2: 3, 3: 2 } },
  { level: 10, slots: { 1: 4, 2: 3, 3: 2 } },
  { level: 11, slots: { 1: 4, 2: 3, 3: 3 } },
  { level: 12, slots: { 1: 4, 2: 3, 3: 3 } },
  { level: 13, slots: { 1: 4, 2: 3, 3: 3, 4: 1 } },
  { level: 14, slots: { 1: 4, 2: 3, 3: 3, 4: 1 } },
  { level: 15, slots: { 1: 4, 2: 3, 3: 3, 4: 2 } },
  { level: 16, slots: { 1: 4, 2: 3, 3: 3, 4: 2 } },
  { level: 17, slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 } },
  { level: 18, slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 } },
  { level: 19, slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 } },
  { level: 20, slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 } },
];

// Bekannte Zauber (Spells Known) Progression für Waldläufer
const RANGER_SPELLS_KNOWN = [
    { level: 1, known: 0 }, { level: 2, known: 2 }, { level: 3, known: 3 }, { level: 4, known: 3 },
    { level: 5, known: 4 }, { level: 6, known: 4 }, { level: 7, known: 5 }, { level: 8, known: 5 },
    { level: 9, known: 6 }, { level: 10, known: 6 }, { level: 11, known: 7 }, { level: 12, known: 7 },
    { level: 13, known: 8 }, { level: 14, known: 8 }, { level: 15, known: 9 }, { level: 16, known: 9 },
    { level: 17, known: 10 }, { level: 18, known: 10 }, { level: 19, known: 11 }, { level: 20, known: 11 },
];

/**
 * Kapselt die 5E-Logik für die Waldläufer-Klasse.
 */
export class RangerLogic {
  constructor(classData, allSpells) {
    this.classData = classData; // Das Waldläufer-Objekt aus classes.json
    this.allSpells = allSpells; // Die *gesamte* spells.json
    
    // Filtert alle Zauber heraus, die in ihrem "classes"-Array "ranger" enthalten
    this.classSpells = this.allSpells.filter(spell => spell.classes && spell.classes.includes('ranger'));
  }

  getHitPointsPerLevel() {
    return 10;
  }

  getSpellcastingAbility() {
    return 'wisdom';
  }
  
  getSavingThrowProficiencies() {
    return this.classData.saving_throws; // ['strength', 'dexterity']
  }

  /**
   * Holt die *komplette* Waldläufer-Zauberliste (gefiltert).
   * Ein Waldläufer wählt aus dieser Liste seine "bekannten Zauber".
   */
  getAllClassSpells() {
    return this.classSpells;
  }

  getCantrips() {
    return []; // Waldläufer haben keine Zaubertricks
  }

  getKnownCantripsCount(level) {
    return 0;
  }

  /**
   * Gibt die Gesamtanzahl der Zauber zurück, die auf einer Stufe bekannt sind.
   */
  getKnownSpellsCount(level) {
    const entry = RANGER_SPELLS_KNOWN.find(p => p.level === level);
    return entry ? entry.known : 0;
  }

  /**
   * Holt Zauber, die nur bis Stufe 5 gehen.
   */
  getLearnableSpells() {
     return this.classSpells.filter(spell => spell.level > 0 && spell.level <= 5);
  }

  getSpellSlots(level) {
    const entry = HALF_CASTER_SLOTS.find(p => p.level === level);
    return entry ? entry.slots : {};
  }

  getSpellSaveDC(character) {
    const proficiencyBonus = getProficiencyBonus(character.level);
    const wisModifier = getModifier(character.abilities.wisdom);
    return 8 + proficiencyBonus + wisModifier;
  }

  getSpellAttackBonus(character) {
    const proficiencyBonus = getProficiencyBonus(character.level);
    const wisModifier = getModifier(character.abilities.wisdom);
    return proficiencyBonus + wisModifier;
  }

  // --- FÄHIGKEITEN-LOGIK ---

  getFeaturesForLevel(level, subclassKey) {
    const features = [];
    const baseFeatures = this.classData.features.filter(f => f.level === level);
    features.push(...baseFeatures);

    if (subclassKey) {
      const subclass = this.classData.subclasses.find(sc => sc.key === subclassKey);
      if (subclass) {
        // HINWEIS: Die Jäger-Features in classes.json haben keine Level-Angabe, außer Stufe 3
        // Wir fügen hier die Stufe-3-Features hinzu.
        const subclassFeatures = subclass.features.filter(f => f.level === level);
        features.push(...subclassFeatures);
      }
    }
    return features;
  }
}