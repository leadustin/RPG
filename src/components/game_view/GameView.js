import React from "react";
import { PartyPortraits } from "./PartyPortraits";
import ActionBar from "./ActionBar";
import { WorldMap } from "../worldmap/WorldMap";
import { CombatLog } from "../combat/CombatLog";
import "./GameView.css";

// Props erweitert um onSaveGame und onLoadGame
function GameView({ 
  character, 
  onToggleCharacterSheet, 
  onEnterLocation, 
  onSaveGame, 
  onLoadGame 
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
          {/* Die 'onEnterLocation' prop wird jetzt an WorldMap weitergegeben */}
          <WorldMap character={character} onEnterLocation={onEnterLocation} />
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
          />
        </div>
      </div>
    </div>
  );
}

export default GameView;