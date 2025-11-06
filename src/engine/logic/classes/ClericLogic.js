import { getModifier, getProficiencyBonus } from '../../../utils/helpers';

// Zauberplätze (identisch mit Magier/Zauberer)
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

// Die Domänenzauber (Domain Spells) für die Domäne des Lebens
// HINWEIS: 'bless' und 'cure_wounds' etc. müssen in spells.json existieren!
const LIFE_DOMAIN_SPELLS = {
  1: ['bless', 'cure_wounds'],
  3: ['lesser_restoration', 'spiritual_weapon'],
  5: ['beacon_of_hope', 'revivify'],
  7: ['death_ward', 'guardian_of_faith'],
  9: ['mass_cure_wounds', 'raise_dead'],
};

/**
 * Kapselt die 5E-Logik für die Kleriker-Klasse.
 */
export class ClericLogic {
  constructor(classData, allSpells) {
    this.classData = classData; // Das Kleriker-Objekt aus classes.json
    this.allSpells = allSpells; // Die *gesamte* spells.json
    
    // Filtert alle Zauber heraus, die in ihrem "classes"-Array "cleric" enthalten
    this.classSpells = this.allSpells.filter(spell => spell.classes && spell.classes.includes('cleric'));
  }

  getHitPointsPerLevel() {
    return 8;
  }

  getSpellcastingAbility() {
    return 'wisdom';
  }
  
  getSavingThrowProficiencies() {
    return this.classData.saving_throws; // ['wisdom', 'charisma']
  }

  /**
   * Holt die *komplette* Kleriker-Zauberliste (gefiltert).
   * Ein Kleriker hat Zugriff auf alle diese Zauber zur Vorbereitung.
   */
  getAllClassSpells() {
    return this.classSpells;
  }

  getCantrips() {
    return this.classSpells.filter(spell => spell.level === 0);
  }

  /**
   * Gibt die Anzahl der Zaubertricks zurück, die auf einer Stufe bekannt sind.
   */
  getKnownCantripsCount(level) {
    if (level < 4) return 3;
    if (level < 10) return 4;
    return 5;
  }

  /**
   * Berechnet die maximal vorbereitbaren Zauber.
   * (Regel: Kleriker-Stufe + Weisheits-Modifikator)
   * @param {object} character - Das Charakter-Objekt (muss level und abilities.wisdom haben)
   */
  getMaxPreparedSpells(character) {
    const wisModifier = getModifier(character.abilities.wisdom);
    return Math.max(1, character.level + wisModifier); // Minimal 1 Zauber
  }

  /**
   * Holt die Domänenzauber (Domain Spells) für die Stufe des Charakters.
   * Diese Zauber sind *immer* vorbereitet und zählen nicht gegen das Limit.
   * @param {string} subclassKey - z.B. "life_domain"
   * @param {number} level - Die Stufe des Klerikers
   * @returns {string[]} Eine Liste von Zauber-Schlüsseln (keys)
   */
  getDomainSpells(subclassKey, level) {
    const domainSpells = [];
    if (subclassKey === 'life_domain') {
      for (const spellLevel in LIFE_DOMAIN_SPELLS) {
        if (level >= parseInt(spellLevel, 10)) {
          domainSpells.push(...LIFE_DOMAIN_SPELLS[spellLevel]);
        }
      }
    }
    // TODO: Andere Domänen hier hinzufügen
    
    return domainSpells;
  }

  getSpellSlots(level) {
    const entry = FULL_CASTER_SLOTS.find(p => p.level === level);
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
   * Berechnet den Bonus-Heilwert für "Jünger des Lebens" (Domäne des Lebens, Stufe 1).
   * Regel: 2 + Grad des Zaubers.
   * @param {number} spellLevel - Der Grad des gewirkten Heilzaubers.
   * @returns {number} Die zusätzliche Heilung.
   */
  getDiscipleOfLifeBonus(spellLevel) {
    if (spellLevel <= 0) return 0; // Gilt nicht für Zaubertricks
    return 2 + spellLevel;
  }
}