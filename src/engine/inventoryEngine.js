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
  // D&D 2024: Hintergründe geben spezifische Items + 50 GP
  if (character && character.background) {
    const bgList = Array.isArray(backgroundsData) ? backgroundsData : Object.values(backgroundsData);
    const backgroundDef = bgList.find(bg => bg.key === character.background.key);

    if (backgroundDef) {
      // A) Ausrüstung aus dem Hintergrund laden
      if (backgroundDef.equipment) {
        backgroundDef.equipment.forEach(bgItem => {
          // Falls in backgrounds.json "id" oder "item_id" steht, hier abfangen:
          const itemId = bgItem.id || bgItem.item_id; 
          const qty = bgItem.quantity || 1;
          
          if (itemId === 'gold') {
             totalGold += qty;
          } else {
             addItemToInventory(inventory, itemId, qty);
          }
        });
      }

      // B) Startgold des Hintergrunds (D&D 2024 gibt meist 50 GP)
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