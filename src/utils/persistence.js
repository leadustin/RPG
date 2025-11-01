// src/utils/persistence.js

const CHARACTER_STORAGE_KEY = "rpg_character";
const GAME_STATE_STORAGE_KEY = "rpg_game_state";

// --- Bestehende Funktionen ---
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
    localStorage.removeItem(GAME_STATE_STORAGE_KEY);
  } catch (e) {
    console.warn("Could not delete character", e);
  }
};

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

// =========== FUNKTIONEN FÜR SAVE SLOT MANAGER ===========

const MAX_SLOTS = 5;
const SLOT_PREFIX = "rpg_save_slot_";

export const getSaveSlots = () => {
  const slots = [];
  for (let i = 0; i < MAX_SLOTS; i++) {
    const slotData = localStorage.getItem(`${SLOT_PREFIX}${i}`);
    slots.push(slotData ? JSON.parse(slotData) : null);
  }
  return slots;
};

export const saveToSlot = (slotId, gameState, name) => {
  if (slotId < 0 || slotId >= MAX_SLOTS) {
    console.error("Invalid slot ID");
    return;
  }
  const data = {
    name,
    timestamp: new Date().toISOString(),
    gameState,
  };
  localStorage.setItem(`${SLOT_PREFIX}${slotId}`, JSON.stringify(data));
};

export const loadFromSlot = (slotId) => {
  const slotData = localStorage.getItem(`${SLOT_PREFIX}${slotId}`);
  return slotData ? JSON.parse(slotData) : null;
};

export const deleteSlot = (slotId) => {
  localStorage.removeItem(`${SLOT_PREFIX}${slotId}`);
};
