// src/components/game_view/GameView.jsx
import React, { useState, useEffect } from "react";
import { PartyPortraits } from "./PartyPortraits";
import ActionBar from "./ActionBar";
import { WorldMap } from "../worldmap/WorldMap";
import RestMenu from "./RestMenu";
import LocationView from "../location_view/LocationView";
import locationsData from "../../data/locations.json";
import "./GameView.css";

function GameView({
  character,
  onToggleCharacterSheet,
  // +++ NEU: Prop empfangen +++
  onToggleCss,
  onEnterLocation,
  onSaveGame,
  onLoadGame,
  onUpdatePosition,
  onDiscoverLocation,
  saveFileExists,
  onShortRest,
  onLongRest,
  onShopTransaction
}) {

  const [activeCharacterId, setActiveCharacterId] = useState(character?.id || 'player');
  const [showRestMenu, setShowRestMenu] = useState(false);

  useEffect(() => {
    const mainCharacterId = character?.id || 'player';
    setActiveCharacterId(mainCharacterId);
  }, [character?.id]);

  const isAtLocation = character?.currentLocation && character.currentLocation !== "worldmap";

  const party = character ? [character] : [];
  const activeCharacter = party.find(c => (c.id || 'player') === activeCharacterId) || character;

  return (
    <div className="game-view-container">
      <div className="top-section">
        <div className="party-portraits-area">
          <PartyPortraits
            party={party}
            activeCharacterId={activeCharacterId}
            onSelectCharacter={setActiveCharacterId}
          />
        </div>
        
        <div className="world-map-area">
           {isAtLocation ? (
              <LocationView 
                  locationId={character.currentLocation}
                  character={character}
                  onLeaveLocation={() => onEnterLocation("worldmap", character.worldMapPosition)}
                  onShopTransaction={onShopTransaction}
              />
           ) : (
              <WorldMap
                character={character}
                onEnterLocation={onEnterLocation}
                onUpdatePosition={onUpdatePosition}
                onDiscoverLocation={onDiscoverLocation}
              />
           )}
        </div>
      </div>

      <div className="bottom-section">
        <div className="action-bar-area">
          <ActionBar
            character={activeCharacter}
            onToggleCharacterSheet={onToggleCharacterSheet}
            // +++ NEU: Prop weitergeben +++
            onToggleCss={onToggleCss}
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