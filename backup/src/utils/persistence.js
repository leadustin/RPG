// src/utils/persistence.js

const CHARACTER_STORAGE_KEY = 'rpg_character';
const GAME_STATE_STORAGE_KEY = 'rpg_game_state';

// --- Bestehende Funktionen (leicht angepasst) ---
export const saveCharacter = (character) => {
  try {
    const serializedState = JSON.stringify(character);
    localStorage.setItem(CHARACTER_STORAGE_KEY, serializedState);
  } catch (e) {
    console.warn("Could not save character", e);
  }
};

export const loadCharacter = () => {
  try {
    const serializedState = localStorage.getItem(CHARACTER_STORAGE_KEY);
    if (serializedState === null) {
      return undefined;
    }
    return JSON.parse(serializedState);
  } catch (e) {
    console.warn("Could not load character", e);
    return undefined;
  }
};

export const deleteCharacter = () => {
  try {
    localStorage.removeItem(CHARACTER_STORAGE_KEY);
    localStorage.removeItem(GAME_STATE_STORAGE_KEY); // Lösche beides
  } catch (e) {
    console.warn("Could not delete character", e);
  }
};


// --- NEUE, BENÖTIGTE FUNKTIONEN ---
export const saveGameState = (state) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(GAME_STATE_STORAGE_KEY, serializedState);
  } catch (e) {
    console.warn("Could not save game state", e);
  }
};

export const loadGameState = () => {
  try {
    const serializedState = localStorage.getItem(GAME_STATE_STORAGE_KEY);
    if (serializedState === null) {
      return undefined;
    }
    return JSON.parse(serializedState);
  } catch (e) {
    console.warn("Could not load game state", e);
    return undefined;
  }
};