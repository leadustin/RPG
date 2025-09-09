// src/utils/persistence.js

const SAVE_KEY = 'dnd_rpg_save_file'

export const saveCharacter = (characterData) => {
  localStorage.setItem(SAVE_KEY, JSON.stringify(characterData))
}

export const loadCharacterFromFile = () => {
  const savedData = localStorage.getItem(SAVE_KEY)
  return savedData ? JSON.parse(savedData) : null
}

export const deleteCharacterFile = () => {
  localStorage.removeItem(SAVE_KEY)
}

// NEU: Diese Funktion prüft, ob ein Spielstand existiert.
export const checkIfSaveFileExists = () => {
  return localStorage.getItem(SAVE_KEY) !== null
}
