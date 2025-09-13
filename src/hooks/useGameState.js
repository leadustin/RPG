import { useState, useEffect, useCallback } from 'react';
import { loadCharacter, saveCharacter, deleteCharacter } from '../utils/persistence';
import { calculateInitialHP, calculateAC } from '../engine/characterEngine';
import allRaceData from '../data/races.json';
import initialItems from '../data/items.json';

export const useGameState = () => {
  const [gameState, setGameState] = useState({
    screen: 'start',
    character: null,
  });

  useEffect(() => {
    const loadedCharacter = loadCharacter();
    if (loadedCharacter) {
      setGameState(prevState => ({
        ...prevState,
        character: loadedCharacter,
      }));
    }
  }, []);

  const handleNewGame = () => {
    setGameState(prevState => ({
      ...prevState,
      screen: 'character-creation',
    }));
  };

  const handleLoadGame = () => {
    const loadedCharacter = loadCharacter();
    if (loadedCharacter) {
      setGameState({
        screen: 'game',
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
      screen: 'start',
      character: null,
    });
  };

  const handleCharacterCreation = (finalizedCharacter) => {
    const tempChar = JSON.parse(JSON.stringify(finalizedCharacter));

    if (tempChar.ability_bonus_assignments) {
      for (const [ability, bonus] of Object.entries(tempChar.ability_bonus_assignments)) {
        tempChar.abilities[ability] += bonus;
      }
    }

    const raceData = allRaceData.find(r => r.key === tempChar.race.key);
    const hp = calculateInitialHP(tempChar);

    const initialStats = {
      hp: hp,
      maxHp: hp,
      armor_class: calculateAC(tempChar),
      speed: raceData?.speed || 30,
      abilities: tempChar.abilities,
    };
    
    const startingInventory = [
        initialItems.find(item => item.id === 'longsword'),
        initialItems.find(item => item.id === 'leather-armor'),
        initialItems.find(item => item.id === 'healing-potion'),
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
        'main-hand': null,
        'off-hand': null,
        'ranged': null,
      }
    };
    
    setGameState({
      screen: 'game',
      character: characterWithStats,
    });
  };

  const handleEquipItem = useCallback((item, targetSlot) => {
    setGameState(prevState => {
      if (!prevState.character) return prevState;

      const character = { ...prevState.character };
      const inventory = [...character.inventory];
      const equipment = { ...character.equipment };

      const itemIndex = inventory.findIndex(invItem => invItem.id === item.id);
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

  const handleUnequipItem = useCallback((item, sourceSlot) => {
    setGameState(prevState => {
      if (!prevState.character) return prevState;

      const character = { ...prevState.character };
      const inventory = [...character.inventory];
      const equipment = { ...character.equipment };

      if (!sourceSlot || !equipment[sourceSlot] || equipment[sourceSlot].id !== item.id) {
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
  };
};