// src/hooks/useCombat.js
import { useState, useCallback, useEffect, useRef } from 'react';
import { getAbilityModifier } from '../engine/rulesEngine';
import { rollDiceString, d } from '../utils/dice';

// Hilfsfunktion: Distanz berechnen
const getDistance = (p1, p2) => Math.max(Math.abs(p1.x - p2.x), Math.abs(p1.y - p2.y));

// Hilfsfunktion: '1W6 + 2' zu '1d6 + 2' umwandeln für den Parser
const normalizeDice = (diceString) => {
    if (!diceString) return "1d4";
    return diceString.replace(/W/gi, 'd'); // Ersetzt W oder w mit d
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

  // --- KAMPF STARTEN ---
  const startCombat = useCallback((enemies) => {
    if (!playerCharacter) return;

    // 1. SPIELER DATEN SICHER LADEN
    const stats = playerCharacter.stats || {};
    // Priorität: stats.hp -> playerCharacter.hp -> Fallback 20
    const startHp = (typeof stats.hp === 'number') ? stats.hp : (playerCharacter.hp || 20);
    const maxHp = stats.maxHp || playerCharacter.maxHp || 20;
    
    console.log(`[Combat] Spieler startet mit ${startHp} / ${maxHp} HP`); // <--- HIER PRÜFEN

    const initBonus = getAbilityModifier(stats.abilities?.dex || 10);

    const playerCombatant = {
      id: playerCharacter.id || 'player',
      type: 'player',
      name: playerCharacter.name || 'Held',
      hp: startHp,
      maxHp: maxHp,
      ac: stats.armor_class || 12,
      initiative: d(20) + initBonus,
      x: 2, y: 4, speed: 6, color: 'blue',
      icon: playerCharacter.icon
    };

    // 2. GEGNER DATEN LADEN (Inklusive Actions)
    const enemyCombatants = enemies.map((e, i) => {
        // HP Fix (Objekt vs Zahl)
        let hpValue = 10; 
        if (typeof e.hp === 'number') hpValue = e.hp;
        else if (e.hp && (e.hp.average || e.hp.max)) hpValue = e.hp.average || e.hp.max;

        return {
            ...e, // Übernimmt alle Daten aus JSON (auch 'actions'!)
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

  // --- AKTION AUSFÜHREN ---
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
      
      // Angriffswurf
      const roll = d(20);
      const attackBonus = action.attackBonus || 5; 
      const totalRoll = roll + attackBonus;
      
      console.log(`[Combat] ${attacker.name} würfelt ${roll} + ${attackBonus} = ${totalRoll} gegen AC ${target.ac}`);

      if (totalRoll >= target.ac) {
          // Schaden berechnen
          let diceString = "1d4";
          // Versuche Schaden aus Item oder Action zu lesen
          if (action.item && action.item.damage) diceString = action.item.damage; // Spieler Waffe
          else if (action.damage && action.damage.dice) diceString = action.damage.dice; // Gegner JSON

          // W in d umwandeln
          diceString = normalizeDice(diceString);

          damage = rollDiceString(diceString);
          logEntry = `⚔️ ${attacker.name} trifft ${target.name} mit ${action.name} (${totalRoll}) für ${damage} Schaden!`;
      } else {
          logEntry = `💨 ${attacker.name} verfehlt ${target.name} (${totalRoll}).`;
      }

      // HP abziehen
      const newCombatants = prev.combatants.map(c => {
          if (c.id === targetId) {
              const newHp = Math.max(0, c.hp - damage);
              if (newHp === 0) logEntry += ` 💀 ${c.name} besiegt!`;
              return { ...c, hp: newHp };
          }
          return c;
      });

      // Status
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

  // --- SPIELER KLICK ---
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
          // Bewegung
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

  // --- INTELLIGENTE KI ---
  useEffect(() => {
    const state = combatState;
    if (!state.isActive || state.result) return;

    const currentC = state.combatants[state.turnIndex];

    if (currentC && currentC.type === 'enemy' && currentC.hp > 0 && !processingTurn.current) {
        processingTurn.current = true;
        console.log(`[KI] ${currentC.name} am Zug. Actions:`, currentC.actions);

        const timer = setTimeout(() => {
            const freshState = stateRef.current;
            if (!freshState.isActive) return;

            const player = freshState.combatants.find(c => c.type === 'player');
            if (player && player.hp > 0) {
                const dist = getDistance(currentC, player);
                
                // 1. Bewegen wenn nötig
                if (dist > 1.5) {
                    let newX = currentC.x;
                    let newY = currentC.y;
                    const dx = player.x - currentC.x;
                    const dy = player.y - currentC.y;
                    if (Math.abs(dx) >= Math.abs(dy)) newX += Math.sign(dx);
                    else newY += Math.sign(dy);

                    const occupied = freshState.combatants.some(c => c.x === newX && c.y === newY && c.hp > 0);
                    if (!occupied) {
                        setCombatState(prev => ({
                            ...prev,
                            combatants: prev.combatants.map(c => c.id === currentC.id ? { ...c, x: newX, y: newY } : c),
                            log: [...prev.log, `${currentC.name} bewegt sich.`]
                        }));
                    }
                }
                
                // 2. Echten Angriff aus JSON wählen
                const newDist = getDistance(freshState.combatants.find(c => c.id === currentC.id) || currentC, player);
                
                if (newDist <= 1.5) {
                     // Wähle erste Aktion aus JSON oder Fallback
                     let enemyAction = { type: 'weapon', name: 'Angriff', damage: { dice: '1d4' } };
                     
                     if (currentC.actions && currentC.actions.length > 0) {
                         // Nimm die erste verfügbare Aktion (meist Nahkampf)
                         const actionTemplate = currentC.actions[0];
                         enemyAction = {
                             type: 'weapon',
                             name: actionTemplate.name,
                             damage: actionTemplate.damage, // Das Objekt { average: 5, dice: "1W6+2"}
                             attackBonus: actionTemplate.attack_bonus
                         };
                     }

                     performAction(currentC.id, player.id, enemyAction);
                }
            }
            setTimeout(() => nextTurn(), 800);
        }, 1000);
        return () => clearTimeout(timer);
    }
  }, [combatState.turnIndex, nextTurn, performAction]); 

  return {
    combatState, startCombat, nextTurn, endCombatSession: () => {},
    selectedAction, setSelectedAction, handleCombatTileClick
  };
};