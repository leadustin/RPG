// src/engine/logic/classes/WarlockLogic.js
import { getModifier, getProficiencyBonus } from '../../../utils/helpers';
import spells from '../../../data/spells.json';
import allFeatures from '../../../data/features.json'; 

export class WarlockLogic {
  
  /**
   * Erstellt eine Instanz der Hexenmeister-Logik.
   * @param {object} character - Das Charakterobjekt.
   */
  constructor(character) {
    this.character = character;
    // Sicherheitsnetz: Features als Array garantieren
    if (!this.character.features) {
        this.character.features = [];
    }
  }

  /**
   * Prüft, ob der Charakter ein bestimmtes Feature besitzt.
   */
  hasFeature(featureKey) {
    return this.character.features.includes(featureKey);
  }

  // --- Grundlegende Klassen-Informationen ---

  getSavingThrowProficiencies() {
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

  getKnownSpellsCount() {
    const level = this.character.level;
    // PHB 2024 / 5e Standard Progression
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

  // --- NEU (PHB 2024): PATRON ZAUBER ---

  /**
   * Gibt die Patron-Zauber zurück, die AUTOMATISCH vorbereitet/bekannt sind.
   * Diese zählen nicht gegen das Limit der bekannten Zauber.
   */
  getAlwaysPreparedPatronSpells() {
    const maxLevel = this.getPactSlotLevel();
    return this.getPatronExpandedSpells(maxLevel);
  }

  /**
   * Ruft die *wählbare* Liste der Zauber ab.
   * Automatische Patron-Zauber werden hier herausgefiltert.
   */
  getLearnableSpells() {
    const maxLevel = this.getPactSlotLevel();
    
    const warlockSpells = spells
      .filter(s => s.classes.includes('warlock') && s.level > 0 && s.level <= maxLevel)
      .map(s => s.key);
      
    const autoSpells = this.getAlwaysPreparedPatronSpells();
    
    // Entferne die automatischen Zauber aus der "Zu lernen"-Liste
    return warlockSpells.filter(key => !autoSpells.includes(key));
  }

  /**
   * Hilfsmethode: Findet Patron-Zauber. Unterstützt Array-Patrons (z.B. ["the_fiend", "the_genie"]).
   */
  getPatronExpandedSpells(maxLevel) {
    // Bevorzugt subclassKey, Fallback auf subclass
    const patronKey = this.character.subclassKey || this.character.subclass;

    if (!patronKey) return [];
    
    return spells
      .filter(s => {
        if (!s.patron_spell || s.patron_spell.level > maxLevel) return false;
        const p = s.patron_spell.patron;
        if (Array.isArray(p)) return p.includes(patronKey);
        return p === patronKey;
      })
      .map(s => s.key);
  }


  // --- PAKTMAGIE-SLOTS ---

  getPactSlotCount() {
    const level = this.character.level;
    if (level === 1) return 1;
    if (level <= 10) return 2;
    if (level <= 16) return 3;
    if (level >= 17) return 4;
    return 0;
  }

  getPactSlotLevel() {
    const level = this.character.level;
    if (level <= 2) return 1;
    if (level <= 4) return 2;
    if (level <= 6) return 3;
    if (level <= 8) return 4;
    if (level >= 9) return 5;
    return 1;
  }

  onShortRest() {
    if (this.character.resources) {
      this.character.resources.pact_magic_slots = this.getPactSlotCount();
    }
  }

  // --- NEU: MYSTISCHE ANRUFUNGEN (Eldritch Invocations) ---

  /**
   * Gibt die Anzahl der Anrufungen zurück, die der Charakter auf seinem Level haben darf.
   */
  getInvocationCount() {
    const level = this.character.level;
    if (level < 2) return 0;
    if (level <= 4) return 2;
    if (level <= 6) return 3;
    if (level <= 8) return 4;
    if (level <= 11) return 5;
    if (level <= 14) return 6;
    if (level <= 17) return 7;
    return 8;
  }

  /**
   * Ruft alle Anrufungen aus der Datenbank ab.
   */
  getAllInvocations() {
    return allFeatures.filter(f => f.feature_type === 'invocation');
  }

  /**
   * Prüft Voraussetzungen für eine Anrufung (Level, Pakt, Zauber).
   * @param {object} invocation - Das Feature-Objekt
   * @param {string[]} currentFeats - Temporäre Liste der gewählten Features (für Live-Check im UI)
   */
  checkInvocationPrerequisite(invocation, currentFeats = []) {
    if (!invocation.prerequisites) return true;
    
    const req = invocation.prerequisites;
    const charLevel = this.character.level;

    // 1. Level Check
    if (req.level && charLevel < req.level) return false;

    // 2. Pakt / Feature Check (z.B. "Pact of the Blade")
    if (req.feature) {
      // Prüfe im Charakter ODER in der aktuellen Auswahl
      const hasFeature = this.character.features.includes(req.feature) || currentFeats.includes(req.feature);
      if (!hasFeature) return false;
    }

    // 3. Zauber Check (z.B. "Eldritch Blast" für Agonizing Blast)
    if (req.spell) {
      const hasSpell = (this.character.cantrips_known || []).includes(req.spell) || 
                       (this.character.spells_known || []).includes(req.spell);
      if (!hasSpell) return false;
    }

    return true;
  }

  /**
   * Ruft die bereits gelernten Anrufungen des Charakters ab.
   */
  getAvailableInvocations() {
    return this.character.features
      .map(key => allFeatures.find(f => f.key === key))
      .filter(feature => feature && feature.feature_type === 'invocation');
  }

  // --- SUBKLASSEN-SPEZIFISCH ---

  getDarkOnesBlessingTempHp() {
    if (this.hasFeature('the_fiend_dark_ones_blessing')) {
      const chaMod = getModifier(this.character.abilities.charisma);
      return chaMod + this.character.level;
    }
    return 0;
  }
}