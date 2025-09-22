import { useState, useEffect, useCallback } from "react";
import {
  loadCharacter,
  saveCharacter,
  deleteCharacter,
} from "../utils/persistence";
import { calculateInitialHP, calculateAC } from "../engine/characterEngine";
import allRaceData from "../data/races.json";

// --- KORREKTUR START ---
// 1. Lade alle neuen, aufgeteilten Item-Dateien
import armorData from "../data/items/armor.json";
import weaponsData from "../data/items/weapons.json";
import clothesData from "../data/items/clothes.json";
import itemsData from "../data/items/items.json";
// Importiere auch die leeren Dateien, damit es keine Fehler gibt
import accessoriesData from "../data/items/accessories.json";
import beltsData from "../data/items/belts.json";
import bootsData from "../data/items/boots.json";
import handsData from "../data/items/hands.json";
import headsData from "../data/items/heads.json";

// 2. Fasse alle Daten in einer einzigen Liste zusammen
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
// --- KORREKTUR ENDE ---

export const useGameState = () => {
  const [gameState, setGameState] = useState({
    screen: "start",
    character: null,
  });

  useEffect(() => {
    const loadedCharacter = loadCharacter();
    if (loadedCharacter) {
      setGameState((prevState) => ({
        ...prevState,
        character: loadedCharacter,
      }));
    }
  }, []);

  const handleNewGame = () => {
    setGameState((prevState) => ({
      ...prevState,
      screen: "character-creation",
    }));
  };

  const handleLoadGame = () => {
    const loadedCharacter = loadCharacter();
    if (loadedCharacter) {
      setGameState({
        screen: "game",
        character: loadedCharacter,
      });
    }
  };

  const handleSaveGame = useCallback(() => {
    if (gameState.character) {
      saveCharacter(gameState.character);
    }
  }, [gameState.character]);

  const handleDeleteGame = () => {
    deleteCharacter();
    setGameState({
      screen: "start",
      character: null,
    });
  };

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

    // 3. Benutze die neue, komplette Item-Liste für das Startinventar
    const startingInventory = [
      allItems.find((item) => item.id === "longsword"),
      allItems.find((item) => item.id === "greatsword"),
      allItems.find((item) => item.id === "leather-armor"),
      allItems.find((item) => item.id === "healing-potion"),
    ].filter(Boolean);

    const characterWithStats = {
      ...finalizedCharacter,
      stats: initialStats,
      inventory: startingInventory,
      equipment: {
        head: null,
        amulet: null,
        armor: null,
        cloth: null,
        cloak: null,
        gloves: null,
        belt: null,
        boots: null,
        ring1: null,
        ring2: null,
        "main-hand": null,
        "off-hand": null,
        ranged: null,
      },
    };

    setGameState({
      screen: "game",
      character: characterWithStats,
    });
  };

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

      // Prüfen, ob eine vielseitige Waffe vorhanden ist
      if (weapon && weapon.properties.some((p) => p.startsWith("Vielseitig"))) {
        
        // --- ANPASSUNG START ---
        // Behandelt den Fall, dass isTwoHanded anfangs 'undefined' ist
        const currentState = weapon.isTwoHanded || false;
        weapon.isTwoHanded = !currentState;
        // --- ANPASSUNG ENDE ---

        // Wenn auf beidhändig umgeschaltet wird, Nebenhand leeren
        if (weapon.isTwoHanded && newCharacter.equipment["off-hand"]) {
          const offHandItem = newCharacter.equipment["off-hand"];
          newCharacter.inventory.push(offHandItem);
          newCharacter.equipment["off-hand"] = null;
        }
      }

      return {
        ...prevGameState,
        character: newCharacter,
      };
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

  useEffect(() => {
    if (gameState.character) {
      saveCharacter(gameState.character);
    }
  }, [gameState.character]);

  return {
    gameState,
    handleNewGame,
    handleLoadGame,
    handleSaveGame,
    handleDeleteGame,
    handleCharacterCreation,
    handleEquipItem,
    handleUnequipItem,
    handleToggleTwoHanded,
  };
};