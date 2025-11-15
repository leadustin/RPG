import { getModifier, getProficiencyBonus } from '../../../utils/helpers';
import allFeatures from '../../../data/features.json'; 
import spells from '../../../data/spells.json'; // Für Arkaner Betrüger

export class RogueLogic {
  
  /**
   * Erstellt eine Instanz der Schurken-Logik, die an einen bestimmten Charakter gebunden ist.
   * @param {object} character - Das Charakterobjekt, das diese Logik verwendet.
   */
  constructor(character) {
    this.character = character;
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
    // Schurken sind in Geschicklichkeit und Intelligenz geübt.
    return ['dexterity', 'intelligence'];
  }

  // --- KAMPF-LOGIK (Hinterhältiger Angriff) ---

  /**
   * Ruft den Schadenswürfel für den "Hinterhältigen Angriff" (Sneak Attack) ab.
   * @returns {string} - Die Schadenswürfel-Notation (z.B. "1d6", "5d6").
   */
  getSneakAttackDamage() {
    const level = this.character.level;
    let diceCount = 0;

    // Regel: 1W6 auf Stufe 1, erhöht sich alle 2 Stufen (ungerade Stufen)
    if (level >= 19) diceCount = 10;
    else if (level >= 17) diceCount = 9;
    else if (level >= 15) diceCount = 8;
    else if (level >= 13) diceCount = 7;
    else if (level >= 11) diceCount = 6;
    else if (level >= 9) diceCount = 5;
    else if (level >= 7) diceCount = 4;
    else if (level >= 5) diceCount = 3;
    else if (level >= 3) diceCount = 2;
    else if (level >= 1) diceCount = 1;

    return `${diceCount}d6`;
  }

  // --- SUBKLASSEN-LOGIK (Signale an die Spiel-Engine) ---

  /**
   * Ruft die erweiterten Optionen für "Listige Aktion" (Cunning Action) ab.
   * (Wird von der Kampf-Engine aufgerufen, um Bonusaktionen zu bestimmen)
   * @returns {string[]} - Ein Array von zusätzlichen Bonusaktionen.
   */
  getFastHandsOptions() {
    // Liest 'thief_fast_hands' aus features.json
    if (this.hasFeature('thief_fast_hands')) {
      const mechanics = allFeatures.find(f => f.key === 'thief_fast_hands')?.mechanics;
      if (mechanics) {
        return mechanics.options; // ['sleight_of_hand', 'thieves_tools', 'use_an_object']
      }
    }
    return [];
  }

  /**
   * Prüft auf die 'Meucheln'-Fähigkeit (Assassinate).
   * (Wird von der Kampf-Engine zu Beginn des Kampfes und bei Angriffen aufgerufena)
   * @returns {object|null} - Die Mechanik-Regeln oder null.
   */
  getAssassinateRules() {
    if (this.hasFeature('assassin_assassinate')) {
      const mechanics = allFeatures.find(f => f.key === 'assassin_assassinate')?.mechanics;
      if (mechanics) {
        // { advantage_condition: "target_has_not_acted", auto_crit_condition: "target_surprised" }
        return mechanics;
      }
    }
    return null;
  }
  
  /**
   * Prüft auf die 'Todesstoß'-Fähigkeit (Death Strike).
   * (Wird von der Kampf-Engine aufgerufen, wenn ein Meuchelmörder-Crit trifft)
   * @returns {object|null} - Die Mechanik-Regeln oder null.
   */
  getDeathStrikeRules() {
    if (this.hasFeature('assassin_death_strike')) {
        const mechanics = allFeatures.find(f => f.key === 'assassin_death_strike')?.mechanics;
        if (mechanics) {
            // { multiplier: 2, condition: "target_surprised", save_throw: "constitution", ... }
            return mechanics;
        }
    }
    return null;
  }

  // --- ARKANER BETRÜGER (Arcane Trickster) ZAUBER-LOGIK ---

  /**
   * Prüft, ob der Schurke ein Zauberwirker ist (nur Arkaner Betrüger).
   * @returns {boolean}
   */
  isSpellcaster() {
    return this.hasFeature('arcane_trickster_spellcasting');
  }

  getSpellcastingAbility() {
    // Arkane Betrüger verwenden Intelligenz
    return 'intelligence';
  }

  getSpellSaveDC() {
    if (!this.isSpellcaster()) return null;
    const intMod = getModifier(this.character.abilities.intelligence);
    const profBonus = getProficiencyBonus(this.character.level);
    return 8 + profBonus + intMod;
  }

  getSpellAttackBonus() {
    if (!this.isSpellcaster()) return null;
    const intMod = getModifier(this.character.abilities.intelligence);
    const profBonus = getProficiencyBonus(this.character.level);
    return profBonus + intMod;
  }

  /**
   * Ruft die Zauberliste für einen Arkanen Betrüger ab.
   * Regel: Magier-Zauber, primär aus Illusion und Verzauberung.
   * @returns {string[]} Array von Zauberschlüsseln.
   */
  getLearnableSpells() {
    if (!this.isSpellcaster()) return [];
    
    const maxLevel = this.character.spellSlots.maxLevel;
    
    // 1. Alle Magier-Zauber der erlaubten Schulen
    const allowedSchoolSpells = spells
      .filter(s => 
        s.classes.includes('wizard') &&
        s.level > 0 && 
        s.level <= maxLevel &&
        (s.school === 'illusion' || s.school === 'enchantment')
      )
      .map(s => s.key);
      
    // 2. Zauber beliebiger Schulen (auf bestimmten Stufen)
    // (Diese Logik ist, wie beim Mystischen Ritter, komplexer und 
    // erfordert die Verwaltung eines 'bekannten Zauber'-Buches)
    
    // (Vereinfachung für dieses Modul: Wir geben nur die Hauptschulen zurück)
    return allowedSchoolSpells;
  }
}