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

  // NEU: Speichert die aktuell in der Actionbar ausgewählte Aktion/Waffe
  const [selectedAction, setSelectedAction] = useState(null);

  // --- INITIIERUNG (Code gekürzt, da unverändert) ---
  const startCombat = useCallback((enemies) => {
    const stats = playerCharacter.stats || {};
    const currentHp = typeof stats.hp === 'number' ? stats.hp : (playerCharacter.hp || 10);
    const maxHp = stats.maxHp || playerCharacter.maxHp || 20;
    const armorClass = stats.armor_class || playerCharacter.ac || 10;
    const speed = playerCharacter.race?.speed || 30;
    const dexScore = stats.abilities?.dex || playerCharacter.abilities?.dex || 10;
    const initBonus = getAbilityModifier(dexScore);

    const playerCombatant = {
      id: playerCharacter.id || 'player',
      type: 'player',
      name: playerCharacter.name || 'Held',
      hp: currentHp,
      maxHp: maxHp,
      ac: armorClass,
      initiative: d(20) + initBonus,
      x: playerCharacter.worldMapPosition?.x || 5, // Fallback
      y: playerCharacter.worldMapPosition?.y || 5, // Fallback
      speed: speed,
      color: 'blue'
    };

    const enemyCombatants = enemies.map((e, i) => ({
      ...e,
      id: e.id || `enemy_${i}`,
      type: 'enemy',
      initiative: d(20) + (e.initBonus || 0),
      currentHp: e.hp,
      maxHp: e.hp,
      color: 'red'
    }));

    const allCombatants = [playerCombatant, ...enemyCombatants].sort((a, b) => b.initiative - a.initiative);

    setCombatState({
      isActive: true,
      round: 1,
      turnIndex: 0,
      combatants: allCombatants,
      log: [`Kampf gestartet! Runde 1 beginnt. ${allCombatants[0].name} ist am Zug.`],
      turnResources: { hasAction: true, hasBonusAction: true, movementLeft: playerCombatant.speed },
      result: null
    });
    
    // Reset selection beim Start
    setSelectedAction(null);
  }, [playerCharacter]);

  // --- AKTIONEN ---
  const performAction = useCallback((attackerId, targetId, action) => {
    setCombatState(prev => {
      const attacker = prev.combatants.find(c => c.id === attackerId);
      const target = prev.combatants.find(c => c.id === targetId);
      
      if (!attacker || !target) return prev;

      let logEntry = '';
      let damage = 0;

      // Einfacher Angriff (Erweitern nach RulesEngine)
      if (action.type === 'weapon' || action.type === 'attack') {
          const roll = d(20);
          // Hier müsste der Angriffsbonus rein (z.B. +5)
          const hit = roll >= target.ac; 
          
          if (hit) {
              // Schadenswurf (Dummy Logic - hier Dice String parsen)
              damage = d(6); // Beispiel
              logEntry = `${attacker.name} greift ${target.name} an: TREFFER (${roll}) für ${damage} Schaden!`;
          } else {
              logEntry = `${attacker.name} greift ${target.name} an: VERFEHLT (${roll}).`;
          }
      } else {
          logEntry = `${attacker.name} führt ${action.name} aus.`;
      }

      const newCombatants = prev.combatants.map(c => {
          if (c.id === targetId) {
              return { ...c, hp: Math.max(0, c.hp - damage) };
          }
          return c;
      });

      // Tod prüfen
      const deadEnemies = newCombatants.filter(c => c.type === 'enemy' && c.hp <= 0).length;
      const totalEnemies = newCombatants.filter(c => c.type === 'enemy').length; // Vorsicht: hier zählen wir alle, auch tote, wenn sie nicht entfernt werden.
      // Besser: Check if all enemies are dead
      const livingEnemies = newCombatants.filter(c => c.type === 'enemy' && c.hp > 0).length;
      
      let result = null;
      if (livingEnemies === 0) result = 'victory';
      if (newCombatants.find(c => c.type === 'player').hp <= 0) result = 'defeat';

      // Ressourcen verbrauchen (Action)
      const newResources = { ...prev.turnResources, hasAction: false };

      return {
          ...prev,
          combatants: newCombatants,
          log: [...prev.log, logEntry],
          turnResources: newResources,
          result
      };
    });
    
    // Nach der Aktion Auswahl zurücksetzen
    setSelectedAction(null);
  }, []);

  // --- NEU: Tile Click Handler für Kampf ---
  const handleCombatTileClick = useCallback((x, y) => {
      if (!combatState.isActive || combatState.result) return;

      const currentCombatant = combatState.combatants[combatState.turnIndex];
      // Nur agieren, wenn der Spieler dran ist
      if (currentCombatant.type !== 'player') return;

      // Prüfen, ob ein Gegner auf dem Feld ist
      const target = combatState.combatants.find(c => c.x === x && c.y === y && c.hp > 0);

      // 1. ANGREIFEN: Wenn Gegner da ist UND eine Aktion ausgewählt wurde
      if (target && target.type === 'enemy' && selectedAction) {
          if (combatState.turnResources.hasAction) {
              performAction(currentCombatant.id, target.id, selectedAction);
          } else {
              setCombatState(prev => ({...prev, log: [...prev.log, "Keine Aktion mehr übrig!"]}));
          }
          return;
      }

      // 2. BEWEGEN: Wenn kein Gegner da ist (und evtl. keine Aktion ausgewählt, oder wir ignorieren die Waffe beim Laufen)
      if (!target) {
          // Implementierung Bewegung (verkürzt)
          // moveCharacter(x, y);
          // Hier müsste deine Bewegungslogik hin (Pfadfindung, Reichweite prüfen)
          console.log(`Bewege zu ${x}, ${y}`);
      }

  }, [combatState, selectedAction, performAction]);

  const nextTurn = useCallback(() => {
      setCombatState(prev => {
          const nextIndex = (prev.turnIndex + 1) % prev.combatants.length;
          const nextRound = nextIndex === 0 ? prev.round + 1 : prev.round;
          
          // Ressourcen resetten, wenn Spieler wieder dran ist (vereinfacht)
          const nextCombatant = prev.combatants[nextIndex];
          const resources = nextCombatant.type === 'player' 
              ? { hasAction: true, hasBonusAction: true, movementLeft: nextCombatant.speed } 
              : prev.turnResources; // Für Gegner egal

          return {
              ...prev,
              turnIndex: nextIndex,
              round: nextRound,
              turnResources: resources,
              log: [...prev.log, `Runde ${nextRound}: ${nextCombatant.name} ist am Zug.`]
          };
      });
  }, []);

  const endCombatSession = useCallback(() => {
      setCombatState(prev => ({ ...prev, isActive: false, result: null }));
  }, []);

  // --- KI LOGIK (Platzhalter, minimal angepasst) ---
  useEffect(() => {
    if (!combatState.isActive || combatState.result) return;
    const currentC = combatState.combatants[combatState.turnIndex];
    
    if (currentC && currentC.type === 'enemy' && currentC.hp > 0) {
        const timer = setTimeout(() => {
            const player = combatState.combatants.find(c => c.type === 'player');
            if (player && player.hp > 0) {
                performAction(currentC.id, player.id, { 
                    type: 'attack', 
                    name: 'Biss', // Beispiel
                    item: { name: 'Biss' } 
                });
                nextTurn();
            } else {
                nextTurn();
            }
        }, 1000);
        return () => clearTimeout(timer);
    }
  }, [combatState.turnIndex, combatState.isActive, combatState.result, performAction, nextTurn]);

  return {
    combatState,
    startCombat,
    nextTurn,
    endCombatSession,
    // Neue Exports
    selectedAction,
    setSelectedAction,
    handleCombatTileClick
  };
};