// src/utils/persistence.js

const AUTOSAVE_STORAGE_KEY = "rpg_autosave";
const MAX_SLOTS = 5;
const SLOT_PREFIX = "rpg_save_slot_";

// --- Autosave Funktionen ---

export const saveAutoSave = (state) => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(AUTOSAVE_STORAGE_KEY, serializedState);
  } catch (e) {
    console.warn("Could not save autosave", e);
  }
};

export const loadAutoSave = () => {
  try {
    const serializedState = localStorage.getItem(AUTOSAVE_STORAGE_KEY);
    if (serializedState === null) {
      return undefined;
    }
    return JSON.parse(serializedState);
  } catch (e) {
    console.warn("Could not load autosave", e);
    return undefined;
  }
};

export const deleteAutoSave = () => {
  try {
    localStorage.removeItem(AUTOSAVE_STORAGE_KEY);
  } catch (e) {
    console.warn("Could not delete autosave", e);
  }
};

// --- Manuelle Save Slot Funktionen (Bestehend) ---

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
    gameState, // Wichtig: Wir speichern den *gesamten* gameState
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