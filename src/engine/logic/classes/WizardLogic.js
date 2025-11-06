import { getModifier, getProficiencyBonus } from '../../../utils/helpers';

// Die 1-20 Level-Tabelle für Zauberplätze von Voll-Zauberwirkern (Magier, Kleriker, etc.)
const FULL_CASTER_SLOTS = [
  { level: 1, slots: { 1: 2 } },
  { level: 2, slots: { 1: 3 } },
  { level: 3, slots: { 1: 4, 2: 2 } },
  { level: 4, slots: { 1: 4, 2: 3 } },
  { level: 5, slots: { 1: 4, 2: 3, 3: 2 } },
  { level: 6, slots: { 1: 4, 2: 3, 3: 3 } },
  { level: 7, slots: { 1: 4, 2: 3, 3: 3, 4: 1 } },
  { level: 8, slots: { 1: 4, 2: 3, 3: 3, 4: 2 } },
  { level: 9, slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 1 } },
  { level: 10, slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2 } },
  { level: 11, slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 } },
  { level: 12, slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 } },
  { level: 13, slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 } },
  { level: 14, slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1 } },
  { level: 15, slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 } },
  { level: 16, slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1 } },
  { level: 17, slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1, 7: 1, 8: 1, 9: 1 } },
  { level: 18, slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 1, 7: 1, 8: 1, 9: 1 } },
  { level: 19, slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 1, 8: 1, 9: 1 } },
  { level: 20, slots: { 1: 4, 2: 3, 3: 3, 4: 3, 5: 3, 6: 2, 7: 2, 8: 1, 9: 1 } },
];

/**
 * Kapselt die 5E-Logik für die Magier-Klasse.
 */
export class WizardLogic {
  constructor(classData, allSpells) {
    this.classData = classData; // Das Magier-Objekt aus classes.json
    this.allSpells = allSpells; // Die *gesamte* spells.json
    
    // Filtert alle Zauber heraus, die in ihrem "classes"-Array "wizard" enthalten
    this.classSpells = this.allSpells.filter(spell => spell.classes && spell.classes.includes('wizard'));
  }

  /**
   * Gibt die Trefferpunkte pro Stufe für einen Magier zurück (W6).
   */
  getHitPointsPerLevel() {
    return 6;
  }

  /**
   * Gibt das Haupt-Zauberattribut zurück.
   */
  getSpellcastingAbility() {
    return 'intelligence';
  }
  
  /**
   * Gibt die Rettungswurf-Kompetenzen zurück.
   */
  getSavingThrowProficiencies() {
    return this.classData.saving_throws; // ['intelligence', 'wisdom']
  }

  /**
   * Holt die *komplette* Magier-Zauberliste (gefiltert).
   */
  getAllClassSpells() {
    return this.classSpells;
  }

  /**
   * Holt die Zaubertricks (Level 0) aus der Klassenliste.
   */
  getCantrips() {
    return this.classSpells.filter(spell => spell.level === 0);
  }

  /**
   * Holt die Zauber des 1. Grades und höher (für das Zauberbuch).
   */
  getLearnableSpells() {
     return this.classSpells.filter(spell => spell.level > 0);
  }

  /**
   * Berechnet die maximal vorbereitbaren Zauber.
   * (Regel: Magier-Stufe + Intelligenz-Modifikator)
   * @param {object} character - Das Charakter-Objekt (muss level und abilities.intelligence haben)
   */
  getMaxPreparedSpells(character) {
    const intModifier = getModifier(character.abilities.intelligence);
    return Math.max(1, character.level + intModifier); // Minimal 1 Zauber
  }

  /**
   * Gibt die Anzahl der Zaubertricks zurück, die auf einer Stufe bekannt sind.
   * @param {number} level - Die Stufe des Magiers
   */
  getKnownCantripsCount(level) {
    if (level < 4) return 3;
    if (level < 10) return 4;
    return 5;
  }
  
  /**
   * Regel für Magier-Zauberbuch auf Stufe 1.
   * @returns {number} 6
   */
  getStartingSpellbookCount() {
    return 6; // Magier starten mit 6 Zaubern der Stufe 1
  }
  
  /**
   * Regel für das Hinzufügen von Zaubern beim Stufenaufstieg (Magier).
   * @returns {number} 2
   */
  getNewSpellsPerLevelUp() {
    return 2; // Magier fügen 2 neue Zauber pro Stufenaufstieg hinzu
  }

  /**
   * Gibt die Zauberplätze pro Stufe zurück.
   * @param {number} level - Die Stufe des Magiers
   */
  getSpellSlots(level) {
    const entry = FULL_CASTER_SLOTS.find(p => p.level === level);
    return entry ? entry.slots : {};
  }

  /**
   * Berechnet den Rettungswurf-Schwierigkeitsgrad (Spell Save DC).
   * Regel: 8 + Übungsbonus + Intelligenz-Modifikator
   * @param {object} character - Das Charakter-Objekt
   */
  getSpellSaveDC(character) {
    const proficiencyBonus = getProficiencyBonus(character.level);
    const intModifier = getModifier(character.abilities.intelligence);
    return 8 + proficiencyBonus + intModifier;
  }

  /**
   * Berechnet den Zauberangriffsbonus (Spell Attack Bonus).
   * Regel: Übungsbonus + Intelligenz-Modifikator
   * @param {object} character - Das Charakter-Objekt
   */
  getSpellAttackBonus(character) {
    const proficiencyBonus = getProficiencyBonus(character.level);
    const intModifier = getModifier(character.abilities.intelligence);
    return proficiencyBonus + intModifier;
  }

  /**
   * Holt die spezifischen Fähigkeiten, die auf einer Stufe freigeschaltet werden,
   * sowohl Basis-Fähigkeiten als auch die der Unterklasse.
   * @param {number} level - Die neue Stufe
   * @param {string} subclassKey - z.B. "school_of_evocation"
   * @returns {Array} Ein Array von Feature-Objekten
   */
  getFeaturesForLevel(level, subclassKey) {
    const features = [];
    
    // Basisfähigkeiten des Magiers
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

  // --- IMPLEMENTIERUNG DER FÄHIGKEITEN-LOGIK ---

  /**
   * Implementiert die Logik für "Arkane Erholung" (Level 1).
   * @param {number} wizardLevel - Die Stufe des Magiers.
   * @returns {number} Die Gesamtmenge an Zaubergraden, die wiederhergestellt werden kann.
   */
  getArcaneRecoveryValue(wizardLevel) {
    if (wizardLevel < 1) return 0;
    // Regel: Hälfte des Magier-Levels, aufgerundet, mind. 1
    return Math.max(1, Math.ceil(wizardLevel / 2));
  }
  
  /**
   * Implementiert die Logik für "Hervorrufungs-Gelehrter" (Evocation Level 2).
   * Berechnet die Kosten für das Kopieren eines Zaubers ins Zauberbuch.
   * @param {object} spell - Das Zauber-Objekt
   * @param {boolean} isEvocationSpecialist - True, wenn "school_of_evocation" gewählt wurde
   * @returns {object} { gold: number, timeInHours: number }
   */
  getSpellCopyCost(spell, isEvocationSpecialist) {
    // 5E-Regel: 50 GM und 2 Stunden pro Zaubergrad
    let goldCost = spell.level * 50;
    let timeCost = spell.level * 2;
    
    // Regel "Hervorrufungs-Gelehrter"
    if (isEvocationSpecialist && spell.school === 'evocation') {
      goldCost /= 2;
      timeCost /= 2;
    }
    
    return { gold: goldCost, timeInHours: timeCost };
  }

  /**
   * Prüft, ob die Logik "Mächtige Zaubertricks" (Evocation Level 6)
   * auf einen Zauber anwendbar ist (halber Schaden bei Rettungswurf-Erfolg).
   * @param {object} spell - Das Zauber-Objekt aus spells.json
   */
  isPotentCantrip(spell) {
    // Regel: Gilt für Magier-Zaubertricks, die einen Rettungswurf erfordern
    return (spell.level === 0 && spell.saving_throw);
  }
   
  /**
   * Berechnet den Bonusschaden für "Ermächtigte Hervorrufung" (Evocation Level 10).
   * Addiert INT-Modifikator zu *einem* Schadenswurf eines Hervorrufungszaubers.
   * @param {object} spell - Das Zauber-Objekt
   * @param {object} character - Das Charakter-Objekt
   * @returns {number} Der zusätzliche Schaden
   */
  getEmpoweredEvocationBonus(spell, character) {
    // Regel: Gilt für Magier-Hervorrufungszauber
    if (spell.school === 'evocation' && spell.classes.includes('wizard')) {
      // Regel: Bonus ist gleich dem INT-Modifikator
      return getModifier(character.abilities.intelligence);
    }
    return 0;
  }
}