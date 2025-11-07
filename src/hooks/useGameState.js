// src/hooks/useGameState.js

import { useState, useEffect, useCallback } from "react";
import {
  loadAutoSave,
  saveAutoSave,
  deleteAutoSave,
  saveToSlot,
  loadFromSlot,
} from "../utils/persistence";

// --- KORRIGIERTE IMPORTE ---
import {
  createCharacter,
  grantExperience, 
  levelUpCharacter, 
  checkForLevelUp,
} from "../engine/characterEngine";

import { rollDiceFormula } from "../utils/helpers";
// --- ENDE KORREKTUREN ---

import allRaceData from "../data/races.json";
import locationsData from "../data/locations.json";

// Item-Daten importieren (unverändert)
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

// --- NEUE HELPER-FUNKTION FÜR LOG-EINTRÄGE ---
const createLogEntry = (message, type = "general") => {
  const timestamp = new Date().toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return { id: `${Date.now()}-${Math.random()}`, message, type, timestamp };
};
// --- ENDE NEU ---

const useGameState = () => {
  const [gameState, setGameState] = useState({
    gameState: "start_screen", // start_screen, character_creation, game_view, location_view
    character: null,
    party: [],
    inventory: [],
    equipment: {},
    logEntries: [],
    currentLocation: "world_map",
    discoveredLocations: ["verlassenes_dorf", "elfenwacht_turm"],
  });

  // Autosave bei Änderungen (unverändert)
  useEffect(() => {
    if (
      gameState.gameState === "game_view" ||
      gameState.gameState === "location_view"
    ) {
      saveAutoSave(gameState);
    }
  }, [gameState]);

  // --- SPIELSTAND-HANDLER (unverändert) ---
  const handleNewGame = useCallback(() => {
    setGameState((prevState) => ({
      ...prevState,
      gameState: "character_creation",
      character: null,
      party: [],
      inventory: [],
      equipment: {},
      logEntries: [createLogEntry("Ein neues Abenteuer beginnt...", "system")],
      currentLocation: "world_map",
      discoveredLocations: ["verlassenes_dorf", "elfenwacht_turm"],
    }));
  }, []);

  const handleLoadAutoSaveGame = useCallback(() => {
    const loadedState = loadAutoSave();
    if (loadedState) {
      setGameState((prevState) => ({ // Stelle sicher, dass der Standard-State als Fallback dient
        ...prevState, // Übernimmt Standardwerte (wie discoveredLocations)
        ...loadedState, // Überschreibt mit geladenen Werten
        logEntries: [
          ...(loadedState.logEntries || []), // Sichere Log-Prüfung
          createLogEntry("Spielstand (Autosave) geladen.", "system"),
        ],
      }));
    } else {
      console.log("Kein Autosave gefunden.");
    }
  }, []);

  const handleDeleteGame = useCallback(() => {
    deleteAutoSave();
    setGameState({
      gameState: "start_screen",
      character: null,
      party: [],
      inventory: [],
      equipment: {},
      logEntries: [createLogEntry("Spielstand gelöscht.", "system")],
      currentLocation: "world_map",
      discoveredLocations: ["verlassenes_dorf", "elfenwacht_turm"],
    });
  }, []);

  const handleSaveToSlot = useCallback(
    (slotId) => {
      saveToSlot(slotId, gameState);
      setGameState((prevState) => ({
        ...prevState,
        logEntries: [
          ...prevState.logEntries,
          createLogEntry(`Spiel in Slot ${slotId} gespeichert.`, "system"),
        ],
      }));
    },
    [gameState]
  );

  const handleLoadFromSlot = useCallback((slotId) => {
    const loadedState = loadFromSlot(slotId);
    if (loadedState) {
      setGameState((prevState) => ({ // Stelle sicher, dass der Standard-State als Fallback dient
        ...prevState, // Übernimmt Standardwerte (wie discoveredLocations)
        ...loadedState, // Überschreibt mit geladenen Werten
        logEntries: [
          ...(loadedState.logEntries || []), // Sichere Log-Prüfung
          createLogEntry(`Spiel aus Slot ${slotId} geladen.`, "system"),
        ],
      }));
    } else {
      console.log(`Kein Spielstand in Slot ${slotId} gefunden.`);
    }
  }, []);

  // --- CHARAKTER-HANDLER ---

  const handleCharacterCreation = useCallback((creationState) => {
    const newCharacter = createCharacter(
      creationState.name,
      creationState.raceData,
      creationState.classKey,
      creationState.backgroundData,
      creationState.abilities,
      creationState.abilityAssignments,
      creationState.portrait
    );

    newCharacter.inventory["item_health_potion_1"] = 3;
    newCharacter.inventory["item_leather_armor_1"] = 1;

    setGameState((prevState) => ({
      ...prevState,
      character: newCharacter,
      gameState: "game_view",
      logEntries: [
        createLogEntry(`${newCharacter.name} beginnt das Abenteuer!`, "system"),
      ],
    }));
  }, []);

  // --- AUSRÜSTUNGS-HANDLER (unverändert) ---
  const handleEquipItem = useCallback((itemId, slot) => {
    setGameState((prevState) => {
      const item = allItems.find((i) => i.key === itemId);
      if (!item || item.slot !== slot) return prevState;

      const newEquipment = { ...prevState.character.equipment };
      const newInventory = { ...prevState.character.inventory };

      const oldItemId = newEquipment[slot];
      if (oldItemId) {
        newInventory[oldItemId] = (newInventory[oldItemId] || 0) + 1;
      }

      newEquipment[slot] = itemId;
      newInventory[itemId] = (newInventory[itemId] || 0) - 1;
      if (newInventory[itemId] <= 0) {
        delete newInventory[itemId];
      }

      const newLogEntry = createLogEntry(
        `${item.name} wurde angelegt.`,
        "inventory"
      );

      return {
        ...prevState,
        character: {
          ...prevState.character,
          equipment: newEquipment,
          inventory: newInventory,
        },
        logEntries: [...prevState.logEntries, newLogEntry],
      };
    });
  }, []);

  const handleUnequipItem = useCallback((itemId, slot) => {
    setGameState((prevState) => {
      const item = allItems.find((i) => i.key === itemId);
      if (!item) return prevState;

      const newEquipment = { ...prevState.character.equipment };
      const newInventory = { ...prevState.character.inventory };

      delete newEquipment[slot];
      newInventory[itemId] = (newInventory[itemId] || 0) + 1;

      const newLogEntry = createLogEntry(
        `${item.name} wurde abgelegt.`,
        "inventory"
      );

      return {
        ...prevState,
        character: {
          ...prevState.character,
          equipment: newEquipment,
          inventory: newInventory,
        },
        logEntries: [...prevState.logEntries, newLogEntry],
      };
    });
  }, []);

  const handleToggleTwoHanded = useCallback((itemId, isTwoHanded) => {
    setGameState((prevState) => {
      // (Logik unverändert)
    });
  }, []);

  // --- WELT-HANDLER ---

  const handleEnterLocation = useCallback((locationId) => {
    setGameState((prevState) => ({
      ...prevState,
      gameState: "location_view",
      currentLocation: locationId,
    }));
  }, []);

  const handleLeaveLocation = useCallback(() => {
    setGameState((prevState) => ({
      ...prevState,
      gameState: "game_view",
      currentLocation: "world_map",
    }));
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

  // --- MODIFIZIERT: Laufzeitfehler-Fix ---
  const handleDiscoverLocation = useCallback((locationId) => {
    setGameState((prevState) => {
      // PRÜFUNG HINZUGEFÜGT: Stellt sicher, dass discoveredLocations ein Array ist
      const currentDiscovered = prevState.discoveredLocations || [];
      
      if (currentDiscovered.includes(locationId)) {
        return prevState;
      }
      
      const location = locationsData.find((loc) => loc.id === locationId);
      const newLogEntry = createLogEntry(
        `Neuer Ort entdeckt: ${location?.name || locationId}`, // Sicherer Zugriff auf Namen
        "explore"
      );
      
      return {
        ...prevState,
        discoveredLocations: [...currentDiscovered, locationId], // Verwendet die sichere Variable
        logEntries: [...prevState.logEntries, newLogEntry],
      };
    });
  }, []);
  // --- ENDE MODIFIZIERT ---

  // --- LEVEL-UP & WÜRFELN ---

  const addExperience = useCallback((amount) => {
    setGameState((prevState) => {
      if (!prevState.character) return prevState;
      
      const updatedCharacter = grantExperience(prevState.character, amount);

      const newLogEntry = createLogEntry(
        `${updatedCharacter.name} erhält ${amount} EP.`,
        "system"
      );

      return {
        ...prevState,
        character: updatedCharacter,
        logEntries: [...prevState.logEntries, newLogEntry],
      };
    });
  }, []);

  const handleConfirmLevelUp = useCallback((hpRollResult, levelUpChoices) => {
    setGameState((prevState) => {
      if (!prevState.character || !prevState.character.canLevelUp) { 
        return prevState;
      }

      const updatedCharacter = levelUpCharacter(
        prevState.character,
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

  const rollDice = useCallback(
    (diceNotation, description, rollerName = "System") => {
      const result = rollDiceFormula(diceNotation); 
      
      const newLogEntry = createLogEntry(
        `${rollerName} würfelt ${description} (${diceNotation}): ${result}`,
        "dice"
      );

      setGameState((prevState) => ({
        ...prevState,
        logEntries: [...prevState.logEntries, newLogEntry],
      }));
      return result;
    },
    []
  );

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
    addExperience,
    handleConfirmLevelUp,
    rollDice,
  };
};

export default useGameState; // Korrekter Default-Export