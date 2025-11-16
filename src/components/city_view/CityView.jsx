// src/components/city_view/CityView.js
import React from 'react';
import './CityView.css';

const CityView = ({ locationId, onLeaveLocation }) => {
    return (
        <div className="city-view">
            <h1>Willkommen in {locationId}</h1>
            <p>Dies ist ein Platzhalter für die Stadtansicht. Hier könnten Händler, Quests und andere Interaktionen stattfinden.</p>
            <button onClick={onLeaveLocation}>Ort verlassen</button>
        </div>
    );
};

export default CityView;