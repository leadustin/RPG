// src/hooks/useCombat.js
import { useState, useCallback, useEffect } from 'react';
import { getAbilityModifier } from '../engine/rulesEngine';

// Würfel-Helper
const d20 = () => Math.floor(Math.random() * 20) + 1;

export const useCombat = (playerCharacter, initialEnemies = []) => {
  const [combatState, setCombatState] = useState({
    isActive: false,
    round: 0,
    turnIndex: 0,
    combatants: [], // Array mit Spieler und Gegnern
    log: []
  });

  // --- INITIIERUNG ---
  const startCombat = useCallback((enemies) => {
    // 1. Spieler-Token erstellen
    const playerToken = {
      id: 'player',
      type: 'player',
      name: playerCharacter.name,
      hp: playerCharacter.hp, // Aktuelle HP
      maxHp: playerCharacter.stats.maxHp || 20, // Fallback
      ac: playerCharacter.stats.ac || 10,
      initiativeBonus: getAbilityModifier(playerCharacter.stats.dex),
      speed: 6, // 6 Felder (30ft / 5ft)
      position: { x: 1, y: 5 }, // Startposition links
      initiative: 0,
      // Referenz auf originale Daten
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
      speed: Math.floor(parseInt(enemyData.speed) / 1.5), // "9m" -> ~6 Felder (grob)
      position: { x: 8, y: 2 + index * 2 }, // Startpositionen rechts verteilt
      initiative: 0,
      data: enemyData
    }));

    const allCombatants = [playerToken, ...enemyTokens];

    // 3. Initiative rollen
    allCombatants.forEach(c => {
      c.initiative = d20() + c.initiativeBonus;
    });

    // 4. Sortieren (Höchste Initiative zuerst)
    allCombatants.sort((a, b) => b.initiative - a.initiative);

    setCombatState({
      isActive: true,
      round: 1,
      turnIndex: 0,
      combatants: allCombatants,
      log: [`Kampf gestartet! Initiative: ${allCombatants.map(c => `${c.name} (${c.initiative})`).join(', ')}`]
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

      // Überspringe tote Teilnehmer
      while (prev.combatants[nextIndex].hp <= 0) {
        nextIndex++;
        if (nextIndex >= prev.combatants.length) {
          nextIndex = 0;
          nextRound++;
        }
        // Sicherheitsabbruch, falls alle tot sind (sollte vorher geprüft werden)
        if (prev.combatants.every(c => c.hp <= 0)) break; 
      }

      return {
        ...prev,
        turnIndex: nextIndex,
        round: nextRound,
        log: [...prev.log, `Runde ${nextRound}, Zug: ${prev.combatants[nextIndex].name}`]
      };
    });
  }, []);

  // --- AKTIONEN ---
  
  // Bewegung
  const moveCombatant = (id, targetPos) => {
    setCombatState(prev => {
      const newCombatants = prev.combatants.map(c => {
        if (c.id === id) {
          // Sehr einfache Validierung: Distanz prüfen (Manhattan oder Euklid)
          // Hier simple "Teleport"-Bewegung im Radius für den Prototyp
          // In PHB 2024 kann man Bewegung aufteilen, hier erstmal ein Schritt pro Zug
          return { ...c, position: targetPos };
        }
        return c;
      });
      return { ...prev, combatants: newCombatants };
    });
  };

  // Angriff
  const attack = (attackerId, targetId, weaponOrSkill) => {
    setCombatState(prev => {
      const attacker = prev.combatants.find(c => c.id === attackerId);
      const target = prev.combatants.find(c => c.id === targetId);
      
      if (!attacker || !target) return prev;

      // Logik für Angriffswurf (d20 + Bonus)
      // Wir nehmen hier vereinfachte Werte an oder holen sie aus `data`
      const attackRoll = d20(); 
      // Bonus müsste aus `weaponOrSkill` oder `attacker.data` kommen
      const attackBonus = 5; // Placeholder
      const totalAttack = attackRoll + attackBonus;
      
      let damage = 0;
      let logEntry = `${attacker.name} greift ${target.name} an: `;

      if (totalAttack >= target.ac) {
        // Treffer!
        damage = Math.floor(Math.random() * 6) + 3; // Placeholder Schaden
        logEntry += `Treffer! (${totalAttack} vs AC ${target.ac}) für ${damage} Schaden.`;
      } else {
        logEntry += `Verfehlt. (${totalAttack} vs AC ${target.ac})`;
      }

      const newCombatants = prev.combatants.map(c => {
        if (c.id === targetId) {
          return { ...c, hp: Math.max(0, c.hp - damage) };
        }
        return c;
      });

      // Tod prüfen
      if (newCombatants.find(c => c.id === targetId).hp === 0) {
        logEntry += ` ${target.name} wurde besiegt!`;
      }

      return {
        ...prev,
        combatants: newCombatants,
        log: [...prev.log, logEntry]
      };
    });
  };

  // --- KI LOGIK (einfach) ---
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
          // Distanz berechnen
          const dx = Math.abs(currentCombatant.position.x - player.position.x);
          const dy = Math.abs(currentCombatant.position.y - player.position.y);
          const distance = Math.max(dx, dy); // Chebyshev distance (D&D Grid Logik oft)

          if (distance > 1) {
            // Bewegen: Ein Feld näher zum Spieler
            let newX = currentCombatant.position.x;
            let newY = currentCombatant.position.y;
            
            if (currentCombatant.position.x < player.position.x) newX++;
            else if (currentCombatant.position.x > player.position.x) newX--;
            
            if (currentCombatant.position.y < player.position.y) newY++;
            else if (currentCombatant.position.y > player.position.y) newY--;

            moveCombatant(currentCombatant.id, { x: newX, y: newY });
            // Nach Bewegung eventuell Angreifen (in echter Logik sequentiell)
          } else {
            // Angreifen
            attack(currentCombatant.id, player.id, null);
          }
        }
        // Zug beenden
        nextTurn();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [combatState.turnIndex, combatState.isActive, combatState.combatants, nextTurn]);

  return {
    combatState,
    startCombat,
    nextTurn,
    moveCombatant,
    attack
  };
};