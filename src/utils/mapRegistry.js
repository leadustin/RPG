// src/utils/mapRegistry.js

// 1. Lade ALLE JSON-Dateien aus dem Maps-Ordner (eager = sofort verfügbar machen)
const mapModules = import.meta.glob('../data/maps/*.json', { eager: true });

// 2. Erstelle ein sauberes Nachschlage-Objekt (Dictionary)
// Key: Dateiname ohne Endung (z.B. "Cave-Entrance")
// Value: Der JSON-Inhalt
const maps = {};

for (const path in mapModules) {
    // Pfad ist z.B. "../data/maps/Cave-Entrance.json"
    // Wir extrahieren "Cave-Entrance"
    const fileName = path.split('/').pop().replace('.json', '');
    maps[fileName] = mapModules[path].default || mapModules[path];
}

/**
 * Gibt die Kartendaten für eine bestimmte ID zurück.
 * @param {string} mapId - Der Dateiname der Karte (z.B. "Cave-Entrance")
 */
export const getMapData = (mapId) => {
    if (!maps[mapId]) {
        console.error(`Karte nicht gefunden: ${mapId}`);
        return null;
    }
    return maps[mapId];
};