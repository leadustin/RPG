// src/utils/imageRegistry.js

// WICHTIG: Wir laden jetzt aus 'battlemaps', nicht aus 'map'!
const imageModules = import.meta.glob('../assets/images/battlemaps/*.(png|jpg|jpeg|webp)', { eager: true });

const mapImages = {};

for (const path in imageModules) {
    // Extrahiere den Dateinamen (z.B. "Cave-Entrance.jpg")
    // Der Pfad ist z.B. "../assets/images/battlemaps/Cave-Entrance.jpg"
    const fileName = path.split('/').pop();
    
    // Speichere das importierte Bild unter dem Dateinamen
    mapImages[fileName] = imageModules[path].default;
}

/**
 * Findet die importierte Bild-URL anhand des Dateinamens.
 * * Tiled speichert Pfade oft relativ (z.B. "../../images/battlemaps/Cave.jpg").
 * Diese Funktion ignoriert den Pfad und sucht nur nach "Cave.jpg" in unserem geladenen Ordner.
 * * @param {string} rawPath - Der Pfad, der in der Tiled-JSON steht
 */
export const getMapImageUrl = (rawPath) => {
    if (!rawPath) return null;
    
    // Wir schneiden alles vor dem letzten '/' weg, um nur den Dateinamen zu erhalten
    const fileName = rawPath.split('/').pop();
    
    const image = mapImages[fileName];
    
    if (!image) {
        console.warn(`Battlemap-Bild nicht gefunden: ${fileName}. Hast du es in src/assets/images/battlemaps/ abgelegt?`);
    }
    
    return image || null;
};