import React from 'react';
import './PartyPortraits.css';

export const PartyPortraits = ({ party }) => {
  return (
    <div className="party-portraits-container">
      {party.map(member => (
        <div key={member.id} className="portrait-item">
          <img src={member.portrait} alt={member.name} />
          <div className="character-info">
            <span className="name">{member.name}</span>
            <div className="hp-bar-wrapper">
              <div className="hp-bar" style={{ width: `${(member.hp / member.maxHp) * 100}%` }}></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};