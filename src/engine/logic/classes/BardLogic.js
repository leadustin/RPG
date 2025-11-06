import { getModifier, getProficiencyBonus } from '../../../utils/helpers';

// Zauberplätze (Voll-Zauberwirker)
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

// Bekannte Zauber (Spells Known) Progression für Barden
const BARD_SPELLS_KNOWN = [
  { level: 1, known: 4 }, { level: 2, known: 5 }, { level: 3, known: 6 }, { level: 4, known: 7 },
  { level: 5, known: 8 }, { level: 6, known: 9 }, { level: 7, known: 10 }, { level: 8, known: 11 },
  { level: 9, known: 12 }, { level: 10, known: 14 }, // (10 + 2 Magische Geheimnisse)
  { level: 11, known: 15 }, { level: 12, known: 15 },
  { level: 13, known: 16 }, { level: 14, known: 18 }, // (14 + 4 Magische Geheimnisse)
  { level: 15, known: 19 }, { level: 16, known: 19 },
  { level: 17, known: 20 }, { level: 18, known: 22 }, // (15 + 7 Magische Geheimnisse - Annahme, dass 18 'meisterlich' ist)
  { level: 19, known: 22 }, { level: 20, known: 22 },
];

/**
 * Kapselt die 5E-Logik für die Barden-Klasse.
 */
export class BardLogic {
  constructor(classData, allSpells) {
    this.classData = classData; // Das Barden-Objekt aus classes.json
    this.allSpells = allSpells; // Die *gesamte* spells.json
    
    // Filtert alle Zauber heraus, die in ihrem "classes"-Array "bard" enthalten
    this.classSpells = this.allSpells.filter(spell => spell.classes && spell.classes.includes('bard'));
  }

  getHitPointsPerLevel() {
    return 8;
  }

  getSpellcastingAbility() {
    return 'charisma';
  }
  
  getSavingThrowProficiencies() {
    return this.classData.saving_throws; // ['dexterity', 'charisma']
  }

  /**
   * Holt die *komplette* Barden-Zauberliste (gefiltert).
   * Ein Barde wählt aus dieser Liste seine "bekannten Zauber".
   */
  getAllClassSpells() {
    return this.classSpells;
  }
  
  /**
   * Holt Zauber von *jeder* Klasse für "Magische Geheimnisse" (Stufe 10+).
   * @param {number} maxLevel - Der maximale Zaubergrad, den der Barde wirken kann.
   */
  getMagicalSecretsSpells(maxLevel) {
    return this.allSpells.filter(spell => spell.level <= maxLevel);
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
    if (level < 4) return 2;
    if (level < 10) return 3;
    return 4;
  }

  /**
   * Gibt die Gesamtanzahl der Zauber zurück, die auf einer Stufe bekannt sind.
   * (Beinhaltet "Magische Geheimnisse" auf Stufe 10, 14, 18)
   */
  getKnownSpellsCount(level) {
    const entry = BARD_SPELLS_KNOWN.find(p => p.level === level);
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

  // --- FÄHIGKEITEN-LOGIK ---

  /**
   * Gibt die Anzahl der "Bardische Inspiration"-Nutzungen zurück.
   * Regel: Charisma-Modifikator (min. 1).
   */
  getBardicInspirationUses(character) {
      const chaModifier = getModifier(character.abilities.charisma);
      return Math.max(1, chaModifier);
  }

  /**
   * Gibt den Würfeltyp für "Bardische Inspiration" zurück.
   * (W6, W8, W10, W12)
   */
  getBardicInspirationDie(level) {
    if (level < 5) return '1d6';
    if (level < 10) return '1d8';
    if (level < 15) return '1d10';
    return '1d12';
  }
  
  /**
   * Gibt den Heil-Würfel für "Lied der Erholung" (Stufe 2) zurück.
   * (Nutzt denselben Würfel wie Bardische Inspiration)
   */
  getSongOfRestDie(level) {
     if (level < 2) return null;
     // Die Beschreibung in classes.json (Stufe 6: W8) ist inkonsistent mit Stufe 5 (W8)
     // 5E-Regel: W6 (Lvl 2), W8 (Lvl 9), W10 (Lvl 13), W12 (Lvl 17)
     // Wir folgen der 5E-Regel:
     if (level < 9) return '1d6';
     if (level < 13) return '1d8';
     if (level < 17) return '1d10';
     return '1d12';
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