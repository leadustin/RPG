import { getModifier, getProficiencyBonus } from '../../../utils/helpers';
import allFeatures from '../../../data/features.json'; 
import spells from '../../../data/spells.json'; // Für Weg der 4 Elemente / Schatten

export class MonkLogic {
  
  /**
   * Erstellt eine Instanz der Mönch-Logik, die an einen bestimmten Charakter gebunden ist.
   * @param {object} character - Das Charakterobjekt, das diese Logik verwendet.
   */
  constructor(character) {
    this.character = character;
    // Ki-Punkte werden direkt auf dem Charakterobjekt verwaltet
    // (z.B. character.resources.ki_points)
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
    // Mönche sind in Stärke und Geschicklichkeit geübt.
    return ['strength', 'dexterity'];
  }

  /**
   * Berechnet die ungepanzerte Verteidigung des Mönchs.
   * Regel: 10 + GES-Mod + WEI-Mod
   * @returns {number|null} - Die RK oder null, wenn nicht anwendbar.
   */
  getUnarmoredDefense() {
    if (this.hasFeature('ungepanzerte_verteidigung_monk')) { // Annahme: Eindeutiger Key in classes.json
      const dexMod = getModifier(this.character.abilities.dexterity);
      const wisMod = getModifier(this.character.abilities.wisdom);
      // (Die Spiel-Engine muss prüfen, ob Rüstung/Schild getragen wird)
      return 10 + dexMod + wisMod;
    }
    return null;
  }

  // --- RESSOURCEN-LOGIK (Ki) ---

  /**
   * Ruft die maximale Anzahl an Ki-Punkten ab.
   * Regel: Entspricht dem Mönch-Level (außer auf Stufe 1).
   * @returns {number}
   */
  getMaxKiPoints() {
    const level = this.character.level;
    if (level === 1) return 0;
    return level;
  }

  /**
   * Ruft den Schadenswürfel für Kampfkunst (unbewaffneter Schlag) ab.
   * @returns {string} - Die Schadenswürfel-Notation (z.B. "1d4", "1d6").
   */
  getMartialArtsDice() {
    const level = this.character.level;
    if (level >= 17) return '1d10';
    if (level >= 11) return '1d8';
    if (level >= 5) return '1d6';
    return '1d4';
  }

  /**
   * Wird aufgerufen, wenn der Mönch eine kurze oder lange Rast beendet.
   * Füllt alle Ki-Punkte auf.
   */
  onShortRest() {
    // Ki-Punkte auffüllen
    // (Annahme: character.resources.ki_points)
    if (this.character.resources) {
      this.character.resources.ki_points = this.getMaxKiPoints();
    }
  }

  // --- FÄHIGKEITEN-LOGIK (Wird von der Kampf-Engine aufgerufen) ---

  /**
   * Ruft die Kosten für eine bestimmte Ki-Fähigkeit ab.
   * @param {string} featureKey - Der Schlüssel der Fähigkeit (z.B. 'betäubender_schlag', 'schattenkuenste').
   * @returns {number|null} - Die Ki-Kosten oder null, wenn nicht gefunden.
   */
  getKiAbilityCost(featureKey) {
    if (!this.hasFeature(featureKey)) return null;

    // Standard-Ki-Fähigkeiten
    switch (featureKey) {
      case 'hagel_der_schlaege': // Flurry of Blows
      case 'geduldige_verteidigung': // Patient Defense
      case 'schritt_des_windes': // Step of the Wind
        return 1;
      case 'betäubender_schlag': // Stunning Strike
        return 1;
      case 'geschosse_ablenken_zurueckwerfen': // Deflect Missiles (Return)
        return 1;
      // (Weitere Kern-Ki-Fähigkeiten hier...)
    }

    // Subklassen-Ki-Fähigkeiten (aus features.json lesen)
    const featureData = allFeatures.find(f => f.key === featureKey);
    if (featureData && featureData.resource_cost && featureData.resource_cost.type === 'ki') {
      return featureData.resource_cost.value;
    }

    return null;
  }

  /**
   * Ruft den Rettungswurf-SG für Mönch-Fähigkeiten (z.B. Betäubender Schlag) ab.
   * Regel: 8 + Übungsbonus + WEI-Mod
   * @returns {number}
   */
  getKiSaveDC() {
    const wisMod = getModifier(this.character.abilities.wisdom);
    const profBonus = getProficiencyBonus(this.character.level);
    return 8 + profBonus + wisMod;
  }

  /**
   * Prüft, ob der Mönch Angriffe mit Geschicklichkeit statt Stärke ausführen kann
   * (für unbewaffnete Schläge und Mönchswaffen).
   * @returns {boolean}
   */
  canUseDexForAttacks() {
    // 'Kampfkunst' (Stufe 1)
    return this.character.level >= 1; 
  }

  /**
   * Prüft, ob die unbewaffneten Schläge des Mönchs als magisch gelten.
   * @returns {boolean}
   */
  unarmedStrikesAreMagical() {
    // 'Ki-gestärkte Schläge' (Stufe 6)
    return this.character.level >= 6;
  }
}