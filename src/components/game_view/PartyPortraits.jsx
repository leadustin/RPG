// src/components/game_view/PartyPortraits.js
import React from 'react';
import './PartyPortraits.css';

export const PartyPortraits = ({ party, activeCharacterId, onSelectCharacter }) => {
  return (
    <div className="party-portraits-container">
      {party.map(member => {
        // hp als Zahl auslesen, egal ob Object oder Number
        const rawHp = member.stats?.hp ?? 10;
        const hp = typeof rawHp === 'object' && rawHp.total !== undefined ? rawHp.total : rawHp;

        const maxHpRaw = member.stats?.maxHp ?? 10;
        const maxHp = typeof maxHpRaw === 'object' && maxHpRaw.total !== undefined ? maxHpRaw.total : maxHpRaw;

        return (
          <div 
            key={member.id} 
            className={`portrait-item ${member.id === activeCharacterId ? 'active' : ''}`}
            onClick={() => onSelectCharacter(member.id)}
            title={member.stats?.hpDetail ? `${member.stats.hpDetail.die} + Mod ${member.stats.hpDetail.bonus} = ${member.stats.hpDetail.total}` : undefined}
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
