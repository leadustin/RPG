// src/hooks/useGameState.jsx

import { useState, useEffect, useCallback } from "react";
import {
  loadAutoSave,
  saveAutoSave,
  deleteAutoSave,
  saveToSlot,
} from "../utils/persistence";
import {
  calculateInitialHP,
  calculateAC,
  grantXpToCharacter,
  applyLevelUp,
  performShortRest,
  performLongRest
} from "../engine/characterEngine";
import spellsData from "../data/spells.json";
import allRaceData from "../data/races.json";
// NEU: Importe für Klassen und Hintergründe, um Objekte wiederherzustellen
import allClassData from "../data/classes.json";
import allBackgroundData from "../data/backgrounds.json";

import locationsData from "../data/locations.json";
import { rollDiceFormula } from "../utils/helpers";

import allItems from "../utils/itemLoader";

const createLogEntry = (message, type = "general") => ({
  id: Date.now() + Math.random(),
  timestamp: new Date(),
  type, 
  message,
});

export const useGameState = () => {
  const [gameState, setGameState] = useState({
    screen: "start",
    character: null,
    logEntries: [], 
  });

  useEffect(() => {
    if (gameState.screen === "game" && gameState.character) {
      saveAutoSave(gameState); 
    }
  }, [gameState]);

  const handleLoadAutoSaveGame = () => {
    const loadedState = loadAutoSave();
    if (loadedState) {
      if (!loadedState.logEntries) {
        loadedState.logEntries = [createLogEntry("Spielstand geladen.")];
      }
      loadedState.logEntries = loadedState.logEntries.map((entry) => ({
        ...entry,
        timestamp: new Date(entry.timestamp),
      }));
      
      // OPTIONAL: Hier könnte man auch eine Hydrierung einbauen, falls alte Saves kaputt sind.
      // Fürs erste verlassen wir uns darauf, dass neue Spiele korrekt erstellt werden.
      setGameState(loadedState);
    } else {
      console.warn("Konnte Autosave nicht laden.");
    }
  };

  const handleNewGame = () => {
    setGameState((prevState) => ({
      ...prevState,
      screen: "character-creation",
      logEntries: [],
      character: null,
    }));
  };

  const handleDeleteGame = () => {
    deleteAutoSave();
    setGameState({
      screen: "start",
      character: null,
      logEntries: [],
    });
  };

  const handleSaveToSlot = useCallback(
    (slotId, saveName) => {
      if (gameState.character) {
        saveToSlot(slotId, gameState, saveName);
      }
    },
    [gameState]
  );

  const handleLoadFromSlot = useCallback(
    (slotData) => {
      if (slotData && slotData.gameState) {
        const loadedState = slotData.gameState;
        if (!loadedState.logEntries) {
          loadedState.logEntries = [createLogEntry("Spielstand geladen.")];
        }
        loadedState.logEntries = loadedState.logEntries.map((entry) => ({
          ...entry,
          timestamp: new Date(entry.timestamp),
        }));
        setGameState(loadedState);
      }
    },
    [setGameState]
  );

  // +++ WICHTIGSTER FIX: Charakter-Objekte wiederherstellen (Hydrierung) +++
  const handleCharacterCreation = (finalizedCharacter) => {
    // Wir erstellen eine Kopie, die wir "hydrieren" (mit Daten füllen)
    let hydratedChar = JSON.parse(JSON.stringify(finalizedCharacter));

    // 1. Rasse wiederherstellen (falls nur ID gespeichert)
    if (typeof hydratedChar.race === 'string') {
        const raceObj = allRaceData.find(r => r.key === hydratedChar.race);
        if (raceObj) hydratedChar.race = raceObj;
    }

    // 2. Klasse wiederherstellen (falls nur ID gespeichert)
    if (typeof hydratedChar.class === 'string') {
        const classObj = allClassData.find(c => c.key === hydratedChar.class);
        if (classObj) hydratedChar.class = classObj;
    }

    // 3. Hintergrund wiederherstellen (falls nur ID gespeichert)
    if (typeof hydratedChar.background === 'string') {
        const bgObj = allBackgroundData.find(b => b.key === hydratedChar.background);
        if (bgObj) hydratedChar.background = bgObj;
    }

    // 4. Subklasse wiederherstellen (falls vorhanden und nur ID)
    if (hydratedChar.subclass && typeof hydratedChar.subclass === 'string') {
        // Dazu brauchen wir die Klasse (die jetzt hoffentlich ein Objekt ist)
        if (hydratedChar.class && hydratedChar.class.subclasses) {
            const subObj = hydratedChar.class.subclasses.find(s => s.key === hydratedChar.subclass);
            if (subObj) hydratedChar.subclass = subObj;
        }
    }

    // --- Ab hier ist 'hydratedChar' wieder ein vollwertiges Objekt mit .name, .icon etc. ---

    if (hydratedChar.ability_bonus_assignments) {
      for (const [ability, bonus] of Object.entries(
        hydratedChar.ability_bonus_assignments
      )) {
        hydratedChar.abilities[ability] += bonus;
      }
    }

    // HP Berechnung benötigt das Rassen-Objekt (deshalb Hydrierung vorher!)
    const hp = calculateInitialHP(hydratedChar);

    const initialStats = {
      hp: hp,
      maxHp: hp,
      armor_class: calculateAC(hydratedChar),
      speed: hydratedChar.race?.speed || 30,
      abilities: hydratedChar.abilities,
    };

    const initialEquipment = {};

    const rawInventory = hydratedChar.inventory || [];
    const characterInventory = rawInventory.map(rawItem => {
        const itemDef = allItems.find(i => i.id === rawItem.itemId);
        if (!itemDef) {
            console.warn(`Item-Definition nicht gefunden für ID: ${rawItem.itemId}`);
            return null;
        }
        return {
            ...itemDef,      
            ...rawItem,      
            id: rawItem.instanceId || crypto.randomUUID() 
        };
    }).filter(Boolean);

    const characterWithStats = {
      ...hydratedChar,
      stats: initialStats,
      inventory: characterInventory,
      equipment: initialEquipment,
      wallet: hydratedChar.wallet || { gold: hydratedChar.gold || 0, silver: 0, copper: 0 },
      position: { x: 2048, y: 1536 },
      currentLocation: "worldmap",
      worldMapPosition: { x: 2048, y: 1536 },
      discoveredLocations: [],
      level: 1,
      experience: 0,
    };

    const characterCreationSummary = {
      Name: characterWithStats.name,
      Rasse: characterWithStats.race?.name,
      Klasse: characterWithStats.class?.name,
      Hintergrund: characterWithStats.background?.name,
      Basis_Attribute: characterWithStats.abilities,
    };

    console.log("--- CHARAKTER ERSTELLT (Hydriert) ---", characterCreationSummary);

    setGameState({
      screen: "game",
      character: characterWithStats,
      logEntries: [
        createLogEntry(
          `Willkommen, ${characterWithStats.name}! Dein Abenteuer beginnt.`,
          "general"
        ),
      ],
    });
  };

  const handleDiscoverLocation = useCallback((locationId) => {
    setGameState((prevState) => {
      if (!prevState.character) return prevState;

      if (
        prevState.character.discoveredLocations &&
        prevState.character.discoveredLocations.includes(locationId)
      ) {
        return prevState;
      }

      const newDiscoveredLocations = [
        ...(prevState.character.discoveredLocations || []),
        locationId,
      ];

      let updatedCharacter = {
        ...prevState.character,
        discoveredLocations: newDiscoveredLocations,
      };

      let newLogEntries = [...prevState.logEntries];
      const locationData = locationsData.find((loc) => loc.id === locationId);

      if (locationData) {
        newLogEntries.push(
          createLogEntry(
            `Neuer Ort entdeckt: ${locationData.name}`,
            "general"
          )
        );

        if (locationData.xp > 0) {
          updatedCharacter = grantXpToCharacter(
            updatedCharacter,
            locationData.xp
          );
          newLogEntries.push(
            createLogEntry(
              `Du erhältst ${locationData.xp} EP für das Entdecken von ${locationData.name}.`,
              "xp"
            )
          );

          if (
            updatedCharacter.pendingLevelUp &&
            !prevState.character.pendingLevelUp
          ) {
            newLogEntries.push(
              createLogEntry(
                `${updatedCharacter.name} ist bereit für ein Level Up!`,
                "level"
              )
            );
          }
        }
      }

      return {
        ...prevState,
        character: updatedCharacter,
        logEntries: newLogEntries,
      };
    });
  }, []);

  const handleEnterLocation = useCallback((locationId, currentPosition) => {
    setGameState((prevState) => {
      if (!prevState.character) return prevState;
      let character = { ...prevState.character };
      let logEntries = [...prevState.logEntries];

      // 1. Position aktualisieren
      character.worldMapPosition = currentPosition;
      character.currentLocation = locationId;

      const locationData = locationsData.find((loc) => loc.id === locationId);
      
      // 2. PRÜFEN: Ist der Ort schon entdeckt? Wenn nein -> XP geben
      const isDiscovered = character.discoveredLocations && character.discoveredLocations.includes(locationId);
      
      if (!isDiscovered && locationData) {
          // Ort zur Liste hinzufügen
          const newDiscovered = [...(character.discoveredLocations || []), locationId];
          character.discoveredLocations = newDiscovered;

          logEntries.push(createLogEntry(`Neuer Ort entdeckt: ${locationData.name}`, "general"));

          // XP vergeben
          if (locationData.xp > 0) {
              character = grantXpToCharacter(character, locationData.xp);
              logEntries.push(createLogEntry(`Du erhältst ${locationData.xp} EP für das Entdecken von ${locationData.name}.`, "xp"));
              
              if (character.pendingLevelUp && !prevState.character.pendingLevelUp) {
                  logEntries.push(createLogEntry(`${character.name} ist bereit für ein Level Up!`, "level"));
              }
          }
      }

      // 3. Log für das Betreten
      logEntries.push(createLogEntry(
        `Betritt ${locationData?.name || "einen Ort"}.`,
        "general"
      ));

      return {
        ...prevState,
        character,
        logEntries,
      };
    });
  }, []);

  const handleLeaveLocation = useCallback(() => {
    setGameState((prevState) => {
      if (!prevState.character) return prevState;
      const character = { ...prevState.character };
      const currentLocationData = locationsData.find(
        (loc) => loc.id === character.currentLocation
      );
      let newPosition = character.worldMapPosition;

      if (currentLocationData) {
        const angle = Math.atan2(
          newPosition.y - currentLocationData.y,
          newPosition.x - currentLocationData.x
        );
        const newX =
          currentLocationData.x +
          Math.cos(angle) * (currentLocationData.radius + 15);
        const newY =
          currentLocationData.y +
          Math.sin(angle) * (currentLocationData.radius + 15);
        newPosition = { x: newX, y: newY };
      }

      character.position = newPosition;
      character.currentLocation = "worldmap";

      const newLogEntry = createLogEntry(
        `Verlässt ${currentLocationData?.name || "Ort"} und kehrt zur Weltkarte zurück.`,
        "general"
      );

      return {
        ...prevState,
        character,
        logEntries: [...prevState.logEntries, newLogEntry],
      };
    });
  }, []);

  const handleUnequipItem = useCallback((item, sourceSlot) => {
    setGameState((prevState) => {
      if (!prevState.character) return prevState;
      const character = { ...prevState.character };
      const inventory = [...character.inventory];
      const equipment = { ...character.equipment };
      if (
        !sourceSlot ||
        !equipment[sourceSlot] ||
        equipment[sourceSlot].id !== item.id
      ) {
        return prevState;
      }
      inventory.push(equipment[sourceSlot]);
      equipment[sourceSlot] = null;

      const newLogEntry = createLogEntry(
        `${item.name} abgelegt (in Inventar).`,
        "item"
      );

      return {
        ...prevState,
        character: { ...character, inventory, equipment },
        logEntries: [...prevState.logEntries, newLogEntry],
      };
    });
  }, []);

  const handleEquipItem = useCallback((item, targetSlot) => {
    setGameState((prevState) => {
      if (!prevState.character) return prevState;
      const character = { ...prevState.character };
      const inventory = [...character.inventory];
      const equipment = { ...character.equipment };
      const itemIndex = inventory.findIndex(
        (invItem) => invItem.id === item.id
      );
      if (itemIndex === -1) return prevState;
      
      inventory.splice(itemIndex, 1);
      const previouslyEquippedItem = equipment[targetSlot];
      if (previouslyEquippedItem) {
        inventory.push(previouslyEquippedItem);
      }
      equipment[targetSlot] = item;

      const newLogEntry = createLogEntry(
        `${item.name} ausgerüstet (${targetSlot}).`,
        "item"
      );

      return {
        ...prevState,
        character: { ...character, inventory, equipment },
        logEntries: [...prevState.logEntries, newLogEntry],
      };
    });
  }, []);

  // +++ NEU: Funktion zum Auspacken von Paketen +++
  const handleUnpackItem = useCallback((packItem) => {
    setGameState((prevState) => {
      if (!prevState.character) return prevState;
      const character = { ...prevState.character };
      let inventory = [...character.inventory];
      let logEntries = [...prevState.logEntries];

      // 1. Definition des Pakets finden (um den Inhalt zu kennen)
      // Da packItem aus dem Inventar kommt, hat es vielleicht nicht alle Infos.
      // Wir suchen das Original-Item in allItems
      const packDef = allItems.find(i => i.id === packItem.itemId);

      if (!packDef || packDef.type !== 'pack' || !packDef.contents) {
         logEntries.push(createLogEntry("Dieser Gegenstand kann nicht ausgepackt werden.", "error"));
         return { ...prevState, logEntries };
      }

      // 2. Paket aus Inventar entfernen
      const packIndex = inventory.findIndex(i => i.instanceId === packItem.instanceId);
      if (packIndex === -1) return prevState; // Sollte nicht passieren

      const currentPackStack = inventory[packIndex];
      
      if (currentPackStack.quantity > 1) {
          // Wenn Stapel: Eins abziehen
          inventory[packIndex] = { 
              ...currentPackStack, 
              quantity: currentPackStack.quantity - 1 
          };
      } else {
          // Wenn einzeln: Entfernen
          inventory.splice(packIndex, 1);
      }

      // 3. Inhalte hinzufügen
      packDef.contents.forEach(contentItem => {
          // Item Definition laden (z.B. "torch")
          const itemDef = allItems.find(i => i.id === contentItem.id);
          if (!itemDef) return;

          // Prüfen ob wir stapeln können
          const existingItemIndex = inventory.findIndex(i => i.itemId === contentItem.id);
          
          // Stapelbare Typen (Logik aus shopEngine/inventoryEngine adaptiert)
          const isStackable = ['ammo', 'potion', 'scroll', 'loot', 'food', 'resource', 'gear', 'consumable'].includes(itemDef.type);

          if (isStackable && existingItemIndex > -1) {
              inventory[existingItemIndex] = {
                  ...inventory[existingItemIndex],
                  quantity: inventory[existingItemIndex].quantity + contentItem.quantity
              };
          } else {
              inventory.push({
                  ...itemDef,
                  itemId: itemDef.id,
                  instanceId: crypto.randomUUID(),
                  quantity: contentItem.quantity,
                  equipped: false
              });
          }
      });

      logEntries.push(createLogEntry(`${packDef.name} ausgepackt.`, "item"));

      return {
        ...prevState,
        character: { ...character, inventory },
        logEntries
      };
    });
  }, []);

  const handleFillQuiver = useCallback((ammoItem) => {
    setGameState((prevState) => {
      if (!prevState.character) return prevState;
      const character = { ...prevState.character };
      const equipment = { ...character.equipment };
      const quiver = equipment.ammo;

      if (!quiver || quiver.type !== "quiver") return prevState;
      if (ammoItem.type !== "ammo") return prevState;

      if (quiver.content && quiver.content.itemId !== ammoItem.itemId) {
        return {
            ...prevState,
            logEntries: [...prevState.logEntries, createLogEntry(`Der Köcher enthält bereits ${quiver.content.name}.`, "general")]
        };
      }

      const currentAmount = quiver.content ? quiver.content.quantity : 0;
      const spaceLeft = (quiver.capacity || 20) - currentAmount;

      if (spaceLeft <= 0) {
         return {
            ...prevState,
            logEntries: [...prevState.logEntries, createLogEntry("Der Köcher ist voll.", "general")]
        };
      }

      const amountToTransfer = Math.min(spaceLeft, ammoItem.quantity);

      const newContent = {
          itemId: ammoItem.itemId,
          name: ammoItem.name,
          quantity: currentAmount + amountToTransfer
      };
      
      const newQuiver = { ...quiver, content: newContent };
      equipment.ammo = newQuiver;

      const inventory = [...character.inventory];
      const invItemIndex = inventory.findIndex(i => i.id === ammoItem.id);
      
      if (invItemIndex > -1) {
          if (inventory[invItemIndex].quantity > amountToTransfer) {
              inventory[invItemIndex] = { 
                  ...inventory[invItemIndex], 
                  quantity: inventory[invItemIndex].quantity - amountToTransfer 
              };
          } else {
              inventory.splice(invItemIndex, 1);
          }
      }

      return {
        ...prevState,
        character: { ...character, equipment, inventory },
        logEntries: [...prevState.logEntries, createLogEntry(`${amountToTransfer}x ${ammoItem.name} in den Köcher gefüllt.`, "item")]
      };
    });
  }, []);

  const handleUnloadQuiver = useCallback(() => {
    setGameState((prevState) => {
      if (!prevState.character) return prevState;
      const character = { ...prevState.character };
      const equipment = { ...character.equipment };
      const quiver = equipment.ammo;

      if (!quiver || !quiver.content) return prevState;

      const inventory = [...character.inventory];
      const ammoToReturn = quiver.content;
      
      const existingStackIndex = inventory.findIndex(i => i.itemId === ammoToReturn.itemId);

      if (existingStackIndex > -1) {
          const stack = { ...inventory[existingStackIndex] };
          stack.quantity += ammoToReturn.quantity;
          inventory[existingStackIndex] = stack;
      } else {
          const baseItem = allItems.find(i => i.id === ammoToReturn.itemId);
          if (baseItem) {
              inventory.push({
                  ...baseItem,
                  instanceId: Date.now(),
                  id: Date.now(),
                  itemId: baseItem.id,
                  quantity: ammoToReturn.quantity
              });
          }
      }

      const newQuiver = { ...quiver };
      delete newQuiver.content;
      equipment.ammo = newQuiver;

      return {
        ...prevState,
        character: { ...character, equipment, inventory },
        logEntries: [...prevState.logEntries, createLogEntry(`Köcher geleert.`, "item")]
      };
    });
  }, []);

  const handleToggleTwoHanded = useCallback((slotId) => {
    setGameState((prevState) => {
      if (!prevState.character) return prevState;

      const character = { ...prevState.character };
      const equipment = { ...character.equipment };
      
      const originalWeapon = equipment[slotId];
      if (!originalWeapon) return prevState;

      const weapon = { ...originalWeapon }; 
      
      let logEntries = [...prevState.logEntries];

      if (weapon.properties && weapon.properties.some((p) => p.startsWith("Vielseitig"))) {
        
        const wasTwoHanded = weapon.isTwoHanded || false;
        weapon.isTwoHanded = !wasTwoHanded;

        if (weapon.isTwoHanded) {
          logEntries.push(createLogEntry(`${weapon.name} wird jetzt zweihändig geführt.`, "item"));

          if (equipment["off-hand"]) {
            const offHandItem = equipment["off-hand"];
            const inventory = [...character.inventory];
            inventory.push(offHandItem);
            character.inventory = inventory;
            equipment["off-hand"] = null;
            logEntries.push(createLogEntry(`${offHandItem.name} abgelegt (in Inventar).`, "item"));
          }
        } else {
          logEntries.push(createLogEntry(`${weapon.name} wird jetzt einhändig geführt.`, "item"));
        }

        equipment[slotId] = weapon;
        character.equipment = equipment;

        return {
          ...prevState,
          character,
          logEntries
        };
      }
      return prevState;
    });
  }, []);

  const handleUpdatePosition = useCallback((newPosition) => {
    setGameState((prevState) => {
      if (!prevState.character) return prevState;
      return {
        ...prevState,
        character: {
          ...prevState.character,
          position: newPosition,
        },
      };
    });
  }, []);

  const handleConfirmLevelUp = useCallback((hpRollResult, levelUpChoices) => {
    setGameState((prevState) => {
      if (!prevState.character || !prevState.character.pendingLevelUp) {
        return prevState;
      }

      const updatedCharacter = applyLevelUp(
        prevState.character,
        hpRollResult,
        levelUpChoices 
      );

      const newLogEntry = createLogEntry(
        `${updatedCharacter.name} hat Stufe ${updatedCharacter.level} erreicht!`,
        "level"
      );

      return {
        ...prevState,
        character: updatedCharacter,
        logEntries: [...prevState.logEntries, newLogEntry],
      };
    });
  }, []);

  const handleShortRest = useCallback((diceToSpend) => {
    setGameState((prevState) => {
      if (!prevState.character) return prevState;
      const result = performShortRest(prevState.character, diceToSpend);
      
      if (!result.success) return prevState;

      return {
          ...prevState,
          character: result.character,
          logEntries: [...prevState.logEntries, createLogEntry(result.message, "general")]
      };
    });
  }, []);

  const handleLongRest = useCallback((diceToSpend) => {
    setGameState((prevState) => {
      if (!prevState.character) return prevState;
      const result = performLongRest(prevState.character);
      
      return {
          ...prevState,
          character: result.character,
          logEntries: [...prevState.logEntries, createLogEntry(result.message, "general")]
      };
    });
  }, []);

  const handleCastSpell = useCallback((spellKey, castLevel) => {
    setGameState((prevState) => {
      const char = { ...prevState.character };
      const spell = spellsData.find(s => s.key === spellKey);
      
      if (!spell) return prevState;
      let logMsg = "";

      // 1. CANTRIP (Level 0) - Kostet nichts
      if (spell.level === 0) {
           logMsg = `${char.name} wirkt den Zaubertrick ${spell.name}.`;
      } 
      // 2. LEVEL SPELL - Kostet Slot
      else {
          const maxSlots = calculateMaxSpellSlots(char); // Dies ist ein Platzhalter, falls calculateMaxSpellSlots hier nicht importiert ist
          const currentSlots = char.currentSpellSlots ? { ...char.currentSpellSlots } : { ...maxSlots };
          
          if (!currentSlots[castLevel] || currentSlots[castLevel] <= 0) {
              return {
                  ...prevState,
                  logEntries: [...prevState.logEntries, createLogEntry(`Fehler: Kein Zauberplatz von Grad ${castLevel} verfügbar!`, "error")]
              };
          }

          currentSlots[castLevel] -= 1;
          char.currentSpellSlots = currentSlots;

          const isUpcast = castLevel > spell.level;
          logMsg = `${char.name} wirkt ${spell.name} auf Grad ${castLevel}. ${isUpcast ? '(Verstärkt!)' : ''}`;
      }
      
      return {
          ...prevState,
          character: char,
          logEntries: [...prevState.logEntries, createLogEntry(logMsg, "magic")]
      };
    });
  }, []);

  const handleShopTransaction = useCallback((newCharacter, logMessage) => {
    setGameState((prevState) => {
      const newLogEntry = createLogEntry(logMessage, "item");
      return {
        ...prevState,
        character: newCharacter,
        logEntries: [...prevState.logEntries, newLogEntry],
      };
    });
  }, []);

  const handleUpdateCharacter = useCallback((updatedCharacter) => {
    setGameState((prevState) => {
      return {
        ...prevState,
        character: updatedCharacter
      };
    });
  }, []);

  return {
    gameState,
    setGameState, 
    handleNewGame,
    handleLoadAutoSaveGame,
    handleDeleteGame,
    handleSaveToSlot,
    handleLoadFromSlot,
    handleCharacterCreation,
    handleEquipItem,
    handleUnequipItem,
    handleToggleTwoHanded,
    handleFillQuiver,
    handleUnpackItem,
    handleUnloadQuiver, 
    handleEnterLocation,
    handleLeaveLocation,
    handleUpdatePosition,
    handleDiscoverLocation,
    handleConfirmLevelUp,
    handleShortRest,
    handleLongRest,
    handleShopTransaction,
    handleUpdateCharacter,
    handleCastSpell,
    rollDiceFormula,
  };
};