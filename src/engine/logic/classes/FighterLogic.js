import { getModifier, getProficiencyBonus } from '../../../utils/helpers';

// Zauberplätze (Drittel-Zauberwirker - Mystischer Ritter, Arkaner Trickster)
const THIRD_CASTER_SLOTS = [
  { level: 1, slots: {} }, { level: 2, slots: {} },
  { level: 3, slots: { 1: 2 } }, { level: 4, slots: { 1: 3 } },
  { level: 5, slots: { 1: 3 } }, { level: 6, slots: { 1: 3 } },
  { level: 7, slots: { 1: 4, 2: 2 } }, { level: 8, slots: { 1: 4, 2: 2 } },
  { level: 9, slots: { 1: 4, 2: 2 } }, { level: 10, slots: { 1: 4, 2: 3 } },
  { level: 11, slots: { 1: 4, 2: 3 } }, { level: 12, slots: { 1: 4, 2: 3 } },
  { level: 13, slots: { 1: 4, 2: 3, 3: 2 } }, { level: 14, slots: { 1: 4, 2: 3, 3: 2 } },
  { level: 15, slots: { 1: 4, 2: 3, 3: 2 } }, { level: 16, slots: { 1: 4, 2: 3, 3: 3 } },
  { level: 17, slots: { 1: 4, 2: 3, 3: 3 } }, { level: 18, slots: { 1: 4, 2: 3, 3: 3 } },
  { level: 19, slots: { 1: 4, 2: 3, 3: 3, 4: 1 } }, { level: 20, slots: { 1: 4, 2: 3, 3: 3, 4: 1 } },
];

/**
 * Kapselt die 5E-Logik für die Kämpfer-Klasse.
 */
export class FighterLogic {
  constructor(classData, allSpells, allFeatures) {
    this.classData = classData; // Das Kämpfer-Objekt aus classes.json
    this.allSpells = allSpells;
    this.allFeatures = allFeatures;
    
    // Mystische Ritter lernen aus der Magier-Liste
    this.wizardSpells = this.allSpells.filter(spell => spell.classes && spell.classes.includes('wizard'));
  }

  getHitPointsPerLevel() {
    return 10;
  }

  getSavingThrowProficiencies() {
    return this.classData.saving_throws; // ['strength', 'constitution']
  }

  /**
   * Holt die spezifischen Fähigkeiten für die Stufe und Unterklasse.
   */
  getFeaturesForLevel(level, subclassKey) {
    const features = [];
    const baseFeatures = this.classData.features.filter(f => f.level === level);
    features.push(...baseFeatures);

    if (subclassKey) {
      const subclass = this.classData.subclasses.find(sc => sc.key === subclassKey);
      if (subclass) {
        const subclassFeatures = subclass.features.filter(f => f.level === level);
        features.push(...subclassFeatures);
      }
    }
    return features;
  }
  
  /**
   * Holt die verfügbaren Kampfstile für einen Kämpfer.
   */
  getFightingStyles() {
      return this.allFeatures.filter(f => f.classes && f.classes.includes('fighter') && f.key.startsWith('fighting_style_'));
  }

  // --- FÄHIGKEITEN-LOGIK ---

  /**
   * Berechnet die Heilung für "Zweite Luft" (Stufe 1).
   * Regel: 1W10 + Kämpfer-Level.
   */
  getSecondWindHeal(level) {
    const roll = Math.floor(Math.random() * 10) + 1;
    return roll + level;
  }

  /**
   * Gibt die Anzahl der Nutzungen für "Tatendrang" (Stufe 2) zurück.
   */
  getActionSurgeUses(level) {
    if (level < 2) return 0;
    if (level < 17) return 1;
    return 2; // Ab Stufe 17 (obwohl classes.json dies nicht erwähnt, ist es 5E-Regel)
  }

  /**
   * Gibt die Anzahl der Nutzungen für "Unbezwingbar" (Stufe 9) zurück.
   */
  getIndomitableUses(level) {
    if (level < 9) return 0;
    if (level < 13) return 1;
    if (level < 17) return 2;
    return 3; // Ab Stufe 17 (classes.json erwähnt nur 2 Nutzungen auf Lvl 14)
  }

  /**
   * Gibt die Anzahl der Angriffe für die Angriffsaktion zurück.
   */
  getExtraAttacks(level) {
    if (level < 5) return 1;
    if (level < 11) return 2;
    if (level < 20) return 3;
    return 4; // Stufe 20 (classes.json erwähnt dies nicht, aber es ist die 5E-Regel)
  }
  
  // --- MYSTISCHER RITTER (ELDRITCH KNIGHT) LOGIK ---

  getSpellcastingAbility() {
    // Nur relevant für Mystischer Ritter
    return 'intelligence';
  }

  /**
   * Holt die Zauberliste für den Mystischen Ritter.
   * Regel: Magier-Zauber, hauptsächlich Bann- (Abjuration) und Hervorrufungs- (Evocation) Schulen.
   */
  getEldritchKnightSpells(level) {
    const maxSpellLevel = this.getEldritchKnightMaxSpellLevel(level);
    
    return this.wizardSpells.filter(spell => {
        if (spell.level === 0) return true; // Alle Zaubertricks sind ok
        if (spell.level > maxSpellLevel) return false;
        
        // Regel: Zauber müssen Bann oder Hervorrufung sein...
        if (spell.school === 'abjuration' || spell.school === 'evocation') {
            return true;
        }
        
        // ...AUSSER auf Stufe 3, 8, 14, 20 (freie Wahl)
        if (level >= 3 || level >= 8 || level >= 14 || level >= 20) {
            // (Die Logik für die *Anzahl* der freien Zauber müsste hier implementiert werden)
            return true; // Vereinfachung: Erlaube alle Schulen
        }
        return false;
    });
  }

  getEldritchKnightMaxSpellLevel(level) {
    if (level < 7) return 1;
    if (level < 13) return 2;
    if (level < 19) return 3;
    return 4;
  }
  
  getKnownCantripsCount(level) {
     // Nur für Mystischer Ritter
    if (level < 3) return 0;
    if (level < 10) return 2;
    return 3;
  }

  getKnownSpellsCount(level) {
    // Nur für Mystischer Ritter
    if (level < 3) return 0;
    if (level === 3) return 3;
    if (level < 7) return 4;
    if (level < 10) return 5;
    if (level < 13) return 6;
    if (level < 16) return 7;
    if (level < 19) return 8;
    return 10; // (Werte variieren je nach Quelle, dies ist eine Standard-Progression)
  }

  /**
   * Gibt die Zauberplätze für den Mystischen Ritter (1/3 Caster) zurück.
   */
  getSpellSlots(level, subclassKey) {
    if (subclassKey !== 'eldritch_knight' || level < 3) {
      return {};
    }
    const entry = THIRD_CASTER_SLOTS.find(p => p.level === level);
    return entry ? entry.slots : {};
  }
  
  getSpellSaveDC(character) {
    if (character.subclassKey !== 'eldritch_knight') return null;
    const proficiencyBonus = getProficiencyBonus(character.level);
    const intModifier = getModifier(character.abilities.intelligence);
    return 8 + proficiencyBonus + intModifier;
  }

  getSpellAttackBonus(character) {
    if (character.subclassKey !== 'eldritch_knight') return null;
    const proficiencyBonus = getProficiencyBonus(character.level);
    const intModifier = getModifier(character.abilities.intelligence);
    return proficiencyBonus + intModifier;
  }
}