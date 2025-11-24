// src/engine/logic/classes/WarlockLogic.js
import { getModifier, getProficiencyBonus } from '../../../utils/helpers';
import spells from '../../../data/spells.json';
import allFeatures from '../../../data/features.json'; 

export class WarlockLogic {
  
  constructor(character) {
    this.character = character;
    if (!this.character.features) {
        this.character.features = [];
    }
  }

  hasFeature(featureKey) {
    return this.character.features.includes(featureKey);
  }

  getSavingThrowProficiencies() {
    return ['wisdom', 'charisma'];
  }

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
    const progression = this.character.class?.pact_magic_progression?.find(p => p.level === level);
    if (progression && progression.spells_known) {
        return progression.spells_known;
    }
    // Fallback
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

  getPactSlotCount() {
    const level = this.character.level;
    const progression = this.character.class?.pact_magic_progression?.find(p => p.level === level);
    if (progression && progression.slots) {
        return progression.slots;
    }
    // Fallback
    if (level === 1) return 1;
    if (level <= 10) return 2;
    if (level <= 16) return 3;
    if (level >= 17) return 4;
    return 0;
  }

  getPactSlotLevel() {
    const level = this.character.level;
    const progression = this.character.class?.pact_magic_progression?.find(p => p.level === level);
    if (progression && progression.slot_level) {
        return progression.slot_level;
    }
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

  getInvocationCount() {
    const level = this.character.level;
    const progression = this.character.class?.pact_magic_progression?.find(p => p.level === level);
    if (progression && progression.invocations_known !== undefined) {
        return progression.invocations_known;
    }
    // Fallback (PHB 2024)
    if (level === 1) return 1;
    if (level <= 4) return 3;
    if (level <= 6) return 5;
    if (level <= 8) return 6;
    if (level <= 10) return 7;
    if (level <= 12) return 8;
    if (level <= 14) return 8;
    if (level <= 17) return 9;
    return 10;
  }

  getAllInvocations() {
    return allFeatures.filter(f => f.feature_type === 'invocation');
  }

  /**
   * BEREINIGT: Prüft strikt auf 'prerequisite' (Einzahl), wie in der JSON definiert.
   */
  checkInvocationPrerequisite(invocation, currentFeats = []) {
    const req = invocation.prerequisite;
    
    // Wenn null/undefined, gibt es keine Voraussetzung -> verfügbar
    if (!req) return true;
    
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

  getDarkOnesBlessingTempHp() {
    if (this.hasFeature('the_fiend_dark_ones_blessing')) {
      const chaMod = getModifier(this.character.abilities.charisma);
      return chaMod + this.character.level;
    }
    return 0;
  }
}