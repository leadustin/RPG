// src/components/game_view/GameView.js

import React from "react";
import { PartyPortraits } from "./PartyPortraits";
import ActionBar from "./ActionBar";
import { WorldMap } from "../worldmap/WorldMap";
import { CombatLog } from "../combat/CombatLog";
import "./GameView.css";

function GameView({
  character,
  onToggleCharacterSheet,
  onEnterLocation,
  onSaveGame,
  onLoadGame,
  onUpdatePosition,
  saveFileExists, // <--- 1. HIER PROP EMPFANGEN
}) {
  if (!character || !character.stats) {
    return <div>Lade Charakterdaten...</div>;
  }

  const party = [
    {
      id: "player",
      name: character.name,
      hp: character.stats.hp,
      maxHp: character.stats.maxHp,
      portrait: character.portrait,
    },
  ];

  return (
    <div className="game-view-container">
      <div className="top-section">
        <div className="party-portraits-area">
          <PartyPortraits party={party} />
        </div>
        <div className="world-map-area">
          <WorldMap
            character={character}
            onEnterLocation={onEnterLocation}
            onUpdatePosition={onUpdatePosition}
          />
        </div>
      </div>

      <div className="bottom-section">
        <div className="log-area">
          <CombatLog />
        </div>
        <div className="action-bar-area">
          <ActionBar
            character={character}
            onToggleCharacterSheet={onToggleCharacterSheet}
            onSaveGame={onSaveGame}
            onLoadGame={onLoadGame}
            saveFileExists={saveFileExists} // <--- 2. HIER PROP WEITERGEBEN
          />
        </div>
      </div>
    </div>
  );
}

export default GameView;