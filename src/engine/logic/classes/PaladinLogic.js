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

// Eid der Hingabe (Domänenzauber)
const DEVOTION_OATH_SPELLS = {
  3: ['protection_from_evil_and_good', 'sanctuary'],
  5: ['lesser_restoration', 'zone_of_truth'],
  9: ['beacon_of_hope', 'dispel_magic'],
  13: ['freedom_of_movement', 'guardian_of_faith'],
  17: ['commune', 'flame_strike'],
};

/**
 * Kapselt die 5E-Logik für die Paladin-Klasse.
 */
export class PaladinLogic {
  constructor(classData, allSpells) {
    this.classData = classData; // Das Paladin-Objekt aus classes.json
    this.allSpells = allSpells; // Die *gesamte* spells.json
    
    // Filtert alle Zauber heraus, die in ihrem "classes"-Array "paladin" enthalten
    this.classSpells = this.allSpells.filter(spell => spell.classes && spell.classes.includes('paladin'));
  }

  getHitPointsPerLevel() {
    return 10;
  }

  getSpellcastingAbility() {
    return 'charisma';
  }
  
  getSavingThrowProficiencies() {
    return this.classData.saving_throws; // ['wisdom', 'charisma']
  }

  /**
   * Holt die *komplette* Paladin-Zauberliste (gefiltert).
   * Ein Paladin bereitet aus dieser Liste vor.
   */
  getAllClassSpells() {
    return this.classSpells;
  }

  getCantrips() {
    return []; // Paladine haben keine Zaubertricks
  }

  getKnownCantripsCount(level) {
    return 0;
  }

  /**
   * Berechnet die maximal vorbereitbaren Zauber (ab Stufe 2).
   * (Regel: Charisma-Modifikator + halbes Paladin-Level, aufgerundet, min. 1)
   */
  getMaxPreparedSpells(character) {
    if (character.level < 2) return 0;
    const chaModifier = getModifier(character.abilities.charisma);
    const halfLevel = Math.max(1, Math.floor(character.level / 2));
    return Math.max(1, chaModifier + halfLevel);
  }

  /**
   * Holt die Eid-Zauber (Oath Spells).
   * Diese Zauber sind *immer* vorbereitet und zählen nicht gegen das Limit.
   */
  getOathSpells(subclassKey, level) {
    const oathSpells = [];
    if (subclassKey === 'oath_of_devotion') {
      for (const spellLevel in DEVOTION_OATH_SPELLS) {
        if (level >= parseInt(spellLevel, 10)) {
          oathSpells.push(...DEVOTION_OATH_SPELLS[spellLevel]);
        }
      }
    }
    // TODO: Andere Eide hier hinzufügen
    return oathSpells;
  }

  getSpellSlots(level) {
    const entry = HALF_CASTER_SLOTS.find(p => p.level === level);
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
   * Gibt den maximalen Heil-Pool für "Handauflegen" (Level 1) zurück.
   * Regel: Paladin-Level * 5.
   */
  getLayOnHandsPool(level) {
    return level * 5;
  }

  /**
   * Berechnet den Schaden für "Göttliches Niederstrecken" (Divine Smite, Level 2).
   * @param {number} slotLevel - Der Grad des verbrauchten Zauberplatzes (1-5).
   * @param {string} targetType - Der Typ des Ziels (z.B. "fiend", "undead", "humanoid").
   * @returns {string} Die Schadenswürfel-Notation (z.B. "3d8").
   */
  getDivineSmiteDamage(slotLevel, targetType) {
    if (slotLevel < 1) return "0";
    
    // Max. Schaden ist 5W8 (oder 6W8 vs. Untote/Unholde)
    let diceCount = Math.min(slotLevel + 1, 5); 
    
    // Bonus-Schaden gegen Untote und Unholde
    if (targetType === 'undead' || targetType === 'fiend') {
      diceCount = Math.min(diceCount + 1, 6);
    }
    
    return `${diceCount}d8`;
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