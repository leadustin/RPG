import React from 'react';
import './GameView.css';
import { WorldMap } from '../worldmap/WorldMap';
import { PartyPortraits } from './PartyPortraits';
import { ActionBar } from './ActionBar';

export const GameView = ({ character }) => {
  // Erstellen Sie eine Beispielgruppe, um die Porträts zu füllen
  const party = [character, null, null, null]; // Annahme: 3 leere Plätze

  return (
    <div className="game-view-container">
      <div className="portraits-area">
        <PartyPortraits party={party} />
      </div>
      <div className="main-content-area">
        {/* Die Weltkarte kommt hierhin */}
        <WorldMap character={character} />
      </div>
      <div className="action-bar-area">
        <ActionBar />
      </div>
    </div>
  );
};
