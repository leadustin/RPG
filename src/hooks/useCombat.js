// src/hooks/useCombat.js
import { useState, useCallback, useEffect, useRef } from 'react';
import { getAbilityModifier } from '../engine/rulesEngine';
import { rollDiceString, d } from '../utils/dice';

// Hilfsfunktion: Distanz berechnen (Schachbrett-Metrik: Diagonal = 1 Schritt)
const getDistance = (p1, p2) => Math.max(Math.abs(p1.x - p2.x), Math.abs(p1.y - p2.y));

export const useCombat = (playerCharacter) => {
  const [combatState, setCombatState] = useState({
    isActive: false,
    round: 0,
    turnIndex: 0,
    combatants: [],
    log: [],
    turnResources: { hasAction: true, hasBonusAction: true, movementLeft: 6 }, // 6 Felder = 9m
    result: null
  });

  const [selectedAction, setSelectedAction] = useState(null);
  
  // Refs für stabilen Zugriff innerhalb von Timeouts
  const stateRef = useRef(combatState);
  const processingTurn = useRef(false); 

  // Ref immer aktuell halten
  useEffect(() => { stateRef.current = combatState; }, [combatState]);

  // --- KAMPF STARTEN ---
  const startCombat = useCallback((enemies) => {
    if (!playerCharacter) return;
    console.log("[Combat] Start mit:", enemies);

    const stats = playerCharacter.stats || {};
    const initBonus = getAbilityModifier(stats.abilities?.dex || 10);

    // Spieler Setup
    const playerCombatant = {
      id: playerCharacter.id || 'player',
      type: 'player',
      name: playerCharacter.name || 'Held',
      hp: typeof stats.hp === 'number' ? stats.hp : 20,
      maxHp: stats.maxHp || 20,
      ac: stats.armor_class || 12,
      initiative: d(20) + initBonus,
      x: 2, y: 4, speed: 6, color: 'blue',
      icon: playerCharacter.icon
    };

    // Gegner Setup (MIT HP FIX)
    const enemyCombatants = enemies.map((e, i) => {
        // +++ HP FIX: Objekt vs Zahl prüfen +++
        let hpValue = 10; // Fallback
        if (typeof e.hp === 'number') {
            hpValue = e.hp;
        } else if (e.hp && (e.hp.average || e.hp.max)) {
            // Nimm average oder max, was da ist
            hpValue = e.hp.average || e.hp.max || 10;
        }

        return {
            ...e,
            id: e.instanceId || `enemy_${i}_${Date.now()}`,
            type: 'enemy',
            name: e.name || `Gegner ${i+1}`,
            initiative: d(20) + (e.initBonus || 0),
            hp: hpValue,        // Jetzt garantiert eine Zahl!
            maxHp: hpValue,     // Jetzt garantiert eine Zahl!
            speed: 5, 
            color: 'red',
            x: 9, y: 3 + i      // Startposition rechts
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

      // Distanz Check
      const dist = getDistance(attacker, target);
      const range = action.range || 1.5;

      if (dist > range && action.type === 'weapon') {
          return { ...prev, log: [...prev.log, `❌ ${attacker.name} ist zu weit weg (${dist} Felder)!`] };
      }

      let logEntry = '';
      let damage = 0;
      const roll = d(20);
      const attackBonus = 5; 
      const totalRoll = roll + attackBonus;
      
      if (totalRoll >= target.ac) {
          const damageDice = action.item?.damage || "1d6";
          damage = rollDiceString(damageDice);
          logEntry = `⚔️ ${attacker.name} trifft ${target.name} (${totalRoll}) für ${damage} Schaden!`;
      } else {
          logEntry = `💨 ${attacker.name} verfehlt ${target.name} (${totalRoll}).`;
      }

      // HP Update
      const newCombatants = prev.combatants.map(c => {
          if (c.id === targetId) {
              const newHp = Math.max(0, c.hp - damage);
              if (newHp === 0) logEntry += ` 💀 ${c.name} besiegt!`;
              return { ...c, hp: newHp };
          }
          return c;
      });

      // Status Check
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

  // --- KLICK HANDLER ---
  const handleCombatTileClick = useCallback((x, y) => {
      const state = stateRef.current;
      if (!state.isActive || state.result) return;

      const current = state.combatants[state.turnIndex];
      // Nur Spieler darf klicken
      if (current.type !== 'player') return;

      const target = state.combatants.find(c => c.x === x && c.y === y && c.hp > 0);

      // A) Angriff
      if (target && target.type === 'enemy') {
          if (selectedAction) {
              if (state.turnResources.hasAction) {
                  performAction(current.id, target.id, selectedAction);
              } else {
                  setCombatState(p => ({...p, log: [...p.log, "Keine Aktion mehr!"]}));
              }
          } else {
              setCombatState(p => ({...p, log: [...p.log, "Wähle zuerst eine Waffe!"]}));
          }
          return;
      }

      // B) Bewegung
      if (!target && !selectedAction) {
          const dist = getDistance(current, {x, y});
          if (dist <= state.turnResources.movementLeft) {
              setCombatState(prev => ({
                  ...prev,
                  combatants: prev.combatants.map(c => c.id === current.id ? { ...c, x, y } : c),
                  turnResources: { ...prev.turnResources, movementLeft: prev.turnResources.movementLeft - dist }
              }));
          } else {
              setCombatState(p => ({...p, log: [...p.log, "Zu weit!"]}));
          }
      }
  }, [selectedAction, performAction]);

  // --- RUNDE BEENDEN ---
  const nextTurn = useCallback(() => {
      processingTurn.current = false; // Reset Lock
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

  // --- KI LOGIK ---
  useEffect(() => {
    const state = combatState;
    if (!state.isActive || state.result) return;

    const currentC = state.combatants[state.turnIndex];

    // KI-Zug starten
    if (currentC && currentC.type === 'enemy' && currentC.hp > 0 && !processingTurn.current) {
        
        processingTurn.current = true; // Lock setzen
        console.log(`[KI] ${currentC.name} (HP: ${currentC.hp}) ist am Zug...`);

        const timer = setTimeout(() => {
            const freshState = stateRef.current;
            if (!freshState.isActive) return;

            const player = freshState.combatants.find(c => c.type === 'player');
            
            if (player && player.hp > 0) {
                const dist = getDistance(currentC, player);
                
                // 1. Bewegen
                if (dist > 1.5) {
                    let newX = currentC.x;
                    let newY = currentC.y;
                    const dx = player.x - currentC.x;
                    const dy = player.y - currentC.y;
                    
                    // Simple Wegfindung
                    if (Math.abs(dx) >= Math.abs(dy)) newX += Math.sign(dx);
                    else newY += Math.sign(dy);

                    const occupied = freshState.combatants.some(c => c.x === newX && c.y === newY && c.hp > 0);
                    if (!occupied) {
                        setCombatState(prev => ({
                            ...prev,
                            combatants: prev.combatants.map(c => c.id === currentC.id ? { ...c, x: newX, y: newY } : c),
                            log: [...prev.log, `${currentC.name} kommt näher.`]
                        }));
                    }
                }
                
                // 2. Angreifen (Falls nah genug)
                // Wir prüfen hier "frisch" die Distanz nach potenzieller Bewegung theoretisch, 
                // aber der Einfachheit halber greift die KI im nächsten 'Tick' oder Zug an.
                // Hier erlauben wir einen direkten Angriff wenn NAH
                const newDist = getDistance(freshState.combatants.find(c => c.id === currentC.id) || currentC, player);
                
                if (newDist <= 1.5) {
                     performAction(currentC.id, player.id, { type: 'weapon', item: { damage: '1d6' } });
                }
            }
            
            // Runde beenden
            setTimeout(() => nextTurn(), 800);

        }, 1000);

        return () => clearTimeout(timer);
    }
  }, [combatState.turnIndex, nextTurn, performAction]); // Nur Triggern bei Zugwechsel

  return {
    combatState, startCombat, nextTurn, endCombatSession: () => {},
    selectedAction, setSelectedAction, handleCombatTileClick
  };
};