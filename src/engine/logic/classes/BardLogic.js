import { getModifier, getProficiencyBonus } from '../../../utils/helpers';
import spells from '../../../data/spells.json';
// allFeatures wird nicht direkt benötigt, da die Engine die Features des Charakters prüft

export class BardLogic {
  
  /**
   * Erstellt eine Instanz der Barden-Logik, die an einen bestimmten Charakter gebunden ist.
   * @param {object} character - Das Charakterobjekt, das diese Logik verwendet.
   */
  constructor(character) {
    this.character = character;
    // Ressourcen (z.B. Bardische Inspiration) werden auf dem Charakterobjekt verwaltet
    // (z.B. character.resources.bardic_inspiration)
  }

  /**
   * Prüft schnell, ob der Charakter ein bestimmtes Feature besitzt.
   * @param {string} featureKey - Der Schlüssel des Features.
   * @returns {boolean}
   */
  hasFeature(featureKey) {
    return this.character.features.includes(featureKey);
  }

  // --- Grundlegende Klassen-Informationen ---

  getSavingThrowProficiencies() {
    // Barden sind in Geschicklichkeit und Charisma geübt.
    return ['dexterity', 'charisma'];
  }

  // --- Zauber-Logik (Bekannte Zauber) ---

  getSpellcastingAbility() {
    return 'charisma';
  }

  getSpellSaveDC() {
    const chaMod = getModifier(this.character.abilities.charisma);
    const profBonus = getProficiencyBonus(this.character.level);
    return 8 + profBonus + chaMod;
  }

  getSpellAttackBonus() {
    const chaMod = getModifier(this.character.abilities.charisma);
    const profBonus = getProficiencyBonus(this.character.level);
    return profBonus + chaMod;
  }

  /**
   * Ruft die Anzahl der Zauber ab, die ein Barde *kennen* kann.
   * (Barden bereiten nicht vor, sie haben eine feste Liste bekannter Zauber).
   * @returns {number}
   */
  getKnownSpellsCount() {
    const level = this.character.level;
    // Standard Barden-Zauberprogression
    if (level === 1) return 4;
    if (level === 2) return 5;
    if (level === 3) return 6;
    if (level === 4) return 7;
    if (level === 5) return 8;
    if (level === 6) return 9;
    if (level === 7) return 10;
    if (level === 8) return 11;
    if (level === 9) return 12;
    if (level === 10) return 14; // Inkl. 2 Magische Geheimnisse
    if (level === 11) return 15;
    if (level === 12) return 15;
    if (level === 13) return 16;
    if (level === 14) return 18; // Inkl. 2 Magische Geheimnisse
    if (level === 15) return 19;
    if (level === 16) return 19;
    if (level === 17) return 20;
    if (level === 18) return 22; // Inkl. 2 Magische Geheimnisse
    if (level >= 19) return 22;
    return 0;
  }

  /**
   * Ruft die *gesamte* Liste der Zauber ab, aus denen der Barde
   * beim Stufenaufstieg wählen kann.
   * @returns {string[]} Array von Zauberschlüsseln.
   */
  getLearnableSpells() {
    const maxLevel = this.character.spellSlots.maxLevel;
    
    // Annahme: spells.json verwendet "caster_class": "bard"
    return spells
      .filter(s => s.caster_class === 'bard' && s.level > 0 && s.level <= maxLevel)
      .map(s => s.key);
  }
  
  /**
   * Ruft die Anzahl der "Magischen Geheimnisse"-Auswahlen ab,
   * die ein Barde auf *diesem* Level erhält.
   * (Wird von der Level-Up-Engine aufgerufen).
   * @returns {number}
   */
  getMagicalSecretsPicksForLevel() {
    const level = this.character.level;
    let picks = 0;
    
    // Basis-Klasse
    if (level === 10 || level === 14 || level === 18) {
      picks += 2;
    }
    
    // Subklasse: Kolleg des Wissens
    if (level === 6 && this.hasFeature('college_of_lore_additional_magical_secrets')) { // Annahme: Key aus features.json
      picks += 2;
    }
    
    return picks;
  }

  // --- BARDISCHE INSPIRATION LOGIK ---

  /**
   * Ruft den Würfeltyp für die Bardische Inspiration ab.
   * @returns {string} - Die Schadenswürfel-Notation (z.B. "1d6", "1d8").
   */
  getInspirationDice() {
    const level = this.character.level;
    // Gelesen aus classes.json Feature-Liste
    if (level >= 15) return '1d12';
    if (level >= 10) return '1d10';
    if (level >= 5) return '1d8';
    return '1d6';
  }

  /**
   * Ruft die maximale Anzahl der Inspiration-Nutzungen ab.
   * Regel: Charisma-Modifikator (min. 1).
   * @returns {number}
   */
  getMaxInspirationUses() {
    return Math.max(1, getModifier(this.character.abilities.charisma));
  }

  /**
   * Wird aufgerufen, wenn der Barde eine kurze Rast beendet.
   */
  onShortRest() {
    // 'Quelle der Inspiration' (Stufe 5)
    if (this.hasFeature('quelle_der_inspiration')) {
      // Inspiration auffüllen
      if (this.character.resources) {
        this.character.resources.bardic_inspiration = this.getMaxInspirationUses();
      }
    }
  }
  
  /**
   * Wird aufgerufen, wenn der Barde eine lange Rast beendet.
   */
  onLongRest() {
    // Inspiration immer auffüllen
    if (this.character.resources) {
      this.character.resources.bardic_inspiration = this.getMaxInspirationUses();
    }
  }

  // --- SUBKLASSEN-LOGIK (Signale an die Kampf-Engine) ---

  /**
   * Prüft, ob der Barde die Reaktion "Schneidende Worte" (Cutting Words) nutzen kann.
   * @returns {boolean}
   */
  canUseCuttingWords() {
    return this.hasFeature('schneidende_worte'); // Key aus classes.json
  }

  /**
   * Prüft, ob der Barde "Kampfinspiration" (Combat Inspiration) hat.
   * (Signalisiert der Engine, dass Inspirationswürfel für Schaden/RK genutzt werden können)
   * @returns {boolean}
   */
  hasCombatInspiration() {
    return this.hasFeature('kampfinspiration'); // Key aus classes.json
  }
}