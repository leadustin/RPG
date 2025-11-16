import { getModifier, getProficiencyBonus } from '../../../utils/helpers';
import spells from '../../../data/spells.json';
import allFeatures from '../../../data/features.json'; 

export class PaladinLogic {
  
  /**
   * Erstellt eine Instanz der Paladin-Logik, die an einen bestimmten Charakter gebunden ist.
   * @param {object} character - Das Charakterobjekt, das diese Logik verwendet.
   */
  constructor(character) {
    this.character = character;
  }

  // --- Hilfsmethode ---

  /**
   * Prüft schnell, ob der Charakter ein bestimmtes Feature besitzt.
   * @param {string} featureKey - Der Schlüssel des Features (z.B. 'ancients_aura_of_warding').
   * @returns {boolean}
   */
  hasFeature(featureKey) {
    return this.character.features.includes(featureKey);
  }

  // --- Grundlegende Zauberinformationen ---

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

  getSavingThrowProficiencies() {
    // Paladine sind in Weisheit und Charisma geübt.
    return ['wisdom', 'charisma'];
  }

  // --- Zaubervorbereitung ---

  /**
   * Berechnet die Anzahl der Zauber, die ein Paladin vorbereiten kann.
   * Regel: Charisma-Modifikator + halbes Paladin-Level (aufgerundet, min. 1).
   * @returns {number}
   */
  getPreparedSpellsCount() {
    const chaMod = getModifier(this.character.abilities.charisma);
    // Math.floor(this.character.level / 2) ist korrekt für "half-level"
    return Math.max(1, chaMod + Math.floor(this.character.level / 2));
  }

  /**
   * Ruft die Eid-Zauber für die Unterklasse des Paladins ab.
   * ANNAHME: spells.json enthält Einträge wie:
   * { "key": "vow_of_enmity", ..., "oath_spell": { "class": "paladin", "oath": "oath_of_vengeance", "level": 3 } }
   * @returns {string[]}
   */
  getOathSpells() {
    if (!this.character.subclass) return [];
    
    // Paladine erhalten ihre Eid-Zauber auf bestimmten Stufen (3, 5, 9, 13, 17)
    // Wir filtern basierend auf dem Charakter-Level
    const paladinLevel = this.character.level;

    return spells
      .filter(s => 
        s.oath_spell &&
        s.oath_spell.class === 'paladin' &&
        s.oath_spell.oath === this.character.subclass &&
        s.oath_spell.level <= paladinLevel 
      )
      .map(s => s.key);
  }

  /**
   * Ruft alle Zauber ab, die dem Paladin zur Vorbereitung zur Verfügung stehen.
   * @returns {string[]} Array von Zauberschlüsseln.
   */
  getPreparableSpells() {
    const maxLevel = this.character.spellSlots.maxLevel;
    
    const classSpells = spells
      .filter(s => s.classes.includes('paladin') && s.level > 0 && s.level <= maxLevel)
      .map(s => s.key);

    // Eid-Zauber werden automatisch hinzugefügt und gelten als immer vorbereitet
    const oathSpells = this.getOathSpells();
    
    // Duplikate entfernen und zurückgeben
    return [...new Set([...classSpells, ...oathSpells])];
  }

  // --- KAMPFFÄHIGKEITEN-LOGIK ---

  /**
   * Berechnet den Schaden für "Göttliches Niederstrecken" (Divine Smite).
   * Wird von der SpellEngine aufgerufen.
   * @param {number} slotLevel - Der Grad des verbrauchten Zauberplatzes (1-5).
   * @param {string} targetType - Der Typ des Ziels (z.B. 'fiend', 'undead', 'humanoid').
   * @returns {string} Die Schadenswürfel-Notation (z.B. "3d8").
   */
  getDivineSmiteDamage(slotLevel, targetType = 'humanoid') {
    if (slotLevel < 1) return '0d8';

    // Regel: 2W8 für einen Zauberplatz des 1. Grades.
    // +1W8 für jeden Zaubergrad darüber, bis zu einem Maximum von 5W8.
    
    // 1. Grad = 2W8
    // 2. Grad = 3W8
    // 3. Grad = 4W8
    // 4. Grad = 5W8
    // 5. Grad = 5W8 (Gedeckelt)
    
    let diceCount = 1 + slotLevel;
    if (diceCount > 5) {
      diceCount = 5;
    }

    // Regel: +1W8 (bis max. 6W8), wenn das Ziel ein Untoter oder Unhold ist.
    if (targetType === 'fiend' || targetType === 'undead') {
      diceCount += 1;
      if (diceCount > 6) {
          diceCount = 6; // Gesamtkappe ist 6W8 gegen diese Ziele
      }
    }
    
    return `${diceCount}d8`;
  }

  // --- AURA-LOGIK ---

  /**
   * Ruft alle aktiven Auren ab, die der Paladin projiziert.
   * Diese Methode wird von der Spiel-Engine verwendet, um Effekte auf Verbündete anzuwenden.
   * @returns {object[]} Ein Array von Aura-Objekten.
   */
  getActiveAuras() {
    const auras = [];
    const level = this.character.level;
    const chaMod = getModifier(this.character.abilities.charisma);
    
    // Die Reichweite aller Auren erhöht sich auf Stufe 18
    const auraRange = (level >= 18) ? 9 : 3; // (Annahme: 9m = 30ft, 3m = 10ft)

    // Aura des Schutzes (Stufe 6)
    if (level >= 6 && chaMod > 0) {
      auras.push({
        key: 'aura_of_protection',
        range: auraRange,
        effect: 'grant_save_bonus', // Signal an die Engine: "Wende Bonus auf Rettungswürfe an"
        value: chaMod // Der Bonus entspricht dem CHA-Modifikator
      });
    }

    // Aura des Mutes (Stufe 10)
    if (level >= 10) {
      auras.push({
        key: 'aura_of_courage',
        range: auraRange,
        effect: 'grant_immunity', // Signal an die Engine: "Mache immun"
        condition: 'frightened' // Gegen den "Verängstigt"-Zustand
      });
    }
    
    // --- Eid-spezifische Auren (Stufe 7) ---

    // Eid der Hingabe (Aura der Hingabe)
    if (this.hasFeature('oath_of_devotion_aura')) { // (Annahme: Feature-Key ist so)
      auras.push({
        key: 'devotion_aura_of_devotion',
        range: auraRange,
        effect: 'grant_immunity',
        condition: 'charmed'
      });
    }

    // Eid der Ahnen (Aura der Behütung)
    if (this.hasFeature('ancients_aura_of_warding')) {
      const featureMechanics = allFeatures.find(f => f.key === 'ancients_aura_of_warding')?.mechanics;
      if (featureMechanics) {
        auras.push({
          key: 'ancients_aura_of_warding',
          range: auraRange,
          effect: 'grant_resistance',
          type: featureMechanics.resistance_type // 'damage_from_spells'
        });
      }
    }
    
    // (Eid der Rache hat keine Stufe 7 Aura, sondern 'Unerbittlicher Rächer')

    return auras;
  }
}