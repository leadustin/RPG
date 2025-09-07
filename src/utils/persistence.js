// src/utils/persistence.js

const CHARACTER_SAVE_KEY = 'dnd_character_save';

/**
 * Speichert das Charakter-Objekt im LocalStorage des Browsers.
 * @param {object} character - Das vollständige Charakter-Objekt.
 */
export const saveCharacter = (character) => {
  try {
    const serializedCharacter = JSON.stringify(character);
    localStorage.setItem(CHARACTER_SAVE_KEY, serializedCharacter);
    console.log("Charakter erfolgreich gespeichert:", character);
  } catch (error) {
    console.error("Fehler beim Speichern des Charakters:", error);
  }
};

/**
 * Lädt den Charakter aus dem LocalStorage.
 * @returns {object|null} Das Charakter-Objekt oder null, wenn kein Speicherstand existiert.
 */
export const loadCharacter = () => {
  try {
    const serializedCharacter = localStorage.getItem(CHARACTER_SAVE_KEY);
    if (serializedCharacter === null) {
      return null;
    }
    return JSON.parse(serializedCharacter);
  } catch (error) {
    console.error("Fehler beim Laden des Charakters:", error);
    return null;
  }
};