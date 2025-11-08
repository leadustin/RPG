import { rollDiceFormula } from '../../../utils/helpers';
import { getAbilityModifier, getProficiencyBonus } from '../../characterEngine';
import spells from '../../../data/spells.json';
import allClassData from '../../../data/classes.json'; 

export class WizardLogic {
  
  constructor(character) {
    this.character = character;
    this.features = character.features || []; // Sicherstellen, dass features ein Array ist

    // --- Feature-spezifische Ressourcen initialisieren ---
    
    // Für 'divination_portent_lvl_2' / 'divination_portent_lvl_14'
    this.portentDice = [];
    
    // Für 'abjuration_arcane_ward'
    this.arcaneWard = {
      currentHp: 0,
      maxHp: 0
    };

    // Initialisiere die Ressourcen beim Erstellen des Charakters
    this.initializeFeatureResources();
  }

  initializeFeatureResources() {
    const intMod = getAbilityModifier(this.character.abilities.intelligence);
    
    if (this.features.includes('abjuration_arcane_ward')) {
      const maxHp = (this.character.level * 2) + intMod;
      this.arcaneWard = {
        currentHp: maxHp,
        maxHp: maxHp
      };
    }
    
    this.rollPortentDice();
  }

  // --- Grundlegende Zauberinformationen ---

  getSpellcastingAbility() {
    return 'intelligence';
  }

  getSpellSaveDC() {
    const intMod = getAbilityModifier(this.character.abilities.intelligence);
    const profBonus = getProficiencyBonus(this.character.level);
    return 8 + profBonus + intMod;
  }

  getSpellAttackBonus() {
    const intMod = getAbilityModifier(this.character.abilities.intelligence);
    const profBonus = getProficiencyBonus(this.character.level);
    return profBonus + intMod;
  }

  getSavingThrowProficiencies() {
    return ['intelligence', 'wisdom'];
  }

  /**
   * Berechnet die Anzahl der Zauber, die ein Magier vorbereiten kann.
   */
  getPreparedSpellsCount() {
    const intMod = getAbilityModifier(this.character.abilities.intelligence);
    return Math.max(1, intMod + this.character.level);
  }

  /**
   * NEU: Helper function, die alle relevanten Zauberdaten liefert (Slots, Max Level, Cantrips).
   */
  getSpellcastingData() {
    const cleanClassKey = this.character.class.key.split(' ')[0];
    const classData = allClassData.find(c => c.key === cleanClassKey);
    
    if (!classData || !classData.spellcasting) {
        // Fallback-Objekt für den Fall, dass die Daten fehlen
        return { slots: [], maxLevel: 0, cantripCount: 0 }; 
    }

    const levelIndex = this.character.level - 1;
    const spellcasting = classData.spellcasting;
    
    // Slots (Länge 9: Index 0 = Level 1, Index 8 = Level 9)
    // Fallback: Wenn Level zu hoch für Slot-Array ist, ist es leer
    const slotsAtCurrentLevel = spellcasting.spell_slots_by_level[levelIndex] || [];
    
    let maxLevel = 0;
    // Cantrips
    const cantripCount = spellcasting.cantrip_progression[levelIndex] || 0;

    // Finde den höchsten Zaubergrad, für den der Charakter Slots hat
    for (let i = slotsAtCurrentLevel.length - 1; i >= 0; i--) {
        if (slotsAtCurrentLevel[i] > 0) {
            maxLevel = i + 1; // +1, da 'i' 0-basiert ist (Slot 1 ist bei Index 0)
            break;
        }
    }

    return { 
        slots: slotsAtCurrentLevel, 
        maxLevel: maxLevel, 
        cantripCount: cantripCount,
        spellcastingAbility: spellcasting.casting_ability
    };
  }

  /**
   * Ruft alle Zauber aus dem Zauberbuch des Magiers ab (Nur Schlüssel).
   */
  getSpellbookSpells() {
    // Nutze den neuen Helper
    const { maxLevel } = this.getSpellcastingData(); 
    
    return spells
        .filter(s => s.classes.includes('wizard') && s.level <= maxLevel)
        .map(s => s.key);
  }
  
  // --- Feature-Logik (unten unverändert) ---

  getEmpoweredEvocationBonus(spell) {
    const hasFeature = this.features.includes('empowered_evocation');
    
    if (hasFeature && spell.school === 'evocation') {
      return getAbilityModifier(this.character.abilities.intelligence);
    }
    return 0;
  }

  isPotentCantrip(spell) {
    const hasFeature = this.features.includes('potent_cantrip');
    
    if (hasFeature && spell.level === 0 && spell.school === 'evocation') {
      return true;
    }
    return false;
  }
  
  // --- Ressourcen-Management für Features ---

  onLongRest() {
    this.rollPortentDice();
    
    if (this.features.includes('abjuration_arcane_ward')) {
      this.arcaneWard.currentHp = this.arcaneWard.maxHp;
    }
  }

  rollPortentDice() {
    this.portentDice = [];
    let diceCount = 0;
    
    if (this.features.includes('divination_portent_lvl_14')) {
      diceCount = 3;
    } else if (this.features.includes('divination_portent_lvl_2')) {
      diceCount = 2;
    }

    for (let i = 0; i < diceCount; i++) {
      this.portentDice.push(rollDiceFormula("1d20"));
    }
  }

  usePortentDice(diceValue) {
    const index = this.portentDice.indexOf(diceValue);
    if (index > -1) {
      this.portentDice.splice(index, 1);
      return true;
    }
    return false;
  }

  rechargeArcaneWard(spellLevel) {
    if (!this.features.includes('abjuration_arcane_ward') || spellLevel === 0) {
      return 0;
    }
    
    const rechargeAmount = spellLevel * 2;
    this.arcaneWard.currentHp = Math.min(
      this.arcaneWard.maxHp, 
      this.arcaneWard.currentHp + rechargeAmount
    );
    return rechargeAmount;
  }

  damageArcaneWard(damageAmount) {
    if (this.arcaneWard.currentHp === 0) {
      return damageAmount;
    }

    const absorbed = Math.min(this.arcaneWard.currentHp, damageAmount);
    this.arcaneWard.currentHp -= absorbed;
    const remainingDamage = damageAmount - absorbed;
    
    return remainingDamage;
  }
}