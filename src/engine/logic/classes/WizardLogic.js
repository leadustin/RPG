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
    // PHB 2024 / 5e Standard Progression für ZAUBER (nicht Anrufungen)
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

  getAlwaysPreparedPatronSpells() {
    const maxLevel = this.getPactSlotLevel();
    return this.getPatronExpandedSpells(maxLevel);
  }

  getLearnableSpells() {
    const maxLevel = this.getPactSlotLevel();
    
    const warlockSpells = spells
      .filter(s => s.classes.includes('warlock') && s.level > 0 && s.level <= maxLevel)
      .map(s => s.key);
      
    const autoSpells = this.getAlwaysPreparedPatronSpells();
    
    // Entferne die automatischen Zauber aus der "Zu lernen"-Liste
    return warlockSpells.filter(key => !autoSpells.includes(key));
  }

  getPatronExpandedSpells(maxLevel) {
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

  // --- MYSTISCHE ANRUFUNGEN (Eldritch Invocations - PHB 2024) ---

  /**
   * Gibt die Anzahl der Anrufungen zurück.
   * KORRIGIERT für PHB 2024:
   * Level 1: 1
   * Level 2-4: 3
   * Level 5-6: 5
   * Level 7-8: 6
   * ...
   */
  getInvocationCount() {
    const level = this.character.level;
    if (level < 1) return 0;
    if (level === 1) return 1;
    if (level <= 4) return 3; // HIER WAR DER FEHLER (Stand vorher auf 2)
    if (level <= 6) return 5; 
    if (level <= 8) return 6;
    if (level <= 11) return 7; // Level 9-11
    if (level <= 14) return 8; // Level 12-14
    if (level <= 17) return 9; // Level 15-17
    return 10; // Level 18+
  }

  getAllInvocations() {
    return allFeatures.filter(f => f.feature_type === 'invocation');
  }

  checkInvocationPrerequisite(invocation, currentFeats = []) {
    if (!invocation.prerequisites) return true;
    
    const req = invocation.prerequisites;
    const charLevel = this.character.level;

    // 1. Level Check
    if (req.level && charLevel < req.level) return false;

    // 2. Pakt / Feature Check
    if (req.feature) {
      const hasFeature = this.character.features.includes(req.feature) || currentFeats.includes(req.feature);
      if (!hasFeature) return false;
    }

    // 3. Zauber Check
    if (req.spell) {
      const hasSpell = (this.character.cantrips_known || []).includes(req.spell) || 
                       (this.character.spells_known || []).includes(req.spell);
      if (!hasSpell) return false;
    }

    return true;
  }

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