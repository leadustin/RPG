import { getModifier, getProficiencyBonus, rollD20 } from '../../../utils/helpers';
import spells from '../../../data/spells.json';
import allFeatures from '../../../data/features.json'; 

export class WizardLogic {
  
  /**
   * Erstellt eine Instanz der Magier-Logik, die an einen bestimmten Charakter gebunden ist.
   * @param {object} character - Das Charakterobjekt, das diese Logik verwendet.
   */
  constructor(character) {
    this.character = character;

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

  /**
   * Initialisiert Ressourcen, die von Features gewährt werden (z.B. Arkaner Schutz).
   * Wird beim Erstellen der Logik-Instanz aufgerufen.
   */
  initializeFeatureResources() {
    const intMod = getModifier(this.character.abilities.intelligence);
    
    // Arkanen Schutz initialisieren
    if (this.character.features.includes('abjuration_arcane_ward')) {
      const maxHp = (this.character.level * 2) + intMod;
      this.arcaneWard = {
        currentHp: maxHp,
        maxHp: maxHp
      };
    }
    
    // Omen-Würfel initialisieren (wird bei langer Rast neu gewürfelt)
    this.rollPortentDice();
  }

  // --- Grundlegende Zauberinformationen ---

  getSpellcastingAbility() {
    return 'intelligence';
  }

  getSpellSaveDC() {
    const intMod = getModifier(this.character.abilities.intelligence);
    const profBonus = getProficiencyBonus(this.character.level);
    return 8 + profBonus + intMod;
  }

  getSpellAttackBonus() {
    const intMod = getModifier(this.character.abilities.intelligence);
    const profBonus = getProficiencyBonus(this.character.level);
    return profBonus + intMod;
  }

  getSavingThrowProficiencies() {
    // Magier sind in Intelligenz und Weisheit geübt.
    return ['intelligence', 'wisdom'];
  }

  // --- Zaubervorbereitung ---

  /**
   * Berechnet die Anzahl der Zauber, die ein Magier vorbereiten kann.
   * @returns {number}
   */
  getPreparedSpellsCount() {
    const intMod = getModifier(this.character.abilities.intelligence);
    // Mindestens 1 Zauber
    return Math.max(1, intMod + this.character.level);
  }

  /**
   * Ruft alle Zauber aus dem Zauberbuch des Magiers ab.
   * HINWEIS: Dies ist eine Vereinfachung. Eine vollständige Implementierung
   * würde ein `character.spellbook`-Array anstelle der gesamten Magier-Zauberliste verwenden.
   * @returns {string[]} Array von Zauberschlüsseln.
   */
  getSpellbookSpells() {
    // TODO: Später durch `character.spellbook` ersetzen.
    // Fürs Erste nehmen wir an, das Zauberbuch enthält alle Magier-Zauber,
    // die der Charakter wirken kann.
    const maxLevel = this.character.spellSlots.maxLevel;
    
    return spells
      .filter(s => s.classes.includes('wizard') && s.level <= maxLevel)
      .map(s => s.key);
  }
  
  // --- Feature-Logik (Wird von der SpellEngine aufgerufen) ---

  /**
   * Prüft, ob der Magier 'Ermächtigte Hervorrufung' hat und gibt den Bonus zurück.
   * (Wird von der SpellEngine aufgerufen)
   * @param {object} spell - Das Zauberobjekt, das gewirkt wird.
   * @returns {number} Der zusätzliche Schadensbonus (INT-Mod).
   */
  getEmpoweredEvocationBonus(spell) {
    const hasFeature = this.character.features.includes('empowered_evocation');
    
    // Prüfen, ob das Feature vorhanden ist UND der Zauber von der Schule der Hervorrufung ist
    if (hasFeature && spell.school === 'evocation') {
      return getModifier(this.character.abilities.intelligence);
    }
    return 0;
  }

  /**
   * Prüft, ob der Magier 'Mächtige Zaubertricks' hat.
   * (Wird von der SpellEngine aufgerufen)
   * @param {object} spell - Das Zauberobjekt, das gewirkt wird.
   * @returns {boolean}
   */
  isPotentCantrip(spell) {
    const hasFeature = this.character.features.includes('potent_cantrip');
    
    // Prüfen, ob das Feature vorhanden ist, es ein Zaubertrick ist UND
    // (gemäß unserer features.json) von der Schule der Hervorrufung ist.
    if (hasFeature && spell.level === 0 && spell.school === 'evocation') {
      return true;
    }
    return false;
  }
  
  // --- Ressourcen-Management für Features ---

  /**
   * Wird aufgerufen, wenn der Magier eine lange Rast beendet.
   * Füllt Feature-Ressourcen wieder auf.
   */
  onLongRest() {
    // Omen-Würfel neu würfeln
    this.rollPortentDice();
    
    // Arkanen Schutz wieder voll aufladen
    if (this.character.features.includes('abjuration_arcane_ward')) {
      this.arcaneWard.currentHp = this.arcaneWard.maxHp;
    }
  }

  /**
   * Würfelt die Omen-Würfel (Portent) und speichert sie.
   */
  rollPortentDice() {
    this.portentDice = [];
    let diceCount = 0;
    
    if (this.character.features.includes('divination_portent_lvl_14')) {
      diceCount = 3;
    } else if (this.character.features.includes('divination_portent_lvl_2')) {
      diceCount = 2;
    }

    for (let i = 0; i < diceCount; i++) {
      this.portentDice.push(rollD20());
    }
  }

  /**
   * Verbraucht einen Omen-Würfel.
   * @param {number} diceValue - Der Wert des Würfels, der verbraucht wird.
   * @returns {boolean} - True bei Erfolg, False wenn der Würfel nicht gefunden wurde.
   */
  usePortentDice(diceValue) {
    const index = this.portentDice.indexOf(diceValue);
    if (index > -1) {
      this.portentDice.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Wird von der SpellEngine aufgerufen, wenn der Magier einen Bannzauber wirkt.
   * Lädt den Arkanen Schutz wieder auf.
   * @param {number} spellLevel - Der Grad des gewirkten Bannzaubers.
   */
  rechargeArcaneWard(spellLevel) {
    if (!this.character.features.includes('abjuration_arcane_ward') || spellLevel === 0) {
      return 0; // Nichts zu tun
    }
    
    const rechargeAmount = spellLevel * 2;
    this.arcaneWard.currentHp = Math.min(
      this.arcaneWard.maxHp, 
      this.arcaneWard.currentHp + rechargeAmount
    );
    return rechargeAmount;
  }

  /**
   * Wird aufgerufen, wenn der Arkane Schutz Schaden nimmt.
   * @param {number} damageAmount - Die Höhe des Schadens.
   * @returns {number} - Der verbleibende Schaden, der "durchbricht".
   */
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