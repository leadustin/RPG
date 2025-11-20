// src/dnd/itemTypes.js
export const ItemTypes = {
  // --- Ausrüstung ---
  WEAPON: 'weapon',
  ARMOR: 'armor',
  SHIELD: 'shield',
  HEAD: 'head',
  HANDS: 'hands',
  BOOTS: 'boots',
  BELT: 'belt',
  ACCESSORY: 'accessory',
  CLOTH: 'cloth',       // Wichtig: heißt 'cloth', nicht 'clothing'
  AMMO: 'ammo',         // Neu: Für Pfeile/Bolzen

  // --- Verbrauchsgüter & Sonstiges ---
  POTION: 'potion',     // Neu: Tränke, Öle, Gifte
  SCROLL: 'scroll',     // Neu: Schriftrollen
  FOOD: 'food',         // Neu: Rationen
  TOOL: 'tool',         // Neu: Werkzeuge, Instrumente
  RESOURCE: 'resource', // Neu: Materialien, Camping-Ausrüstung
  LOOT: 'loot',         // Neu: Verkaufsgüter (Edelsteine, Gold)
  QUEST: 'quest',       // Neu: Quest-Items
  
  // --- Fallback ---
  ITEM: 'item'          // Generisches
};