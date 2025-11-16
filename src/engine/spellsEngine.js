import allSpells from '../data/spells.json';
import { getModifier, rollDiceFormula } from '../utils/helpers';

/**
 * Die SpellsEngine ist dafür verantwortlich, die Logik-Daten
 * aus spells.json zu lesen und Effekte im Spiel auszuführen.
 */
export class SpellsEngine {
  constructor() {
    this.spellsData = allSpells;
    console.log("SpellsEngine initialisiert.");
  }

  /**
   * Ruft die vollständigen Daten für einen Zauber anhand seines Schlüssels ab.
   * @param {string} spellKey 
   * @returns {object | undefined} Das Zauberobjekt oder undefined.
   */
  getSpell(spellKey) {
    return this.spellsData.find(s => s.key === spellKey);
  }

  /**
   * Führt einen Zauber aus (Hauptfunktion).
   * HINWEIS: Dies ist noch ein SKELETON. Wir implementieren nur Schaden.
   * * @param {object} caster - Der Charakter, der zaubert.
   * @param {string} spellKey - z.B. "acid_splash".
   * @param {object[]} targets - Array von Ziel-Charakter-Objekten.
   * @param {object} classLogic - Die Logik-Instanz der Klasse (z.B. WizardLogic).
   */
  executeSpell(caster, spellKey, targets, classLogic) {
    const spell = this.getSpell(spellKey);
    if (!spell) {
      console.error(`Zauber ${spellKey} nicht gefunden!`);
      return;
    }

    console.log(`${caster.name} wirkt ${spell.name}!`);

    // 1. Zauberslot / Aktion verbrauchen (TODO)
    // z.B. checkCastingTime(caster, spell.casting_time) ...

    // 2. Effekte des Zaubers durchgehen
    if (!spell.effects) {
      console.log(`${spell.name} hat keine Logik-Effekte (z.B. 'Tanzende Lichter').`);
      return;
    }

    for (const effect of spell.effects) {
      try {
        if (effect.type === "DAMAGE") {
          this.applyDamageEffect(caster, spell, effect, targets, classLogic);
        }
        // ... Hier kommen später APPLY_CONDITION, HEAL, SUMMON etc. hinzu
      } catch (e) {
        console.error(`Fehler bei der Ausführung des Effekts:`, effect, e);
      }
    }
  }

  /**
   * Wendet einen Schaden-Effekt auf Ziele an.
   */
  applyDamageEffect(caster, spell, effect, targets, classLogic) {
    const casterLevel = caster.level;
    let damageDice = effect.damage.dice;

    // 1. Skalierung berechnen
    if (effect.scaling?.type === "CANTRIP") {
      const breakpoints = Object.keys(effect.scaling.dice_at_levels).sort((a, b) => b - a);
      for (const level of breakpoints) {
        if (casterLevel >= parseInt(level, 10)) {
          damageDice = effect.scaling.dice_at_levels[level];
          break; // Nimm den höchsten erreichten Breakpoint
        }
      }
    }
    // TODO: 'PER_SLOT_LEVEL' Skalierung implementieren (z.B. für Feuerball)

    // 2. Auf alle Ziele anwenden
    for (const target of targets) {
      let finalDamage = 0;
      let saved = false;
      let hit = true; // Angenommen für Rettungswurf-Zauber

      // 3. Zauberangriff (falls vorhanden)
      if (effect.attack_roll) {
        const attackBonus = classLogic.getSpellAttackBonus();
        const roll = rollDiceFormula("1d20") + attackBonus;
        
        if (roll < target.stats.ac) { // Annahme: target.stats.ac
          hit = false;
          console.log(`Angriff auf ${target.name} verfehlt (Wurf: ${roll} vs AC: ${target.stats.ac})`);
        }
      }

      if (!hit) continue; // Nächstes Ziel

      // 4. Rettungswurf (falls vorhanden)
      if (effect.saving_throw) {
        const saveDC = classLogic.getSpellSaveDC();
        const targetAbility = effect.saving_throw.ability;
        // Annahme: target.abilities
        const saveBonus = getModifier(target.abilities[targetAbility]); 
        const saveRoll = rollDiceFormula("1d20") + saveBonus;

        if (saveRoll >= saveDC) {
          saved = true;
          console.log(`${target.name} besteht den ${targetAbility.toUpperCase()}-Rettungswurf! (Wurf: ${saveRoll} vs DC: ${saveDC})`);
        } else {
          console.log(`${target.name} scheitert am ${targetAbility.toUpperCase()}-Rettungswurf! (Wurf: ${saveRoll} vs DC: ${saveDC})`);
        }
      }

      // 5. Schaden basierend auf Rettungswurf bestimmen
      if (saved && effect.saving_throw?.effect_on_success === "NEGATES_DAMAGE") {
        finalDamage = 0;
      } else {
        // Schaden würfeln
        finalDamage = rollDiceFormula(damageDice);

        // Klassen-Boni (z.B. Ermächtigte Hervorrufung)
        if (classLogic.getEmpoweredEvocationBonus) {
          const bonus = classLogic.getEmpoweredEvocationBonus(spell);
          if(bonus > 0) {
            console.log(`Füge ${bonus} Bonus-Schaden von 'Ermächtigte Hervorrufung' hinzu.`);
            finalDamage += bonus;
          }
        }
        
        if (saved && effect.saving_throw?.effect_on_success === "HALF_DAMAGE") {
          finalDamage = Math.floor(finalDamage / 2);
        }
      }

      // 6. Schaden anwenden (im Log ausgeben)
      if (finalDamage > 0) {
        console.log(`>>> ${target.name} erleidet ${finalDamage} ${effect.damage.type} Schaden!`);
        // Hier würdest du den Schaden anwenden, z.B.:
        // target.stats.hp -= finalDamage;
      } else {
        console.log(`>>> ${target.name} erleidet keinen Schaden.`);
      }
    }
  }
}

// Erstelle eine globale Instanz, die importiert werden kann
const spellsEngine = new SpellsEngine();
export default spellsEngine;