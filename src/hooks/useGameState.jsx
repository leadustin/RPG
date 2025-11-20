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
} from "../engine/characterEngine";
import allRaceData from "../data/races.json";
import locationsData from "../data/locations.json";
import { rollDiceFormula } from "../utils/helpers";

// Item-Daten importieren
import armorData from "../data/items/armor.json";
import weaponsData from "../data/items/weapons.json";
import clothesData from "../data/items/clothes.json";
import itemsData from "../data/items/items.json";
import accessoriesData from "../data/items/accessories.json";
import beltsData from "../data/items/belts.json";
import bootsData from "../data/items/boots.json";
import handsData from "../data/items/hands.json";
import headsData from "../data/items/heads.json";

const allItems = [
  ...armorData,
  ...weaponsData,
  ...clothesData,
  ...itemsData,
  ...accessoriesData,
  ...beltsData,
  ...bootsData,
  ...handsData,
  ...headsData,
];

// --- HELPER-FUNKTION FÜR LOG-EINTRÄGE ---
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

  // Autosave
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

  const handleCharacterCreation = (finalizedCharacter) => {
    const tempChar = JSON.parse(JSON.stringify(finalizedCharacter));

    if (tempChar.ability_bonus_assignments) {
      for (const [ability, bonus] of Object.entries(
        tempChar.ability_bonus_assignments
      )) {
        tempChar.abilities[ability] += bonus;
      }
    }

    const raceData = allRaceData.find((r) => r.key === tempChar.race.key);
    const hp = calculateInitialHP(tempChar);

    const initialStats = {
      hp: hp,
      maxHp: hp,
      armor_class: calculateAC(tempChar),
      speed: raceData?.speed || 30,
      abilities: tempChar.abilities,
    };

    // Start-Equipment (Ausgerüstet) aus Klasse laden
    const equipmentList = finalizedCharacter.class.starting_equipment || [];
    const initialEquipment = {};
    equipmentList.forEach((item) => {
      const itemDetails = allItems.find((i) => i.name === item.item);
      if (itemDetails && itemDetails.slot) {
        initialEquipment[itemDetails.slot] = {
          ...itemDetails,
          id: `${itemDetails.name}-${Date.now()}`,
        };
      }
    });

    // +++ ÄNDERUNG: Inventar "hydrieren" statt überschreiben +++
    // 1. Hole das rohe Inventar aus dem CharacterCreationScreen (enthält itemId, quantity, instanceId)
    const rawInventory = finalizedCharacter.inventory || [];

    // 2. Verknüpfe es mit den echten Item-Daten aus allItems
    const characterInventory = rawInventory.map(rawItem => {
        // Suche das Item anhand der ID (z.B. "dagger")
        const itemDef = allItems.find(i => i.id === rawItem.itemId);
        
        if (!itemDef) {
            console.warn(`Item-Definition nicht gefunden für ID: ${rawItem.itemId}`);
            return null;
        }

        // Kombiniere Definition mit Instanz-Daten
        return {
            ...itemDef,      // Name, Gewicht, Typ, etc.
            ...rawItem,      // quantity, instanceId
            id: rawItem.instanceId || crypto.randomUUID() // Wichtig: CharacterSheet nutzt 'id' als Key
        };
    }).filter(Boolean); // Entferne null-Werte (nicht gefundene Items)
    // +++ ENDE ÄNDERUNG +++

    const characterWithStats = {
      ...finalizedCharacter,
      stats: initialStats,
      inventory: characterInventory, // <-- Hier nutzen wir jetzt das echte Inventar
      equipment: initialEquipment,
      // Stelle sicher, dass Wallet übernommen wird (falls nicht schon im finalizedCharacter)
      wallet: finalizedCharacter.wallet || { gold: 0, silver: 0, copper: 0 },
      position: { x: 2048, y: 1536 },
      currentLocation: "worldmap",
      worldMapPosition: { x: 2048, y: 1536 },
      discoveredLocations: [],
      level: 1,
      experience: 0,
    };

    // --- Log-Block (Sicher) ---
    const characterCreationSummary = {
      Name: characterWithStats.name,
      Rasse: characterWithStats.race?.name,
      Klasse: characterWithStats.class?.name,
      Hintergrund: characterWithStats.background?.name,
      Hintergrund_Sprachen: characterWithStats.background_choices?.languages || [],
      Hintergrund_Werkzeuge: characterWithStats.background_choices?.tools || [],
      Basis_Attribute: characterWithStats.abilities,
      Kampfstil: characterWithStats.fighting_style || "Kein",
      Start_Inventar_IDs: characterWithStats.inventory?.map((item) => item.itemId || item.id) || [],
    };

    console.log("--- CHARAKTER ERSTELLT ---", characterCreationSummary);

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
      const character = { ...prevState.character };
      character.worldMapPosition = currentPosition;
      character.currentLocation = locationId;

      const locationData = locationsData.find((loc) => loc.id === locationId);
      const newLogEntry = createLogEntry(
        `Betritt ${locationData?.name || "einen Ort"}.`,
        "general"
      );

      return {
        ...prevState,
        character,
        logEntries: [...prevState.logEntries, newLogEntry],
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

  const handleToggleTwoHanded = (slotId) => {
    setGameState((prevGameState) => {
      const newCharacter = { ...prevGameState.character };
      const weapon = newCharacter.equipment[slotId];
      let newLogEntries = [...prevGameState.logEntries];

      if (weapon && weapon.properties.some((p) => p.startsWith("Vielseitig"))) {
        const currentState = weapon.isTwoHanded || false;
        weapon.isTwoHanded = !currentState;

        if (weapon.isTwoHanded) {
          newLogEntries.push(
            createLogEntry(`${weapon.name} wird jetzt zweihändig geführt.`, "item")
          );
          if (newCharacter.equipment["off-hand"]) {
            const offHandItem = newCharacter.equipment["off-hand"];
            newCharacter.inventory.push(offHandItem);
            newCharacter.equipment["off-hand"] = null;
            newLogEntries.push(
              createLogEntry(`${offHandItem.name} abgelegt (in Inventar).`, "item")
            );
          }
        } else {
          newLogEntries.push(
            createLogEntry(`${weapon.name} wird jetzt einhändig geführt.`, "item")
          );
        }
      }
      return { ...prevGameState, character: newCharacter, logEntries: newLogEntries };
    });
  };

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
  // --- KÖCHER LOGIK ---

  const handleFillQuiver = useCallback((ammoItem) => {
    setGameState((prevState) => {
      if (!prevState.character) return prevState;
      const character = { ...prevState.character };
      const equipment = { ...character.equipment };
      const quiver = equipment.ammo;

      // Sicherheitschecks
      if (!quiver || quiver.type !== "quiver") return prevState;
      if (ammoItem.type !== "ammo") return prevState;

      // Check: Ist schon eine ANDERE Munitionsart drin?
      if (quiver.content && quiver.content.itemId !== ammoItem.itemId) {
        // Log: Nur eine Art erlaubt
        return {
            ...prevState,
            logEntries: [...prevState.logEntries, createLogEntry(`Der Köcher enthält bereits ${quiver.content.name}. Leere ihn zuerst.`, "general")]
        };
      }

      // Berechne Kapazität
      const currentAmount = quiver.content ? quiver.content.quantity : 0;
      const spaceLeft = (quiver.capacity || 20) - currentAmount;

      if (spaceLeft <= 0) {
         return {
            ...prevState,
            logEntries: [...prevState.logEntries, createLogEntry("Der Köcher ist voll.", "general")]
        };
      }

      // Wie viel können wir übertragen?
      const amountToTransfer = Math.min(spaceLeft, ammoItem.quantity);

      // 1. Köcher Inhalt aktualisieren
      const newContent = {
          itemId: ammoItem.itemId,
          name: ammoItem.name,
          quantity: currentAmount + amountToTransfer
      };
      
      const newQuiver = { ...quiver, content: newContent };
      equipment.ammo = newQuiver;

      // 2. Inventar aktualisieren (Ammo reduzieren/entfernen)
      const inventory = [...character.inventory];
      const invItemIndex = inventory.findIndex(i => i.id === ammoItem.id);
      
      if (invItemIndex > -1) {
          if (inventory[invItemIndex].quantity > amountToTransfer) {
              // Reduzieren
              inventory[invItemIndex] = { 
                  ...inventory[invItemIndex], 
                  quantity: inventory[invItemIndex].quantity - amountToTransfer 
              };
          } else {
              // Entfernen
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

      // Inhalt zurück ins Inventar
      const inventory = [...character.inventory];
      const ammoToReturn = quiver.content;

      // Check ob Stack schon existiert
      const existingStackIndex = inventory.findIndex(i => i.itemId === ammoToReturn.itemId);

      if (existingStackIndex > -1) {
          // Existierenden Stack aktualisieren
          const stack = { ...inventory[existingStackIndex] };
          stack.quantity += ammoToReturn.quantity;
          inventory[existingStackIndex] = stack;
      } else {
          // Neues Item erstellen
          // WICHTIG: Wir müssen die vollen Item-Daten laden!
          const baseItem = allItems.find(i => i.id === ammoToReturn.itemId);
          
          if (baseItem) {
              inventory.push({
                  ...baseItem,
                  instanceId: Date.now(),
                  id: Date.now(), // Neue ID für React-Keys
                  itemId: baseItem.id, // Referenz-ID sicherstellen
                  quantity: ammoToReturn.quantity
              });
          } else {
              console.warn("Konnte Item-Daten für Rückgabe nicht finden:", ammoToReturn.itemId);
              // Fallback: Nur das zurückgeben, was wir haben (könnte fehlerhaft sein)
              inventory.push({
                  ...ammoToReturn,
                  instanceId: Date.now(),
                  id: Date.now(),
                  type: "ammo" // Sicherstellen, dass der Typ stimmt
              });
          }
      }

      // Köcher leeren
      const newQuiver = { ...quiver };
      delete newQuiver.content;
      equipment.ammo = newQuiver;

      return {
        ...prevState,
        character: { ...character, equipment, inventory },
        logEntries: [...prevState.logEntries, createLogEntry(`Köcher geleert (${ammoToReturn.quantity}x ${ammoToReturn.name}).`, "item")]
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
    handleEnterLocation,
    handleLeaveLocation,
    handleUpdatePosition,
    handleDiscoverLocation,
    handleConfirmLevelUp,
    handleFillQuiver,
    handleUnloadQuiver,
    rollDiceFormula,
  };
};