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

    // Inventar hydrieren
    const rawInventory = finalizedCharacter.inventory || [];
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
      ...finalizedCharacter,
      stats: initialStats,
      inventory: characterInventory,
      equipment: initialEquipment,
      wallet: finalizedCharacter.wallet || { gold: 0, silver: 0, copper: 0 },
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

  // +++ GEÄNDERT: UNEQUIP ZUERST DEFINIEREN +++
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
  // +++ ENDE +++

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

  // +++ KÖCHER LOGIK (Hinzugefügt) +++
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
  // +++ ENDE KÖCHER +++

  // +++ FIXED: Toggle 2H mit korrekter Mutation +++
  const handleToggleTwoHanded = useCallback((slotId) => {
    setGameState((prevState) => {
      if (!prevState.character) return prevState;

      const character = { ...prevState.character };
      const equipment = { ...character.equipment };

      const originalWeapon = equipment[slotId];
      if (!originalWeapon) return prevState;

      // Kopie erstellen!
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

        // Zurückschreiben
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
  // +++ ENDE FIX +++

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

  const handleShortRest = useCallback((diceToSpend) => {
    setGameState((prevState) => {
      if (!prevState.character) return prevState;

      const result = performShortRest(prevState.character, diceToSpend);

      if (!result.success) {
        return {
          ...prevState,
          logEntries: [...prevState.logEntries, createLogEntry(result.message, "general")]
        };
      }

      return {
        ...prevState,
        character: result.character,
        logEntries: [...prevState.logEntries, createLogEntry(result.message, "general")]
      };
    });
  }, []);

  const handleLongRest = useCallback(() => {
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
    handleFillQuiver, // <-- Jetzt da
    handleUnloadQuiver, // <-- Jetzt da
    handleEnterLocation,
    handleLeaveLocation,
    handleUpdatePosition,
    handleDiscoverLocation,
    handleConfirmLevelUp,
    handleShortRest,
    handleLongRest,
    rollDiceFormula,
  };
};