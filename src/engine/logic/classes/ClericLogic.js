import { getModifier, getProficiencyBonus } from '../../../utils/helpers';
import spells from '../../../data/spells.json';
// Wir importieren allFeatures, um die Mechaniken nachzuschlagen
import allFeatures from '../../../data/features.json'; 

export class ClericLogic {
  
  /**
   * Erstellt eine Instanz der Kleriker-Logik, die an einen bestimmten Charakter gebunden ist.
   * @param {object} character - Das Charakterobjekt, das diese Logik verwendet.
   */
  constructor(character) {
    this.character = character;
  }

  // --- Grundlegende Zauberinformationen ---

  getSpellcastingAbility() {
    return 'wisdom';
  }

  getSpellSaveDC() {
    const wisMod = getModifier(this.character.abilities.wisdom);
    const profBonus = getProficiencyBonus(this.character.level);
    return 8 + profBonus + wisMod;
  }

  getSpellAttackBonus() {
    const wisMod = getModifier(this.character.abilities.wisdom);
    const profBonus = getProficiencyBonus(this.character.level);
    return profBonus + wisMod;
  }

  getSavingThrowProficiencies() {
    // Kleriker sind in Weisheit und Charisma geübt.
    return ['wisdom', 'charisma'];
  }

  // --- Zaubervorbereitung ---

  /**
   * Berechnet die Anzahl der Zauber, die ein Kleriker vorbereiten kann.
   * @returns {number}
   */
  getPreparedSpellsCount() {
    const wisMod = getModifier(this.character.abilities.wisdom);
    // Mindestens 1 Zauber
    return Math.max(1, wisMod + this.character.level);
  }

  /**
   * Ruft alle Zauber ab, die dem Kleriker zur Vorbereitung zur Verfügung stehen.
   * @returns {string[]} Array von Zauberschlüsseln.
   */
  getPreparableSpells() {
    const maxLevel = this.character.spellSlots.maxLevel;
    
    const classSpells = spells
      .filter(s => s.classes.includes('cleric') && s.level <= maxLevel)
      .map(s => s.key);

    // Domänenzauber werden automatisch hinzugefügt und gelten als immer vorbereitet
    const domainSpells = this.getDomainSpells();
    
    // Duplikate entfernen und zurückgeben
    return [...new Set([...classSpells, ...domainSpells])];
  }

  /**
   * Ruft die Domänenzauber für die Unterklasse des Klerikers ab.
   * ANNAHME: spells.json enthält Einträge wie:
   * { "key": "bless", ..., "domain_spell": { "class": "cleric", "domain": "life_domain", "level": 1 } }
   * @returns {string[]}
   */
  getDomainSpells() {
    if (!this.character.subclass) return [];
    
    const maxLevel = this.character.spellSlots.maxLevel;
    
    return spells
      .filter(s => 
        s.domain_spell &&
        s.domain_spell.class === 'cleric' &&
        s.domain_spell.domain === this.character.subclass &&
        s.domain_spell.level <= maxLevel
      )
      .map(s => s.key);
  }

  // --- Feature-Logik (Wird von der SpellEngine aufgerufen) ---

  /**
   * Prüft, ob der Kleriker 'Jünger des Lebens' hat und gibt den Heilbonus zurück.
   * @param {object} spell - Das Zauberobjekt, das gewirkt wird.
   * @returns {number} Der zusätzliche Heilbetrag.
   */
  getDiscipleOfLifeBonus(spell) {
    // Prüfen, ob der Charakter das Feature 'disciple_of_life' besitzt
    const hasFeature = this.character.features.includes('disciple_of_life');

    // Das Feature gilt nur für Heilzauber des 1. Grades oder höher
    if (hasFeature && spell.level > 0 && spell.damage_type.includes('healing')) {
      // Bonus ist 2 + Zaubergrad
      return 2 + spell.level;
    }
    return 0;
  }

  /**
   * Prüft, ob der Kleriker 'Gesegneter Heiler' hat und gibt den Selbstheilungsbonus zurück.
   * @param {object} spell - Das Zauberobjekt, das gewirkt wird.
   * @param {boolean} isHealingOthers - Wahr, wenn der Zauber auf eine andere Kreatur als den Wirker zielt.
   * @returns {number} Der Heilbetrag für den Kleriker selbst.
   */
  getBlessedHealerBonus(spell, isHealingOthers) {
    const hasFeature = this.character.features.includes('blessed_healer');

    // Gilt nur, wenn andere geheilt werden
    if (hasFeature && isHealingOthers && spell.level > 0 && spell.damage_type.includes('healing')) {
      // Selbstheilung ist 2 + Zaubergrad
      return 2 + spell.level;
    }
    return 0;
  }

  /**
   * Ruft den Schaden für 'Göttlicher Schlag' ab, basierend auf der Domäne.
   * @returns {object|null} Ein Objekt mit { dice: "1d8"|"2d8", damage_type: "radiant"|"psychic"|... } oder null.
   */
  getDivineStrikeDamage() {
    const level = this.character.level;
    let strikeFeatureKey = null;

    // Finden, welchen "Göttlicher Schlag" der Kleriker hat
    if (this.character.features.includes('divine_strike_life')) {
      strikeFeatureKey = 'divine_strike_life';
    } else if (this.character.features.includes('divine_strike_knowledge')) {
      strikeFeatureKey = 'divine_strike_knowledge';
    } else if (this.character.features.includes('divine_strike_light')) {
      strikeFeatureKey = 'divine_strike_light';
    } else if (this.character.features.includes('divine_strike_trickery')) {
      strikeFeatureKey = 'divine_strike_trickery';
    } else if (this.character.features.includes('divine_strike_war')) {
      strikeFeatureKey = 'divine_strike_war';
    }
    // (Hier könnten weitere Domänen hinzugefügt werden)
    
    if (!strikeFeatureKey) {
      return null; // Dieser Kleriker hat keinen Göttlichen Schlag
    }

    // Die Mechanik aus features.json lesen
    const featureMechanics = allFeatures.find(f => f.key === strikeFeatureKey)?.mechanics;
    
    if (!featureMechanics) {
      console.error(`Mechanik für ${strikeFeatureKey} nicht in features.json gefunden!`);
      return null;
    }

    // Skalierung auf Stufe 14 prüfen
    const dice = (level >= 14 && featureMechanics.scaling?.["14"]) 
                   ? featureMechanics.scaling["14"] 
                   : featureMechanics.dice;

    return {
      dice: dice,
      damage_type: featureMechanics.damage_type
    };
  }
}