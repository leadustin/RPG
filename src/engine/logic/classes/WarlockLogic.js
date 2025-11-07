import { getModifier, getProficiencyBonus } from '../../../utils/helpers';
import spells from '../../../data/spells.json';
import allFeatures from '../../../data/features.json'; 

export class WarlockLogic {
  
  /**
   * Erstellt eine Instanz der Hexenmeister-Logik, die an einen bestimmten Charakter gebunden ist.
   * @param {object} character - Das Charakterobjekt, das diese Logik verwendet.
   */
  constructor(character) {
    this.character = character;
    // Paktmagie-Plätze werden direkt auf dem Charakterobjekt verwaltet
    // (z.B. character.resources.pact_magic_slots)
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
    // Hexenmeister sind in Weisheit und Charisma geübt.
    return ['wisdom', 'charisma'];
  }

  // --- Zauber-Logik (Paktmagie) ---

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
   * Ruft die Anzahl der bekannten Zauber des Hexenmeisters ab.
   * @returns {number}
   */
  getKnownSpellsCount() {
    const level = this.character.level;
    // Standard Hexenmeister-Zauberprogression
    if (level === 1) return 2;
    if (level === 2) return 3;
    if (level === 3) return 4;
    if (level === 4) return 5;
    if (level === 5) return 6;
    if (level === 6) return 7;
    if (level === 7) return 8;
    if (level === 8) return 9;
    if (level === 9) return 10;
    if (level === 10) return 10;
    if (level <= 12) return 11;
    if (level <= 14) return 12;
    if (level <= 16) return 13;
    if (level <= 18) return 14;
    if (level >= 19) return 15;
    return 0;
  }

  /**
   * Ruft die *gesamte* Liste der Zauber ab, aus denen der Hexenmeister
   * beim Stufenaufstieg wählen kann.
   * @returns {string[]} Array von Zauberschlüsseln.
   */
  getLearnableSpells() {
    const maxLevel = this.getPactSlotLevel(); // Hexenmeister können nur bis zu ihrem Pakt-Grad lernen
    
    // 1. Standard-Hexenmeister-Liste
    const warlockSpells = spells
      .filter(s => s.classes.includes('warlock') && s.level > 0 && s.level <= maxLevel)
      .map(s => s.key);
      
    // 2. Erweiterte Zauberliste des Schutzpatrons
    const patronSpells = this.getPatronExpandedSpells(maxLevel);
    
    // Duplikate entfernen und zurückgeben
    return [...new Set([...warlockSpells, ...patronSpells])];
  }

  /**
   * Ruft die erweiterten Zauber des Schutzpatrons ab.
   * ANNAHME: spells.json enthält Einträge wie:
   * { "key": "burning_hands", ..., "patron_spell": { "patron": "the_fiend", "level": 1 } }
   * @param {number} maxLevel - Der maximale Zaubergrad, den der Hexenmeister wirken kann.
   * @returns {string[]}
   */
  getPatronExpandedSpells(maxLevel) {
    if (!this.character.subclass) return [];
    
    return spells
      .filter(s => 
        s.patron_spell &&
        s.patron_spell.patron === this.character.subclass &&
        s.patron_spell.level <= maxLevel
      )
      .map(s => s.key);
  }

  // --- PAKTMAGIE-LOGIK ---

  /**
   * Ruft die Anzahl der Paktmagie-Plätze ab.
   * @returns {number}
   */
  getPactSlotCount() {
    const level = this.character.level;
    if (level === 1) return 1;
    if (level <= 10) return 2;
    if (level <= 16) return 3;
    if (level >= 17) return 4;
    return 0;
  }

  /**
   * Ruft den Grad (Level) der Paktmagie-Plätze ab.
   * @returns {number}
   */
  getPactSlotLevel() {
    const level = this.character.level;
    if (level <= 2) return 1;
    if (level <= 4) return 2;
    if (level <= 6) return 3;
    if (level <= 8) return 4;
    if (level >= 9) return 5;
    return 1;
  }

  /**
   * Wird aufgerufen, wenn der Hexenmeister eine kurze Rast beendet.
   * Füllt alle Paktmagie-Plätze auf.
   */
  onShortRest() {
    // Paktmagie auffüllen
    // (Annahme: character.resources.pact_magic_slots)
    if (this.character.resources) {
      this.character.resources.pact_magic_slots = this.getPactSlotCount();
    }
  }

  // --- MYSTISCHE ANRUFUNGEN (Eldritch Invocations) ---

  /**
   * Ruft alle "Mystischen Anrufungen" ab, die der Charakter gelernt hat.
   * (Wird von der UI/Kampf-Engine aufgerufen)
   * @returns {object[]} Array von Feature-Objekten.
   */
  getAvailableInvocations() {
    // Filtert alle gelernten Features, die vom Typ 'invocation' sind
    return this.character.features
      .map(key => allFeatures.find(f => f.key === key))
      .filter(feature => feature && feature.feature_type === 'invocation');
  }

  // --- SUBKLASSEN-LOGIK ---

  /**
   * Prüft auf 'Segen des Dunklen' (Dark One's Blessing) und gibt die Temp-TP zurück.
   * (Wird von der Kampf-Engine aufgerufen, WENN der Hexenmeister eine Kreatur auf 0 TP bringt)
   * @returns {number} - Die Höhe der temporären TP.
   */
  getDarkOnesBlessingTempHp() {
    // Liest 'the_fiend_dark_ones_blessing' aus features.json
    if (this.hasFeature('the_fiend_dark_ones_blessing')) {
      // Regel: CHA-Mod + Hexenmeister-Level
      const chaMod = getModifier(this.character.abilities.charisma);
      return chaMod + this.character.level;
    }
    return 0;
  }
}