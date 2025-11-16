import { getModifier, getProficiencyBonus } from '../../../utils/helpers';
import spells from '../../../data/spells.json';
import allFeatures from '../../../data/features.json'; 

export class SorcererLogic {
  
  /**
   * Erstellt eine Instanz der Zauberer-Logik, die an einen bestimmten Charakter gebunden ist.
   * @param {object} character - Das Charakterobjekt, das diese Logik verwendet.
   */
  constructor(character) {
    this.character = character;
    // Zauberpunkte werden direkt auf dem Charakterobjekt verwaltet
    // (z.B. character.resources.sorcery_points)
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
    // Zauberer sind in Konstitution und Charisma geübt.
    return ['constitution', 'charisma'];
  }

  /**
   * Berechnet die ungepanzerte Verteidigung (Drakonische Blutlinie).
   * Regel: 13 + GES-Mod
   * @returns {number|null} - Die RK oder null, wenn nicht anwendbar.
   */
  getUnarmoredDefense() {
    // Liest 'draconic_resilience_ac' aus features.json
    if (this.hasFeature('draconic_resilience_ac')) {
      const dexMod = getModifier(this.character.abilities.dexterity);
      // (Die Spiel-Engine muss prüfen, ob Rüstung getragen wird)
      return 13 + dexMod;
    }
    return null;
  }
  
  /**
   * Ruft den Bonus auf die Trefferpunkte (Drakonische Blutlinie) ab.
   * Regel: +1 TP pro Zauberer-Level
   * @returns {number}
   */
  getHitPointBonus() {
     if (this.hasFeature('draconic_resilience_hp')) {
         return this.character.level;
     }
     return 0;
  }

  // --- Zauber-Logik (Bekannte Zauber) ---

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

  /**
   * Ruft die Anzahl der Zauber ab, die ein Zauberer *kennen* kann.
   * @returns {number}
   */
  getKnownSpellsCount() {
    const level = this.character.level;
    // Standard Zauberer-Zauberprogression
    if (level === 1) return 2;
    if (level === 2) return 3;
    if (level === 3) return 4;
    if (level === 4) return 5;
    if (level === 5) return 6;
    if (level === 6) return 7;
    if (level === 7) return 8;
    if (level === 8) return 9;
    if (level === 9) return 10;
    if (level === 10) return 11;
    if (level === 11) return 12;
    if (level === 12) return 12;
    if (level === 13) return 13;
    if (level === 14) return 13;
    if (level === 15) return 14;
    if (level === 16) return 14;
    if (level >= 17) return 15;
    return 0;
  }

  /**
   * Ruft die *gesamte* Liste der Zauber ab, aus denen der Zauberer
   * beim Stufenaufstieg wählen kann.
   * @returns {string[]} Array von Zauberschlüsseln.
   */
  getLearnableSpells() {
    const maxLevel = this.character.spellSlots.maxLevel;
    
    // Annahme: spells.json verwendet "caster_class": "sorcerer"
    return spells
      .filter(s => s.caster_class === 'sorcerer' && s.level > 0 && s.level <= maxLevel)
      .map(s => s.key);
  }
  
  // --- ZAUBERPUNKTE (Sorcery Points) & METAMAGIE ---

  /**
   * Ruft die maximale Anzahl an Zauberpunkten ab.
   * Regel: Entspricht dem Zauberer-Level (außer auf Stufe 1).
   * @returns {number}
   */
  getMaxSorceryPoints() {
    const level = this.character.level;
    if (level === 1) return 0;
    return level;
  }
  
  /**
   * Wird aufgerufen, wenn der Zauberer eine lange Rast beendet.
   * Füllt alle Zauberpunkte auf.
   */
  onLongRest() {
    // Zauberpunkte auffüllen
    // (Annahme: character.resources.sorcery_points)
    if (this.character.resources) {
      this.character.resources.sorcery_points = this.getMaxSorceryPoints();
    }
  }

  /**
   * Ruft die Metamagie-Optionen ab, die dem Zauberer zur Verfügung stehen.
   * (Wird von der UI/Kampf-Engine aufgerufen)
   * @returns {string[]} Array von Metamagie-Feature-Keys (z.B. ['metamagic_quickened_spell']).
   */
  getAvailableMetamagic() {
    // Filtert alle gelernten Features, die vom Typ 'metamagic' sind
    return this.character.features.filter(key => {
      const feature = allFeatures.find(f => f.key === key);
      return feature && feature.feature_type === 'metamagic';
    });
  }

  /**
   * Berechnet die Kosten für eine bestimmte Metamagie-Anwendung.
   * (Wird von der SpellEngine aufgerufen)
   * @param {string} metamagicKey - Der Schlüssel der Metamagie (z.B. 'metamagic_twinned_spell').
   * @param {object} spell - Der Zauber, auf den sie angewendet wird.
   * @returns {number} - Die Kosten in Zauberpunkten.
   */
  getMetamagicCost(metamagicKey, spell) {
    const featureData = allFeatures.find(f => f.key === metamagicKey);
    if (!featureData) return 0;

    // Spezielle Regel für 'Gezielter Zauber' (Twinned Spell)
    if (metamagicKey === 'metamagic_twinned_spell') {
      // Regel: Kosten = Zaubergrad (Zaubertricks kosten 1 Punkt)
      return (spell.level === 0) ? 1 : spell.level;
    }
    
    // Standardkosten aus features.json
    return featureData.cost || 0;
  }
  
  // --- SUBKLASSEN-LOGIK ---

  /**
   * Prüft, ob 'Elementare Affinität' angewendet werden kann und gibt den Bonus zurück.
   * (Wird von der SpellEngine aufgerufen)
   * @param {object} spell - Das Zauberobjekt, das gewirkt wird.
   * @returns {number} - Der zusätzliche Schadensbonus (CHA-Mod).
   */
  getElementalAffinityBonus(spell) {
    if (!this.hasFeature('elemental_affinity')) {
      return 0;
    }
    
    // Annahme: Der Charakter hat seinen Drachen-Ahnen-Schadenstyp gespeichert
    // (z.B. character.draconic_ancestry_type = 'fire')
    const ancestryType = this.character.draconic_ancestry_type;
    
    if (ancestryType && spell.damage_type === ancestryType) {
      // Regel: Füge CHA-Modifikator zu *einem* Schadenswurf des Zaubers hinzu
      return getModifier(this.character.abilities.charisma);
    }
    
    return 0;
  }
}