import { getModifier, getProficiencyBonus } from '../../../utils/helpers';

// Bekannte Zauber (Spells Known) Progression für Hexenmeister
const WARLOCK_SPELLS_KNOWN = [
  { level: 1, known: 2 }, { level: 2, known: 3 }, { level: 3, known: 4 }, { level: 4, known: 5 },
  { level: 5, known: 6 }, { level: 6, known: 7 }, { level: 7, known: 8 }, { level: 8, known: 9 },
  { level: 9, known: 10 }, { level: 10, known: 10 }, { level: 11, known: 11 }, { level: 12, known: 11 },
  { level: 13, known: 12 }, { level: 14, known: 12 }, { level: 15, known: 13 }, { level: 16, known: 13 },
  { level: 17, known: 14 }, { level: 18, known: 14 }, { level: 19, known: 15 }, { level: 20, known: 15 },
];

// Paktmagie (Pact Magic) Progression für Hexenmeister
// Dies definiert die *Anzahl* der Plätze und den *Grad* dieser Plätze.
const WARLOCK_PACT_SLOTS = [
  { level: 1, slots: 1, slotLevel: 1 }, { level: 2, slots: 2, slotLevel: 1 },
  { level: 3, slots: 2, slotLevel: 2 }, { level: 4, slots: 2, slotLevel: 2 },
  { level: 5, slots: 2, slotLevel: 3 }, { level: 6, slots: 2, slotLevel: 3 },
  { level: 7, slots: 2, slotLevel: 4 }, { level: 8, slots: 2, slotLevel: 4 },
  { level: 9, slots: 2, slotLevel: 5 }, { level: 10, slots: 2, slotLevel: 5 },
  { level: 11, slots: 3, slotLevel: 5 }, { level: 12, slots: 3, slotLevel: 5 },
  { level: 13, slots: 3, slotLevel: 5 }, { level: 14, slots: 3, slotLevel: 5 },
  { level: 15, slots: 3, slotLevel: 5 }, { level: 16, slots: 3, slotLevel: 5 },
  { level: 17, slots: 4, slotLevel: 5 }, { level: 18, slots: 4, slotLevel: 5 },
  { level: 19, slots: 4, slotLevel: 5 }, { level: 20, slots: 4, slotLevel: 5 },
];

/**
 * Kapselt die 5E-Logik für die Hexenmeister-Klasse.
 */
export class WarlockLogic {
  constructor(classData, allSpells) {
    this.classData = classData; // Das Hexenmeister-Objekt aus classes.json
    this.allSpells = allSpells; // Die *gesamte* spells.json
    
    // Filtert alle Zauber heraus, die in ihrem "classes"-Array "warlock" enthalten
    this.classSpells = this.allSpells.filter(spell => spell.classes && spell.classes.includes('warlock'));
  }

  getHitPointsPerLevel() {
    return 8;
  }

  getSpellcastingAbility() {
    return 'charisma';
  }
  
  getSavingThrowProficiencies() {
    return this.classData.saving_throws; // ['wisdom', 'charisma']
  }

  /**
   * Holt die *komplette* Hexenmeister-Zauberliste (gefiltert).
   * Ein Hexenmeister wählt aus dieser Liste seine "bekannten Zauber".
   */
  getAllClassSpells() {
    return this.classSpells;
  }

  getCantrips() {
    return this.classSpells.filter(spell => spell.level === 0);
  }

  getLearnableSpells() {
     // Hexenmeister-Paktzauber können nur bis Grad 5 gehen
     return this.classSpells.filter(spell => spell.level > 0 && spell.level <= 5);
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
   * (Mystisches Arkanum (Stufe 6-9 Zauber) wird separat gehandhabt)
   */
  getKnownSpellsCount(level) {
    const entry = WARLOCK_SPELLS_KNOWN.find(p => p.level === level);
    return entry ? entry.known : 0;
  }

  /**
   * Gibt die Pakt-Zauberplätze zurück (einzigartig für Hexenmeister).
   * @param {number} level - Die Stufe des Hexenmeisters
   * @returns {object} { slots: number, slotLevel: number }
   */
  getPactSpellSlots(level) {
    const entry = WARLOCK_PACT_SLOTS.find(p => p.level === level);
    return entry ? { slots: entry.slots, slotLevel: entry.slotLevel } : { slots: 0, slotLevel: 0 };
  }

  /**
   * HINWEIS: 'getSpellSlots' (Plural) gibt die Standard-Tabelle zurück,
   * die für den Hexenmeister NICHT verwendet wird, außer zur Kompatibilität.
   * Verwende 'getPactSpellSlots' für die Logik.
   */
  getSpellSlots(level) {
    // Diese Methode ist für Hexenmeister-Paktmagie irrelevant,
    // aber wir implementieren sie, falls die UI sie erwartet.
    const pactInfo = this.getPactSpellSlots(level);
    if (pactInfo.slotLevel > 0) {
      // Erzeugt ein Objekt wie { 5: 2 } (für Stufe 9)
      return { [pactInfo.slotLevel]: pactInfo.slots };
    }
    return {};
  }
  
  /**
   * Holt "Mystisches Arkanum" (Stufe 6, 7, 8, 9 Zauber).
   * Diese sind 1x pro langer Rast nutzbar und sind *keine* Paktzauber.
   */
  getMysticArcanum(level) {
    const arcanums = {};
    if (level >= 11) arcanums[6] = 1;
    if (level >= 13) arcanums[7] = 1;
    if (level >= 15) arcanums[8] = 1;
    if (level >= 17) arcanums[9] = 1;
    return arcanums;
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
   * Gibt die Anzahl der Mystischen Anrufungen (Invocations) zurück.
   */
  getInvocationsKnownCount(level) {
    if (level < 2) return 0;
    if (level < 5) return 2;
    if (level < 7) return 3;
    if (level < 9) return 4;
    if (level < 12) return 5;
    if (level < 15) return 6;
    if (level < 18) return 7;
    return 8;
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