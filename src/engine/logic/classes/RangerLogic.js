import { getModifier, getProficiencyBonus } from '../../../utils/helpers';
import spells from '../../../data/spells.json';
// allFeatures wird nicht direkt benötigt, da die Engine die Features des Charakters prüft

export class RangerLogic {
  
  /**
   * Erstellt eine Instanz der Waldläufer-Logik, die an einen bestimmten Charakter gebunden ist.
   * @param {object} character - Das Charakterobjekt, das diese Logik verwendet.
   */
  constructor(character) {
    this.character = character;
  }

  /**
   * Prüft schnell, ob der Charakter ein bestimmtes Feature besitzt.
   * @param {string} featureKey - Der Schlüssel des Features.
   ** @returns {boolean}
   */
  hasFeature(featureKey) {
    return this.character.features.includes(featureKey);
  }

  // --- Grundlegende Klassen-Informationen ---

  getSavingThrowProficiencies() {
    // Waldläufer sind in Stärke und Geschicklichkeit geübt.
    return ['strength', 'dexterity'];
  }

  // --- Zauber-Logik (Anders als Kleriker/Paladin) ---

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

  /**
   * Ruft die Anzahl der Zauber ab, die ein Waldläufer *kennen* kann.
   * (Waldläufer bereiten nicht vor, sie haben eine feste Liste bekannter Zauber).
   * @returns {number}
   */
  getKnownSpellsCount() {
    const level = this.character.level;
    if (level === 1) return 0; // Kein Zauberwirken auf Stufe 1
    if (level <= 2) return 2;
    if (level <= 4) return 3;
    if (level <= 6) return 4;
    if (level <= 8) return 5;
    if (level <= 10) return 6;
    if (level <= 12) return 7;
    if (level <= 14) return 8;
    if (level <= 16) return 9;
    if (level <= 18) return 10;
    return 11; // Stufe 19-20
  }

  /**
   * Ruft die *gesamte* Liste der Zauber ab, aus denen der Waldläufer
   * beim Stufenaufstieg wählen kann.
   * @returns {string[]} Array von Zauberschlüsseln.
   */
  getLearnableSpells() {
    const maxLevel = this.character.spellSlots.maxLevel;
    
    return spells
      .filter(s => s.classes.includes('ranger') && s.level > 0 && s.level <= maxLevel)
      .map(s => s.key);
  }
  
  // (Die LevelUp-Engine muss 'getKnownSpellsCount' und 'getLearnableSpells' verwenden,
  // um dem Spieler die Auswahl zu ermöglichen. Das Ergebnis wird in 
  // 'character.knownSpells' gespeichert, welches die SpellEngine dann liest.)

  // --- HERR DER TIERE (Beast Master) LOGIK ---

  /**
   * Prüft, ob der Waldläufer einen Tiergefährten hat.
   * (Wird von der Spiel-Engine aufgerufen, um den Gefährten zu instanziieren)
   * @returns {boolean}
   */
  hasAnimalCompanion() {
    return this.hasFeature('beast_master_animal_companion');
  }

  /**
   * Prüft, ob der Gefährte als Reaktion angreifen kann, wenn der Waldläufer angreift.
   * (Wird von der Kampf-Engine aufgerufen)
   * @returns {boolean}
   */
  canCompanionAttackAsReaction() {
    // Gemäß features.json: 'beast_master_coordinated_attack'
    return this.hasFeature('beast_master_coordinated_attack');
  }
  
  /**
   * Ruft die Bonusaktionen ab, die der Gefährte nutzen kann.
   * (Wird von der Kampf-Engine aufgerufen)
   * @returns {string[] | null} - Ein Array von Aktionen (z.B. ['dash', 'disengage', 'help'])
   */
  getCompanionBonusActions() {
    if (this.hasFeature('beast_master_exceptional_training')) {
      return ['dash', 'disengage', 'help'];
    }
    return null;
  }
  
  /**
   * Prüft, ob der Gefährte 'Bestialische Wut' (Multi-Angriff) hat.
   * (Wird von der Kampf-Engine aufgerufen)
   * @returns {boolean}
   */
  companionHasBestialFury() {
     return this.hasFeature('beast_master_bestial_fury');
  }
  
  /**
   * Prüft, ob Zauber (die 'Selbst' als Ziel haben) mit dem Gefährten geteilt werden können.
   * (Wird von der SpellEngine aufgerufen)
   * @returns {boolean}
   */
  canShareSpellsWithCompanion() {
      return this.hasFeature('beast_master_share_spells');
  }

  // --- JÄGER (Hunter) LOGIK ---
  // (Jäger-Fähigkeiten wie 'Koloss-Töter' sind passive Boni.
  // Die Kampf-Engine sollte 'character.features' direkt prüfen.)
  
  /**
   * Beispiel: Wird von der Kampf-Engine aufgerufen, NACHDEM ein Treffer gelandet wurde.
   * @param {object} target - Das Ziel des Angriffs.
   * @returns {string|null} - Der zusätzliche Schadenswürfel (z.B. "1d8") oder null.
   */
  getHunterPreyDamage(target) {
    if (this.hasFeature('hunter_prey_colossus_slayer')) {
      // Regel: 1W8 extra, wenn das Ziel unter seinen maximalen TP ist (1x pro Zug)
      if (target.hp < target.maxHp) {
        return '1d8';
      }
    }
    
    // (Andere 'Beute des Jägers'-Optionen wie 'Riesen-Mörder' (Reaktion)
    // oder 'Horden-Brecher' (Extra-Angriff) müssen von der
    // Kampf-Engine als verfügbare Aktionen behandelt werden.)
    
    return null;
  }
}