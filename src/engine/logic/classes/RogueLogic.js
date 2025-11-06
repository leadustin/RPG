import { getModifier, getProficiencyBonus } from '../../../utils/helpers';

// Zauberplätze (Drittel-Zauberwirker - Mystischer Ritter, Arkaner Betrüger)
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

// Bekannte Zauber (Arcane Trickster)
const TRICKSTER_SPELLS_KNOWN = [
    { level: 3, known: 3 }, { level: 4, known: 4 }, { level: 7, known: 5 }, { level: 8, known: 6 },
    { level: 10, known: 7 }, { level: 11, known: 8 }, { level: 13, known: 9 }, { level: 14, known: 10 },
    { level: 16, known: 11 }, { level: 19, known: 12 }, { level: 20, known: 13 },
];

/**
 * Kapselt die 5E-Logik für die Schurken-Klasse.
 */
export class RogueLogic {
  constructor(classData, allSpells, allFeatures) {
    this.classData = classData; // Das Schurken-Objekt aus classes.json
    this.allSpells = allSpells;
    this.allFeatures = allFeatures;
    
    // Arkane Betrüger lernen aus der Magier-Liste
    this.wizardSpells = this.allSpells.filter(spell => spell.classes && spell.classes.includes('wizard'));
  }

  getHitPointsPerLevel() {
    return 8;
  }

  getSavingThrowProficiencies() {
    return this.classData.saving_throws; // ['dexterity', 'intelligence']
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

  // --- FÄHIGKEITEN-LOGIK ---

  /**
   * Gibt den Schadenswürfel für 'Hinterhältiger Angriff' (Sneak Attack) zurück.
   * Regel: 1W6, +1W6 alle 2 Stufen.
   */
  getSneakAttackDice(level) {
    // (classes.json ist bei der Skalierung fehlerhaft, wir nutzen 5E-Regeln)
    const diceCount = Math.ceil(level / 2);
    return `${diceCount}d6`;
  }

  /**
   * Gibt die Anzahl der 'Expertise'-Fertigkeiten zurück, die gewählt werden können.
   */
  getExpertiseCount(level) {
    if (level < 1) return 0;
    if (level < 6) return 2; // Stufe 1
    return 4; // Stufe 6 (erhält 2 weitere)
  }

  // --- ARKANER BETRÜGER (ARCANE TRICKSTER) LOGIK ---

  getSpellcastingAbility() {
    // Nur relevant für Arkaner Betrüger
    return 'intelligence';
  }

  /**
   * Holt die Zauberliste für den Arkanen Betrüger.
   * Regel: Magier-Zauber, hauptsächlich Illusion und Verzauberung.
   */
  getArcaneTricksterSpells(level) {
    const maxSpellLevel = this.getArcaneTricksterMaxSpellLevel(level);
    
    return this.wizardSpells.filter(spell => {
        if (spell.level === 0) return true; // Alle Zaubertricks sind ok
        if (spell.level > maxSpellLevel) return false;
        
        // Regel: Zauber müssen Illusion oder Verzauberung sein...
        if (spell.school === 'illusion' || spell.school === 'enchantment') {
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

  getArcaneTricksterMaxSpellLevel(level) {
    if (level < 7) return 1;
    if (level < 13) return 2;
    if (level < 19) return 3;
    return 4;
  }
  
  getKnownCantripsCount(level, subclassKey) {
    if (subclassKey !== 'arcane_trickster' || level < 3) return 0;
    if (level < 10) return 3; // 2 + Magierhand
    return 4; // 3 + Magierhand
  }

  getKnownSpellsCount(level, subclassKey) {
    if (subclassKey !== 'arcane_trickster') return 0;
    const entry = TRICKSTER_SPELLS_KNOWN.find(p => p.level === level);
    return entry ? entry.known : 0;
  }

  getSpellSlots(level, subclassKey) {
    if (subclassKey !== 'arcane_trickster' || level < 3) {
      return {};
    }
    const entry = THIRD_CASTER_SLOTS.find(p => p.level === level);
    return entry ? entry.slots : {};
  }
  
  getSpellSaveDC(character) {
    if (character.subclassKey !== 'arcane_trickster') return null;
    const proficiencyBonus = getProficiencyBonus(character.level);
    const intModifier = getModifier(character.abilities.intelligence);
    return 8 + proficiencyBonus + intModifier;
  }

  getSpellAttackBonus(character) {
    if (character.subclassKey !== 'arcane_trickster') return null;
    const proficiencyBonus = getProficiencyBonus(character.level);
    const intModifier = getModifier(character.abilities.intelligence);
    return proficiencyBonus + intModifier;
  }
}