// src/hooks/useGameState.js

import { useState, useEffect, useCallback } from "react";
import {
  loadAutoSave,
  saveAutoSave,
  deleteAutoSave,
  saveToSlot,
  loadFromSlot,
} from "../utils/persistence";
import { calculateInitialHP, calculateAC } from "../engine/characterEngine";
import allRaceData from "../data/races.json";
import locationsData from "../data/locations.json";

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

export const useGameState = () => {
  const [gameState, setGameState] = useState({
    screen: "start",
    character: null,
  });

  // Initiales Laden: ENTFERNT. Wir starten immer mit screen: "start".
  /*
  useEffect(() => {
    const loadedState = loadAutoSave();
    if (loadedState) {
      setGameState(loadedState);
    }
  }, []);
  */

  // Autosave: Speichere bei JEDER Änderung, wenn im Spiel
  useEffect(() => {
    if (gameState.screen === "game" && gameState.character) {
      saveAutoSave(gameState);
    }
  }, [gameState]);

  // NEUER Handler, um das Autosave-Spiel (Fortsetzen) zu laden
  const handleLoadAutoSaveGame = () => {
    const loadedState = loadAutoSave();
    if (loadedState) {
      setGameState(loadedState);
    } else {
      // Fallback, falls Autosave gelöscht wurde
      console.warn("Konnte Autosave nicht laden.");
    }
  };

  const handleNewGame = () => {
    setGameState((prevState) => ({
      ...prevState,
      screen: "character-creation",
    }));
  };

  const handleDeleteGame = () => {
    deleteAutoSave();
    setGameState({
      screen: "start",
      character: null,
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
        setGameState(slotData.gameState);
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

    const startingInventory = [
      allItems.find((item) => item.id === "longsword"),
      allItems.find((item) => item.id === "greatsword"),
      allItems.find((item) => item.id === "leather-armor"),
      allItems.find((item) => item.id === "shield"),
      allItems.find((item) => item.id === "healing-potion"),
    ].filter(Boolean);

    const characterWithStats = {
      ...finalizedCharacter,
      stats: initialStats,
      inventory: startingInventory,
      equipment: initialEquipment,
      position: { x: 2048, y: 1536 },
      currentLocation: "worldmap",
      worldMapPosition: { x: 2048, y: 1536 },
      discoveredLocations: [],
      level: 1,
      experience: 0,
    };

    setGameState({
      screen: "game",
      character: characterWithStats,
    });
  };

const handleDiscoverLocation = useCallback((locationId) => {
    setGameState((prevState) => {
      if (!prevState.character) return prevState;

      // Prüfen, ob der Ort bereits entdeckt wurde
      if (
        prevState.character.discoveredLocations &&
        prevState.character.discoveredLocations.includes(locationId)
      ) {
        return prevState; // Nichts tun, wenn schon entdeckt
      }

      // Den neuen Ort zum Array hinzufügen
      const newDiscoveredLocations = [
        ...(prevState.character.discoveredLocations || []),
        locationId,
      ];

      return {
        ...prevState,
        character: {
          ...prevState.character,
          discoveredLocations: newDiscoveredLocations,
        },
      };
    });
  }, []);

  const handleEnterLocation = useCallback((locationId, currentPosition) => {
    setGameState((prevState) => {
      if (!prevState.character) return prevState;
      const character = { ...prevState.character };
      character.worldMapPosition = currentPosition;
      character.currentLocation = locationId;
      return { ...prevState, character };
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

      return { ...prevState, character };
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
      return {
        ...prevState,
        character: { ...character, inventory, equipment },
      };
    });
  }, []);

  const handleToggleTwoHanded = (slotId) => {
    setGameState((prevGameState) => {
      const newCharacter = { ...prevGameState.character };
      const weapon = newCharacter.equipment[slotId];

      if (weapon && weapon.properties.some((p) => p.startsWith("Vielseitig"))) {
        const currentState = weapon.isTwoHanded || false;
        weapon.isTwoHanded = !currentState;
        if (weapon.isTwoHanded && newCharacter.equipment["off-hand"]) {
          const offHandItem = newCharacter.equipment["off-hand"];
          newCharacter.inventory.push(offHandItem);
          newCharacter.equipment["off-hand"] = null;
        }
      }
      return { ...prevGameState, character: newCharacter };
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
      return {
        ...prevState,
        character: { ...character, inventory, equipment },
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

  return {
    gameState,
    setGameState,
    handleNewGame,
    handleLoadAutoSaveGame, // Neu
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
  };
};