// src/utils/itemLoader.js
import itemsData from '../data/items/items.json';
import weaponsData from '../data/items/weapons.json';
import armorData from '../data/items/armor.json';
import backgroundItemsData from '../data/items/background_items.json';

// Alle Items in eine Map laden für schnellen Zugriff
const allItems = [
  ...itemsData,
  ...weaponsData,
  ...armorData,
  ...backgroundItemsData
];

export const getItemById = (id) => {
  if (!id) return null;

  // 1. Direkter Treffer
  let found = allItems.find(i => i.id === id);
  if (found) return found;

  // 2. Fallback: "_" vs "-" Austausch (z.B. background sagt "light_crossbow", weapon.json hat "light-crossbow")
  const altId = id.includes('_') ? id.replace(/_/g, '-') : id.replace(/-/g, '_');
  found = allItems.find(i => i.id === altId);

  if (found) return found;

  // 3. Nicht gefunden -> Platzhalter zurückgeben, damit die App nicht crasht
  console.warn(`Item nicht gefunden: ${id}`);
  return {
    id: id,
    name: `Unbekannt (${id})`,
    type: "unknown",
    icon: "placeholder_item.webp",
    weight: 0,
    value: 0
  };
};

export const getAllItems = () => allItems;