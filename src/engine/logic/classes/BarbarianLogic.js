import { getModifier, getProficiencyBonus } from '../../../utils/helpers';
// Wir importieren die features.json, um Subklassen-Mechaniken zu lesen
import allFeatures from '../../../data/features.json'; 

export class BarbarianLogic {
  
  /**
   * Erstellt eine Instanz der Barbaren-Logik, die an einen bestimmten Charakter gebunden ist.
   * @param {object} character - Das Charakterobjekt, das diese Logik verwendet.
   */
  constructor(character) {
    this.character = character;
  }

  // --- Hilfsmethode ---

  /**
   * Prüft schnell, ob der Charakter ein bestimmtes Feature besitzt.
   * @param {string} featureKey - Der Schlüssel des Features (z.B. 'path_of_the_berserker_frenzy').
   * @returns {boolean}
   */
  hasFeature(featureKey) {
    // Annahme: character.features ist ein Array von Feature-Keys
    return this.character.features.includes(featureKey);
  }

  // --- Grundlegende Klassen-Informationen ---

  getSavingThrowProficiencies() {
    // Barbaren sind in Stärke und Konstitution geübt.
    return ['strength', 'constitution'];
  }

  /**
   * Berechnet die ungepanzerte Verteidigung des Barbaren.
   * Regel: 10 + GES-Mod + KON-Mod (wenn 'ungepanzerte_verteidigung' vorhanden ist)
   * @returns {number|null} - Die RK oder null, wenn nicht anwendbar.
   */
  getUnarmoredDefense() {
    if (this.hasFeature('ungepanzerte_verteidigung')) { // Annahme: Key aus classes.json
      const dexMod = getModifier(this.character.abilities.dexterity);
      const conMod = getModifier(this.character.abilities.constitution);
      // (Die Spiel-Engine muss prüfen, ob Rüstung getragen wird)
      return 10 + dexMod + conMod;
    }
    return null;
  }

  // --- KAMPFRAUSCH (RAGE) LOGIK ---

  /**
   * Ruft die Boni ab, die während des Kampfrauschs aktiv sind.
   * Wird von der Kampf-Engine aufgerufen, wenn der Charakter in den Kampfrausch verfällt.
   * @returns {object} - Ein Objekt, das die aktiven Boni beschreibt.
   */
  getActiveRageBonuses() {
    const level = this.character.level;
    const subclass = this.character.subclass;
    let bonuses = {
      advantage_on_str_checks: true,
      advantage_on_str_saves: true,
      damage_resistance: ['bludgeoning', 'piercing', 'slashing'],
      melee_damage_bonus: this.getRageDamageBonus(level)
    };

    // --- Subklassen-Boni hinzufügen ---

    // Pfad des Totemkriegers (Bär)
    if (this.hasFeature('totem_warrior_bear_aspect')) { // Annahme: Der Spieler wählt 'bear'
      bonuses.damage_resistance.push('poison', 'acid', 'cold', 'fire', 'lightning', 'thunder', 'force', 'necrotic', 'radiant');
      // (Psychic ist absichtlich ausgenommen)
    }
    
    // Pfad des Berserkers (Raserei)
    if (subclass === 'path_of_the_berserker') {
       // 'Raserei' (Frenzy) erlaubt eine Bonus-Aktion-Attacke.
       // Dies muss in der Kampf-Engine/Action-Handler implementiert werden,
       // aber wir können hier ein Flag setzen.
       bonuses.can_attack_as_bonus_action = true;
    }
    
    // Pfad des Zeloten (Göttliche Raserei)
    if (this.hasFeature('zealot_divine_fury')) {
        const featureMechanics = allFeatures.find(f => f.key === 'zealot_divine_fury')?.mechanics;
        if (featureMechanics) {
            bonuses.extra_damage_on_first_hit = {
                dice: featureMechanics.damage_dice, // "1d6"
                bonus: Math.floor(this.character.level / 2),
                type: featureMechanics.damage_type, // "radiant_or_necrotic"
            };
        }
    }

    // (Hier könnten weitere Boni von anderen Pfaden hinzugefügt werden)

    return bonuses;
  }

  /**
   * Berechnet den Schadensbonus des Kampfrauschs basierend auf dem Level.
   * @param {number} level - Das Barbaren-Level.
   * @returns {number} - Der Schadensbonus (z.B. +2, +3, +4).
   */
  getRageDamageBonus(level) {
    if (level >= 16) return 4;
    if (level >= 9) return 3;
    return 2;
  }

  /**
   * Berechnet die maximale Anzahl der Kampfrausch-Nutzungen pro langer Rast.
   * @returns {number|string}
   */
  getMaxRageUses() {
    const level = this.character.level;
    if (level >= 20) return '∞'; // Unbegrenzt auf Stufe 20
    if (level >= 17) return 6;
    if (level >= 12) return 5;
    if (level >= 6) return 4;
    if (level >= 3) return 3;
    return 2;
  }
}