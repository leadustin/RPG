// src/hooks/useCombat.js
import { useState, useCallback, useEffect, useRef } from 'react';
import { getAbilityModifier } from '../engine/rulesEngine';
import { rollDiceString, d } from '../utils/dice';

const getDistance = (p1, p2) => Math.max(Math.abs(p1.x - p2.x), Math.abs(p1.y - p2.y));

// Helper: Würfel-String bereinigen
const normalizeDice = (diceString) => {
    if (!diceString) return "1d4";
    return diceString.replace(/W/gi, 'd').replace(/\s/g, ''); 
};

// Helper: Zahl aus Würfel-Objekt ziehen
const extractDamageValue = (rollResult) => {
    if (typeof rollResult === 'number') return rollResult;
    if (rollResult && typeof rollResult === 'object') {
        if (rollResult.total !== undefined) return rollResult.total;
        if (rollResult.value !== undefined) return rollResult.value;
        if (rollResult.result !== undefined) return rollResult.result;
        if (rollResult.sum !== undefined) return rollResult.sum;
    }
    console.warn("Konnte keinen Zahlenwert aus Würfel-Objekt lesen:", rollResult);
    return 1; 
};

export const useCombat = (playerCharacter) => {
  const [combatState, setCombatState] = useState({
    isActive: false,
    round: 0,
    turnIndex: 0,
    combatants: [],
    log: [],
    turnResources: { hasAction: true, hasBonusAction: true, movementLeft: 6 },
    result: null
  });

  const [selectedAction, setSelectedAction] = useState(null);
  const stateRef = useRef(combatState);
  const processingTurn = useRef(false); 

  useEffect(() => { stateRef.current = combatState; }, [combatState]);

  // --- START ---
  const startCombat = useCallback((enemies) => {
    if (!playerCharacter) return;
    
    console.log("⚔️ COMBAT STARTED vs", enemies.length, "enemies");

    const stats = playerCharacter.stats || {};
    const startHp = (typeof stats.hp === 'number') ? stats.hp : (playerCharacter.hp || 20);
    const maxHp = stats.maxHp || playerCharacter.maxHp || 20;
    
    const playerCombatant = {
      id: playerCharacter.id || 'player',
      type: 'player',
      name: playerCharacter.name || 'Held',
      hp: startHp,
      maxHp: maxHp,
      ac: stats.armor_class || 12,
      initiative: d(20) + getAbilityModifier(stats.abilities?.dex || 10),
      x: 2, y: 4, speed: 6, color: 'blue',
      icon: playerCharacter.icon
    };

    const enemyCombatants = enemies.map((e, i) => {
        let hpValue = 10;
        if (typeof e.hp === 'number') hpValue = e.hp;
        else if (e.hp && (e.hp.average || e.hp.max)) hpValue = e.hp.average || e.hp.max;

        return {
            ...e, 
            id: e.instanceId || `enemy_${i}_${Date.now()}`,
            type: 'enemy',
            name: e.name || `Gegner ${i+1}`,
            initiative: d(20) + (e.initBonus || 0),
            hp: hpValue,
            maxHp: hpValue,
            speed: 5, 
            color: 'red',
            x: 9, y: 3 + i
        };
    });

    const allCombatants = [playerCombatant, ...enemyCombatants].sort((a, b) => b.initiative - a.initiative);
    
    console.log("🎲 Initiative Order:", allCombatants.map(c => `${c.name} (${c.initiative})`).join(', '));

    setCombatState({
      isActive: true,
      round: 1,
      turnIndex: 0,
      combatants: allCombatants,
      log: [`Kampf gestartet! ${allCombatants[0].name} beginnt.`],
      turnResources: { hasAction: true, hasBonusAction: true, movementLeft: 6 },
      result: null
    });
    
    setSelectedAction(null);
    processingTurn.current = false;
  }, [playerCharacter]);

  // --- PERFORM ACTION ---
  const performAction = useCallback((attackerId, targetId, action) => {
    setCombatState(prev => {
      const attacker = prev.combatants.find(c => c.id === attackerId);
      const target = prev.combatants.find(c => c.id === targetId);
      
      if (!attacker || !target) {
          console.warn("⚠️ Action failed: Attacker or Target not found.");
          return prev;
      }

      console.log(`⚡ ACTION: ${attacker.name} uses ${action.name} on ${target.name}`);

      const dist = getDistance(attacker, target);
      const range = action.range || 1.5;

      if (dist > range && action.type === 'weapon') {
          console.log(`❌ Out of range: Dist ${dist} > Range ${range}`);
          return { ...prev, log: [...prev.log, `❌ ${attacker.name} ist zu weit weg!`] };
      }

      let logEntry = '';
      let damage = 0;
      
      const roll = d(20);
      const attackBonus = action.attackBonus || 5; 
      const totalRoll = roll + attackBonus;
      
      console.log(`🎲 Attack Roll: D20(${roll}) + ${attackBonus} = ${totalRoll} vs AC ${target.ac}`);

      if (totalRoll >= target.ac) {
          // Schaden berechnen
          let diceString = "1d4";
          if (action.item && action.item.damage) diceString = action.item.damage; 
          else if (action.damage && action.damage.dice) diceString = action.damage.dice; 
          else if (typeof action.damage === 'string') diceString = action.damage;

          const cleanDice = normalizeDice(diceString);
          
          try {
              const rawResult = rollDiceString(cleanDice);
              damage = extractDamageValue(rawResult);

              if (action.damage && action.damage.bonus) damage += Number(action.damage.bonus);
              
              console.log(`💥 HIT! Damage Roll (${cleanDice}): ${damage}`);
              logEntry = `⚔️ ${attacker.name} trifft ${target.name} (${damage} Schaden)`;
          } catch (err) {
              console.error("❌ Dice Error:", err);
              damage = 1; 
              logEntry = `Fehler beim Schaden, minimaler Treffer (1)`;
          }
      } else {
          console.log("💨 MISS!");
          logEntry = `💨 ${attacker.name} verfehlt (${totalRoll})`;
      }

      // HP abziehen
      const newCombatants = prev.combatants.map(c => {
          if (c.id === targetId) {
              const safeDamage = isNaN(damage) ? 0 : damage;
              const newHp = Math.max(0, c.hp - safeDamage);
              console.log(`🩸 ${c.name} HP: ${c.hp} -> ${newHp}`);
              if (newHp === 0) {
                  logEntry += ` 💀 ${c.name} besiegt!`;
                  console.log(`💀 ${c.name} DIED`);
              }
              return { ...c, hp: newHp };
          }
          return c;
      });

      const enemiesAlive = newCombatants.some(c => c.type === 'enemy' && c.hp > 0);
      const playerAlive = newCombatants.some(c => c.type === 'player' && c.hp > 0);
      
      let result = null;
      if (!enemiesAlive) {
          result = 'victory';
          console.log("🏆 VICTORY!");
      }
      if (!playerAlive) {
          result = 'defeat';
          console.log("💀 DEFEAT!");
      }

      return {
          ...prev,
          combatants: newCombatants,
          log: [...prev.log, logEntry],
          turnResources: { ...prev.turnResources, hasAction: false },
          result
      };
    });
    
    setSelectedAction(null);
  }, []);

  // --- CLICK HANDLER (Player Movement/Attack) ---
  const handleCombatTileClick = useCallback((x, y) => {
      const state = stateRef.current;
      if (!state.isActive || state.result) return;

      const current = state.combatants[state.turnIndex];
      if (current.type !== 'player') return;

      const target = state.combatants.find(c => c.x === x && c.y === y && c.hp > 0);

      if (target && target.type === 'enemy') {
          if (selectedAction && state.turnResources.hasAction) {
              performAction(current.id, target.id, selectedAction);
          } else {
              console.log("⚠️ Cannot attack: No action selected or no action resource left.");
          }
      } else if (!target && !selectedAction) {
          // Movement
          const dist = getDistance(current, {x, y});
          if (dist <= state.turnResources.movementLeft) {
              console.log(`🏃 Player Move: (${current.x},${current.y}) -> (${x},${y}) | Cost: ${dist}`);
              setCombatState(prev => ({
                  ...prev,
                  combatants: prev.combatants.map(c => c.id === current.id ? { ...c, x, y } : c),
                  turnResources: { ...prev.turnResources, movementLeft: prev.turnResources.movementLeft - dist }
              }));
          } else {
              console.log(`❌ Move failed: Distance ${dist} > Moves Left ${state.turnResources.movementLeft}`);
          }
      }
  }, [selectedAction, performAction]);

  // --- NEXT TURN ---
  const nextTurn = useCallback(() => {
      processingTurn.current = false; 
      setCombatState(prev => {
          if (prev.result) return prev;

          const nextIndex = (prev.turnIndex + 1) % prev.combatants.length;
          const nextRound = nextIndex === 0 ? prev.round + 1 : prev.round;
          const nextCombatant = prev.combatants[nextIndex];
          
          console.log(`🔄 ROUND ${nextRound} | Turn: ${nextCombatant.name} (${nextCombatant.type})`);

          return {
              ...prev,
              turnIndex: nextIndex,
              round: nextRound,
              turnResources: { hasAction: true, hasBonusAction: true, movementLeft: nextCombatant.speed || 6 },
              log: [...prev.log, `--- Runde ${nextRound}: ${nextCombatant.name} ---`]
          };
      });
  }, []);

  // --- KI LOGIK ---
  useEffect(() => {
    // FIX: Dependency Array korrigiert (isActive hinzugefügt)
    const state = combatState;
    if (!state.isActive || state.result) return;

    const currentC = state.combatants[state.turnIndex];

    // Überspringen wenn tot
    if (currentC && currentC.hp <= 0) {
        if (!processingTurn.current) {
             console.log(`☠️ Skipping dead turn: ${currentC.name}`);
             processingTurn.current = true;
             setTimeout(() => nextTurn(), 500);
        }
        return;
    }

    if (currentC && currentC.type === 'enemy' && currentC.hp > 0 && !processingTurn.current) {
        
        processingTurn.current = true;
        console.log(`🤖 AI THINKING: ${currentC.name}...`);
        
        const aiTurn = async () => {
            try {
                // 1. Bewegen
                await new Promise(r => setTimeout(r, 600));
                
                let freshState = stateRef.current;
                if (!freshState.isActive || freshState.result) return;
                
                const player = freshState.combatants.find(c => c.type === 'player');
                
                if (player && player.hp > 0) {
                    const dist = getDistance(currentC, player);
                    
                    if (dist > 1.5) {
                        let newX = currentC.x;
                        let newY = currentC.y;
                        const dx = player.x - currentC.x;
                        const dy = player.y - currentC.y;
                        
                        // Simple pathfinding towards player
                        if (Math.abs(dx) >= Math.abs(dy)) newX += Math.sign(dx);
                        else newY += Math.sign(dy);

                        const occupied = freshState.combatants.some(c => c.x === newX && c.y === newY && c.hp > 0);
                        
                        if (!occupied) {
                            console.log(`🤖 AI MOVES: ${currentC.name} to (${newX}, ${newY})`);
                            setCombatState(prev => ({
                                ...prev,
                                combatants: prev.combatants.map(c => c.id === currentC.id ? { ...c, x: newX, y: newY } : c),
                                log: [...prev.log, `${currentC.name} nähert sich.`]
                            }));
                            await new Promise(r => setTimeout(r, 500)); 
                        } else {
                            console.log(`🤖 AI BLOCKED: Cannot move to (${newX}, ${newY})`);
                        }
                    }
                    
                    // 2. Angreifen
                    freshState = stateRef.current; 
                    const actionTemplate = (currentC.actions && currentC.actions[0]) || { name: 'Angriff', damage: '1d4' };
                    
                    // Wir führen die Action aus, performAction loggt den Rest
                    performAction(currentC.id, player.id, {
                        type: 'weapon',
                        name: actionTemplate.name,
                        damage: actionTemplate.damage, 
                        attackBonus: actionTemplate.attack_bonus || 4,
                        range: 1.5 
                    });
                }
            } catch (error) {
                console.error("❌ AI ERROR:", error);
            } finally {
                if (!stateRef.current.result) {
                    setTimeout(() => nextTurn(), 800);
                }
            }
        };

        aiTurn();
    }
  }, [combatState.turnIndex, combatState.isActive, nextTurn, performAction]); 

  return {
    combatState, startCombat, nextTurn, endCombatSession: () => {},
    selectedAction, setSelectedAction, handleCombatTileClick
  };
};