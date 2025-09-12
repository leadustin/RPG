// src/hooks/useGameState.js

import { useState, useEffect, useCallback } from 'react';
import { loadCharacter, saveCharacter, deleteCharacter } from '../utils/persistence';
// HIER: Korrekte Funktionen importiert
import { calculateInitialHP, calculateAC } from '../engine/characterEngine';
import allRaceData from '../data/races.json';

export const useGameState = () => {
  const [gameState, setGameState] = useState({
    screen: 'start', // start, character-creation, game
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
    // --- START DER KORREKTUR ---
    
    // 1. Erstelle eine Kopie des Charakters, um die finalen Attributswerte zu berechnen.
    const tempChar = JSON.parse(JSON.stringify(finalizedCharacter));

    // 2. Wende die zugewiesenen Attributsboni (z.B. von der Rasse) auf die Basiswerte an.
    if (tempChar.ability_bonus_assignments) {
      for (const [ability, bonus] of Object.entries(tempChar.ability_bonus_assignments)) {
        tempChar.abilities[ability] += bonus;
      }
    }

    // 3. Berechne die finalen Werte (HP, AC etc.) basierend auf den aktualisierten Attributen.
    const raceData = allRaceData.find(r => r.key === tempChar.race.key);
    const hp = calculateInitialHP(tempChar);

    const initialStats = {
      hp: hp,
      maxHp: hp,
      armor_class: calculateAC(tempChar),
      speed: raceData?.speed || 30,
      abilities: tempChar.abilities, // Speichere die finalen Attributswerte
    };
    
    // 4. Füge die berechneten Werte dem Charakter-Objekt hinzu.
    const characterWithStats = {
      ...finalizedCharacter,
      stats: initialStats,
    };
    
    // 5. Speichere den vollständigen Charakter und wechsle zum Spielbildschirm.
    setGameState(prevState => ({
      ...prevState,
      screen: 'game',
      character: characterWithStats,
    }));
    // --- ENDE DER KORREKTUR ---
  };
  
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
  };
};