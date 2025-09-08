// src/utils/persistence.js

const CHARACTER_STORAGE_KEY = 'rpg_character';

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

// Neue Funktion hinzufügen
export const deleteCharacter = () => {
  try {
    localStorage.removeItem(CHARACTER_STORAGE_KEY);
  } catch (e) {
    console.warn("Could not delete character", e);
  }
};
