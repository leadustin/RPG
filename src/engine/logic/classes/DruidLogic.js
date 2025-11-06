import { getModifier, getProficiencyBonus } from '../../../utils/helpers';

// Zauberplätze (identisch mit Kleriker/Magier)
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

/**
 * Kapselt die 5E-Logik für die Druiden-Klasse.
 */
export class DruidLogic {
  constructor(classData, allSpells, allBeasts) {
    this.classData = classData; // Das Druiden-Objekt aus classes.json
    this.allSpells = allSpells; // Die *gesamte* spells.json
    this.allBeasts = allBeasts; // Die *gesamte* beasts.json
    
    this.classSpells = this.allSpells.filter(spell => spell.classes && spell.classes.includes('druid'));
  }

  getHitPointsPerLevel() {
    return 8;
  }

  getSpellcastingAbility() {
    return 'wisdom';
  }
  
  getSavingThrowProficiencies() {
    return this.classData.saving_throws; // ['intelligence', 'wisdom']
  }

  getAllClassSpells() {
    return this.classSpells;
  }

  getCantrips() {
    return this.classSpells.filter(spell => spell.level === 0);
  }

  getKnownCantripsCount(level) {
    if (level < 4) return 2;
    if (level < 10) return 3;
    return 4;
  }

  /**
   * Berechnet die maximal vorbereitbaren Zauber.
   * (Regel: Druiden-Stufe + Weisheits-Modifikator)
   */
  getMaxPreparedSpells(character) {
    const wisModifier = getModifier(character.abilities.wisdom);
    return Math.max(1, character.level + wisModifier); // Minimal 1 Zauber
  }
  
  /**
   * Holt die Domänenzauber (Zirkelzauber) für den Zirkel des Landes.
   * @param {string} subclassKey - z.B. "circle_of_the_land"
   * @param {number} level - Die Stufe des Druiden
   * @returns {string[]} Eine Liste von Zauber-Schlüsseln (keys)
   */
  getCircleSpells(subclassKey, level) {
    // TODO: Implementiere die Zirkelzauber-Listen (z.B. Arktis, Küste etc.)
    // ähnlich wie die Domänenzauber des Klerikers.
    // (Diese Zauber sind immer vorbereitet und zählen nicht gegen das Limit)
    
    // Beispiel (angenommen, 'Wald'-Zirkel wurde gewählt):
    const forestSpells = {
      3: ['barkskin', 'spider_climb'],
      5: ['call_lightning', 'plant_growth'],
      // ... etc.
    };
    
    const circleSpells = [];
    if (subclassKey === 'circle_of_the_land') {
       // Hier müsste die Logik für den gewählten Land-Typ implementiert werden.
       // Wir nehmen hier 'Wald' als Beispiel an:
       for (const spellLevel in forestSpells) {
         if (level >= parseInt(spellLevel, 10)) {
           circleSpells.push(...forestSpells[spellLevel]);
         }
       }
    }
    return circleSpells;
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

  // --- TIERGESTALT (WILD SHAPE) LOGIK ---

  /**
   * Gibt die Anzahl der Tiergestalt-Nutzungen zurück.
   * Regel: 2 pro kurzer oder langer Rast.
   */
  getWildShapeUses(level) {
    if (level < 2) return 0;
    return 2;
  }

  /**
   * Gibt den maximalen Herausforderungsgrad (CR) für die Tiergestalt zurück.
   * (Diese Logik ist für Basis-Druiden, NICHT Zirkel des Mondes)
   */
  getWildShapeMaxCR(level) {
    if (level < 4) return 0.25; // 1/4
    if (level < 8) return 0.5; // 1/2
    return 1.0;
  }

  /**
   * Filtert die 'beasts.json'-Liste, um nur gültige Formen für die Stufe des Druiden anzuzeigen.
   * @param {number} level - Die Stufe des Druiden
   * @param {string} subclassKey - (Wichtig für Zirkel des Mondes, noch nicht implementiert)
   */
  getAvailableWildShapes(level, subclassKey) {
    if (level < 2) return [];

    const maxCR = this.getWildShapeMaxCR(level);
    
    return this.allBeasts.filter(beast => {
      // 1. CR-Prüfung
      if (beast.cr > maxCR) return false;

      // 2. Bewegungs-Prüfung (Basis-Druide)
      if (level < 4 && (beast.movement.swim > 0 || beast.movement.fly > 0)) {
         // Stufe 2-3: Kein Schwimmen, kein Fliegen
         return false;
      }
      if (level < 8 && beast.movement.fly > 0) {
         // Stufe 4-7: Kein Fliegen
         return false;
      }
      
      return true;
    });
  }
  
  /**
   * Implementiert "Natürliche Erholung" (Zirkel des Landes, Stufe 2).
   * @param {number} druidLevel - Die Stufe des Druiden.
   * @returns {number} Die Gesamtmenge an Zaubergraden, die wiederhergestellt werden kann (1x pro langer Rast).
   */
  getNaturalRecoveryValue(druidLevel) {
    if (druidLevel < 2) return 0;
    // Regel: Hälfte des Druiden-Levels, aufgerundet
    return Math.max(1, Math.ceil(druidLevel / 2));
  }
}