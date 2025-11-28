// src/hooks/useCombat.js
import { useState, useCallback, useEffect, useRef } from 'react';
import { getAbilityModifier } from '../engine/rulesEngine';
import { rollDiceString, d } from '../utils/dice';

const getDistance = (p1, p2) => Math.max(Math.abs(p1.x - p2.x), Math.abs(p1.y - p2.y));

const normalizeDice = (diceString) => {
    if (!diceString) {
        console.error("[COMBAT-DEBUG] CRITICAL: Kein Würfel-String übergeben!");
        return null;
    }
    return diceString.replace(/W/gi, 'd').replace(/\s/g, ''); 
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
    console.group("[COMBAT-DEBUG] Start Combat Initialization");
    
    if (!playerCharacter) {
        console.error("[COMBAT-DEBUG] FEHLER: Kein Spieler-Charakter!");
        console.groupEnd();
        return;
    }

    const stats = playerCharacter.stats || {};
    const startHp = (typeof stats.hp === 'number') ? stats.hp : playerCharacter.hp;
    
    const playerCombatant = {
      id: playerCharacter.id || 'player',
      type: 'player',
      name: playerCharacter.name || 'Held',
      hp: startHp || 20, 
      maxHp: stats.maxHp || playerCharacter.maxHp || 20,
      ac: stats.armor_class || 10,
      initiative: d(20) + getAbilityModifier(stats.abilities?.dex || 10),
      x: 2, y: 4, speed: 6, color: 'blue',
      icon: playerCharacter.icon
    };
    console.log("[COMBAT-DEBUG] Spieler erstellt:", playerCombatant);

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
      log: [`[DEBUG] Kampf gestartet. ${allCombatants[0].name} beginnt.`],
      turnResources: { hasAction: true, hasBonusAction: true, movementLeft: 6 },
      result: null
    });
    
    setSelectedAction(null);
    processingTurn.current = false;
    console.groupEnd();
  }, [playerCharacter]);

  // --- ACTION PERFORM (MIT DAMAGE FIX) ---
  const performAction = useCallback((attackerId, targetId, action) => {
    setCombatState(prev => {
      const attacker = prev.combatants.find(c => c.id === attackerId);
      const target = prev.combatants.find(c => c.id === targetId);
      
      if (!attacker || !target) return prev;

      // Dice String holen
      let diceString = null;
      if (action.item && action.item.damage) diceString = action.item.damage; 
      else if (action.damage && action.damage.dice) diceString = action.damage.dice; 
      else if (typeof action.damage === 'string') diceString = action.damage; 

      const cleanDice = normalizeDice(diceString);
      
      // Angriffswurf
      const roll = d(20);
      const attackBonus = action.attackBonus || 5; 
      const totalRoll = roll + attackBonus;
      let logEntry = '';
      let damage = 0;

      console.log(`[COMBAT-DEBUG] ${attacker.name} Angriff: ${totalRoll} (AC: ${target.ac})`);

      if (cleanDice && totalRoll >= target.ac) {
          try {
              // 1. Würfeln
              let rawResult = rollDiceString(cleanDice);
              
              // +++ FIX: Prüfen ob Ergebnis ein Objekt ist +++
              if (typeof rawResult === 'object' && rawResult !== null) {
                  // Versuche typische Properties zu finden
                  if (rawResult.total !== undefined) damage = rawResult.total;
                  else if (rawResult.value !== undefined) damage = rawResult.value;
                  else if (rawResult.result !== undefined) damage = rawResult.result;
                  else {
                      console.warn("[COMBAT-DEBUG] Unbekanntes Würfel-Objekt:", rawResult);
                      damage = 1; // Fallback
                  }
              } else {
                  // Es ist bereits eine Zahl
                  damage = Number(rawResult);
              }

              // Bonus addieren (falls im JSON definiert außerhalb vom Dice string)
              if (action.damage && action.damage.bonus) {
                  damage += Number(action.damage.bonus);
              }
              
              // Sicherheits-Check falls immer noch NaN
              if (isNaN(damage)) {
                  console.error("[COMBAT-DEBUG] CRITICAL: Schaden ist NaN! Setze auf 1.");
                  damage = 1;
              }

              console.log(`[COMBAT-DEBUG] Finaler Schaden: ${damage}`);
              logEntry = `⚔️ ${attacker.name} trifft ${target.name} (${damage} Schaden)`;

          } catch (err) {
              console.error("[COMBAT-DEBUG] Fehler beim Würfeln:", err);
              logEntry = `ERROR: Würfelfehler`;
          }
      } else {
          logEntry = `💨 ${attacker.name} verfehlt (${totalRoll})`;
      }

      // HP anwenden
      const newCombatants = prev.combatants.map(c => {
          if (c.id === targetId) {
              const newHp = Math.max(0, c.hp - damage);
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

  // --- CLICK HANDLER ---
  const handleCombatTileClick = useCallback((x, y) => {
      const state = stateRef.current;
      if (!state.isActive || state.result) return;

      const current = state.combatants[state.turnIndex];
      if (current.type !== 'player') return;

      const target = state.combatants.find(c => c.x === x && c.y === y && c.hp > 0);

      // Angriff
      if (target && target.type === 'enemy') {
          if (selectedAction && state.turnResources.hasAction) {
              performAction(current.id, target.id, selectedAction);
          }
      } 
      // Bewegung
      else if (!target && !selectedAction) {
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
              turnResources: { hasAction: true, hasBonusAction: true, movementLeft: 6 },
              log: [...prev.log, `--- ${nextCombatant.name} ---`]
          };
      });
  }, []);

  // --- KI LOGIK ---
  useEffect(() => {
    const state = combatState;
    if (!state.isActive || state.result) return;

    const currentC = state.combatants[state.turnIndex];

    if (currentC && currentC.type === 'enemy' && currentC.hp > 0 && !processingTurn.current) {
        
        processingTurn.current = true;
        console.log(`[KI] ${currentC.name} am Zug...`);

        const timer = setTimeout(() => {
            try {
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
                        if (Math.abs(dx) >= Math.abs(dy)) newX += Math.sign(dx);
                        else newY += Math.sign(dy);

                        const occupied = freshState.combatants.some(c => c.x === newX && c.y === newY && c.hp > 0);
                        if (!occupied) {
                            setCombatState(prev => ({
                                ...prev,
                                combatants: prev.combatants.map(c => c.id === currentC.id ? { ...c, x: newX, y: newY } : c)
                            }));
                        }
                    }
                    
                    // 2. Angreifen
                    // Wir tun so, als hätten wir uns bewegt (Simple KI Logik für sofortigen Schlag)
                    // Checke Distanz erneut (oder nutze vereinfachte Logik: wenn wir nah genug waren oder bewegt haben)
                    
                    // Lade Aktion
                    const actionTemplate = (currentC.actions && currentC.actions[0]) || { name: 'Angriff', damage: '1d4' };
                    
                    performAction(currentC.id, player.id, {
                        type: 'weapon',
                        name: actionTemplate.name,
                        damage: actionTemplate.damage, // Objekt übergeben!
                        attackBonus: actionTemplate.attack_bonus || 4
                    });
                }
            } catch (error) {
                console.error("[KI ERROR]", error);
            } finally {
                setTimeout(() => nextTurn(), 800);
            }
        }, 1000);

        return () => clearTimeout(timer);
    }
  }, [combatState.turnIndex, nextTurn, performAction]); 

  return {
    combatState, startCombat, nextTurn, endCombatSession: () => {},
    selectedAction, setSelectedAction, handleCombatTileClick
  };
};