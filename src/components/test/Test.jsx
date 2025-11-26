// src/components/test/Test.jsx
import React from 'react';
import './Test.css';
// Importiert den Inhalt von App.css als reinen Text (Vite Feature)
import appCssContent from '../../App.css?raw';

const Test = ({ onClose }) => {
    return (
        <div className="test-container">
            <div className="test-header">
                <h2>Haupt CSS (App.css)</h2>
                <button className="test-close-btn" onClick={onClose}>
                    Schließen
                </button>
            </div>
            <pre className="test-content">
                {appCssContent}
            </pre>
        </div>
    );
};

export default Test;