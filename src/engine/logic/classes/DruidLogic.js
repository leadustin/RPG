import { getModifier, getProficiencyBonus } from '../../../utils/helpers';
import spells from '../../../data/spells.json';
import allFeatures from '../../../data/features.json';
// Erforderlich für die Tiergestalt-Logik
import beasts from '../../../data/beasts.json'; 

export class DruidLogic {
  
  /**
   * Erstellt eine Instanz der Druiden-Logik, die an einen bestimmten Charakter gebunden ist.
   * @param {object} character - Das Charakterobjekt, das diese Logik verwendet.
   */
  constructor(character) {
    this.character = character;
    // Ressourcen wie 'Wild Shape'-Nutzungen werden auf dem Haupt-Charakterobjekt gespeichert
    // (z.B. character.resources.wild_shape)
  }

  // --- Hilfsmethode ---

  /**
   * Prüft schnell, ob der Charakter ein bestimmtes Feature besitzt.
   * @param {string} featureKey - Der Schlüssel des Features (z.B. 'moon_combat_wild_shape').
   * @returns {boolean}
   */
  hasFeature(featureKey) {
    return this.character.features.includes(featureKey);
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
    // Druiden sind in Intelligenz und Weisheit geübt.
    return ['intelligence', 'wisdom'];
  }

  // --- Zaubervorbereitung ---

  /**
   * Berechnet die Anzahl der Zauber, die ein Druide vorbereiten kann.
   * @returns {number}
   */
  getPreparedSpellsCount() {
    const wisMod = getModifier(this.character.abilities.wisdom);
    // Mindestens 1 Zauber
    return Math.max(1, wisMod + this.character.level);
  }

  /**
   * Ruft die Zirkel-Zauber für die Unterklasse des Druiden ab (nur 'Zirkel des Landes').
   * ANNAHME: spells.json enthält Einträge wie:
   * { "key": "barkskin", ..., "circle_spell": { "class": "druid", "circle": "circle_of_the_land_forest", "level": 3 } }
   * @returns {string[]}
   */
  getCircleSpells() {
    if (!this.character.subclass || !this.character.subclass.startsWith('circle_of_the_land')) {
      return [];
    }
    
    const maxLevel = this.character.spellSlots.maxLevel;
    
    return spells
      .filter(s => 
        s.circle_spell &&
        s.circle_spell.class === 'druid' &&
        s.circle_spell.circle === this.character.subclass && // z.B. 'circle_of_the_land_forest'
        s.circle_spell.level <= maxLevel
      )
      .map(s => s.key);
  }

  /**
   * Ruft alle Zauber ab, die dem Druiden zur Vorbereitung zur Verfügung stehen.
   * @returns {string[]} Array von Zauberschlüsseln.
   */
  getPreparableSpells() {
    const maxLevel = this.character.spellSlots.maxLevel;
    
    const classSpells = spells
      .filter(s => s.classes.includes('druid') && s.level <= maxLevel)
      .map(s => s.key);

    // Zirkelzauber (Land) werden automatisch hinzugefügt und gelten als immer vorbereitet
    const circleSpells = this.getCircleSpells();
    
    // Duplikate entfernen und zurückgeben
    return [...new Set([...classSpells, ...circleSpells])];
  }


  // --- TIERGESTALT (WILD SHAPE) LOGIK ---

  /**
   * Ruft das maximale CR-Limit für die Tiergestalt des Druiden ab.
   * @returns {number} Das maximale CR (z.B. 0.25, 1, 5).
   */
  getWildShapeCRLimit() {
    const level = this.character.level;

    // Zirkel des Mondes (liest 'moon_circle_forms' aus features.json)
    if (this.hasFeature('moon_circle_forms')) {
      // Regel: max(1, floor(level / 3))
      return Math.max(1, Math.floor(level / 3));
    }

    // Basis-Druide
    if (level >= 8) return 1;
    if (level >= 4) return 0.5;
    return 0.25;
  }

  /**
   * Prüft Bewegungs-Einschränkungen (Fliegen/Schwimmen) für die Tiergestalt.
   * @returns {object} { no_fly: boolean, no_swim: boolean }
   */
  getWildShapeSpeedRestrictions() {
    const level = this.character.level;

    // Zirkel des Mondes (hat anfangs Einschränkungen, die aufgehoben werden)
    if (this.hasFeature('moon_circle_forms')) {
      // Die CR-Beschränkungen (HG 1) heben die Schwimm/Flug-Beschränkungen
      // der Basis-Klasse effektiv auf, aber die PHB-Regel für Mond-Druiden
      // (Stufe 2-5) besagt, dass sie HG 1 wählen können, *solange es keine Fluggeschwindigkeit hat*.
      // Ab Stufe 6 entfällt diese Einschränkung.
      if (level < 6) {
         // Diese Einschränkung ist in features.json für moon_circle_forms definiert
         return { no_fly: true, no_swim: false }; 
      }
      return {}; // Keine Einschränkungen für Mond-Druiden ab Stufe 6
    }

    // Basis-Druide
    if (level < 8) return { no_fly: true, no_swim: false };
    if (level < 4) return { no_fly: true, no_swim: true };
    return {}; // Keine Einschränkungen (Stufe 8+)
  }

  /**
   * Prüft, ob der Druide Tiergestalt als Bonusaktion nutzen kann.
   * @returns {boolean}
   */
  canUseWildShapeAsBonusAction() {
    // Liest 'moon_combat_wild_shape' aus features.json
    return this.hasFeature('moon_combat_wild_shape');
  }
  
  /**
   * Prüft, ob der Druide in Tiergestalt Zauberplätze zum Heilen nutzen kann.
   * @returns {boolean}
   */
  canHealInWildShape() {
    // Liest 'moon_combat_wild_shape' aus features.json
    return this.hasFeature('moon_combat_wild_shape');
  }

  /**
   * Prüft, ob die Angriffe des Druiden in Tiergestalt als magisch gelten.
   * @returns {boolean}
   */
  wildShapeAttacksAreMagical() {
    // Liest 'moon_primal_strike' aus features.json
    return this.hasFeature('moon_primal_strike');
  }

  /**
   * Ruft eine Liste aller verfügbaren Tierformen ab, in die sich der Druide verwandeln kann,
   * basierend auf CR-Limit und Bewegungs-Einschränkungen.
   * @returns {string[]} Ein Array von Kreaturen-Schlüsseln (z.B. ['wolf', 'giant_eagle', 'fire_elemental']).
   */
  getAvailableWildShapeForms() {
    const crLimit = this.getWildShapeCRLimit();
    const restrictions = this.getWildShapeSpeedRestrictions();
    
    // Filtere alle Kreaturen aus beasts.json
    let availableBeasts = beasts.filter(b => b.cr <= crLimit);

    if (restrictions.no_fly) {
      availableBeasts = availableBeasts.filter(b => !b.speed || !b.speed.fly);
    }
    if (restrictions.no_swim) {
      availableBeasts = availableBeasts.filter(b => !b.speed || !b.speed.swim);
    }

    const beastKeys = availableBeasts.map(b => b.key);

    // Füge Elementare hinzu, falls 'moon_elemental_wild_shape' vorhanden ist
    if (this.hasFeature('moon_elemental_wild_shape')) {
      // (Wir nehmen an, die Elementare sind in beasts.json oder einer anderen importierten Datei)
      beastKeys.push('air_elemental', 'earth_elemental', 'fire_elemental', 'water_elemental');
    }
    
    return beastKeys;
  }
}