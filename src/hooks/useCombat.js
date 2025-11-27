// src/hooks/useCombat.js
import { useState, useCallback, useEffect } from 'react';
import { getAbilityModifier, calculateWeaponStats } from '../engine/rulesEngine'; // +++ NEU IMPORTIERT
import { rollDiceString, d } from '../utils/dice';

export const useCombat = (playerCharacter) => {
  const [combatState, setCombatState] = useState({
    isActive: false,
    round: 0,
    turnIndex: 0,
    combatants: [],
    log: [],
    turnResources: { hasAction: true, hasBonusAction: true, movementLeft: 0 },
    result: null
  });

  // --- INITIIERUNG (Bleibt fast gleich) ---
  const startCombat = useCallback((enemies) => {
    const playerToken = {
      id: 'player',
      type: 'player',
      name: playerCharacter.name,
      hp: playerCharacter.hp,
      maxHp: playerCharacter.stats.maxHp || 20,
      ac: playerCharacter.stats.ac || 10,
      initiativeBonus: getAbilityModifier(playerCharacter.stats.dex),
      speed: 30,
      position: { x: 1, y: 5 },
      initiative: 0,
      data: playerCharacter
    };

    const enemyTokens = enemies.map((enemyData, index) => ({
      id: `enemy-${index}`,
      type: 'enemy',
      name: `${enemyData.name} ${index + 1}`,
      hp: enemyData.hp.average,
      maxHp: enemyData.hp.average,
      ac: enemyData.ac,
      initiativeBonus: getAbilityModifier(enemyData.stats.dex),
      speed: 30, 
      position: { x: 8, y: 2 + index * 2 },
      initiative: 0,
      data: enemyData
    }));

    const allCombatants = [playerToken, ...enemyTokens];
    allCombatants.forEach(c => c.initiative = d(20) + c.initiativeBonus);
    allCombatants.sort((a, b) => b.initiative - a.initiative);

    setCombatState({
      isActive: true,
      round: 1,
      turnIndex: 0,
      combatants: allCombatants,
      log: [`Kampf gestartet! Initiative: ${allCombatants.map(c => `${c.name} (${c.initiative})`).join(', ')}`],
      turnResources: { hasAction: true, hasBonusAction: true, movementLeft: allCombatants[0].speed },
      result: null 
    });
  }, [playerCharacter]);

  // --- HELPER: KAMPFENDE ---
  const checkEndCondition = (currentCombatants) => {
    const player = currentCombatants.find(c => c.type === 'player');
    const enemies = currentCombatants.filter(c => c.type === 'enemy');
    
    if (player.hp <= 0) return { type: 'defeat', xp: 0, loot: [] };

    const allEnemiesDead = enemies.every(e => e.hp <= 0);
    if (allEnemiesDead) {
      let totalXp = 0;
      let totalLoot = [];
      enemies.forEach(e => {
        if (e.data.xp) totalXp += e.data.xp;
        if (e.data.loot && e.data.loot.items) {
            totalLoot = [...totalLoot, ...e.data.loot.items];
        }
      });
      return { type: 'victory', xp: totalXp, loot: totalLoot };
    }
    return null; 
  };

  // --- RUNDENLOGIK ---
  const nextTurn = useCallback(() => {
    setCombatState(prev => {
      if (prev.result) return prev;

      let nextIndex = prev.turnIndex + 1;
      let nextRound = prev.round;

      if (nextIndex >= prev.combatants.length) {
        nextIndex = 0;
        nextRound++;
      }

      let loops = 0;
      while (prev.combatants[nextIndex].hp <= 0 && loops < prev.combatants.length) {
        nextIndex++;
        if (nextIndex >= prev.combatants.length) {
          nextIndex = 0;
          nextRound++;
        }
        loops++;
      }

      const nextCombatant = prev.combatants[nextIndex];
      return {
        ...prev,
        turnIndex: nextIndex,
        round: nextRound,
        log: [...prev.log, `--- Runde ${nextRound}, Zug: ${nextCombatant.name} ---`],
        turnResources: { hasAction: true, hasBonusAction: true, movementLeft: nextCombatant.speed || 30 }
      };
    });
  }, []);

  // --- BEWEGUNG ---
  const moveCombatant = (id, targetPos) => {
    setCombatState(prev => {
      if (prev.result) return prev; 
      const activeC = prev.combatants[prev.turnIndex];
      if (activeC.id !== id) return prev;

      const dx = Math.abs(activeC.position.x - targetPos.x);
      const dy = Math.abs(activeC.position.y - targetPos.y);
      const distanceTiles = Math.max(dx, dy); 
      const cost = distanceTiles * 5; 

      if (cost > prev.turnResources.movementLeft) return prev;

      const newCombatants = prev.combatants.map(c => c.id === id ? { ...c, position: targetPos } : c);

      return {
        ...prev,
        combatants: newCombatants,
        turnResources: { ...prev.turnResources, movementLeft: prev.turnResources.movementLeft - cost }
      };
    });
  };

  // --- ANGRIFF (UPDATED) ---
  const attack = (attackerId, targetId, weapon = null) => {
    setCombatState(prev => {
      if (prev.result) return prev;
      if (!prev.turnResources.hasAction) return { ...prev, log: [...prev.log, "⚠️ Keine Aktion mehr übrig!"] };

      const attacker = prev.combatants.find(c => c.id === attackerId);
      const target = prev.combatants.find(c => c.id === targetId);
      if (!attacker || !target) return prev;

      // +++ BERECHNUNG DER WERTE +++
      let attackBonus = 0;
      let damageMod = 0;
      let damageDice = "1d4"; // Default waffenlos
      let damageType = "Wucht";

      // Fallunterscheidung: Spieler vs Monster
      if (attacker.type === 'player') {
        // Spieler nutzt echte Stats und Waffe
        if (weapon) {
            const stats = calculateWeaponStats(attacker.data, weapon);
            attackBonus = stats.toHit;
            damageMod = stats.damageMod;
            damageDice = weapon.damage;
            damageType = weapon.damage_type || "Wucht";
        } else {
            // Waffenloser Schlag (Spieler)
            const strMod = getAbilityModifier(attacker.data.stats.str);
            attackBonus = strMod + (attacker.data.proficiencyBonus || 2); // Monk etc. check fehlt hier, vereinfacht
            damageMod = strMod;
            damageDice = "1"; // 1 Schaden + STR
        }
      } else {
        // Monster nutzt statische Daten aus enemies.json
        if (weapon) {
            // Wenn wir eine "Waffe" übergeben haben (KI Logik)
            attackBonus = weapon.attackBonus || 4;
            damageDice = weapon.damage || "1d6";
            // Monster haben Damage Mod oft schon im Würfelstring (z.B. "1d6 + 2"), 
            // daher lassen wir damageMod hier oft auf 0 wenn der String geparst wird.
            // Aber um sicherzugehen, nutzen wir hier keine extra Logik, da KI Strings oft komplex sind.
        } else {
            // Fallback Monster
            attackBonus = 3;
            damageDice = "1d4";
        }
      }

      // Würfeln
      const d20Roll = d(20);
      const totalAttack = d20Roll + attackBonus;
      
      let logEntry = `${attacker.name} greift ${target.name} an (${weapon?.name || 'Faust'}): `;
      let damage = 0;
      const isCrit = d20Roll === 20;

      if (isCrit || totalAttack >= target.ac) {
        let dmgResult = rollDiceString(damageDice);
        
        // Monster Logik Check: Wenn der String sowas wie "1W6 + 2" war, ist der Modifikator schon in "total" drin.
        // Bei Spielern (z.B. "1d8") müssen wir damageMod addieren.
        
        // Einfache Heuristik: Wenn der Dice-String ein '+' enthält, nehmen wir an, der Mod ist drin.
        const hasBuiltInMod = damageDice.includes('+');
        const finalDamageMod = hasBuiltInMod ? 0 : damageMod;

        damage = dmgResult.total + finalDamageMod;

        if (isCrit) {
            const critRoll = rollDiceString(damageDice); // Nur Würfel nochmal, ohne Mod
            // Bei Crit rollen wir nur den Würfelteil nochmal. Da rollDiceString aber bei "1d6+2" auch die +2 nochmal rechnen würde,
            // ist das hier etwas tricky. Für den Prototyp verdoppeln wir einfach den Würfelschaden.
            // Bessere Lösung: rollDiceString splittet Würfel und Mod.
            
            // Simpler Crit: Schaden verdoppeln (Hausregel) oder einfach einen extra Roll addieren (5e RAW)
            // Hier: Extra Roll des Basiswürfels (ohne Mod)
            // Wir parsen den String kurz "manuell" für den reinen Würfelteil, falls möglich, oder nehmen dmgResult.total nochmal (etwas hoch)
            // Nehmen wir einfach an: Crit = (Würfel * 2) + Mod
            
            damage += Math.max(1, dmgResult.total - (hasBuiltInMod ? 0 : 0)); // Vereinfacht
            logEntry += `💥 KRIT! (${d20Roll}) -> ${damage} ${damageType}`;
        } else {
            logEntry += `Treffer! (${totalAttack}) -> ${damage} ${damageType}`;
        }
      } else {
        logEntry += `Verfehlt. (${totalAttack} vs AC ${target.ac})`;
      }

      const newCombatants = prev.combatants.map(c => c.id === targetId ? { ...c, hp: Math.max(0, c.hp - damage) } : c);
      
      if (newCombatants.find(c => c.id === targetId).hp === 0) {
        logEntry += ` 💀 Besiegt!`;
      }

      const endResult = checkEndCondition(newCombatants);

      return {
        ...prev,
        combatants: newCombatants,
        log: [...prev.log, logEntry],
        turnResources: { ...prev.turnResources, hasAction: false },
        result: endResult 
      };
    });
  };

  const dash = () => {
    setCombatState(prev => {
        if (prev.result) return prev;
        if (!prev.turnResources.hasAction) return prev;
        const activeC = prev.combatants[prev.turnIndex];
        return {
            ...prev,
            log: [...prev.log, `${activeC.name} sprintet!`],
            turnResources: { ...prev.turnResources, hasAction: false, movementLeft: prev.turnResources.movementLeft + (activeC.speed || 30) }
        }
    });
  };

  const endCombatSession = useCallback(() => {
      setCombatState(prev => ({ ...prev, isActive: false, result: null }));
  }, []);

  // --- KI LOGIK ---
  useEffect(() => {
    if (!combatState.isActive || combatState.result) return; 

    const currentCombatant = combatState.combatants[combatState.turnIndex];
    if (currentCombatant && currentCombatant.type === 'enemy' && currentCombatant.hp > 0) {
      const timer = setTimeout(() => {
        const player = combatState.combatants.find(c => c.type === 'player');
        if (player && player.hp > 0) {
          let kiWeapon = null;
          if (currentCombatant.data.actions && currentCombatant.data.actions.length > 0) {
              const action = currentCombatant.data.actions[0];
              kiWeapon = {
                  name: action.name,
                  damage: action.damage.dice.replace('W', 'd'), // Fix deutsche Notation
                  attackBonus: action.attack_bonus
              };
          }
          attack(currentCombatant.id, player.id, kiWeapon);
        }
        nextTurn();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [combatState.turnIndex, combatState.isActive, combatState.result, nextTurn]);

  return { combatState, startCombat, nextTurn, moveCombatant, attack, dash, endCombatSession };
};