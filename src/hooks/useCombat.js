// src/hooks/useCombat.js
import { useState, useCallback, useEffect } from 'react';
import { calculateWeaponStats, getAbilityModifier } from '../engine/rulesEngine';
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

  // --- INITIIERUNG ---
  const startCombat = useCallback((enemies) => {
    
    // FIX: Sicheres Laden der HP aus verschiedenen möglichen Pfaden
    // Priorität: character.stats.hp -> character.hp -> Default 10
    const stats = playerCharacter.stats || {};
    const currentHp = typeof stats.hp === 'number' ? stats.hp : (playerCharacter.hp || 10);
    const maxHp = stats.maxHp || playerCharacter.maxHp || 20;
    const armorClass = stats.armor_class || playerCharacter.ac || 10;
    const speed = playerCharacter.race?.speed || 30;
    
    // Initiative (Geschicklichkeit)
    const dexScore = stats.abilities?.dex || playerCharacter.abilities?.dex || 10;
    const initBonus = getAbilityModifier(dexScore);

    const playerToken = {
      id: 'player',
      type: 'player',
      name: playerCharacter.name,
      hp: currentHp,
      maxHp: maxHp,
      ac: armorClass,
      initiativeBonus: initBonus,
      speed: speed,
      position: { x: 1, y: 5 }, // Startposition links
      initiative: 0,
      data: playerCharacter,
      // Kopie der Zauberslots für den Kampf
      spellSlots: playerCharacter.currentSpellSlots ? { ...playerCharacter.currentSpellSlots } : (stats.maxSpellSlots || {})
    };

    const enemyTokens = enemies.map((enemyData, index) => ({
      id: `enemy-${index}`,
      type: 'enemy',
      name: `${enemyData.name} ${index + 1}`,
      hp: enemyData.hp.average,
      maxHp: enemyData.hp.average,
      ac: enemyData.ac,
      initiativeBonus: getAbilityModifier(enemyData.stats?.dex || 10),
      speed: 30, // Standard Monster Speed
      position: { x: 8, y: 2 + index * 2 },
      initiative: 0,
      data: enemyData
    }));

    const allCombatants = [playerToken, ...enemyTokens];
    
    // Initiative rollen
    allCombatants.forEach(c => c.initiative = d(20) + c.initiativeBonus);
    // Sortieren (höchste Initiative zuerst)
    allCombatants.sort((a, b) => b.initiative - a.initiative);

    const firstCombatant = allCombatants[0];

    setCombatState({
      isActive: true,
      round: 1,
      turnIndex: 0,
      combatants: allCombatants,
      log: [`Kampf gestartet!`],
      turnResources: { 
          hasAction: true, 
          hasBonusAction: true, 
          movementLeft: firstCombatant.speed || 30 
      },
      result: null
    });
  }, [playerCharacter]);

  // --- KAMPF-ENDE PRÜFEN ---
  const checkEndCondition = (combatants) => {
    const player = combatants.find(c => c.type === 'player');
    const enemies = combatants.filter(c => c.type === 'enemy');
    
    if (player.hp <= 0) {
        return { type: 'defeat', xp: 0, loot: [] };
    }
    
    if (enemies.every(e => e.hp <= 0)) {
      let xp = 0;
      let loot = [];
      enemies.forEach(e => {
        if (e.data.xp) xp += e.data.xp;
        if (e.data.loot && e.data.loot.items) loot.push(...e.data.loot.items);
      });
      return { type: 'victory', xp, loot };
    }
    return null;
  };

  // --- RUNDE BEENDEN ---
  const nextTurn = useCallback(() => {
    setCombatState(prev => {
      if (prev.result) return prev; // Kampf vorbei

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
      
      const nextC = prev.combatants[nextIndex];
      const speed = nextC.speed || 30;

      return {
        ...prev,
        turnIndex: nextIndex,
        round: nextRound,
        log: [...prev.log, `--- Runde ${nextRound}: ${nextC.name} ---`],
        turnResources: { 
            hasAction: true, 
            hasBonusAction: true, 
            movementLeft: speed 
        }
      };
    });
  }, []);

  // --- BEWEGUNG ---
  const moveCombatant = (id, targetPos) => {
    setCombatState(prev => {
      if (prev.result) return prev;
      const activeC = prev.combatants[prev.turnIndex];
      
      // Nur der aktive Charakter darf sich bewegen
      if (activeC.id !== id) return prev;

      // Distanz berechnen (Manhattan oder Chebyshev für Grid)
      const dx = Math.abs(activeC.position.x - targetPos.x);
      const dy = Math.abs(activeC.position.y - targetPos.y);
      const distanceTiles = Math.max(dx, dy); 
      const cost = distanceTiles * 5; // 5ft pro Feld
      
      if (cost > prev.turnResources.movementLeft) {
          // Optional: Log Eintrag "Nicht genug Bewegung"
          return prev;
      }

      const newCombatants = prev.combatants.map(c => 
          c.id === id ? { ...c, position: targetPos } : c
      );

      return {
        ...prev,
        combatants: newCombatants,
        turnResources: { 
            ...prev.turnResources, 
            movementLeft: prev.turnResources.movementLeft - cost 
        }
      };
    });
  };

  // --- AKTION AUSFÜHREN ---
  const performAction = (attackerId, targetId, actionData) => {
    setCombatState(prev => {
      if (prev.result) return prev;
      
      const attacker = prev.combatants.find(c => c.id === attackerId);
      const target = prev.combatants.find(c => c.id === targetId);
      if (!attacker || !target) return prev;

      let logEntry = "";
      let damage = 0;
      let healing = 0;
      
      // Kopien für State-Update
      let newResources = { ...prev.turnResources };
      let updatedAttacker = { ...attacker };

      // --- RESSOURCEN CHECK ---
      if (actionData.type === 'weapon' || actionData.type === 'unarmed' || actionData.type === 'spell_attack') {
          if (!newResources.hasAction) return { ...prev, log: [...prev.log, "⚠️ Keine Aktion mehr!"] };
      } else if (actionData.type === 'item_heal') {
          // Heiltrank ist Bonusaktion (PHB 2024 / gängige Hausregel)
          if (!newResources.hasBonusAction) return { ...prev, log: [...prev.log, "⚠️ Keine Bonusaktion mehr!"] };
      }

      // --- LOGIK: WAFFENANGRIFF ---
      if (actionData.type === 'weapon' || actionData.type === 'unarmed') {
          const stats = calculateWeaponStats(attacker.data, actionData.item);
          const d20 = d(20);
          const totalHit = d20 + stats.toHit;
          const isCrit = d20 === 20;
          
          logEntry = `${attacker.name} greift ${target.name} an (${actionData.item?.name || 'Faust'}): `;
          
          if (isCrit || totalHit >= target.ac) {
              const diceString = actionData.item?.damage || "1d4";
              // Formatierung fixen ("1W8" -> "1d8")
              const cleanDice = diceString.toUpperCase().replace('W', 'd').replace(/\s/g, '');
              
              const dmgRoll = rollDiceString(cleanDice);
              damage = dmgRoll.total + stats.damageMod;
              
              if (isCrit) {
                  damage += rollDiceString(cleanDice).total;
                  logEntry += `💥 KRITISCHER TREFFER! (${d20}) für ${damage} Schaden.`;
              } else {
                  logEntry += `Treffer! (${totalHit}) für ${damage} Schaden.`;
              }
          } else {
              logEntry += `Verfehlt. (${totalHit})`;
          }
          newResources.hasAction = false;
      }
      
      // --- LOGIK: ZAUBER ---
      else if (actionData.type === 'spell_attack') {
          logEntry = `${attacker.name} wirkt ${actionData.spell.name}!`;
          // Hier müsste man Spell Slots abziehen, wenn Level > 0
          // Schaden:
          const dmgString = actionData.spell.damage || "1d10";
          const cleanDice = dmgString.toUpperCase().replace('W', 'd');
          damage = rollDiceString(cleanDice).total;
          logEntry += ` ${damage} Schaden.`;
          
          newResources.hasAction = false;
      }
      
      // --- LOGIK: HEILUNG (ITEM) ---
      else if (actionData.type === 'item_heal') {
          healing = rollDiceString("2d4+2").total;
          logEntry = `${attacker.name} heilt sich um ${healing} TP.`;
          newResources.hasBonusAction = false;
      }

      // --- UPDATE COMBATANTS ---
      const newCombatants = prev.combatants.map(c => {
          if (c.id === targetId) {
              let newHp = c.hp - damage + healing;
              newHp = Math.min(newHp, c.maxHp);
              newHp = Math.max(newHp, 0);
              return { ...c, hp: newHp };
          }
          return c;
      });

      // Tod prüfen
      if (damage > 0 && newCombatants.find(c => c.id === targetId).hp === 0) {
          logEntry += ` 💀 ${target.name} wurde besiegt!`;
      }

      const result = checkEndCondition(newCombatants);

      return {
          ...prev,
          combatants: newCombatants,
          log: [...prev.log, logEntry],
          turnResources: newResources,
          result
      };
    });
  };

  const endCombatSession = useCallback(() => {
      setCombatState(prev => ({ ...prev, isActive: false, result: null }));
  }, []);

  // --- KI LOGIK ---
  useEffect(() => {
    if (!combatState.isActive || combatState.result) return;
    
    const currentC = combatState.combatants[combatState.turnIndex];
    
    // Wenn Gegner am Zug ist
    if (currentC && currentC.type === 'enemy' && currentC.hp > 0) {
        const timer = setTimeout(() => {
            const player = combatState.combatants.find(c => c.type === 'player');
            if (player && player.hp > 0) {
                // KI greift an (Fake Waffe)
                performAction(currentC.id, player.id, { 
                    type: 'weapon', 
                    item: { name: 'Angriff', damage: '1d6', category: 'simple' } 
                });
                
                // Zug beenden
                nextTurn();
            } else {
                nextTurn();
            }
        }, 1000);
        return () => clearTimeout(timer);
    }
  }, [combatState.turnIndex, combatState.isActive, combatState.result, nextTurn]);

  return { 
      combatState, 
      startCombat, 
      nextTurn, 
      moveCombatant, 
      performAction, 
      endCombatSession 
  };
};