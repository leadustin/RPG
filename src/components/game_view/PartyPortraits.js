import React from 'react';
import './PartyPortraits.css';

export const PartyPortraits = ({ party }) => {
  return (
    <div className="party-portraits-container">
      {party.map((member, index) => (
        <div key={index} className="portrait-slot">
          {member ? (
            <>
              <div className="portrait-image">
                {/* Das eigentliche Porträt-Bild kommt hierhin */}
              </div>
              <div className="health-bar-placeholder">
                {/* Zukünftige Lebensenergieanzeige */}
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
