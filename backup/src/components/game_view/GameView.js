import React from 'react';
import { PartyPortraits } from './PartyPortraits';
import ActionBar from './ActionBar';
import { WorldMap } from '../worldmap/WorldMap';
import { CombatLog } from '../combat/CombatLog';
import './GameView.css';

function GameView({ character, onToggleCharacterSheet }) {
  // Hinzugefügt: Eine Überprüfung, um sicherzustellen, dass der Charakter und seine Werte geladen sind.
  // Das verhindert den Absturz der Anwendung.
  if (!character || !character.stats) {
    return <div>Lade Charakterdaten...</div>;
  }

  // Die Party-Liste, jetzt mit deinem erstellten Charakter an erster Stelle.
  const party = [
    { 
      id: 'player', 
      name: character.name, 
      hp: character.stats.hp, 
      maxHp: character.stats.maxHp, 
      portrait: 'https://via.placeholder.com/50' 
    },
    // Die restlichen Mitglieder sind weiterhin Platzhalter.
    { id: 'char2', name: 'Magier', hp: 8, maxHp: 10, portrait: 'https://via.placeholder.com/50' },
    { id: 'char3', name: 'Schurke', hp: 12, maxHp: 12, portrait: 'https://via.placeholder.com/50' },
    { id: 'char4', name: 'Kleriker', hp: 9, maxHp: 10, portrait: 'https://via.placeholder.com/50' },
  ];

  return (
    <div className="game-view-container">
      <div className="top-section">
        <div className="party-portraits-area">
          <PartyPortraits party={party} />
        </div>
        <div className="world-map-area">
          <div className="world-map-aspect-ratio-wrapper">
            <WorldMap character={character} />
          </div>
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