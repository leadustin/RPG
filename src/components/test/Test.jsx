// src/components/test/Test.jsx
import React from 'react';
import './Test.css';

const Test = ({ onClose }) => {
    return (
        // Klick auf den Hintergrund schließt das Overlay
        <div className="character-view-overlay" onClick={onClose}>
            {/* preventDefault verhindert, dass Klicks in die Boxen das Overlay schließen */}
            <div className="character-view-container" onClick={(e) => e.stopPropagation()}>
                
                {/* Linke Box (fest) */}
                <div className="character-view-box left-box"></div>

                {/* Rechte Box (flexibel) */}
                <div className="character-view-box right-box"></div>

            </div>
        </div>
    );
};

export default Test;