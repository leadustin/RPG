import React, { useState, useEffect } from "react";
import { PartyPortraits } from "./PartyPortraits";
import ActionBar from "./ActionBar";
import { WorldMap } from "../worldmap/WorldMap";
import RestMenu from "./RestMenu";
import "./GameView.css";

function GameView({
  character,
  onToggleCharacterSheet,
  onEnterLocation,
  onSaveGame,
  onLoadGame,
  onUpdatePosition,
  onDiscoverLocation,
  saveFileExists,
  onShortRest,
  onLongRest
}) {

  // --- KORREKTUR: Hooks an den Anfang verschoben ---
  // Initialisiere den State mit der ID des Charakters (falls vorhanden) oder einem Fallback.
  const [activeCharacterId, setActiveCharacterId] = useState(character?.id || 'player');
  const [showRestMenu, setShowRestMenu] = useState(false);

  // Effekt, um die aktive ID zu aktualisieren, wenn der Hauptcharakter wechselt
  // (z.B. beim Laden eines neuen Spiels).
  useEffect(() => {
    // Synchronisiere die activeCharacterId mit der ID des Hauptcharakters.
    const mainCharacterId = character?.id || 'player';
    setActiveCharacterId(mainCharacterId);
  }, [character?.id]); // Abhängig nur von der ID des Hauptcharakters

  // --- FRÜHERER RETURN (BLEIBT GLEICH) ---
  // Diese Prüfung ist jetzt sicher, da die Hooks davor aufgerufen wurden.
  if (!character || !character.stats) {
    return <div>Lade Charakterdaten...</div>;
  }

  // --- Party-Erstellung (Bleibt gleich) ---
  const playerCharacter = { ...character, id: character.id || 'player' };
  const party = [
    playerCharacter,
    // Zukünftige Partymitglieder kommen hierhin
  ];

  // --- Aktiven Charakter finden (Bleibt gleich) ---
  // Wir können activeCharacterId sicher verwenden, da es durch useState/useEffect verwaltet wird.
  const activeCharacter = party.find(m => m.id === activeCharacterId) || playerCharacter;


  return (
    <div className="game-view-container">
      <div className="top-section">
        <div className="party-portraits-area">
          <PartyPortraits
            party={party}
            activeCharacterId={activeCharacterId} // Benutze die State-ID
            onSelectCharacter={setActiveCharacterId} // Erlaube Klicks, dies zu ändern
          />
        </div>
        <div className="world-map-area">
          <WorldMap
            character={character}
            onEnterLocation={onEnterLocation}
            onUpdatePosition={onUpdatePosition}
            onDiscoverLocation={onDiscoverLocation}
          />
        </div>
      </div>

      <div className="bottom-section">
        <div className="action-bar-area">
          <ActionBar
            character={activeCharacter}
            onToggleCharacterSheet={onToggleCharacterSheet}
            onSaveGame={onSaveGame}
            onLoadGame={onLoadGame}
            saveFileExists={saveFileExists}
            onRestClick={() => setShowRestMenu(true)}
          />
        </div>
      </div>

      {showRestMenu && (
        <RestMenu
          character={activeCharacter}
          onShortRest={(dice) => {
            onShortRest(dice);
          }}
          onLongRest={() => {
            onLongRest();
            setShowRestMenu(false);
          }}
          onClose={() => setShowRestMenu(false)}
        />
      )}
    </div>
  );
}

export default GameView;