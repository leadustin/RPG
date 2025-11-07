import { getModifier, getProficiencyBonus } from '../utils/helpers';
import { WizardLogic } from './logic/classes/WizardLogic';
import { SorcererLogic } from './logic/classes/SorcererLogic';
import { PaladinLogic } from './logic/classes/PaladinLogic';

/**
 * Führt einen Würfelwurf basierend auf D&D-Notation aus (z.B. "8d6", "1d4+4").
 * Gibt Würfel-Objekte zurück, um Metamagie-Effekte (wie Neuwürfeln) zu unterstützen.
 * @param {string} diceNotation - Z.B. "3d8", "1d10+5", "10d6+40".
 * @returns {object} { total: number, rolls: number[], damageRollObjects: {roll: number, diceType: number}[] }
 */
const rollDice = (diceNotation) => {
  if (!diceNotation) return { total: 0, rolls: [], damageRollObjects: [] };

  let total = 0;
  const rolls = [];
  const damageRollObjects = [];
  const parts = diceNotation.toLowerCase().split('+');
  
  let dicePart = parts[0];
  let bonus = 0;

  // Verarbeite den Bonus, falls vorhanden
  if (parts.length > 1) {
    let bonusCandidate = parts.slice(1).join('+');
    bonus = parseInt(bonusCandidate, 10) || 0;
  }
  
  const match = dicePart.match(/(\d+)d(\d+)/);
  
  if (!match) {
    // Wenn keine Würfelnotation, behandle den Rest als Bonus
    bonus += parseInt(dicePart.trim(), 10) || 0;
    return { total: bonus, rolls: [], damageRollObjects: [] };
  }

  const numDice = parseInt(match[1], 10);
  const diceType = parseInt(match[2], 10);

  for (let i = 0; i < numDice; i++) {
    const roll = Math.floor(Math.random() * diceType) + 1;
    rolls.push(roll);
    damageRollObjects.push({ roll, diceType }); 
    total += roll;
  }
  
  return { total: total + bonus, rolls: rolls, damageRollObjects };
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
   * Hilfsfunktion zum Parsen und Verdoppeln der Zauberdauer (max. 24 Stunden).
   */
  getExtendedDuration(durationString) {
    if (durationString.includes('Konzentration') || durationString.includes('Sofort')) return durationString;

    const match = durationString.match(/(\d+)\s*(Runde|Minute|Stunde|Tag)/i);
    if (match) {
        let value = parseInt(match[1], 10);
        const unit = match[2];
        let newDuration = value * 2;
        
        // Konvertierung zur Vereinfachung des 24h-Limits
        let newUnit = unit;
        if (unit === 'Tag') {
           newDuration = newDuration * 24;
           newUnit = 'Stunde';
        }

        // Hard-Limit bei 24 Stunden (Extended Spell Regel)
        if (newUnit === 'Stunde' && newDuration > 24) {
            newDuration = 24;
            newUnit = 'Stunde';
        } else if (newUnit === 'Minute' && newDuration > 1440) {
            newDuration = 24;
            newUnit = 'Stunde';
        }
        
        return `${newDuration} ${newUnit}`;
    }
    return durationString;
  }

  /**
   * Führt einen Zauber für einen Wirker aus.
   * @param {object} caster - Das Charakterobjekt (muss ... inventory, concentration haben)
   * @param {string} spellKey - Der Schlüssel des Zaubers (z.b. "fireball").
   * @param {object[]} targets - Ein Array von Ziel-Charakterobjekten.
   * @param {object} options - { metamagic: string, slotLevel: number, protectedTargets: string[], additionalTargetId: string, originPoint: object }
   */
  castSpell(caster, spellKey, targets = [], options = {}) {
    const spell = this.allSpells.find(s => s.key === spellKey);
    if (!spell) {
      console.error(`SpellEngine: Zauber mit Schlüssel '${spellKey}' nicht gefunden.`);
      return { success: false, logs: [`Zauber '${spellKey}' nicht gefunden.`] };
    }

    const slotLevel = options.slotLevel || spell.level;
    let logEntries = [`${caster.name} wirkt ${spell.name} (Grad ${slotLevel})!`];

    // --- MODIFIZIERT: Konzentrations-Logik (Teil 1: Prüfen & Brechen) ---
    const isConcentrationSpell = spell.duration.toLowerCase().includes('konzentration');

    if (isConcentrationSpell && caster.concentration && caster.concentration.spellKey) {
        logEntries.push(`${caster.name} bricht die Konzentration für ${caster.concentration.spellKey} ab, um ${spell.name} zu wirken.`);
        // Annahme: Sie haben eine Methode, um alte Statuseffekte zu entfernen
        if (caster.removeStatus) {
            caster.removeStatus(caster.concentration.spellKey); 
        }
        caster.concentration.spellKey = null;
    }
    // --- Ende MODIFIZIERT ---

    // 1. Kosten und Ressourcen prüfen (inkl. Materialkomponenten)
    // --- MODIFIZIERT: checkSpellCost prüft jetzt das Inventar ---
    const costCheck = this.checkSpellCost(caster, spell, slotLevel, options);
    if (!costCheck.success) {
      return { success: false, logs: [costCheck.log] };
    }
    
    // Protokollierung der Komponentenkosten
    if (spell.material_costs && spell.material_costs.consumed) {
        logEntries.push(`(${spell.material_costs.description} wird verbraucht.)`);
    } else if (spell.material_costs && spell.material_costs.value_gp > 0) {
        logEntries.push(`(Benötigt ${spell.material_costs.description}.)`);
    }

    // 2. Ressourcen verbrauchen (mutiert das caster-Objekt)
    try {
      // --- MODIFIZIERT: consumeResources verbraucht jetzt Inventargegenstände ---
      this.consumeResources(caster, spell, slotLevel, costCheck.metamagicCost);
    } catch (e) {
      return { success: false, logs: [e.message] };
    }

    // 3. Zauberlogik vorbereiten
    let spellResult = {};
    let modifiedTargets = [...targets];
    let saveOptions = {}; // { targetId: { advantage: bool, disadvantage: bool } }
    let finalDuration = spell.duration; // Standard-Dauer

    // 4. Metamagie VOR der Ausführung/Dauer anwenden
    if (options.metamagic && caster.classLogic instanceof SorcererLogic) {
      const preCastResult = this.applyMetamagic_PreCast(caster, spell, modifiedTargets, options);
      modifiedTargets = preCastResult.targets;
      saveOptions = preCastResult.saveOptions;
      if (preCastResult.log) logEntries.push(preCastResult.log);
      
      if (options.metamagic === 'metamagic_extended_spell' && 
          !spell.duration.includes('Sofort') && 
          !spell.duration.includes('Runde')) 
      {
          finalDuration = this.getExtendedDuration(spell.duration);
          logEntries.push(`(Verlängerter Zauber: Dauer auf ${finalDuration} verdoppelt)`);
      }
    }
    
    // 4.1. AoE-Logging (Annahme: Targets sind die betroffenen Kreaturen)
    if (spell.aoe) {
        const shape = spell.aoe.shape;
        const size = spell.aoe.size || spell.aoe.radius || spell.aoe.length;
        const targetType = (targets[0] && targets[0].name) || 'Ursprungspunkt';
        
        if (shape === 'self') {
            logEntries.push(`(AoE: ${spell.range_type} mit ${size}m ${shape} von ${caster.name} ausgehend.)`);
        } else {
             logEntries.push(`(AoE: ${shape} mit ${size}m Größe, zentriert auf ${targetType}.)`);
        }
    }


    // 5. Zauber-Effekt-Handler aufrufen (mit finalDuration)
    if (spell.damage) {
      spellResult = this.handleDamageSpell(caster, spell, modifiedTargets, options, saveOptions, finalDuration);
    } else if (spell.saving_throw) {
      spellResult = this.handleSaveOrEffectSpell(caster, spell, modifiedTargets, options, saveOptions, finalDuration);
    } else {
      spellResult = this.handleUtilitySpell(caster, spell, modifiedTargets, options, finalDuration);
    }

    logEntries = [...logEntries, ...spellResult.logs];
    
    // --- MODIFIZIERT: Konzentrations-Logik (Teil 2: Setzen) ---
    if (isConcentrationSpell && spellResult.success !== false) { // Nur setzen, wenn Zauber nicht fehlschlug
        caster.concentration.spellKey = spell.key;
        logEntries.push(`${caster.name} konzentriert sich nun auf ${spell.name}.`);
        // Annahme: Sie haben eine Methode, um Statuseffekte anzuwenden
        if (caster.applyStatus) {
            caster.applyStatus(spell.key, finalDuration || spell.duration, { isConcentration: true });
        }
    }
    // --- Ende MODIFIZKAITON ---
    
    // 7. Endergebnis zurückgeben
    return { success: true, logs: logEntries };
  }

  /**
   * Prüft Zauberplätze, Zauberpunkte und Materialkosten.
   * --- MODIFIZIERT ---
   */
  checkSpellCost(caster, spell, slotLevel, options) {
    if (spell.level > 0) {
      if (!caster.spellSlots || !caster.spellSlots[slotLevel] || caster.spellSlots[slotLevel] <= 0) {
        return { success: false, log: `Keine Zauberplätze des Grades ${slotLevel} verfügbar.` };
      }
    }
    
    // --- NEU: Materialkomponenten-Prüfung (Inventar) ---
    // (Annahme: caster.inventory = { "diamond_300gp": 1, "holy_water": 5 })
    if (spell.material_costs) {
        // 1. Prüfen, ob eine Komponente VERBRAUCHT wird
        if (spell.material_costs.consumed) {
            const componentKey = spell.material_costs.key; // z.B. "diamond_300gp"
            const requiredAmount = spell.material_costs.amount || 1;
            
            if (!caster.inventory || !caster.inventory[componentKey] || caster.inventory[componentKey] < requiredAmount) {
               return { success: false, log: `Fehlende verbrauchbare Komponente: ${spell.material_costs.description} (benötigt ${requiredAmount}).` };
            }
        }
        // 2. Prüfen, ob eine Komponente (die nicht verbraucht wird) einen Wert hat
        if (!spell.material_costs.consumed && spell.material_costs.value_gp > 0) {
             const componentKey = spell.material_costs.key;
             if (!caster.inventory || !caster.inventory[componentKey] || caster.inventory[componentKey] < 1) {
                 return { success: false, log: `Erforderliche Komponente fehlt: ${spell.material_costs.description}.` };
             }
        }
    }
    // --- Ende NEU ---

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
   * --- MODIFIZIERT ---
   */
  consumeResources(caster, spell, slotLevel, metamagicCost = 0) {
    if (spell.level > 0) {
      caster.spellSlots[slotLevel]--;
    }
    if (metamagicCost > 0) {
      caster.sorceryPoints -= metamagicCost;
    }
    
    // --- NEU: Materialkomponenten verbrauchen (Inventar) ---
    if (spell.material_costs && spell.material_costs.consumed) {
       const componentKey = spell.material_costs.key;
       const consumedAmount = spell.material_costs.amount || 1;
       if (caster.inventory && caster.inventory[componentKey]) {
           caster.inventory[componentKey] -= consumedAmount;
           // Optional: Logik zum Entfernen des Items, wenn Menge 0 erreicht
           if (caster.inventory[componentKey] <= 0) {
               delete caster.inventory[componentKey];
           }
       }
    }
    // --- Ende NEU ---
  }
  
  /**
   * Wendet Metamagie VOR dem Wurf an (z.B. Erhöhter Zauber).
   */
  applyMetamagic_PreCast(caster, spell, targets, options) {
    const logs = [];
    const feature = this.allFeatures.find(f => f.key === options.metamagic);
    if(feature) logs.push(`${caster.name} nutzt ${feature.name}!`);
    
    let saveOptions = {};
    let modifiedTargets = [...targets];
    
    if (options.metamagic === 'metamagic_heightened_spell') {
      if (targets.length > 0) {
        saveOptions[targets[0].id] = { disadvantage: true };
        logs.push(`${targets[0].name} hat Nachteil auf den Rettungswurf!`);
      }
    }
    
    if (options.metamagic === 'metamagic_careful_spell') {
      logs.push(`(${options.protectedTargets?.length || 0} Ziele werden geschützt)`);
    }

    if (options.metamagic === 'metamagic_twinned_spell' && options.additionalTargetId) {
        // Sucht das zusätzliche Ziel (Annahme: es existiert im Ziel-Array oder einer globalen Liste)
        const additionalTarget = targets.find(t => t.id === options.additionalTargetId) || { name: "Unbekanntes Ziel", id: options.additionalTargetId }; 
        if (additionalTarget) {
            modifiedTargets.push(additionalTarget);
            logs.push(`(${additionalTarget.name} ist nun auch Ziel!)`);
        } else {
             logs.push(`Fehler: Zusätzliches Ziel mit ID ${options.additionalTargetId} nicht gefunden.`);
        }
    }
    
    if (options.metamagic === 'metamagic_distant_spell') {
         logs.push(`(Entfernter Zauber: Reichweite wurde verdoppelt/auf 9m erhöht)`);
    }

    if (options.metamagic === 'metamagic_quickened_spell') {
         logs.push(`(Beschleunigter Zauber: Zauberzeit wurde auf Bonusaktion geändert)`);
    }
    

    return { targets: modifiedTargets, log: logs.join(' '), saveOptions };
  }

  /**
   * Führt einen Zauber aus, der Schaden verursacht.
   */
  handleDamageSpell(caster, spell, targets, options, saveOptions = {}, finalDuration = null) {
    const logs = [];
    const casterDC = caster.classLogic.getSpellSaveDC(caster);
    const attackBonus = caster.classLogic.getSpellAttackBonus(caster);
    const slotLevel = options.slotLevel || spell.level;
    const abilityMod = caster.classLogic.getSpellcastingAbilityModifier(caster);


    // 1. Skalierungslogik (nutzt strukturierte Daten)
    let damageDice = spell.damage;
    let baseDamageDice = damageDice.match(/(\d+d\d+)/)?.[0] || '0d0';
    let baseBonus = damageDice.includes('+') ? parseInt(damageDice.split('+')[1], 10) : 0;
    
    if (spell.scaling_rules) {
      const rules = spell.scaling_rules;
      const scalingLevel = (rules.type === 'cantrip_dice') ? caster.level : slotLevel;
      const baseLevel = (rules.type === 'cantrip_dice') ? 0 : spell.level;
      
      if (scalingLevel > baseLevel) {
        const extraLevels = scalingLevel - baseLevel;
        
        if (rules.type === 'per_slot_level' || rules.type === 'cantrip_dice' || rules.type === 'per_two_slot_levels') {
          const baseDiceMatch = baseDamageDice.match(/(\d+)d(\d+)/);
          
          if (baseDiceMatch && rules.dice) {
            const baseNumDice = parseInt(baseDiceMatch[1], 10);
            const diceType = baseDiceMatch[2];
            
            // Logik zur Bestimmung der Anzahl der zusätzlichen Würfel pro Level
            const diceIncreaseMatch = rules.dice.match(/(\d+)d\d+/);
            const numDiceIncreasePerLevel = parseInt(diceIncreaseMatch ? diceIncreaseMatch[1] : 1);
            
            // Bestimmt den Teiler (1 für per_slot, 2 für per_two_slot)
            const divider = rules.type === 'per_two_slot_levels' ? 2 : 1;
            const numLevelsToScale = Math.floor(extraLevels / divider);
            
            const newNumDice = baseNumDice + (numDiceIncreasePerLevel * numLevelsToScale);
            
            damageDice = `${newNumDice}d${diceType}${baseBonus > 0 ? `+${baseBonus}` : ''}`;
            
          } else if (rules.effect === 'additional_projectiles' && spell.key === 'magic_missile') {
            // Spezielle Logik für Magic Missile
            const baseNumMissiles = 3;
            const numMissiles = baseNumMissiles + extraLevels;
            damageDice = `${numMissiles}d4+${numMissiles}`; 
          }
        }
      }
    }
    
    let { total: damage, damageRollObjects } = rollDice(damageDice); 
    
    // Check if damage is actually healing (e.g., Cure Wounds, False Life)
    const isHealing = spell.damage_type.includes('healing');
    
    for (const target of targets) {
      // 2. Metamagie: Behutsamer Zauber (Careful Spell)
      if (options.metamagic === 'metamagic_careful_spell' && 
          options.protectedTargets && 
          options.protectedTargets.includes(target.id) &&
          spell.saving_throw) 
      {
        logs.push(`${target.name} ist durch 'Behutsamer Zauber' geschützt und besteht automatisch! (0 Schaden)`);
        continue;
      }
      
      let tookHalfDamage = false;
      let hit = false;
      let finalDamage = damage;
      let targetHit = false; // Flag, wenn der Zauber das Ziel trifft (Attack Roll oder Save Failure)

      if (spell.attack_roll) {
        if(spell.attack_roll === "auto_hit") {
          logs.push(`${spell.name} trifft ${target.name} automatisch.`);
          hit = true;
          targetHit = true;
        } else {
          const { roll, success } = this.checkAttackRoll(caster, target, attackBonus);
          if (success) {
            logs.push(`Angriffswurf (${roll}+${attackBonus}) trifft ${target.name} (RK ${target.ac})!`);
            hit = true;
            targetHit = true;
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
          if (spell.level === 0) {
             finalDamage = 0;
          } else {
             finalDamage = Math.floor(damage / 2);
          }
          tookHalfDamage = true;
          logs.push(`${target.name} besteht ${saveType.toUpperCase()}-Rettungswurf (Wurf ${roll} vs SG ${casterDC}).`);
        } else {
          logs.push(`${target.name} scheitert am ${saveType.toUpperCase()}-Rettungswurf (Wurf ${roll} vs SG ${casterDC}).`);
          targetHit = true; // Bei Save-Zaubern bedeutet "Hit" den gescheiterten Wurf
        }
        hit = true;
      } else {
        hit = true;
        targetHit = true;
      }

      if (!hit) continue;

      // 4. Metamagie: Verstärkter Zauber (Empowered Spell)
      if (options.metamagic === 'metamagic_empowered_spell' && caster.classLogic instanceof SorcererLogic && damageRollObjects.length > 0) {
         const chaMod = Math.max(1, getModifier(caster.abilities.charisma));
         
         damageRollObjects.sort((a, b) => a.roll - b.roll); 
         
         const rollsToReroll = damageRollObjects.slice(0, chaMod);
         let rerollLog = [];
         
         for (const oldRollObj of rollsToReroll) {
             const diceType = oldRollObj.diceType;
             const newRoll = Math.floor(Math.random() * diceType) + 1;
             
             finalDamage = finalDamage - oldRollObj.roll + newRoll;
             rerollLog.push(`${oldRollObj.roll} (W${diceType}) wurde zu ${newRoll} neu gewürfelt.`);
         }
         
         logs.push(`(Verstärkter Zauber: ${rerollLog.join('; ')} Gesamt: ${finalDamage} Schaden)`);
      }
      
      // 5. Modifikatoren hinzufügen (Heilung oder Ermächtigte Hervorrufung)
      if (isHealing) {
          finalDamage += abilityMod;
          logs.push(`(Heilungs-Modifikator +${abilityMod} hinzugefügt)`);
      } else if (caster.classLogic instanceof WizardLogic && caster.level >= 10) {
        const bonus = caster.classLogic.getEmpoweredEvocationBonus(spell, caster);
        if (bonus > 0 && finalDamage > 0) { 
            logs.push(`(Ermächtigte Hervorrufung fügt +${bonus} Schaden hinzu)`);
            finalDamage += bonus;
        }
      }

      // 6. Klassen-Features (Mächtige Zaubertricks)
      if (caster.classLogic instanceof WizardLogic && 
          caster.level >= 6 && 
          caster.classLogic.isPotentCantrip(spell) && 
          tookHalfDamage && 
          finalDamage === 0) 
      {
          finalDamage = Math.floor(rollDice(damageDice).total / 2);
          logs.push(`(Mächtige Zaubertricks: ${target.name} erleidet trotzdem ${finalDamage} Schaden!)`);
      }
      
      // 7. Resistenzen und Verwundbarkeiten prüfen (Simuliert)
      // NOTE: target.damageVulnerabilities/Resistances müssen in CharacterObjekt vorhanden sein.
      const damageType = spell.damage_type.toLowerCase();
      let damageMultiplier = 1;

      if (target.damageResistances?.includes(damageType)) {
          damageMultiplier = 0.5;
          logs.push(`(${target.name} ist resistent gegen ${spell.damage_type}: Schaden halbiert.)`);
      } else if (target.damageVulnerabilities?.includes(damageType)) {
          damageMultiplier = 2;
          logs.push(`(${target.name} ist verwundbar gegen ${spell.damage_type}: Schaden verdoppelt!)`);
      }

      finalDamage = Math.floor(finalDamage * damageMultiplier);


      // 8. Schaden/Heilung anwenden
      const damageVerb = isHealing ? 'heilt' : 'erleidet';
      
      logs.push(`${target.name} ${damageVerb} ${finalDamage} ${spell.damage_type} Schaden (Multiplikator: x${damageMultiplier}).`);
      
      if (isHealing) {
          if (spell.damage_type === 'healing_temp') {
              target.tempHp = Math.max(target.tempHp || 0, finalDamage);
              logs.push(`(${target.name} erhält ${finalDamage} temporäre TP)`);
          } else {
              target.hp = Math.min(target.maxHp, target.hp + finalDamage); 
          }
      } else {
          target.hp -= finalDamage;
      }
      
      if (!isHealing && target.hp <= 0) {
        logs.push(`${target.name} ist besiegt!`);
      }
      
      // 9. Sekundäre Effekte / Conditions
      if (targetHit && spell.conditions_applied) {
          const conditionData = spell.conditions_applied?.[0]; 
          if (!conditionData) continue;
          
          let applyCondition = true;
          let effectStatus = conditionData.condition;

          // Spezielle Logik für Zauber mit sekundärem Rettungswurf (Smite-Zauber)
          if (spell.damage_note?.includes("Zusätzlicher Initialschaden")) {
             // Führt den Rettungswurf nur für den Zusatzeffekt durch (Smite-Zauber)
             const saveType = spell.saving_throw;
             const { roll: secondaryRoll, success: secondarySuccess } = this.checkSave(target, saveType, casterDC, {});
             
             if (secondarySuccess) {
                 applyCondition = false;
                 logs.push(`Zustands-RW: ${target.name} besteht den ${saveType.toUpperCase()}-RW und widersteht dem Zustand.`);
             } else {
                 logs.push(`Zustands-RW: ${target.name} scheitert am ${saveType.toUpperCase()}-RW und ist ${effectStatus}!`);
             }
          }
          
          // Normale Kontroll-Cantrips / Zauber, die bei Hit einen Zustand vergeben (z.B. Ray of Frost, Chill Touch)
          if (applyCondition) {
              logs.push(`${target.name} ist nun von ${effectStatus} betroffen.`);
              if (target.applyStatus) {
                 target.applyStatus(effectStatus, finalDuration || spell.duration); 
              }
          }
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
    
    const roll = rollD20(options); 
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
  handleSaveOrEffectSpell(caster, spell, targets, options, saveOptions = {}, finalDuration = null) {
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
         
         const conditionData = spell.conditions_applied?.[0];
         let appliedEffect = 'affected';
         
         if (conditionData && conditionData.condition) {
             appliedEffect = conditionData.condition;
         } else if (spell.key === 'hold_person') {
             appliedEffect = 'paralyzed';
         }

         logs.push(`${target.name} scheitert am Rettungswurf (Wurf ${roll} vs SG ${casterDC}) und ist nun ${appliedEffect}!`);
         
         if (target.applyStatus) {
           target.applyStatus(appliedEffect, finalDuration || spell.duration); 
         }
       }
    }
    return { logs };
  }
  
  /**
   * Führt einen Utility-Zauber (z.B. 'Magierrüstung') aus und verallgemeinert die Logik.
   */
  handleUtilitySpell(caster, spell, targets, options, finalDuration = null) {
     const logs = [];
     const duration = finalDuration || spell.duration;
     
     // Prüft auf die neue, strukturierte Utility-Logik
     if (spell.utility_effects) {
         const target = targets[0] || caster; // Annahme: Utility-Zauber zielen meist auf 1 Ziel/Selbst
         
         for (const effect of spell.utility_effects) {
             switch (effect.type) {
                 case 'set_ac_13_plus_dex':
                     const dexMod = getModifier(target.abilities.dex);
                     target.ac = 13 + dexMod; 
                     logs.push(`${target.name} Rüstungsklasse ist nun ${target.ac}.`);
                     if(target.applyStatus) target.applyStatus('mage_armor', duration);
                     break;
                 case 'set_ac_min_16':
                     target.ac = Math.max(target.ac, 16); 
                     logs.push(`${target.name} Rüstungsklasse ist nun mindestens 16 (Borkenhaut).`);
                     if(target.applyStatus) target.applyStatus('barkskin', duration);
                     break;
                 case 'resistance_nonmagical_b_p_s_damage':
                     logs.push(`${target.name} erhält Resistenz gegen nicht-magischen Wucht-, Hieb- und Stichschaden.`);
                     if(target.applyStatus) target.applyStatus('stoneskin', duration);
                     break;
                 case 'grant_darkvision':
                     logs.push(`${target.name} erhält Dunkelsicht (${effect.value} ${effect.unit}).`);
                     if(target.applyStatus) target.applyStatus('darkvision_buff', duration);
                     break;
                 case 'weapon_magic_and_bonus':
                     logs.push(`${target.name}'s Waffe wird magisch (Bonus +${effect.value || 1} und ${spell.damage_type}).`);
                     if(target.applyStatus) target.applyStatus(spell.key, duration);
                     break;
                 case 'create_light':
                     logs.push(`${spell.name} erzeugt helles Licht (${effect.bright_radius}m) und dämmriges Licht (${effect.dim_radius}m).`);
                     break;
                 case 'triples_jump_distance':
                     logs.push(`${target.name} Sprungweite verdreifacht sich.`);
                     if(target.applyStatus) target.applyStatus('jump_buff', duration);
                     break;
                 case 'movement_increase':
                     logs.push(`${target.name} Bewegungsrate erhöht sich um ${effect.value} ${effect.unit}.`);
                     if(target.applyStatus) target.applyStatus('longstrider', duration);
                     break;
                 case 'teleport_self_and_one_other':
                     logs.push(`${caster.name} und ${targets.length > 1 ? targets[1].name : 'das Ziel'} teleportieren sich.`);
                     break;
                 case 'next_attack_vs_target_has_advantage':
                      logs.push(`Der nächste Angriff gegen ${target.name} hat Vorteil.`);
                      if(target.applyStatus) target.applyStatus('guiding_bolt_debuff', duration);
                      break;
                 default:
                     logs.push(`${spell.name} wirkt den Effekt: ${effect.type}.`);
                     if(target.applyStatus) target.applyStatus(spell.key, duration);
                     break;
             }
         }
     } else {
         // Fallback für Zauber ohne spezifische Utility-Logik
         logs.push(`${spell.name} wird erfolgreich gewirkt.`);
     }
     
     return { logs };
  }

  /**
   * Führt eine Kampffähigkeit aus, die Ressourcen verbraucht (z.B. Divine Smite).
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
      const targetType = target.type || 'humanoid'; 
      const damageDice = caster.classLogic.getDivineSmiteDamage(slotLevel, targetType); 
      const { total: smiteDamage } = rollDice(damageDice); 

      logs.push(`${caster.name} nutzt Göttliches Niederstrecken (Grad ${slotLevel})!`);
      logs.push(`${target.name} erleidet ${smiteDamage} gleißenden Schaden zusätzlich!`);
      
      // 4. Schaden anwenden
      target.hp -= smiteDamage;
      if (target.hp <= 0) {
        logs.push(`${target.name} ist besiegt!`);
        target.hp = 0;
      }
      return { success: true, logs };
    }
    
    return { success: false, logs: [`Unbekannte Fähigkeit: ${abilityKey}`] };
  }

  // --- ALLES AB HIER IST NEU (Implementierung von Konzentrationsverlust) ---
  
  /**
   * NEUE FUNKTION: Diese muss von Ihrer Haupt-Spiel-Engine (Game Loop / Combat Manager) 
   * aufgerufen werden, WENN ein Charakter Schaden erleidet.
   *
   * @param {object} character - Der Charakter, der Schaden erleidet (muss .concentration, .abilities, .level, .classLogic haben).
   * @param {number} damageAmount - Die Höhe des erlittenen Schadens.
   * @returns {object} { broken: boolean, logs: string[] } - Gibt zurück, ob die Konzentration gebrochen wurde und was passiert ist.
   */
  handleTakeDamage(character, damageAmount) {
    const logs = [];
    
    // 1. Prüfen, ob der Charakter sich überhaupt konzentriert.
    if (!character.concentration || !character.concentration.spellKey) {
        return { broken: false, logs: [] }; // Nichts zu tun
    }

    // 2. D&D Regel für Konzentration: SG 10 oder halber Schaden, je nachdem, was höher ist.
    const saveDC = Math.max(10, Math.floor(damageAmount / 2));
    const abilityKey = 'constitution'; // Konzentration ist immer Konstitution
    
    logs.push(`${character.name} muss einen Konstitutions-Rettungswurf (SG ${saveDC}) für Konzentration ablegen.`);

    // 3. Modifikatoren für den Rettungswurf berechnen
    const modifier = getModifier(character.abilities[abilityKey]);
    const proficiencyBonus = getProficiencyBonus(character.level);
    
    let proficiency = 0;
    // Prüfen, ob der Charakter geübt in KO-Rettungswürfen ist
    if (character.classLogic && character.classLogic.getSavingThrowProficiencies().includes(abilityKey)) {
        proficiency = proficiencyBonus;
    }
    
    // HINWEIS: Hier könnten Boni von Features (z.B. 'Fokussierte Beschwörung' des Magiers)
    // oder Zaubern (z.B. 'Segen') hinzugefügt werden.

    // 4. Den Wurf ausführen (nutzt die lokale rollD20 Funktion)
    const roll = rollD20(); // (Kein Vor-/Nachteil als Standard)
    const total = roll + modifier + proficiency;

    // 5. Ergebnis prüfen
    if (total >= saveDC) {
        logs.push(`${character.name} hält die Konzentration aufrecht! (Wurf ${total} vs SG ${saveDC})`);
        return { broken: false, logs };
    } else {
        const lostSpell = character.concentration.spellKey;
        logs.push(`${character.name} verliert die Konzentration auf ${lostSpell}! (Wurf ${total} vs SG ${saveDC})`);
        
        // 6. Konzentration und Status entfernen
        character.concentration.spellKey = null;
        if (character.removeStatus) {
            character.removeStatus(lostSpell);
        }
        
        return { broken: true, logs };
    }
  }
  // --- Ende NEU ---
}