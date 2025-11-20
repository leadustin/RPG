// src/engine/inventoryEngine.js
import backgroundsData from '../data/backgrounds.json';
import itemsData from '../data/items/items.json'; // Optional: Falls Sie Stats nachschlagen wollen

/**
 * Erstellt das Startinventar basierend auf den Entscheidungen des Spielers.
 * @param {Object} character - Das Charakter-Objekt aus der Erstellung
 * @returns {Object} { inventory: Array, wallet: Object }
 */
export const initializeInventory = (character) => {
  const inventory = [];
  const wallet = { gold: 0, silver: 0, copper: 0 };

  if (!character || !character.background) {
    return { inventory, wallet };
  }

  // 1. Hintergrund-Daten laden
  const bgList = Array.isArray(backgroundsData) ? backgroundsData : Object.values(backgroundsData);
  const backgroundDef = bgList.find(bg => bg.key === character.background.key);

  if (!backgroundDef) {
    console.warn(`Hintergrund-Definition nicht gefunden für: ${character.background.key}`);
    return { inventory, wallet };
  }

  // 2. Ausrüstungswahl ermitteln (Standard: 'a')
  const optionId = character.background_options?.equipmentOption || 'a';
  const equipmentOption = backgroundDef.equipment_options?.find(opt => opt.id === optionId);

  // 3. Items hinzufügen
  if (equipmentOption) {
    equipmentOption.items.forEach(itemEntry => {
      // Fall A: Gold
      if (itemEntry.item_id === 'gold') {
        wallet.gold += itemEntry.quantity;
      } 
      // Fall B: Gegenstände
      else {
        addItemToInventory(inventory, itemEntry.item_id, itemEntry.quantity);
      }
    });
  }

  // 4. (Optional) Klassen-Ausrüstung hier hinzufügen
  // ...

  return { inventory, wallet };
};

/**
 * Hilfsfunktion: Fügt Item zum Inventar hinzu (oder stapelt es)
 */
const addItemToInventory = (inventory, itemId, quantity) => {
  const existingItem = inventory.find(i => i.itemId === itemId);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    inventory.push({
      instanceId: crypto.randomUUID(), // Eindeutige ID für diese Instanz
      itemId: itemId,
      quantity: quantity,
      equipped: false
    });
  }
};