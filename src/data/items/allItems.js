// src/data/items/allItems.js

// Importiere alle einzelnen Item-Kategorien
import accessories from './accessories.json';
import armor from './armor.json';
import belts from './belts.json';
import boots from './boots.json';
import clothes from './clothes.json';
import hands from './hands.json';
import heads from './heads.json';
import genericItems from './items.json'; // umbenannt, um Konflikte zu vermeiden
import weapons from './weapons.json';

// Führe alle Items in einem einzigen Objekt zusammen.
// Der "key" aus der JSON-Datei wird zum Hauptschlüssel im Objekt.
const allItems = {
  ...Object.fromEntries(accessories.map(item => [item.key, item])),
  ...Object.fromEntries(armor.map(item => [item.key, item])),
  ...Object.fromEntries(belts.map(item => [item.key, item])),
  ...Object.fromEntries(boots.map(item => [item.key, item])),
  ...Object.fromEntries(clothes.map(item => [item.key, item])),
  ...Object.fromEntries(hands.map(item => [item.key, item])),
  ...Object.fromEntries(heads.map(item => [item.key, item])),
  ...Object.fromEntries(genericItems.map(item => [item.key, item])),
  ...Object.fromEntries(weapons.map(item => [item.key, item])),
};

// Funktion, um ein Item anhand seines Namens (oder Schlüssels) zu finden
export const getItem = (identifier) => {
  // Zuerst nach Schlüssel suchen (am zuverlässigsten)
  if (allItems[identifier]) {
    return allItems[identifier];
  }
  // Dann nach Namen suchen (für die Texte aus der Ausrüstung)
  return Object.values(allItems).find(item => item.name === identifier);
};

export default allItems;