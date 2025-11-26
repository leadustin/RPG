// src/components/test/Test.jsx
import React, { useState } from 'react';
import './Test.css';

const Test = ({ onClose }) => {
    // Dummy Daten für das Menü
    const dummyData = [
        { id: 'stats', title: 'Attribute', icon: '💪', description: 'Deine körperlichen und geistigen Grundwerte.' },
        { id: 'skills', title: 'Fertigkeiten', icon: '🎭', description: 'Was du gelernt hast und worin du gut bist.' },
        { id: 'equipment', title: 'Ausrüstung', icon: '🎒', description: 'Waffen, Rüstungen und Gegenstände in deinem Besitz.' },
        { id: 'spells', title: 'Zauberbuch', icon: '📖', description: 'Deine bekannten und vorbereiteten Zaubersprüche.' },
        { id: 'features', title: 'Merkmale', icon: '✨', description: 'Besondere Fähigkeiten durch Klasse und Volk.' },
        { id: 'bio', title: 'Biografie', icon: '📜', description: 'Deine Geschichte, Persönlichkeit und Aussehen.' },
    ];

    const [selectedId, setSelectedId] = useState(dummyData[0].id);
    const activeItem = dummyData.find(item => item.id === selectedId);

    return (
        <div className="character-view-overlay">
            {/* Header */}
            <div className="character-view-header">
                <h2>Character View</h2>
                <button className="character-view-close-btn" onClick={onClose}>
                    Schließen
                </button>
            </div>

            {/* Hauptcontainer (Analog zu class-selection-container) */}
            <div className="character-view-container">
                
                {/* Linkes Panel: Grid Auswahl (Analog zu class-grid + class-summary-box) */}
                <div className="character-view-box character-view-grid-box">
                    {dummyData.map((item) => (
                        <button 
                            key={item.id} 
                            onClick={() => setSelectedId(item.id)}
                            className={`character-view-button ${selectedId === item.id ? 'selected' : ''}`}
                        >
                            <div className="character-view-icon">
                                {item.icon}
                            </div>
                            <span>{item.title}</span>
                        </button>
                    ))}
                </div>

                {/* Rechtes Panel: Details (Analog zu class-details + class-summary-box) */}
                <div className="character-view-box character-view-details-box">
                    {activeItem ? (
                        <>
                            <h3>{activeItem.title}</h3>
                            <p className="character-view-description">{activeItem.description}</p>
                            
                            <div className="character-view-content-text">
                                <p>Hier würden nun die detaillierten Informationen zu <strong>{activeItem.title}</strong> stehen.</p>
                                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus lacinia odio vitae vestibulum vestibulum. Cras venenatis euismod malesuada.</p>
                                <ul>
                                    <li>Detailpunkt 1</li>
                                    <li>Detailpunkt 2</li>
                                    <li>Wichtiger Wert: 15</li>
                                </ul>
                            </div>
                        </>
                    ) : (
                        <p className="character-view-description">Bitte wähle eine Kategorie aus.</p>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Test;