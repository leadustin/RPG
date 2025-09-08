import React from 'react';
import './PartyPortraits.css';

export const PartyPortraits = ({ party }) => {
  return (
    <div className="party-portraits-container">
      {party.map((member, index) => (
        <div key={index} className="portrait-slot">
          {member ? (
            <>
              <div className="portrait-image-placeholder"></div>
              <div className="portrait-info">
                <span>{member.name}</span>
                {/* Hier könnten später HP-Balken etc. hin */}
              </div>
            </>
          ) : (
            <div className="portrait-empty">Leerer Platz</div>
          )}
        </div>
      ))}
    </div>
  );
};
