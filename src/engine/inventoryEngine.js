// src/engine/inventoryEngine.js
import backgroundsData from '../data/backgrounds.json';

// Wir importieren items.json NICHT mehr, da sie gelöscht wurde.
// Die IDs reichen uns hier. Die UI lädt die Details später über den itemLoader.

/**
 * Erstellt das finale Inventar aus Klassen- und Hintergrund-Ausrüstung.
 * @param {Object} character - Der Charakter mit gewählten Optionen
 * @param {Object} classStartingEquipment - Die Auswahl aus dem Class-Screen { type, gold, items: [] }
 * @returns {Object} { inventory: Array, gold: Number }
 */
export const initializeInventory = (character, classStartingEquipment) => {
  const inventory = [];
  let totalGold = 0;

  // 1. Klassen-Ausrüstung hinzufügen (aus deiner Auswahl im Screen)
  if (classStartingEquipment) {
    // Gold addieren
    totalGold += (classStartingEquipment.gold || 0);

    // Items addieren
    if (classStartingEquipment.items) {
      classStartingEquipment.items.forEach(item => {
        addItemToInventory(inventory, item.id, item.quantity || 1);
      });
    }
  }

  // 2. Hintergrund-Ausrüstung hinzufügen (aus backgrounds.json)
  if (character && character.background) {
    const bgList = Array.isArray(backgroundsData) ? backgroundsData : Object.values(backgroundsData);
    const backgroundDef = bgList.find(bg => bg.key === character.background.key);

    if (backgroundDef) {
      // FIX: Wir müssen "equipment_options" nutzen, nicht "equipment"
      
      // Welche Option hat der User gewählt? (Standard: 'a')
      // Falls du im Background-Screen noch keine Wahl eingebaut hast, ist 'a' der Default (Items).
      const selectedOptionId = character.background_choices?.equipmentOption || 'a'; 
      
      const equipmentOption = backgroundDef.equipment_options?.find(opt => opt.id === selectedOptionId);

      if (equipmentOption && equipmentOption.items) {
        equipmentOption.items.forEach(bgItem => {
          // In backgrounds.json heißt der Key "item_id"
          const itemId = bgItem.item_id || bgItem.id;
          const qty = bgItem.quantity || 1;

          if (itemId === 'gold') {
             totalGold += qty;
          } else {
             addItemToInventory(inventory, itemId, qty);
          }
        });
      }

      // Falls es noch ein festes "starting_gold" Feld im Root gibt (D&D 2024 oft 50gp bei Option B, aber hier ist es in den Options)
      if (backgroundDef.starting_gold) {
        totalGold += backgroundDef.starting_gold;
      }
    }
  }

  return { inventory, gold: totalGold };
};

/**
 * Hilfsfunktion: Fügt Item zum Inventar hinzu oder stapelt es, wenn es schon existiert.
 */
const addItemToInventory = (inventory, itemId, quantity) => {
  // Prüfen, ob Item schon da ist
  const existingItem = inventory.find(i => i.itemId === itemId);

  if (existingItem) {
    // Stapeln
    existingItem.quantity += quantity;
  } else {
    // Neu hinzufügen
    inventory.push({
      instanceId: crypto.randomUUID(), // Eindeutige ID für diese Instanz im Rucksack
      itemId: itemId,
      quantity: quantity,
      equipped: false
    });
  }
};