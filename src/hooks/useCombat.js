// src/hooks/useCombat.js
import { useState, useCallback, useEffect } from 'react';
import { getAbilityModifier } from '../engine/rulesEngine';
import { rollDiceString, d } from '../utils/dice';

export const useCombat = (playerCharacter) => {
  const [combatState, setCombatState] = useState({
    isActive: false,
    round: 0,
    turnIndex: 0,
    combatants: [],
    log: [],
    turnResources: { hasAction: true, hasBonusAction: true, movementLeft: 0 },
    result: null // +++ NEU: Speichert das Ergebnis (null, 'victory', 'defeat')
  });

  // --- INITIIERUNG ---
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
      result: null // Reset
    });
  }, [playerCharacter]);

  // --- HELPER: KAMPFENDE PRÜFEN ---
  const checkEndCondition = (currentCombatants) => {
    const player = currentCombatants.find(c => c.type === 'player');
    const enemies = currentCombatants.filter(c => c.type === 'enemy');
    
    // 1. Niederlage?
    if (player.hp <= 0) {
      return { type: 'defeat', xp: 0, loot: [] };
    }

    // 2. Sieg? (Alle Gegner tot)
    const allEnemiesDead = enemies.every(e => e.hp <= 0);
    if (allEnemiesDead) {
      // XP und Loot berechnen
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

    return null; // Kampf geht weiter
  };

  // --- RUNDENLOGIK ---
  const nextTurn = useCallback(() => {
    setCombatState(prev => {
      // Falls Kampf schon vorbei, nichts tun
      if (prev.result) return prev;

      let nextIndex = prev.turnIndex + 1;
      let nextRound = prev.round;

      if (nextIndex >= prev.combatants.length) {
        nextIndex = 0;
        nextRound++;
      }

      // Tote überspringen
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

  // --- AKTIONEN (mit End-Check) ---
  const moveCombatant = (id, targetPos) => {
    setCombatState(prev => {
      if (prev.result) return prev; // Keine Aktionen nach Kampfende
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

  const attack = (attackerId, targetId, weapon = null) => {
    setCombatState(prev => {
      if (prev.result) return prev;
      if (!prev.turnResources.hasAction) return { ...prev, log: [...prev.log, "⚠️ Keine Aktion mehr übrig!"] };

      const attacker = prev.combatants.find(c => c.id === attackerId);
      const target = prev.combatants.find(c => c.id === targetId);
      if (!attacker || !target) return prev;

      const attackBonus = weapon ? (weapon.attackBonus || 0) : 2; 
      const statMod = getAbilityModifier(attacker.data.stats?.str || 10);
      const d20Roll = d(20);
      const totalAttack = d20Roll + attackBonus + statMod;
      
      let logEntry = `${attacker.name} greift ${target.name} an: `;
      let damage = 0;
      const isCrit = d20Roll === 20;

      if (isCrit || totalAttack >= target.ac) {
        const damageDice = weapon ? weapon.damage : "1d4";
        let dmgResult = rollDiceString(damageDice);
        damage = dmgResult.total + statMod;

        if (isCrit) {
            const critRoll = rollDiceString(damageDice);
            damage += critRoll.total;
            logEntry += `💥 KRIT! (${damage} Schaden)`;
        } else {
            logEntry += `Treffer! (${damage} Schaden)`;
        }
      } else {
        logEntry += `Verfehlt.`;
      }

      const newCombatants = prev.combatants.map(c => c.id === targetId ? { ...c, hp: Math.max(0, c.hp - damage) } : c);
      
      if (newCombatants.find(c => c.id === targetId).hp === 0) {
        logEntry += ` 💀 ${target.name} besiegt!`;
      }

      // +++ NEU: PRÜFE OB KAMPF VORBEI IST +++
      const endResult = checkEndCondition(newCombatants);

      return {
        ...prev,
        combatants: newCombatants,
        log: [...prev.log, logEntry],
        turnResources: { ...prev.turnResources, hasAction: false },
        result: endResult // Speichere Ergebnis falls vorhanden
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

  // Funktionalität um Kampf komplett zu beenden (Reset)
  const endCombatSession = useCallback(() => {
      setCombatState(prev => ({ ...prev, isActive: false, result: null }));
  }, []);

  // --- KI LOGIK ---
  useEffect(() => {
    if (!combatState.isActive || combatState.result) return; // Stoppe KI bei Kampfende

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
                  damage: action.damage.dice.replace('W', 'd'),
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