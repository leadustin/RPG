// src/components/worldmap/PlayerCharacter.js
import React from 'react';
import './PlayerCharacter.css';

const PlayerCharacter = ({ position }) => {
  return (
    <div
      className="player-character"
      style={{
        top: `${position.y}px`,
        left: `${position.x}px`,
      }}
    >
      <img src="https://placeholder.pics/svg/16x16.svg" alt="Player Character" />
    </div>
  );
};

export default PlayerCharacter;