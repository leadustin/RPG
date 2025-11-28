// src/hooks/useCombat.js
import { useState, useCallback, useEffect, useRef } from 'react';
import { getAbilityModifier, calculateSpellAttackBonus, calculateSpellSaveDC } from '../engine/rulesEngine';
import { rollDiceString, d } from '../utils/dice';

// Distanzberechnung
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

// Helper: Wandelt "9m" in Anzahl Felder um (1 Feld = 1.5m)
const calculateMoveTiles = (speedString) => {
    if (!speedString) return 6; 
    const meters = parseInt(speedString);
    if (isNaN(meters)) return 6;
    return Math.floor(meters / 1.5);
};

// +++ NEU: Helper für Zauberschaden-Skalierung (Cantrips) +++
const getScaledCantripDamage = (characterLevel, scalingData) => {
    if (!scalingData || scalingData.type !== 'CANTRIP') return null;
    
    // Sortiere Level absteigend (17, 11, 5, 1)
    const levels = Object.keys(scalingData.dice_at_levels)
        .map(Number)
        .sort((a, b) => b - a);
        
    for (const level of levels) {
        if (characterLevel >= level) {
            return scalingData.dice_at_levels[level];
        }
    }
    return "1d4"; // Fallback
};

// +++Robustere Reichweiten-Berechnung +++
const calculateWeaponRange = (action) => {
    if (!action) return 1; 

    // Wir schauen entweder direkt in die Action oder in das eingebettete Item (Spieler-Waffen)
    const source = action.item || action;

    // 1. Prüfe auf "Reichweite" (Reach) Eigenschaft
    const props = source.properties || [];
    if (props.includes("Reichweite")) {
        return 2; // 3m = 2 Felder
    }

    // 2. Explizite Range (z.B. "24/96" für Bogen)
    if (source.range) {
        // Nimm die erste Zahl vor dem Schrägstrich
        const rangeMeters = parseInt(source.range.split('/')[0]);
        if (!isNaN(rangeMeters)) {
            return Math.floor(rangeMeters / 1.5);
        }
    }

    // 3. Enemy "reach" String (z.B. "1,5m" - meist direkt an der Action definiert)
    if (action.reach) {
        const reachVal = parseFloat(action.reach.replace(',', '.'));
        if (!isNaN(reachVal)) {
            return Math.max(1, Math.floor(reachVal / 1.5));
        }
    }

    // 4. Fallback
    return 1; 
};

export const useCombat = (playerCharacter) => {
  const initialState = {
    isActive: false,
    round: 0,
    turnIndex: 0,
    combatants: [],
    log: [],
    turnResources: { hasAction: true, hasBonusAction: true, movementLeft: 6 },
    result: null
  };

  const [combatState, setCombatState] = useState(initialState);
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
    
    const playerInit = d(20) + getAbilityModifier(stats.abilities?.dex || 10);

    const playerCombatant = {
      id: playerCharacter.id || 'player',
      type: 'player',
      name: playerCharacter.name || 'Held',
      hp: startHp,
      maxHp: maxHp,
      ac: stats.armor_class || 12,
      initiative: playerInit,
      x: 2, y: 4, speed: 6, color: 'blue',
      icon: playerCharacter.icon
    };

    const enemyCombatants = enemies.map((e, i) => {
        let hpValue = 10;
        if (typeof e.hp === 'number') hpValue = e.hp;
        else if (e.hp && (e.hp.average || e.hp.max)) hpValue = e.hp.average || e.hp.max;

        const dex = e.stats?.dex || 10;
        const initMod = getAbilityModifier(dex);

        return {
            ...e, 
            id: e.instanceId || `enemy_${i}_${Date.now()}`,
            type: 'enemy',
            name: e.name || `Gegner ${i+1}`,
            initiative: d(20) + (e.initBonus || initMod),
            hp: hpValue,
            maxHp: hpValue,
            speed: e.speed || "9m", 
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

  // --- END SESSION ---
  const endCombatSession = useCallback(() => {
      console.log("🏳️ Combat Session Ended");
      setCombatState(initialState);
      setSelectedAction(null);
      processingTurn.current = false;
  }, []);

  // --- PERFORM ACTION ---
  const performAction = useCallback((attackerId, targetId, action) => {
    setCombatState(prev => {
      const attacker = prev.combatants.find(c => c.id === attackerId);
      const target = prev.combatants.find(c => c.id === targetId);
      
      if (!attacker || !target) return prev; // Fehler: Teilnehmer nicht gefunden

      // 1. REICHWEITE PRÜFEN
      const dist = getDistance(attacker, target);
      const allowedRange = calculateWeaponRange(action); 

      // Wir erlauben eine kleine Toleranz für Zauber-Reichweiten, da die oft sehr groß sind
      if (dist > allowedRange) {
          return { ...prev, log: [...prev.log, `❌ ${attacker.name}: Ziel zu weit entfernt! (${dist}/${allowedRange})`] };
      }

      console.log(`⚡ ACTION: ${attacker.name} uses ${action.name} on ${target.name}`);

      let logEntry = '';
      let damage = 0;
      let hitSuccess = false;
      let isCritical = false;

      // ---------------------------------------------------------
      // FALL A: ZAUBER (Magie)
      // ---------------------------------------------------------
      if (action.uiType && (action.uiType.includes("Zauber") || action.uiType === "Zaubertrick")) {
          
          // Daten aus action.effects holen (Struktur aus spells.json)
          const effect = action.effects ? action.effects.find(e => e.type === "DAMAGE") : null;
          
          // Fall 1: Angriffswurf (z.B. Feuerpfeil)
          if (effect && effect.attack_roll) {
              const spellAttackBonus = (attacker.type === 'player') 
                  ? calculateSpellAttackBonus(playerCharacter) 
                  : (attacker.attack_bonus || 4); // Einfacher Bonus für Monster

              const d20 = d(20);
              const totalRoll = d20 + spellAttackBonus;
              isCritical = d20 === 20;

              console.log(`🪄 Spell Attack: D20(${d20}) + ${spellAttackBonus} = ${totalRoll} vs AC ${target.ac}`);

              if (totalRoll >= target.ac || isCritical) {
                  hitSuccess = true;
                  logEntry = `🪄 ${attacker.name} trifft mit ${action.name}!`;
              } else {
                  logEntry = `💨 ${attacker.name} verfehlt mit ${action.name}.`;
              }
          } 
          
          // Fall 2: Rettungswurf (z.B. Heilige Flamme)
          else if (effect && effect.saving_throw) {
              const saveDC = (attacker.type === 'player') 
                  ? calculateSpellSaveDC(playerCharacter)
                  : (attacker.save_dc || 12); // Fallback für Monster

              // Gegner würfelt Save
              const abilityKey = effect.saving_throw.ability?.toLowerCase().substring(0, 3); // "dexterity" -> "dex"
              const saveMod = getAbilityModifier(target.stats?.[abilityKey] || 10);
              const saveRoll = d(20) + saveMod;

              console.log(`🛡️ Saving Throw (${abilityKey}): Rolled ${saveRoll} vs DC ${saveDC}`);

              if (saveRoll < saveDC) {
                  hitSuccess = true;
                  logEntry = `🔥 ${target.name} scheitert beim Rettungswurf!`;
              } else {
                  logEntry = `🛡️ ${target.name} weicht dem Zauber aus.`;
                  // Manche Zauber machen halben Schaden bei Erfolg, hier vereinfacht: kein Schaden
              }
          }

          // SCHADEN BERECHNEN (Wenn getroffen)
          if (hitSuccess && effect) {
              let diceString = effect.damage.dice;

              // Skalierung für Cantrips prüfen
              if (effect.scaling && effect.scaling.type === "CANTRIP" && attacker.type === 'player') {
                  const scaledDice = getScaledCantripDamage(playerCharacter.level, effect.scaling);
                  if (scaledDice) diceString = scaledDice;
              }

              // Kritischer Treffer verdoppelt Würfel (nur bei Angriffswürfen!)
              if (isCritical && effect.attack_roll) {
                  // Sehr vereinfacht: Wir verdoppeln einfach das Ergebnis oder die Würfelanzahl
                  // Hier: String parsen wäre sauberer, aber für jetzt rollen wir 2x
                  const dmg1 = extractDamageValue(rollDiceString(normalizeDice(diceString)));
                  const dmg2 = extractDamageValue(rollDiceString(normalizeDice(diceString)));
                  damage = dmg1 + dmg2;
                  logEntry += " (KRITISCH!)";
              } else {
                  damage = extractDamageValue(rollDiceString(normalizeDice(diceString)));
              }
          }

      } 
      // ---------------------------------------------------------
      // FALL B: WAFFE (Physisch)
      // ---------------------------------------------------------
      else {
          const d20 = d(20);
          const attackBonus = action.attackBonus || 5; 
          const totalRoll = d20 + attackBonus;
          isCritical = d20 === 20;
          
          console.log(`⚔️ Weapon Attack: D20(${d20}) + ${attackBonus} = ${totalRoll} vs AC ${target.ac}`);

          if (totalRoll >= target.ac || isCritical) {
              hitSuccess = true;
              
              let diceString = "1d4";
              if (action.item && action.item.damage) diceString = action.item.damage; 
              else if (action.damage && action.damage.dice) diceString = action.damage.dice; 
              else if (typeof action.damage === 'string') diceString = action.damage;

              const cleanDice = normalizeDice(diceString);
              damage = extractDamageValue(rollDiceString(cleanDice));

              if (isCritical) {
                  damage += extractDamageValue(rollDiceString(cleanDice)); // Krit: Würfel nochmal
                  logEntry = `⚔️ KRITISCHER TREFFER! ${attacker.name} trifft ${target.name}`;
              } else {
                  logEntry = `⚔️ ${attacker.name} trifft ${target.name}`;
              }

              // Stat-Bonus auf Schaden (nur bei Waffen üblich)
              if (action.damage && action.damage.bonus) damage += Number(action.damage.bonus);
          } else {
              logEntry = `💨 ${attacker.name} verfehlt mit der Waffe.`;
          }
      }

      // ---------------------------------------------------------
      // SCHADENSVERARBEITUNG & STATUS
      // ---------------------------------------------------------
      
      if (hitSuccess && damage > 0) {
          logEntry += ` für ${damage} Schaden.`;
      }

      const newCombatants = prev.combatants.map(c => {
          if (c.id === targetId) {
              const safeDamage = isNaN(damage) ? 0 : damage;
              const newHp = Math.max(0, c.hp - safeDamage);
              console.log(`🩸 ${c.name} HP: ${c.hp} -> ${newHp}`);
              if (newHp === 0) {
                  logEntry += ` 💀 ${c.name} besiegt!`;
              }
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
  }, [playerCharacter]);

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
              const dist = getDistance(current, target);
              const allowedRange = calculateWeaponRange(selectedAction);
              
              if (dist <= allowedRange) {
                  performAction(current.id, target.id, selectedAction);
              } else {
                  console.log(`⚠️ Ziel zu weit weg. Dist: ${dist}, Max: ${allowedRange}`);
                  setCombatState(prev => ({
                      ...prev,
                      log: [...prev.log, `⚠️ Zu weit weg! (${dist} Felder)`]
                  }));
              }
          }
      } 
      // Bewegung
      else if (!target && !selectedAction) {
          const dist = getDistance(current, {x, y});
          if (dist <= state.turnResources.movementLeft) {
              console.log(`🏃 Player Move: (${current.x},${current.y}) -> (${x},${y})`);
              setCombatState(prev => ({
                  ...prev,
                  combatants: prev.combatants.map(c => c.id === current.id ? { ...c, x, y } : c),
                  turnResources: { ...prev.turnResources, movementLeft: prev.turnResources.movementLeft - dist }
              }));
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
          
          console.log(`🔄 ROUND ${nextRound} | Turn: ${nextCombatant.name}`);

          return {
              ...prev,
              turnIndex: nextIndex,
              round: nextRound,
              turnResources: { 
                  hasAction: true, 
                  hasBonusAction: true, 
                  movementLeft: calculateMoveTiles(nextCombatant.speed) 
              },
              log: [...prev.log, `--- Runde ${nextRound}: ${nextCombatant.name} ---`]
          };
      });
  }, []);

  // --- KI LOGIK ---
  useEffect(() => {
    const state = combatState;
    if (!state.isActive || state.result) return;

    const currentC = state.combatants[state.turnIndex];

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
                // Denkpause vor Zugbeginn
                await new Promise(r => setTimeout(r, 800));
                
                let freshState = stateRef.current;
                if (!freshState.isActive || freshState.result) return;
                
                const player = freshState.combatants.find(c => c.type === 'player');
                
                if (player && player.hp > 0) {
                    let currentX = currentC.x;
                    let currentY = currentC.y;
                    
                    const actionTemplate = (currentC.actions && currentC.actions[0]) || { name: 'Angriff', damage: '1d4' };
                    const attackRange = calculateWeaponRange(actionTemplate);

                    let distToPlayer = getDistance({x: currentX, y: currentY}, player);
                    
                    // --- 1. BEWEGUNG ---
                    const maxMoves = calculateMoveTiles(currentC.speed);
                    let movesLeft = maxMoves;
                    let hasMoved = false;

                    while (movesLeft > 0 && distToPlayer > attackRange) {
                        let bestX = currentX;
                        let bestY = currentY;
                        let minNewDist = distToPlayer;

                        for (let dx = -1; dx <= 1; dx++) {
                            for (let dy = -1; dy <= 1; dy++) {
                                if (dx === 0 && dy === 0) continue; 

                                const nextX = currentX + dx;
                                const nextY = currentY + dy;
                                
                                const isOccupied = freshState.combatants.some(c => c.x === nextX && c.y === nextY && c.hp > 0);
                                if (!isOccupied) {
                                    const distFromNext = getDistance({x: nextX, y: nextY}, player);
                                    if (distFromNext < minNewDist) {
                                        minNewDist = distFromNext;
                                        bestX = nextX;
                                        bestY = nextY;
                                    }
                                }
                            }
                        }

                        if (bestX !== currentX || bestY !== currentY) {
                            currentX = bestX;
                            currentY = bestY;
                            movesLeft--;
                            hasMoved = true;
                            distToPlayer = minNewDist; 
                        } else {
                            break;
                        }
                    }

                    if (hasMoved) {
                        console.log(`🤖 AI MOVES: ${currentC.name} to (${currentX}, ${currentY})`);
                        setCombatState(prev => ({
                            ...prev,
                            combatants: prev.combatants.map(c => c.id === currentC.id ? { ...c, x: currentX, y: currentY } : c),
                            log: [...prev.log, `${currentC.name} bewegt sich.`]
                        }));
                        // WARTEN: Hier auf 600ms erhöht, damit die CSS Transition (400ms) fertig ist
                        await new Promise(r => setTimeout(r, 600)); 
                    }
                    
                    // --- 2. ANGRIFF ---
                    const finalDistToPlayer = getDistance({x: currentX, y: currentY}, player);
                    
                    if (finalDistToPlayer <= attackRange) {
                        performAction(currentC.id, player.id, {
                            ...actionTemplate,
                            type: 'weapon',
                            range: actionTemplate.range, 
                            reach: actionTemplate.reach
                        });
                    } else {
                        console.log(`🤖 AI WAIT: Player too far (${finalDistToPlayer} > ${attackRange}).`);
                    }
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
    combatState, startCombat, nextTurn, endCombatSession,
    selectedAction, setSelectedAction, handleCombatTileClick
  };
};