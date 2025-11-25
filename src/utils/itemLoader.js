import weapons from '../data/items/weapons.json';
import armor from '../data/items/armor.json';
import tools from '../data/items/tools.json';
import adventuringGear from '../data/items/adventuring_gear.json';
import magicItems from '../data/items/magic_items.json';
import loot from '../data/items/loot.json';
import packs from '../data/items/packs.json';

// Wir führen alle Listen zu einer großen "Master-Liste" zusammen
const allItems = [
  ...weapons,
  ...armor,
  ...tools,
  ...adventuringGear,
  ...magicItems,
  ...loot,
  ...packs
];

// Erstellt eine Map für schnellen Zugriff per ID (z.B. itemsMap.get('dagger'))
export const itemsMap = new Map(allItems.map(item => [item.id, item]));

/**
 * Sucht ein Item anhand seiner ID.
 * @param {string} id - Die ID des Items (z.B. "dagger").
 * @returns {object|undefined} Das Item-Objekt oder undefined.
 */
export const getItem = (id) => {
  return itemsMap.get(id);
};

/**
 * Gibt alle Items einer bestimmten Kategorie zurück.
 * @param {string} type - Der Typ (z.B. "weapon", "armor", "tool").
 * @returns {array} Array von Items.
 */
export const getItemsByType = (type) => {
  return allItems.filter(item => item.type === type);
};

export default allItems;