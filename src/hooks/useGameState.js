import { useState, useCallback } from 'react';
// KORREKTUR HIER: Die richtigen Funktionsnamen werden importiert
import { saveCharacter, loadCharacter, deleteCharacter } from '../utils/persistence';

export const useGameState = () => {
  const [gameState, setGameState] = useState({
    screen: 'start', // Mögliche Werte: 'start', 'character-creation', 'game'
    character: null,
  });

  const handleNewGame = useCallback(() => {
    setGameState(prevState => ({ ...prevState, screen: 'character-creation' }));
  }, []);

  const handleLoadGame = useCallback(() => {
    // KORREKTUR HIER: loadCharacter anstelle von loadState verwenden
    const loadedState = loadCharacter();
    if (loadedState) {
      // Annahme: loadCharacter gibt das gesamte gameState-Objekt zurück
      setGameState(loadedState);
    } else {
      console.log("Kein Spielstand zum Laden gefunden.");
    }
  }, []);

  const handleSaveGame = useCallback(() => {
    if (gameState.character) {
      // KORREKTUR HIER: saveCharacter anstelle von saveState verwenden
      saveCharacter(gameState);
      console.log("Spiel gespeichert!");
    } else {
      console.log("Kein Charakter zum Speichern vorhanden.");
    }
  }, [gameState]);

  const handleDeleteGame = useCallback(() => {
    // KORREKTUR HIER: deleteCharacter anstelle von deleteState verwenden
    deleteCharacter();
    setGameState({ screen: 'start', character: null });
    console.log("Spielstand gelöscht!");
  }, []);

  const handleCharacterCreation = useCallback((characterData) => {
    setGameState({
      screen: 'game',
      character: characterData,
    });
  }, []);

  return {
    gameState,
    handleNewGame,
    handleLoadGame,
    handleSaveGame,
    handleDeleteGame,
    handleCharacterCreation,
  };
};