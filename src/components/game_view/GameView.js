import React from "react";
import { PartyPortraits } from "./PartyPortraits";
import ActionBar from "./ActionBar";
import { WorldMap } from "../worldmap/WorldMap";
import { CombatLog } from "../combat/CombatLog";
import "./GameView.css";

function GameView({ character, onToggleCharacterSheet }) {
  // Überprüfung, um sicherzustellen, dass der Charakter und seine Werte geladen sind.
  if (!character || !character.stats) {
    return <div>Lade Charakterdaten...</div>;
  }

  // Die Party-Liste enthält jetzt nur noch den Spielercharakter.
  // Sie kann in Zukunft dynamisch mit weiteren Charakteren erweitert werden.
  const party = [
    {
      id: "player",
      name: character.name,
      hp: character.stats.hp,
      maxHp: character.stats.maxHp,
      portrait: character.portrait, // Hier wird das korrekte Portrait verwendet
    },
  ];

  return (
    <div className="game-view-container">
      <div className="top-section">
        <div className="party-portraits-area">
          <PartyPortraits party={party} />
        </div>
        <div className="world-map-area">
          <WorldMap character={character} />
        </div>
      </div>

      <div className="bottom-section">
        <div className="log-area">
          <CombatLog />
        </div>
        <div className="action-bar-area">
          <ActionBar onToggleCharacterSheet={onToggleCharacterSheet} />
        </div>
      </div>
    </div>
  );
}

export default GameView;