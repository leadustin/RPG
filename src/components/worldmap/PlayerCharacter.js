// src/components/worldmap/PlayerCharacter.js
import React, { forwardRef } from 'react';
import './PlayerCharacter.css';

const PlayerCharacter = forwardRef((props, ref) => {
  return (
    <div ref={ref} className="player-character">
      <img src="https://placeholder.pics/svg/16x16.svg" alt="Player Character" />
    </div>
  );
});

export default PlayerCharacter;