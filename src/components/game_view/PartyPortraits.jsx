// src/components/game_view/PartyPortraits.jsx
import React from 'react';
import './PartyPortraits.css';

// Hilfsfunktion für Portrait-Bilder
const portraitImages = import.meta.glob('../../assets/images/portraits/**/*.webp', { eager: true, import: 'default' });

const getPortraitModule = (raceKey, gender, portraitIndex) => {
    // Fallback, falls raceKey nicht existiert (z.B. bei Initialisierung)
    if (!raceKey) return null;
    
    const genderString = gender === 'male' ? 'male' : 'female';
    const path = `../../assets/images/portraits/${raceKey}/${genderString}/${portraitIndex}.webp`;
    return portraitImages[path];
};

export const PartyPortraits = ({ party, activeCharacterId, onSelectCharacter }) => {
  if (!party) return null;

  return (
    <div className="party-portraits-container">
      {party.map((char, index) => {
        // Bestimme das Bild
        let imgSrc = char.portrait;
        if (!imgSrc && char.race) {
            // Fallback: Versuche Bild dynamisch zu laden, falls nicht im Char gespeichert
            imgSrc = getPortraitModule(char.race.key, char.gender, 1); 
        }

        return (
          <div 
            key={char.id || index} // <--- HIER WAR DER FEHLER (Key hinzugefügt)
            className={`portrait-wrapper ${char.id === activeCharacterId ? 'active' : ''}`}
            onClick={() => onSelectCharacter(char.id || 'player')}
          >
            {imgSrc ? (
                <img src={imgSrc} alt={char.name} className="portrait-image" />
            ) : (
                <div className="portrait-placeholder">{char.name?.charAt(0)}</div>
            )}
            
            {/* Mini HP Bar */}
            <div className="mini-hp-bar">
                <div 
                    className="mini-hp-fill" 
                    style={{ width: `${(char.stats.hp / char.stats.maxHp) * 100}%` }}
                />
            </div>
          </div>
        );
      })}
    </div>
  );
};