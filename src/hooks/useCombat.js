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
      
      if (!attacker || !target) return prev;

      const dist = getDistance(attacker, target);
      const range = action.range || 1.5;

      if (dist > range && action.type === 'weapon') {
          return { ...prev, log: [...prev.log, `❌ ${attacker.name} ist zu weit weg!`] };
      }

      let logEntry = '';
      let damage = 0;
      
      const roll = d(20);
      const attackBonus = action.attackBonus || 5; 
      const totalRoll = roll + attackBonus;
      
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
              
              logEntry = `⚔️ ${attacker.name} trifft ${target.name} (${damage} Schaden)`;
          } catch (err) {
              console.error("Würfelfehler:", err);
              damage = 1; 
              logEntry = `Fehler beim Schaden, minimaler Treffer (1)`;
          }
      } else {
          logEntry = `💨 ${attacker.name} verfehlt (${totalRoll})`;
      }

      const newCombatants = prev.combatants.map(c => {
          if (c.id === targetId) {
              const safeDamage = isNaN(damage) ? 0 : damage;
              const newHp = Math.max(0, c.hp - safeDamage);
              if (newHp === 0) logEntry += ` 💀 ${c.name} besiegt!`;
              return { ...c, hp: newHp };
          }
          return c;
      });

      const enemiesAlive = newCombatants.some(c => c.type === 'enemy' && c.hp > 0);
      const playerAlive = newCombatants.some(c => c.type === 'player' && c.hp > 0);
      
      let result = null;
      if (!enemiesAlive) result = 'victory';
      if (!playerAlive) result = 'defeat';

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

  // --- CLICK HANDLER ---
  const handleCombatTileClick = useCallback((x, y) => {
      const state = stateRef.current;
      if (!state.isActive || state.result) return;

      const current = state.combatants[state.turnIndex];
      if (current.type !== 'player') return;

      const target = state.combatants.find(c => c.x === x && c.y === y && c.hp > 0);

      if (target && target.type === 'enemy') {
          if (selectedAction && state.turnResources.hasAction) {
              performAction(current.id, target.id, selectedAction);
          }
      } else if (!target && !selectedAction) {
          const dist = getDistance(current, {x, y});
          if (dist <= state.turnResources.movementLeft) {
              setCombatState(prev => ({
                  ...prev,
                  combatants: prev.combatants.map(c => c.id === current.id ? { ...c, x, y } : c),
                  turnResources: { ...prev.turnResources, movementLeft: prev.turnResources.movementLeft - dist }
              }));
          }
      }
  }, [selectedAction, performAction]);

  const nextTurn = useCallback(() => {
      processingTurn.current = false; 
      setCombatState(prev => {
          if (prev.result) return prev;

          const nextIndex = (prev.turnIndex + 1) % prev.combatants.length;
          const nextRound = nextIndex === 0 ? prev.round + 1 : prev.round;
          const nextCombatant = prev.combatants[nextIndex];
          
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
    // FIX: combatState.isActive zur Dependency hinzufügen!
    const state = combatState;
    if (!state.isActive || state.result) return;

    const currentC = state.combatants[state.turnIndex];

    // Sicherstellen, dass wir nicht in einer Schleife hängen, wenn jemand tot ist
    if (currentC && currentC.hp <= 0) {
        if (!processingTurn.current) {
             processingTurn.current = true;
             setTimeout(() => nextTurn(), 500);
        }
        return;
    }

    if (currentC && currentC.type === 'enemy' && currentC.hp > 0 && !processingTurn.current) {
        
        processingTurn.current = true;
        
        const aiTurn = async () => {
            try {
                // 1. Bewegen (Verzögerung für Realismus)
                await new Promise(r => setTimeout(r, 600));
                
                let freshState = stateRef.current;
                if (!freshState.isActive || freshState.result) return;
                
                const player = freshState.combatants.find(c => c.type === 'player');
                
                if (player && player.hp > 0) {
                    const dist = getDistance(currentC, player);
                    
                    // Bewegung berechnen
                    if (dist > 1.5) {
                        let newX = currentC.x;
                        let newY = currentC.y;
                        const dx = player.x - currentC.x;
                        const dy = player.y - currentC.y;
                        
                        // Einfache Annäherung
                        if (Math.abs(dx) >= Math.abs(dy)) newX += Math.sign(dx);
                        else newY += Math.sign(dy);

                        const occupied = freshState.combatants.some(c => c.x === newX && c.y === newY && c.hp > 0);
                        
                        if (!occupied) {
                            setCombatState(prev => ({
                                ...prev,
                                combatants: prev.combatants.map(c => c.id === currentC.id ? { ...c, x: newX, y: newY } : c),
                                log: [...prev.log, `${currentC.name} nähert sich.`]
                            }));
                            // Kurz warten, damit das Grid rendert und "performAction" die neuen Koordinaten hat
                            await new Promise(r => setTimeout(r, 500)); 
                        }
                    }
                    
                    // 2. Angreifen (nach Bewegung)
                    // State neu holen, da sich Position geändert haben könnte
                    freshState = stateRef.current; 
                    
                    // Prüfen ob jetzt in Reichweite (oder ob es Fernkampf ist)
                    // Hier vereinfacht: Gegner hat immer Nahkampf mit 1.5 Reichweite
                    // Wenn wir in performAction sind, wird dort nochmal Range geprüft.
                    
                    const actionTemplate = (currentC.actions && currentC.actions[0]) || { name: 'Angriff', damage: '1d4' };
                    
                    performAction(currentC.id, player.id, {
                        type: 'weapon',
                        name: actionTemplate.name,
                        damage: actionTemplate.damage, 
                        attackBonus: actionTemplate.attack_bonus || 4,
                        range: 1.5 // Nahkampf
                    });
                }
            } catch (error) {
                console.error("KI Fehler:", error);
            } finally {
                // Zug beenden
                if (!stateRef.current.result) {
                    setTimeout(() => nextTurn(), 800);
                }
            }
        };

        aiTurn();
    }
  }, [combatState.turnIndex, combatState.isActive, nextTurn, performAction]); // FIX: isActive hinzugefügt

  return {
    combatState, startCombat, nextTurn, endCombatSession: () => {},
    selectedAction, setSelectedAction, handleCombatTileClick
  };
};