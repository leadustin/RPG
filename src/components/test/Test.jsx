// src/components/test/Test.jsx
import React, { useMemo } from 'react';
import './Test.css';

// Bilder importieren (Beispiel: Nimmt das erste gefundene Bild als Portrait)
const portraitModules = import.meta.glob('../../assets/images/portraits/human/male/*.webp', { eager: true });

// Hilfsfunktion für Attributs-Modifikatoren (z.B. 16 -> +3)
const getModifier = (score) => {
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
};

const Test = ({ onClose }) => {
    
    // Dummy Daten für das CharacterSheet (wird später durch echte Props ersetzt)
    const character = useMemo(() => {
        const portraitPath = Object.keys(portraitModules)[0];
        const portraitSrc = portraitPath ? portraitModules[portraitPath].default : null;

        return {
            name: "Valerius",
            race: { name: "Mensch" },
            class: { name: "Krieger" },
            level: 3,
            attributes: {
                strength: 16,
                dexterity: 14,
                constitution: 15,
                intelligence: 10,
                wisdom: 12,
                charisma: 8
            },
            hp: { current: 28, max: 28 },
            ac: 16,
            portrait: portraitSrc
        };
    }, []);

    // Mapping für die Anzeige der Attribute
    const attributesList = [
        { key: 'strength', label: 'Stärke' },
        { key: 'dexterity', label: 'Geschick' },
        { key: 'constitution', label: 'Konst.' },
        { key: 'intelligence', label: 'Intell.' },
        { key: 'wisdom', label: 'Weisheit' },
        { key: 'charisma', label: 'Charisma' },
    ];

    return (
        <div className="character-view-overlay" onClick={onClose}>
            <div className="character-view-container" onClick={(e) => e.stopPropagation()}>
                
                {/* --- LINKE SPALTE: Portrait & Basiswerte --- */}
                <div className="character-view-box">
                    
                    {/* 1. Portrait & Info */}
                    <div className="cv-portrait-section">
                        <div className="cv-portrait-frame">
                            {character.portrait ? (
                                <img src={character.portrait} alt="Portrait" className="cv-portrait-image" />
                            ) : (
                                <div style={{width:'100%', height:'100%', background:'#222'}} />
                            )}
                        </div>
                        <div className="cv-character-name">{character.name}</div>
                        <div className="cv-character-details">
                            Stufe {character.level} {character.race.name} {character.class.name}
                        </div>
                    </div>

                    {/* 2. Vitals (HP & AC) */}
                    <div className="cv-vitals-container">
                        <div className="cv-vital-box">
                            <span className="cv-vital-value" style={{color: '#e05050'}}>
                                {character.hp.current}/{character.hp.max}
                            </span>
                            <span className="cv-vital-label">Leben</span>
                        </div>
                        <div className="cv-vital-box">
                            <span className="cv-vital-value" style={{color: '#ffd700'}}>
                                {character.ac}
                            </span>
                            <span className="cv-vital-label">RK</span>
                        </div>
                    </div>

                    {/* 3. Attribute */}
                    <div className="cv-stats-grid">
                        {attributesList.map((attr) => {
                            const val = character.attributes[attr.key];
                            return (
                                <div key={attr.key} className="cv-stat-row">
                                    <span className="cv-stat-label">{attr.label}</span>
                                    <div className="cv-stat-value-group">
                                        <span className="cv-stat-score">{val}</span>
                                        <span className="cv-stat-modifier">{getModifier(val)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                </div>

                {/* --- RECHTE SPALTE: Details & Tabs (Platzhalter) --- */}
                <div className="character-view-box">
                    <div className="cv-right-placeholder">
                        Rechter Bereich (Tabs folgen...)
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Test;