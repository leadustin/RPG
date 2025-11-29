// src/engine/spellsEngine.js
// TODO: Support für weitere Effekt-Typen hinzufügen:
//       - 'ADD_LIGHT_SOURCE': Für Lichtzauber (Parameter: Radius hell/dämmrig, Farbe)
//       - 'INTERACT': Für Zauber wie 'Klopfen' (Knock) oder 'Magierhand'
//       - 'TERRAIN': Für Zauber, die den Untergrund verändern (z.B. 'Schmieren', 'Dornenwuchs')
//       - 'NO_OPPORTUNITY_ATTACKS': Verhindert automatische Angriffe bei Bewegung (Shocking Grasp)
// TODO: Erweiterte Zauber-Logik (Chromatic Orb, Chaos Bolt)
//       - UI für Schadensart-Auswahl beim Wirken ('variable' auflösen)
//       - "Leaping"-Mechanik: Würfelergebnisse auf Doubles prüfen und ggf. 'chain_target' auslösen.
// TODO: Skalierung für flache Werte implementieren (False Life)
//       - Support für 'scaling.type === "FLAT_VALUE"' hinzufügen.
//       - Logik: (castLevel - baseLevel) * scaling.increase_amount auf den Würfel-Modifikator addieren.
// TODO: Vertrauten-Mechanik erweitern
//       - 'Touch Delivery': Wenn ein Vertrauter in Reichweite ist, erlaube dem Spieler,
//         Zauber mit Reichweite 'Berührung' von der Position des Vertrauten aus zu wirken.
//       - 'Shared Senses': Fog of War für den Spieler basierend auf der Position des Vertrauten aufdecken.
import allSpells from '../data/spells.json';
import { getModifier, rollDiceFormula } from '../utils/helpers';

export class SpellsEngine {
  constructor() {
    this.spellsData = allSpells;
    console.log("SpellsEngine initialisiert.");
  }

  getSpell(spellKey) {
    return this.spellsData.find(s => s.key === spellKey);
  }

  // executeSpell erhält jetzt optional castLevel
  executeSpell(caster, spellKey, targets, classLogic, castLevel) {
    const spell = this.getSpell(spellKey);
    if (!spell) {
      console.error(`Zauber ${spellKey} nicht gefunden!`);
      return;
    }

    // Fallback: Wenn kein castLevel angegeben, nimm das Basis-Level des Zaubers
    const actualCastLevel = castLevel || spell.level;

    console.log(`${caster.name} wirkt ${spell.name} auf Grad ${actualCastLevel}!`);

    if (!spell.effects) return;

    for (const effect of spell.effects) {
      try {
        if (effect.type === "DAMAGE") {
          this.applyDamageEffect(caster, spell, effect, targets, classLogic, actualCastLevel);
        }
        // ... andere Effekte
      } catch (e) {
        console.error(`Fehler bei der Ausführung des Effekts:`, effect, e);
      }
    }
  }

  /**
   * Wendet einen Schaden-Effekt auf Ziele an.
   * NEU: castLevel Parameter für Skalierung
   */
  applyDamageEffect(caster, spell, effect, targets, classLogic, castLevel) {
    const casterLevel = caster.level;
    let damageDice = effect.damage.dice;

    // 1. Skalierung berechnen
    if (effect.scaling) {
        // A. Cantrip Skalierung (basiert auf Charakter-Level)
        if (effect.scaling.type === "CANTRIP") {
            const breakpoints = Object.keys(effect.scaling.dice_at_levels).sort((a, b) => b - a);
            for (const level of breakpoints) {
                if (casterLevel >= parseInt(level, 10)) {
                damageDice = effect.scaling.dice_at_levels[level];
                break; 
                }
            }
        }
        // B. Slot Level Skalierung (Upcasting)
        else if (effect.scaling.type === "PER_SLOT_LEVEL") {
            const baseLevel = spell.level;
            // Wie viele Level über dem Basis-Level?
            const levelsAbove = Math.max(0, castLevel - baseLevel);
            
            if (levelsAbove > 0 && effect.scaling.increase_dice) {
                // Parsen: "8d6" -> 8, "d6"
                const parts = damageDice.split('d');
                if (parts.length === 2) {
                    const baseCount = parseInt(parts[0]);
                    const dieType = parts[1];
                    
                    // Increase Dice parsen: "1d6" -> 1
                    const increaseParts = effect.scaling.increase_dice.split('d');
                    const increaseCount = parseInt(increaseParts[0]);

                    // Neuen Würfel berechnen
                    const newCount = baseCount + (increaseCount * levelsAbove);
                    damageDice = `${newCount}d${dieType}`;
                    
                    console.log(`Upcasting: ${spell.name} (+${levelsAbove} Level) -> Schaden erhöht auf ${damageDice}`);
                }
            }
        }
    }

    // 2. Auf alle Ziele anwenden (unverändert)
    for (const target of targets) {
      // ... (Rest der Logik: Angriffswurf, Rettungswurf, Schaden würfeln)
      // Hier nur gekürzt dargestellt, übernimm deinen bestehenden Code für Steps 3-6
      // Aber nutze die Variable 'damageDice', die jetzt ggf. erhöht wurde.
      
       const finalDamage = rollDiceFormula(damageDice);
       console.log(`>>> ${target.name} erleidet ${finalDamage} ${effect.damage.type} Schaden (${damageDice})!`);
    }
  }
}

const spellsEngine = new SpellsEngine();
export default spellsEngine;