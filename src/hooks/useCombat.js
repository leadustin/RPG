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
    // Ressourcen für den aktuellen Zug
    turnResources: {
      hasAction: true,
      hasBonusAction: true,
      movementLeft: 0 
    }
  });

  // --- INITIIERUNG ---
  const startCombat = useCallback((enemies) => {
    // 1. Spieler-Token erstellen
    const playerToken = {
      id: 'player',
      type: 'player',
      name: playerCharacter.name,
      hp: playerCharacter.hp,
      maxHp: playerCharacter.stats.maxHp || 20,
      ac: playerCharacter.stats.ac || 10,
      initiativeBonus: getAbilityModifier(playerCharacter.stats.dex),
      speed: 30, // Standard 30ft
      position: { x: 1, y: 5 },
      initiative: 0,
      data: playerCharacter
    };

    // 2. Gegner-Tokens erstellen
    const enemyTokens = enemies.map((enemyData, index) => ({
      id: `enemy-${index}`,
      type: 'enemy',
      name: `${enemyData.name} ${index + 1}`,
      hp: enemyData.hp.average,
      maxHp: enemyData.hp.average,
      ac: enemyData.ac,
      initiativeBonus: getAbilityModifier(enemyData.stats.dex),
      speed: 30, // Vereinfacht 30ft
      position: { x: 8, y: 2 + index * 2 },
      initiative: 0,
      data: enemyData
    }));

    const allCombatants = [playerToken, ...enemyTokens];

    // 3. Initiative rollen
    allCombatants.forEach(c => {
      c.initiative = d(20) + c.initiativeBonus;
    });

    // 4. Sortieren (Höchste Initiative zuerst)
    allCombatants.sort((a, b) => b.initiative - a.initiative);

    const firstCombatant = allCombatants[0];

    setCombatState({
      isActive: true,
      round: 1,
      turnIndex: 0,
      combatants: allCombatants,
      log: [`Kampf gestartet! Initiative: ${allCombatants.map(c => `${c.name} (${c.initiative})`).join(', ')}`],
      turnResources: {
        hasAction: true,
        hasBonusAction: true,
        movementLeft: firstCombatant.speed
      }
    });
  }, [playerCharacter]);

  // --- RUNDENLOGIK ---
  const nextTurn = useCallback(() => {
    setCombatState(prev => {
      let nextIndex = prev.turnIndex + 1;
      let nextRound = prev.round;

      if (nextIndex >= prev.combatants.length) {
        nextIndex = 0;
        nextRound++;
      }

      // Tote überspringen
      while (prev.combatants[nextIndex].hp <= 0) {
        nextIndex++;
        if (nextIndex >= prev.combatants.length) {
          nextIndex = 0;
          nextRound++;
        }
        // Sicherheitsabbruch, falls alle tot sind
        if (prev.combatants.every(c => c.hp <= 0)) break; 
      }

      const nextCombatant = prev.combatants[nextIndex];

      return {
        ...prev,
        turnIndex: nextIndex,
        round: nextRound,
        log: [...prev.log, `--- Runde ${nextRound}, Zug: ${nextCombatant.name} ---`],
        // Ressourcen zurücksetzen für den neuen Charakter am Zug
        turnResources: {
          hasAction: true,
          hasBonusAction: true,
          movementLeft: nextCombatant.speed || 30
        }
      };
    });
  }, []);

  // --- AKTIONEN ---

  // Bewegung
  const moveCombatant = (id, targetPos) => {
    setCombatState(prev => {
      const activeC = prev.combatants[prev.turnIndex];
      // Sicherheitscheck: Ist der Handelnde dran?
      if (activeC.id !== id) return prev;

      // Distanz berechnen (Chebyshev für Grid: max(dx, dy) * 5ft)
      const dx = Math.abs(activeC.position.x - targetPos.x);
      const dy = Math.abs(activeC.position.y - targetPos.y);
      const distanceTiles = Math.max(dx, dy); 
      const cost = distanceTiles * 5; // 5ft pro Feld

      // Ressourcen-Check
      if (cost > prev.turnResources.movementLeft) {
        // Optional: Log Eintrag "Nicht genug Bewegung"
        return prev;
      }

      const newCombatants = prev.combatants.map(c => {
        if (c.id === id) return { ...c, position: targetPos };
        return c;
      });

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

  // Angriff
  const attack = (attackerId, targetId, weapon = null) => {
    setCombatState(prev => {
      // Ressourcen-Check: Hat der Charakter noch eine Aktion?
      if (!prev.turnResources.hasAction) {
        return { ...prev, log: [...prev.log, "⚠️ Keine Aktion mehr übrig!"] };
      }

      const attacker = prev.combatants.find(c => c.id === attackerId);
      const target = prev.combatants.find(c => c.id === targetId);
      
      if (!attacker || !target) return prev;

      // 1. Werte berechnen
      // Angriffsbonus (aus Waffe oder Standard +2)
      const attackBonus = weapon ? (weapon.attackBonus || 0) : 2; 
      // Attributsmodifikator (hier vereinfacht STR für alles, später DEX für Fernkampf)
      const statMod = getAbilityModifier(attacker.data.stats?.str || 10);
      
      const d20Roll = d(20);
      const totalAttack = d20Roll + attackBonus + statMod;
      
      let logEntry = `${attacker.name} greift ${target.name} an: `;
      let damage = 0;

      // Kritischer Treffer? (Natürliche 20)
      const isCrit = d20Roll === 20;

      if (isCrit || totalAttack >= target.ac) {
        // 2. Schaden würfeln
        // Standard: 1d4 + Mod (Waffenlos) oder Waffenschaden + Mod
        const damageDice = weapon ? weapon.damage : "1d4"; // z.B. "1d8"
        
        // Normaler Schaden
        let dmgResult = rollDiceString(damageDice);
        damage = dmgResult.total + statMod;

        // Bei Crit: Würfel verdoppeln (einfachste 5e Regel: Würfel 2x rollen)
        if (isCrit) {
            const critRoll = rollDiceString(damageDice);
            damage += critRoll.total;
            logEntry += `💥 KRITISCHER TREFFER! (${d20Roll} + ${attackBonus + statMod}) `;
            logEntry += `Schaden: ${dmgResult.breakdown} + ${critRoll.breakdown} + ${statMod} (Mod) = ${damage} ${weapon?.type || 'Wucht'}.`;
        } else {
            logEntry += `Treffer! (${d20Roll} + ${attackBonus + statMod} vs AC ${target.ac}) `;
            logEntry += `Schaden: ${dmgResult.breakdown} + ${statMod} (Mod) = ${damage} ${weapon?.type || 'Wucht'}.`;
        }

      } else {
        logEntry += `Verfehlt. (${d20Roll} + ${attackBonus + statMod} vs AC ${target.ac})`;
      }

      // Schaden anwenden (nicht unter 0 fallen)
      const newCombatants = prev.combatants.map(c => {
        if (c.id === targetId) {
          return { ...c, hp: Math.max(0, c.hp - damage) };
        }
        return c;
      });

      // Tod prüfen
      if (newCombatants.find(c => c.id === targetId).hp === 0) {
        logEntry += ` 💀 ${target.name} wurde besiegt!`;
      }

      return {
        ...prev,
        combatants: newCombatants,
        log: [...prev.log, logEntry],
        turnResources: {
          ...prev.turnResources,
          hasAction: false // Aktion verbraucht
        }
      };
    });
  };

  // Dash (Sprinten)
  const dash = () => {
    setCombatState(prev => {
        if (!prev.turnResources.hasAction) {
            return { ...prev, log: [...prev.log, "⚠️ Keine Aktion für Dash übrig!"] };
        }
        
        const activeC = prev.combatants[prev.turnIndex];
        
        return {
            ...prev,
            log: [...prev.log, `${activeC.name} sprintet!`],
            turnResources: {
                ...prev.turnResources,
                hasAction: false,
                movementLeft: prev.turnResources.movementLeft + (activeC.speed || 30)
            }
        }
    });
  };

  // --- KI LOGIK ---
  useEffect(() => {
    if (!combatState.isActive) return;

    const currentCombatant = combatState.combatants[combatState.turnIndex];
    
    // Wenn KI am Zug ist (Typ 'enemy')
    if (currentCombatant && currentCombatant.type === 'enemy' && currentCombatant.hp > 0) {
      // Kurze Verzögerung für "Denkzeit"
      const timer = setTimeout(() => {
        // 1. Ziel finden (Spieler)
        const player = combatState.combatants.find(c => c.type === 'player');
        
        if (player && player.hp > 0) {
          // Sehr simple KI: 
          // 1. Nahkampf-Angriff versuchen
          // 2. Wenn zu weit weg, bewegen (hier simuliert durch Teleport im Prototyp, 
          //    in echter Logik müsste moveCombatant schrittweise aufgerufen werden)
          
          // Wir nutzen hier direkt attack, da wir keine komplexe Pfadfindung haben
          // Die KI nutzt eine Standard-Waffe aus ihren Daten (siehe enemies.json actions)
          
          // Versuche eine Waffe aus den 'actions' zu holen, falls vorhanden
          let kiWeapon = null;
          if (currentCombatant.data.actions && currentCombatant.data.actions.length > 0) {
              const action = currentCombatant.data.actions[0]; // Nimm erste Aktion (meist Nahkampf)
              kiWeapon = {
                  name: action.name,
                  damage: action.damage.dice, // z.B. "1W6 + 2" -> Muss evtl. angepasst werden wenn "W" statt "d"
                  attackBonus: action.attack_bonus
              };
              // Kleiner Fix für deutsche Würfelnotation W -> d
              if (kiWeapon.damage) kiWeapon.damage = kiWeapon.damage.replace('W', 'd');
          }

          attack(currentCombatant.id, player.id, kiWeapon);
        }
        
        // Zug beenden
        nextTurn();
      }, 1500); // 1.5 Sekunden Verzögerung
      return () => clearTimeout(timer);
    }
  }, [combatState.turnIndex, combatState.isActive, combatState.combatants, nextTurn]); // Abhängigkeiten

  return {
    combatState,
    startCombat,
    nextTurn,
    moveCombatant,
    attack,
    dash
  };
};