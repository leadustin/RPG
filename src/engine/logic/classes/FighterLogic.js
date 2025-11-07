import { getModifier, getProficiencyBonus } from '../../../utils/helpers';
import allFeatures from '../../../data/features.json'; 
// (spells.json wird für den Mystischen Ritter benötigt)
import spells from '../../../data/spells.json'; 

export class FighterLogic {
  
  /**
   * Erstellt eine Instanz der Kämpfer-Logik, die an einen bestimmten Charakter gebunden ist.
   * @param {object} character - Das Charakterobjekt, das diese Logik verwendet.
   */
  constructor(character) {
    this.character = character;

    // --- Feature-spezifische Ressourcen initialisieren ---

    // Für 'battle_master_combat_superiority'
    this.superiorityDice = {
      current: 0,
      max: 0,
      dice: '1d8' // Standard
    };

    this.initializeFeatureResources();
  }

  /**
   * Initialisiert Ressourcen, die von Features gewährt werden.
   */
  initializeFeatureResources() {
    // Initialisiere Überlegenheitswürfel für Kampfmeister
    if (this.hasFeature('battle_master_combat_superiority')) {
      let diceCount = 0;
      let diceType = '1d8';
      
      // Skalierung der Würfelanzahl
      if (this.character.level >= 15) diceCount = 6;
      else if (this.character.level >= 7) diceCount = 5;
      else diceCount = 4;
      
      // Skalierung des Würfeltyps
      if (this.hasFeature('battle_master_improved_combat_superiority_w12')) diceType = '1d12'; // Annahme für Stufe 18
      else if (this.hasFeature('battle_master_improved_combat_superiority')) diceType = '1d10';

      this.superiorityDice = {
        current: diceCount,
        max: diceCount,
        dice: diceType
      };
    }
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
    // Kämpfer sind in Stärke und Konstitution geübt.
    return ['strength', 'constitution'];
  }

  // --- KAMPF-LOGIK (Wird von der Kampf-Engine aufgerufen) ---

  /**
   * Ruft die Anzahl der Angriffe ab, die der Kämpfer mit einer Angriffsaktion ausführen kann.
   * @returns {number}
   */
  getExtraAttackCount() {
    const level = this.character.level;
    if (level >= 20) return 4;
    if (level >= 11) return 3;
    if (level >= 5) return 2;
    return 1;
  }

  /**
   * Ruft den verbesserten kritischen Trefferbereich für Champions ab.
   * @returns {number} - Die Zahl, bei der ein kritischer Treffer beginnt (z.B. 19 oder 18).
   */
  getCriticalHitRange() {
    // Liest die 'champion'-Features aus features.json
    if (this.hasFeature('champion_superior_critical')) {
      return 18;
    }
    if (this.hasFeature('champion_improved_critical')) {
      return 19;
    }
    return 20; // Standard
  }

  /**
   * Wird aufgerufen, wenn der Kämpfer eine kurze oder lange Rast beendet.
   * Füllt Ressourcen wie 'Tatendrang' und 'Überlegenheitswürfel' auf.
   */
  onShortRest() {
    // Tatendrang (Action Surge) auffüllen
    // (Annahme: character.resources.action_surge)
    
    // Überlegenheitswürfel (Battle Master) auffüllen
    if (this.hasFeature('battle_master_combat_superiority')) {
      this.superiorityDice.current = this.superiorityDice.max;
    }
    
    // Zweite Luft (Second Wind) auffüllen
    // (Annahme: character.resources.second_wind)
  }

  // --- MYSTISCHER RITTER (Eldritch Knight) ZAUBER-LOGIK ---

  /**
   * Prüft, ob der Kämpfer ein Zauberwirker ist (nur Mystischer Ritter).
   * @returns {boolean}
   */
  isSpellcaster() {
    return this.hasFeature('eldritch_knight_spellcasting');
  }

  getSpellcastingAbility() {
    // Mystische Ritter verwenden Intelligenz
    return 'intelligence';
  }

  getSpellSaveDC() {
    if (!this.isSpellcaster()) return null;
    const intMod = getModifier(this.character.abilities.intelligence);
    const profBonus = getProficiencyBonus(this.character.level);
    return 8 + profBonus + intMod;
  }

  getSpellAttackBonus() {
    if (!this.isSpellcaster()) return null;
    const intMod = getModifier(this.character.abilities.intelligence);
    const profBonus = getProficiencyBonus(this.character.level);
    return profBonus + intMod;
  }

  /**
   * Ruft die Zauberliste für einen Mystischen Ritter ab.
   * Regel: Magier-Zauber, primär aus Bannmagie (Abjuration) und Hervorrufung (Evocation).
   * @returns {string[]} Array von Zauberschlüsseln.
   */
  getPreparableSpells() {
    if (!this.isSpellcaster()) return [];
    
    const maxLevel = this.character.spellSlots.maxLevel;
    
    // 1. Alle Magier-Zauber der erlaubten Schulen
    const allowedSchoolSpells = spells
      .filter(s => 
        s.classes.includes('wizard') &&
        s.level > 0 && 
        s.level <= maxLevel &&
        (s.school === 'abjuration' || s.school === 'evocation')
      )
      .map(s => s.key);
      
    // 2. Zauber beliebiger Schulen (auf bestimmten Stufen)
    // Regel: Auf Stufe 3, 8, 14, 20 können sie einen Zauber einer *beliebigen* Schule lernen.
    // (Diese Logik ist komplexer und erfordert die Verwaltung eines 'bekannten Zauber'-Buches
    // statt nur 'vorbereitbarer' Zauber. Fürs Erste filtern wir die Hauptschulen.)
    
    // (Vereinfachung für dieses Modul: Wir geben nur die Hauptschulen zurück)
    return allowedSchoolSpells;
  }
}