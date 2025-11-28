// src/hooks/useCombat.js
import { useState, useCallback, useEffect, useRef } from 'react';
import { getAbilityModifier, calculateSpellAttackBonus, calculateSpellSaveDC, getProficiencyBonus } from '../engine/rulesEngine';
import { rollDiceString, d } from '../utils/dice';

// --- HELPER FUNCTIONS ---

const getDistance = (p1, p2) => Math.max(Math.abs(p1.x - p2.x), Math.abs(p1.y - p2.y));

const normalizeDice = (diceString) => {
    if (!diceString) return "1d4";
    return diceString.replace(/W/gi, 'd').replace(/\s/g, ''); 
};

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

const calculateMoveTiles = (speedString) => {
    if (!speedString) return 6; 
    const meters = parseInt(speedString);
    if (isNaN(meters)) return 6;
    return Math.floor(meters / 1.5);
};

// Helper: Berechnet Cantrip-Würfel basierend auf sauberer Scaling-Tabelle
const getCantripDice = (level, scaling) => {
    if (!scaling || !scaling.dice_at_levels) return null;
    const levels = Object.keys(scaling.dice_at_levels).map(Number).sort((a, b) => b - a);
    for (const l of levels) {
        if (level >= l) return scaling.dice_at_levels[l];
    }
    return scaling.dice_at_levels["1"]; // Fallback auf Level 1
};

const calculateWeaponRange = (action) => {
    if (!action) return 1; 
    
    if (action.range_m) {
        return Math.floor(action.range_m / 1.5);
    }

    const source = action.item || action;
    const props = source.properties || [];
    if (props.includes("Reichweite")) return 2; 

    if (source.range) {
        if (typeof source.range === 'string' && source.range.toLowerCase().includes('berührung')) return 1;
        const rangeMeters = parseInt(source.range.split('/')[0]);
        if (!isNaN(rangeMeters)) return Math.floor(rangeMeters / 1.5);
    }
    
    if (action.reach) {
        const reachVal = parseFloat(action.reach.replace(',', '.'));
        if (!isNaN(reachVal)) return Math.max(1, Math.floor(reachVal / 1.5));
    }

    return 1; 
};

// +++ NEU: Übersetzung für Schadensarten +++
const damageTypeMap = {
    acid: "Säure",
    bludgeoning: "Wucht",
    cold: "Kälte",
    fire: "Feuer",
    force: "Energie",
    lightning: "Blitz",
    necrotic: "Nekrotisch",
    piercing: "Stich",
    poison: "Gift",
    psychic: "Psychisch",
    radiant: "Gleißend",
    slashing: "Hieb",
    thunder: "Donner",
    healing: "Heilung"
};

// --- HOOK ---

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

  // --- START COMBAT ---
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

  // --- END COMBAT ---
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
      
      if (!attacker || !target) return prev;

      // 1. REICHWEITE PRÜFEN
      const dist = getDistance(attacker, target);
      const allowedRange = calculateWeaponRange(action);

      if (dist > allowedRange) {
          return { ...prev, log: [...prev.log, `❌ ${attacker.name}: Ziel zu weit entfernt!`] };
      }

      console.log(`⚡ ACTION: ${attacker.name} uses ${action.name} on ${target.name}`);

      let logEntry = '';
      let damage = 0;
      let heal = 0;
      let hitSuccess = false;
      let isCritical = false;
      let halfDamage = false; 

      // ---------------------------------------------------------
      // FALL A: ZAUBER (Basierend auf sauberen 'effects')
      // ---------------------------------------------------------
      if (action.effects && action.effects.length > 0) {
          const effect = action.effects.find(e => e.type === "DAMAGE" || e.type === "HEALING");
          
          if (effect) {
              // 1. ANGRIFFSWURF
              if (effect.attack_roll && effect.attack_roll !== 'auto') {
                  const spellAttackBonus = (attacker.type === 'player') 
                      ? calculateSpellAttackBonus(playerCharacter) 
                      : (attacker.attack_bonus || 4);

                  const d20 = d(20);
                  const totalRoll = d20 + spellAttackBonus;
                  isCritical = d20 === 20;

                  console.log(`🪄 Spell Attack: D20(${d20}) + ${spellAttackBonus} = ${totalRoll} vs AC ${target.ac}`);

                  if (totalRoll >= target.ac || isCritical) {
                      hitSuccess = true;
                      // Log wird unten überschrieben mit Details
                  } else {
                      logEntry = `💨 ${attacker.name} verfehlt mit ${action.name}.`;
                  }
              }
              // 2. RETTUNGSWURF
              else if (effect.saving_throw) {
                  const saveDC = (attacker.type === 'player') 
                      ? calculateSpellSaveDC(playerCharacter)
                      : (attacker.save_dc || 12);

                  const abilityKey = effect.saving_throw.ability.toLowerCase().substring(0, 3);
                  const saveMod = getAbilityModifier(target.stats?.[abilityKey] || 10);
                  const saveRoll = d(20) + saveMod;

                  console.log(`🛡️ Save (${abilityKey}): Rolled ${saveRoll} vs DC ${saveDC}`);

                  if (saveRoll < saveDC) {
                      hitSuccess = true;
                      // Log wird unten überschrieben
                  } else {
                      if (effect.saving_throw.effect_on_success === 'half') {
                          hitSuccess = true;
                          halfDamage = true;
                      } else {
                          logEntry = `🛡️ ${target.name} weicht ${action.name} aus.`;
                      }
                  }
              }
              // 3. AUTO HIT
              else if (effect.attack_roll === 'auto') {
                  hitSuccess = true;
              }

              // SCHADEN & LOG-FORMATIERUNG
              if (hitSuccess && effect.damage) {
                  let diceString = effect.damage.dice;

                  // Skalierung anwenden (Cantrip)
                  if (effect.scaling && effect.scaling.type === "CANTRIP" && attacker.type === 'player') {
                      const scaled = getCantripDice(playerCharacter.level, effect.scaling);
                      if (scaled) diceString = scaled;
                  }

                  let rollVal = extractDamageValue(rollDiceString(normalizeDice(diceString)));
                  
                  // Modifikator addieren
                  if (effect.add_modifier && attacker.type === 'player') {
                      rollVal += calculateSpellAttackBonus(playerCharacter) - getProficiencyBonus(playerCharacter.level); 
                  }

                  // Kritischer Treffer
                  if (isCritical && effect.attack_roll) {
                      rollVal += extractDamageValue(rollDiceString(normalizeDice(diceString)));
                  }

                  let finalVal = rollVal;
                  if (halfDamage) {
                      finalVal = Math.floor(rollVal / 2);
                  }

                  if (effect.type === 'HEALING') {
                      heal = finalVal;
                      logEntry = `${attacker.name} würfelt ${diceString} (${rollVal}) und heilt ${target.name} um ${heal} TP.`;
                  } else {
                      damage = finalVal;
                      
                      // Übersetzung der Schadensart
                      const typeKey = effect.damage.type.toLowerCase();
                      const dmgTypeDE = damageTypeMap[typeKey] || typeKey; // Fallback auf englisch, falls nicht in Map

                      // +++ DAS GEWÜNSCHTE LOG FORMAT +++
                      if (halfDamage) {
                          logEntry = `${target.name} besteht RW. ${attacker.name} würfelt ${diceString} (${rollVal}) und fügt mit ${action.name} ${target.name} ${damage} ${dmgTypeDE}schaden zu (halbiert).`;
                      } else {
                          logEntry = `${attacker.name} würfelt ${diceString} (${rollVal}) und fügt mit ${action.name} ${target.name} ${damage} ${dmgTypeDE}schaden zu.`;
                      }

                      if (isCritical) logEntry += " (KRITISCH!)";
                  }
              }
          }
      }
      
      // ---------------------------------------------------------
      // FALL B: WAFFE (Fallback)
      // ---------------------------------------------------------
      else if (!action.effects && action.type !== 'spell') {
          const d20 = d(20);
          const attackBonus = action.attackBonus || 5; 
          const totalRoll = d20 + attackBonus;
          isCritical = d20 === 20;
          
          if (totalRoll >= target.ac || isCritical) {
              hitSuccess = true;
              let diceString = "1d4";
              if (action.item && action.item.damage) diceString = action.item.damage; 
              else if (action.damage && action.damage.dice) diceString = action.damage.dice; 
              else if (typeof action.damage === 'string') diceString = action.damage;

              const cleanDice = normalizeDice(diceString);
              damage = extractDamageValue(rollDiceString(cleanDice));

              if (isCritical) {
                  damage += extractDamageValue(rollDiceString(cleanDice));
              }
              if (action.damage && action.damage.bonus) damage += Number(action.damage.bonus);

              // Standard Waffen-Log (könnte man auch anpassen, wenn gewünscht)
              logEntry = `${attacker.name} trifft ${target.name} mit ${action.name} (${damage} Schaden).`;
              if (isCritical) logEntry += " (KRIT!)";

          } else {
              logEntry = `💨 ${attacker.name} verfehlt mit ${action.name}.`;
          }
      }

      // ---------------------------------------------------------
      // VERARBEITUNG
      // ---------------------------------------------------------
      const newCombatants = prev.combatants.map(c => {
          if (c.id === targetId) {
              const newHp = Math.max(0, Math.min(c.maxHp, c.hp - damage + heal));
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
  }, [playerCharacter]);

  // --- CLICK HANDLER ---
  const handleCombatTileClick = useCallback((x, y) => {
      const state = stateRef.current;
      if (!state.isActive || state.result) return;

      const current = state.combatants[state.turnIndex];
      if (current.type !== 'player') return;

      const target = state.combatants.find(c => c.x === x && c.y === y && c.hp > 0);

      if (target && target.type === 'enemy') {
          if (selectedAction && state.turnResources.hasAction) {
              const dist = getDistance(current, target);
              const allowedRange = calculateWeaponRange(selectedAction);
              
              if (dist <= allowedRange) {
                  performAction(current.id, target.id, selectedAction);
              } else {
                  setCombatState(prev => ({...prev, log: [...prev.log, `⚠️ Zu weit weg!`]}))
              }
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
              turnResources: { hasAction: true, hasBonusAction: true, movementLeft: calculateMoveTiles(nextCombatant.speed) },
              log: [...prev.log, `--- Runde ${nextRound}: ${nextCombatant.name} ---`]
          };
      });
  }, []);

  // KI
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
                        setCombatState(prev => ({
                            ...prev,
                            combatants: prev.combatants.map(c => c.id === currentC.id ? { ...c, x: currentX, y: currentY } : c),
                            log: [...prev.log, `${currentC.name} bewegt sich.`]
                        }));
                        await new Promise(r => setTimeout(r, 600)); 
                    }
                    const finalDistToPlayer = getDistance({x: currentX, y: currentY}, player);
                    if (finalDistToPlayer <= attackRange) {
                        performAction(currentC.id, player.id, {
                            ...actionTemplate,
                            type: 'weapon', 
                            range: actionTemplate.range, 
                            reach: actionTemplate.reach
                        });
                    }
                }
            } catch (error) {
                console.error("AI Error", error);
            } finally {
                if (!stateRef.current.result) setTimeout(() => nextTurn(), 800);
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