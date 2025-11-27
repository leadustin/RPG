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

  // --- INITIIERUNG ---
  const startCombat = useCallback((enemies) => {
    // Safety check
    if (!playerCharacter) {
      console.error("Kein Spieler-Charakter vorhanden!");
      return;
    }

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
      x: playerCharacter.worldMapPosition?.x || 5,
      y: playerCharacter.worldMapPosition?.y || 5,
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

      // WAFFEN-ANGRIFF
      if (action.type === 'weapon' && action.item) {
          const weapon = action.item;
          const roll = d(20);
          
          // Hier würde calculateWeaponStats aus rulesEngine genutzt
          // Vereinfacht: +5 Angriffsbonus annehmen
          const attackBonus = 5; // TODO: Aus Charakter berechnen
          const totalRoll = roll + attackBonus;
          const hit = totalRoll >= target.ac;
          
          if (hit) {
              // Schadenswurf (z.B. "1d8")
              const damageDice = weapon.damage || "1d6";
              damage = rollDiceString(damageDice);
              logEntry = `${attacker.name} greift ${target.name} mit ${weapon.name} an: TREFFER (${roll}+${attackBonus}=${totalRoll}) für ${damage} Schaden!`;
          } else {
              logEntry = `${attacker.name} greift ${target.name} mit ${weapon.name} an: VERFEHLT (${roll}+${attackBonus}=${totalRoll} vs AC ${target.ac}).`;
          }
      } 
      // ZAUBER
      else if (action.type === 'spell' || action.uiType?.includes('Zauber')) {
          // Zauber-Logik (vereinfacht)
          logEntry = `${attacker.name} wirkt ${action.name} auf ${target.name}!`;
          // TODO: Schadenswurf basierend auf Zauber
          damage = d(8); // Beispiel
      }
      // GEGENSTAND (z.B. Trank)
      else if (action.type === 'item' || action.uiType === 'Gegenstand') {
          logEntry = `${attacker.name} benutzt ${action.name}.`;
          // TODO: Item-Effekte
      }
      // STANDARD-AKTION (z.B. Spurt, Helfen)
      else if (action.uiType === 'Aktion') {
          logEntry = `${attacker.name} führt ${action.name} aus.`;
          // TODO: Aktion-Effekte
      }
      // FALLBACK
      else {
          logEntry = `${attacker.name} führt ${action.name} aus.`;
      }

      const newCombatants = prev.combatants.map(c => {
          if (c.id === targetId) {
              return { ...c, hp: Math.max(0, c.hp - damage) };
          }
          return c;
      });

      // Sieg/Niederlage prüfen
      const livingEnemies = newCombatants.filter(c => c.type === 'enemy' && c.hp > 0).length;
      const playerAlive = newCombatants.find(c => c.type === 'player').hp > 0;
      
      let result = null;
      if (livingEnemies === 0) result = 'victory';
      if (!playerAlive) result = 'defeat';

      // Ressourcen verbrauchen
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

      // 2. BEWEGEN: Wenn kein Gegner da ist
      if (!target && !selectedAction) {
          // Bewegungslogik hier einfügen
          const distance = Math.abs(currentCombatant.x - x) + Math.abs(currentCombatant.y - y);
          const movementCost = distance * 5; // 5ft pro Feld
          
          if (movementCost <= combatState.turnResources.movementLeft) {
              setCombatState(prev => ({
                  ...prev,
                  combatants: prev.combatants.map(c => 
                      c.id === currentCombatant.id ? { ...c, x, y } : c
                  ),
                  turnResources: {
                      ...prev.turnResources,
                      movementLeft: prev.turnResources.movementLeft - movementCost
                  },
                  log: [...prev.log, `${currentCombatant.name} bewegt sich zu (${x}, ${y}).`]
              }));
          } else {
              setCombatState(prev => ({
                  ...prev,
                  log: [...prev.log, "Nicht genug Bewegung übrig!"]
              }));
          }
      }

      // 3. HINWEIS: Wenn Aktion ausgewählt, aber kein gültiges Ziel
      if (selectedAction && !target) {
          setCombatState(prev => ({
              ...prev,
              log: [...prev.log, `Wähle ein gültiges Ziel für ${selectedAction.name}.`]
          }));
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
    // Safety check
    if (!combatState.isActive || combatState.result || !combatState.combatants.length) return;
    
    const currentC = combatState.combatants[combatState.turnIndex];
    
    if (currentC && currentC.type === 'enemy' && currentC.hp > 0) {
        const timer = setTimeout(() => {
            const player = combatState.combatants.find(c => c.type === 'player');
            if (player && player.hp > 0) {
                performAction(currentC.id, player.id, { 
                    type: 'attack', 
                    name: 'Biss', // Beispiel
                    item: { name: 'Biss', damage: '1d6' } 
                });
                setTimeout(() => nextTurn(), 500); // Kleiner Delay für bessere UX
            } else {
                nextTurn();
            }
        }, 1000);
        return () => clearTimeout(timer);
    }
  }, [combatState.turnIndex, combatState.isActive, combatState.result, combatState.combatants, performAction, nextTurn]);

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