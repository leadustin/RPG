// src/components/game_view/PartyPortraits.js
import React from 'react';
import './PartyPortraits.css';

// --- GEÄNDERT: Nimmt activeCharacterId und onSelectCharacter entgegen ---
export const PartyPortraits = ({ party, activeCharacterId, onSelectCharacter }) => {
  return (
    <div className="party-portraits-container">
      {party.map(member => {
        // Sicherstellen, dass HP-Daten vorhanden sind (für zukünftige Gefährten)
        const hp = member.stats?.hp ?? 10;
        const maxHp = member.stats?.maxHp ?? 10;
        
        return (
          <div 
            key={member.id} 
            // --- GEÄNDERT: Fügt 'active' Klasse und onClick Handler hinzu ---
            className={`portrait-item ${member.id === activeCharacterId ? 'active' : ''}`}
            onClick={() => onSelectCharacter(member.id)}
          >
            <img src={member.portrait} alt={member.name} className="character-portrait-img" />
            
            <div className="character-overlay">
              <span className="name">{member.name}</span>
              <div className="hp-bar-wrapper">
                <div 
                  className="hp-bar" 
                  style={{ width: `${(hp / maxHp) * 100}%` }}
                ></div>
                <span className="hp-text">{`${hp} / ${maxHp}`}</span>
              </div>
            </div>

          </div>
        );
      })}
    </div>
  );
};