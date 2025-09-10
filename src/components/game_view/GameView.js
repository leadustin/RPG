import React from 'react';
import { PartyPortraits } from './PartyPortraits';
import ActionBar from './ActionBar';
import { WorldMap } from '../worldmap/WorldMap';
import { CombatLog } from '../combat/CombatLog';
import './GameView.css';

function GameView({ onToggleCharacterSheet }) {
  const party = [
    { id: 'char1', name: 'Kämpfer', hp: 10, maxHp: 12, portrait: 'https://via.placeholder.com/50' },
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
          {/* NEU: Wrapper für das Seitenverhältnis */}
          <div className="world-map-aspect-ratio-wrapper">
            <WorldMap />
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