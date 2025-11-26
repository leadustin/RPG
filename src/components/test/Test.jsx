// src/components/test/Test.jsx
import React, { useState, useEffect } from 'react';
import './Test.css';

const Test = ({ onClose, character, party = [] }) => {
    
    const [displayCharacter, setDisplayCharacter] = useState(character);

    useEffect(() => {
        if (character) {
            setDisplayCharacter(character);
        }
    }, [character]);

    const currentParty = party.length > 0 ? party : (character ? [character] : []);

    if (!displayCharacter) return null;

    return (
        <div className="character-view-overlay" onClick={onClose}>
            <div className="character-view-container" onClick={(e) => e.stopPropagation()}>
                
                {/* --- LINKE SPALTE: Portraits --- */}
                <div className="character-view-box cv-sidebar">
                    {currentParty.map((member) => {
                        const isActive = member.id === displayCharacter.id || (member.name === displayCharacter.name);
                        
                        return (
                            <div 
                                key={member.id || member.name}
                                className={`cv-portrait-wrapper ${isActive ? 'active' : ''}`}
                                onClick={() => setDisplayCharacter(member)}
                            >
                                <div className="cv-portrait-frame">
                                    {member.portrait ? (
                                        <img 
                                            src={member.portrait} 
                                            alt={member.name} 
                                            className="cv-portrait-image" 
                                        />
                                    ) : (
                                        <div className="cv-portrait-placeholder">?</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* --- RECHTE SPALTE: Details --- */}
                <div className="character-view-box">
                    <div className="cv-right-placeholder">
                        <h2>{displayCharacter.name}</h2>
                        <p>Hier folgen die Details für {displayCharacter.name}...</p>
                        <p style={{fontSize: '0.8em'}}>(Klasse: {displayCharacter.class?.name})</p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Test;