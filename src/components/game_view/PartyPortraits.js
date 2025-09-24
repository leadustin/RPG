// src/components/game_view/PartyPortraits.js
import React from 'react';
import './PartyPortraits.css';

export const PartyPortraits = ({ party }) => {
  return (
    <div className="party-portraits-container">
      {party.map(member => (
        <div key={member.id} className="portrait-item">
          <img src={member.portrait} alt={member.name} className="character-portrait-img" />
          
          {/* --- NEU: Overlay für Name und HP --- */}
          <div className="character-overlay">
            <span className="name">{member.name}</span>
            <div className="hp-bar-wrapper">
              <div 
                className="hp-bar" 
                style={{ width: `${(member.hp / member.maxHp) * 100}%` }}
              ></div>
              <span className="hp-text">{`${member.hp} / ${member.maxHp}`}</span>
            </div>
          </div>

        </div>
      ))}
    </div>
  );
};