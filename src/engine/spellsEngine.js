import { getModifier, getProficiencyBonus } from '../utils/helpers';
import { WizardLogic } from './logic/classes/WizardLogic';
import { SorcererLogic } from './logic/classes/SorcererLogic';
import { PaladinLogic } from './logic/classes/PaladinLogic';

/**
 * Führt einen Würfelwurf basierend auf D&D-Notation aus (z.B. "8d6", "1d4+4").
 * @param {string} diceNotation - Z.B. "3d8", "1d10+5", "10d6+40".
 * @returns {object} { total: number, rolls: number[] }
 */
const rollDice = (diceNotation) => {
  if (!diceNotation) return { total: 0, rolls: [] };

  let total = 0;
  const rolls = [];
  const parts = diceNotation.toLowerCase().split('+');
  const dicePart = parts[0];
  const bonus = parts[1] ? parseInt(parts[1], 10) : 0;

  const match = dicePart.match(/(\d+)d(\d+)/);
  if (!match) {
    console.error(`Ungültige Würfelnotation: ${diceNotation}`);
    return { total: bonus, rolls: [] };
  }

  const numDice = parseInt(match[1], 10);
  const diceType = parseInt(match[2], 10);

  for (let i = 0; i < numDice; i++) {
    const roll = Math.floor(Math.random() * diceType) + 1;
    rolls.push(roll);
    total += roll;
  }
  
  return { total: total + bonus, rolls: rolls };
};

/**
 * Führt einen einzelnen W20-Wurf aus.
 * @param {object} options - { advantage: boolean, disadvantage: boolean }
 * @returns {number} Das Wurfergebnis.
 */
const rollD20 = (options = {}) => {
  const roll1 = Math.floor(Math.random() * 20) + 1;
  if (options.advantage && options.disadvantage) {
     return roll1;
  }
  if (!options.advantage && !options.disadvantage) {
    return roll1;
  }
  const roll2 = Math.floor(Math.random() * 20) + 1;
  
  if (options.advantage) {
    return Math.max(roll1, roll2);
  }
  if (options.disadvantage) {
    return Math.min(roll1, roll2);
  }
};

/**
 * Die zentrale Engine zur Handhabung der Zauberausführung.
 */
export class SpellEngine {
  constructor(allSpells, allFeatures) {
    this.allSpells = allSpells;
    this.allFeatures = allFeatures;
  }

  /**
   * Führt einen Zauber für einen Wirker aus.
   * @param {object} caster - Das Charakterobjekt (muss abilities, level, classLogic, spellSlots, sorceryPoints, hp, ac, id, name haben)
   * @param {string} spellKey - Der Schlüssel des Zaubers (z.B. "fireball").
   * @param {object[]} targets - Ein Array von Ziel-Charakterobjekten.
   * @param {object} options - { metamagic: string, slotLevel: number, protectedTargets: string[] }
   */
  castSpell(caster, spellKey, targets = [], options = {}) {
    const spell = this.allSpells.find(s => s.key === spellKey);
    if (!spell) {
      console.error(`SpellEngine: Zauber mit Schlüssel '${spellKey}' nicht gefunden.`);
      return { success: false, logs: [`Zauber '${spellKey}' nicht gefunden.`] };
    }

    const slotLevel = options.slotLevel || spell.level;
    let logEntries = [`${caster.name} wirkt ${spell.name} (Grad ${slotLevel})!`];

    // 1. Kosten und Ressourcen prüfen
    const costCheck = this.checkSpellCost(caster, spell, slotLevel, options);
    if (!costCheck.success) {
      return { success: false, logs: [costCheck.log] };
    }

    // 2. Ressourcen verbrauchen (mutiert das caster-Objekt)
    try {
      this.consumeResources(caster, spell, slotLevel, costCheck.metamagicCost);
    } catch (e) {
      return { success: false, logs: [e.message] };
    }

    // 3. Zauberlogik vorbereiten
    let spellResult = {};
    let modifiedTargets = [...targets];
    let saveOptions = {}; // { targetId: { advantage: bool, disadvantage: bool } }

    // 4. Metamagie VOR der Ausführung anwenden
    if (options.metamagic && caster.classLogic instanceof SorcererLogic) {
      const preCastResult = this.applyMetamagic_PreCast(caster, spell, modifiedTargets, options);
      modifiedTargets = preCastResult.targets;
      saveOptions = preCastResult.saveOptions;
      if (preCastResult.log) logEntries.push(preCastResult.log);
    }
    
    // 5. Zauber-Effekt-Handler aufrufen
    if (spell.damage) {
      spellResult = this.handleDamageSpell(caster, spell, modifiedTargets, options, saveOptions);
    } else if (spell.saving_throw) {
      spellResult = this.handleSaveOrEffectSpell(caster, spell, modifiedTargets, options, saveOptions);
    } else {
      spellResult = this.handleUtilitySpell(caster, spell, modifiedTargets, options);
    }

    logEntries = [...logEntries, ...spellResult.logs];
    
    // 7. Endergebnis zurückgeben
    return { success: true, logs: logEntries };
  }

  /**
   * Prüft Zauberplätze und Zauberpunkte.
   */
  checkSpellCost(caster, spell, slotLevel, options) {
    if (spell.level > 0) {
      if (!caster.spellSlots || !caster.spellSlots[slotLevel] || caster.spellSlots[slotLevel] <= 0) {
        return { success: false, log: `Keine Zauberplätze des Grades ${slotLevel} verfügbar.` };
      }
    }

    let metamagicCost = 0;
    if (options.metamagic) {
      const feature = this.allFeatures.find(f => f.key === options.metamagic);
      if (!feature) return { success: false, log: "Unbekannte Metamagie." };

      if (feature.key === 'metamagic_twinned_spell') {
        metamagicCost = spell.level === 0 ? 1 : spell.level;
      } else {
        metamagicCost = feature.cost || 0;
      }

      if (!caster.sorceryPoints || caster.sorceryPoints < metamagicCost) {
        return { success: false, log: `Nicht genügend Zauberpunkte für ${feature.name}.` };
      }
    }
    return { success: true, metamagicCost };
  }

  /**
   * Verbraucht die Ressourcen beim Wirken.
   */
  consumeResources(caster, spell, slotLevel, metamagicCost = 0) {
    if (spell.level > 0) {
      caster.spellSlots[slotLevel]--;
    }
    if (metamagicCost > 0) {
      caster.sorceryPoints -= metamagicCost;
    }
  }
  
  /**
   * Wendet Metamagie VOR dem Wurf an (z.B. Erhöhter Zauber).
   */
  applyMetamagic_PreCast(caster, spell, targets, options) {
    const logs = [];
    const feature = this.allFeatures.find(f => f.key === options.metamagic);
    if(feature) logs.push(`${caster.name} nutzt ${feature.name}!`);
    
    let saveOptions = {};
    if (options.metamagic === 'metamagic_heightened_spell') {
      if (targets.length > 0) {
        saveOptions[targets[0].id] = { disadvantage: true };
        logs.push(`${targets[0].name} hat Nachteil auf den Rettungswurf!`);
      }
    }
    
    if (options.metamagic === 'metamagic_careful_spell') {
      logs.push(`(${options.protectedTargets?.length || 0} Ziele werden geschützt)`);
    }
    
    // TODO: Logik für 'Gezielter Zauber' (Twinned) - fügt ein Ziel hinzu
    // TODO: Logik für 'Entfernter Zauber' (Distant) - prüft Reichweite
    // TODO: Logik für 'Subtiler Zauber' (Subtle) - ignoriert Stille-Effekte

    return { targets: targets, log: logs.join(' '), saveOptions };
  }

  /**
   * Führt einen Zauber aus, der Schaden verursacht.
   */
  handleDamageSpell(caster, spell, targets, options, saveOptions = {}) {
    const logs = [];
    const casterDC = caster.classLogic.getSpellSaveDC(caster);
    const attackBonus = caster.classLogic.getSpellAttackBonus(caster);
    const slotLevel = options.slotLevel || spell.level;

    for (const target of targets) {
      if (options.metamagic === 'metamagic_careful_spell' && 
          options.protectedTargets && 
          options.protectedTargets.includes(target.id)) 
      {
        logs.push(`${target.name} ist durch 'Behutsamer Zauber' geschützt und besteht automatisch!`);
        continue;
      }
      
      let damageDice = spell.damage;
      if (spell.scaling && slotLevel > spell.level) {
         const extraLevels = slotLevel - spell.level;
         // TODO: Skalierungslogik für *alle* Zauber implementieren
         if (spell.key === 'fireball' || spell.key === 'lightning_bolt') {
            damageDice = `${8 + extraLevels}d6`;
         }
         if (spell.key === 'magic_missile') {
             const numMissiles = 3 + extraLevels;
             damageDice = `${numMissiles}d4+${numMissiles}`;
         }
      }
      
      let { total: damage, rolls: damageRolls } = rollDice(damageDice);
      let tookHalfDamage = false;
      let hit = false;

      if (spell.attack_roll) {
        if(spell.attack_roll === "auto_hit") {
          logs.push(`${spell.name} trifft ${target.name} automatisch.`);
          hit = true;
        } else {
          const { roll, success } = this.checkAttackRoll(caster, target, attackBonus);
          if (success) {
            logs.push(`Angriffswurf (${roll}+${attackBonus}) trifft ${target.name} (RK ${target.ac})!`);
            hit = true;
          } else {
            logs.push(`Angriffswurf (${roll}+${attackBonus}) verfehlt ${target.name} (RK ${target.ac}).`);
            continue;
          }
        }
        
      } else if (spell.saving_throw) {
        const saveType = spell.saving_throw;
        const targetSaveOptions = saveOptions[target.id] || {};
        const { roll, success } = this.checkSave(target, saveType, casterDC, targetSaveOptions);
        
        if (success) {
          // Zaubertricks mit Rettungswurf (wie Säurespritzer) verursachen 0 Schaden bei Erfolg
          if (spell.level === 0) {
             damage = 0;
          } else {
             damage = Math.floor(damage / 2);
          }
          tookHalfDamage = true;
          logs.push(`${target.name} besteht ${saveType.toUpperCase()}-Rettungswurf (Wurf ${roll} vs SG ${casterDC}).`);
        } else {
          logs.push(`${target.name} scheitert am ${saveType.toUpperCase()}-Rettungswurf (Wurf ${roll} vs SG ${casterDC}).`);
        }
        hit = true; // Der Zauber "trifft", auch wenn der RW bestanden wurde (für halben Schaden)
      } else {
        // Zauber ohne RW und ohne Angriffswurf (z.B. Magisches Geschoss)
        hit = true;
      }

      if (!hit) continue;

      // Metamagie (Verstärkter Zauber)
      if (options.metamagic === 'metamagic_empowered_spell' && caster.classLogic instanceof SorcererLogic) {
         const chaMod = Math.max(1, getModifier(caster.abilities.charisma));
         // Sortiere die Würfel und finde die 'chaMod' niedrigsten
         damageRolls.sort((a, b) => a - b);
         const rollsToReroll = damageRolls.slice(0, chaMod);
         let newDamageTotal = 0;
         const newRolls = [];
         
         for(const oldRoll of rollsToReroll) {
             const newRoll = Math.floor(Math.random() * (oldRoll.diceType || 6)) + 1; // Annahme d6, falls Typ unbekannt
             newRolls.push(newRoll);
             newDamageTotal += newRoll;
         }
         // Ersetze die alten Würfel
         let originalDamage = damage;
         damage = (damage - rollsToReroll.reduce((a,b) => a+b, 0)) + newDamageTotal;
         logs.push(`(Verstärkter Zauber: ${chaMod} Würfel neu gewürfelt! Schaden von ${originalDamage} auf ${damage} geändert.)`);
      }
      
      // Klassen-Features (Ermächtigte Hervorrufung)
      if (caster.classLogic instanceof WizardLogic && caster.level >= 10) {
        const bonus = caster.classLogic.getEmpoweredEvocationBonus(spell, caster);
        if (bonus > 0 && damage > 0) { // Bonus nur, wenn Schaden verursacht wurde
            logs.push(`(Ermächtigte Hervorrufung fügt +${bonus} Schaden hinzu)`);
            damage += bonus;
        }
      }

      // Klassen-Features (Mächtige Zaubertricks)
      if (caster.classLogic instanceof WizardLogic && 
          caster.level >= 6 && 
          caster.classLogic.isPotentCantrip(spell) && 
          tookHalfDamage && 
          damage === 0) 
      {
          // REGEL: "Mächtige Zaubertricks"
          // (Gilt für Zaubertricks, die 0 Schaden bei Erfolg machen würden)
          damage = Math.floor(rollDice(damageDice).total / 2);
          logs.push(`(Mächtige Zaubertricks: ${target.name} erleidet trotzdem ${damage} Schaden!)`);
      }

      logs.push(`${target.name} erleidet ${damage} ${spell.damage_type} Schaden.`);
      target.hp -= damage;
      if (target.hp <= 0) {
        logs.push(`${target.name} ist besiegt!`);
        // TODO: target.applyStatus('dead', 'permanent');
      }
    }
    return { logs };
  }
  
  /**
   * Führt einen Rettungswurf für ein Ziel durch.
   */
  checkSave(target, saveType, dc, options = {}) {
    const abilityKey = this.mapSaveToAbility(saveType);
    if (!target.abilities || typeof target.abilities[abilityKey] === 'undefined') {
        console.error(`Ziel ${target.name} fehlt Attribut ${abilityKey} für Rettungswurf.`);
        return { roll: 0, success: false };
    }
    
    const modifier = getModifier(target.abilities[abilityKey]);
    const proficiencyBonus = getProficiencyBonus(target.level);
    
    let proficiency = 0;
    if (target.classLogic && target.classLogic.getSavingThrowProficiencies().includes(saveType)) {
      proficiency = proficiencyBonus;
    }
    
    const roll = rollD20(options); // options kann { disadvantage: true } enthalten
    const total = roll + modifier + proficiency;
    
    return { roll, total, success: total >= dc };
  }

  /**
   * Führt einen Zauberangriffswurf durch.
   */
  checkAttackRoll(caster, target, attackBonus, options = {}) {
     const roll = rollD20(options);
     const total = roll + attackBonus;
     return { roll, total, success: total >= target.ac };
  }

  mapSaveToAbility(saveType) {
    const map = {
      'strength': 'str', 'dexterity': 'dex', 'constitution': 'con',
      'intelligence': 'int', 'wisdom': 'wis', 'charisma': 'cha',
    };
    return map[saveType.toLowerCase()];
  }
  
  /**
   * Führt einen Zauber aus, der einen Effekt (z.B. 'Furcht') verursacht.
   */
  handleSaveOrEffectSpell(caster, spell, targets, options, saveOptions = {}) {
    const logs = [];
    const casterDC = caster.classLogic.getSpellSaveDC(caster);

    for(const target of targets) {
       const saveType = spell.saving_throw;
       if (!saveType) continue;

       const targetSaveOptions = saveOptions[target.id] || {};
       const { roll, success } = this.checkSave(target, saveType, casterDC, targetSaveOptions);
       
       if (success) {
         logs.push(`${target.name} besteht den Rettungswurf (Wurf ${roll} vs SG ${casterDC}).`);
       } else {
         // Annahme: spell.json hat ein Feld "effect" (z.B. "frightened", "charmed", "paralyzed")
         const effect = spell.key === 'hold_person' ? 'paralyzed' : 'affected';
         logs.push(`${target.name} scheitert am Rettungswurf (Wurf ${roll} vs SG ${casterDC}) und ist nun ${effect}!`);
         
         if (target.applyStatus) {
           target.applyStatus(effect, spell.duration); // (Dauer müsste noch in Runden umgerechnet werden)
         }
       }
    }
    return { logs };
  }
  
  /**
   * Führt einen Utility-Zauber (z.B. 'Magierrüstung') aus.
   */
  handleUtilitySpell(caster, spell, targets, options) {
     const logs = [];
     
     if (spell.key === 'mage_armor') {
         const target = targets[0] || caster;
         // Regel: RK wird 13 + GE-Mod, wenn keine Rüstung getragen wird.
         // (Annahme: target.equipment ist prüfbar)
         const dexMod = getModifier(target.abilities.dex);
         target.ac = 13 + dexMod; // (Vereinfachte Annahme, überschreibt aktuelle RK)
         logs.push(`${target.name} Rüstungsklasse ist nun ${target.ac}.`);
         if(target.applyStatus) target.applyStatus('mage_armor', spell.duration);
     } else {
         logs.push(`${spell.name} wird erfolgreich gewirkt.`);
     }
     
     return { logs };
  }

  /**
   * (NEUE METHODE)
   * Führt eine Kampffähigkeit aus, die Ressourcen verbraucht (z.B. Divine Smite).
   * Diese wird *nach* einem erfolgreichen Treffer aufgerufen.
   * @param {object} caster - Der Charakter, der die Fähigkeit nutzt.
   * @param {object} target - Das Ziel des Angriffs.
   * @param {string} abilityKey - z.B. "divine_smite".
   * @param {number} slotLevel - Der Grad des Zauberplatzes, der verbraucht wird.
   */
  useCombatAbility(caster, target, abilityKey, slotLevel) {
    const logs = [];
    
    if (abilityKey === 'divine_smite' && caster.classLogic instanceof PaladinLogic) {
      // 1. Kosten prüfen
      if (!caster.spellSlots[slotLevel] || caster.spellSlots[slotLevel] <= 0) {
        return { success: false, logs: [`Keine Zauberplätze des Grades ${slotLevel} für Göttliches Niederstrecken.`] };
      }

      // 2. Kosten verbrauchen
      caster.spellSlots[slotLevel]--;
      
      // 3. Schaden berechnen
      const targetType = target.type || 'humanoid'; // Annahme: Ziele haben einen Typ
      const damageDice = caster.classLogic.getDivineSmiteDamage(slotLevel, targetType);
      const { total: smiteDamage } = rollDice(damageDice);

      logs.push(`${caster.name} nutzt Göttliches Niederstrecken (Grad ${slotLevel})!`);
      logs.push(`${target.name} erleidet ${smiteDamage} gleißenden Schaden zusätzlich!`);
      
      // 4. Schaden anwenden
      target.hp -= smiteDamage;
      if (target.hp <= 0) {
        logs.push(`${target.name} ist besiegt!`);
        target.hp = 0;
        // target.applyStatus('dead', 'permanent');
      }
      return { success: true, logs };
    }
    
    // ... (Hier könnte "Göttliche Macht fokussieren: Leben erhalten" des Klerikers implementiert werden)

    return { success: false, logs: [`Unbekannte Fähigkeit: ${abilityKey}`] };
  }
}