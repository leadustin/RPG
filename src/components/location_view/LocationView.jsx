import React from 'react';
import './LocationView.css';
import locationsData from '../../data/locations.json';

const LocationView = ({ locationId, onLeaveLocation }) => {
    const location = locationsData.find(loc => loc.id === locationId);

    if (!location) {
        return (
            <div className="location-view">
                <h1>Unbekannter Ort</h1>
                <p>Dieser Ort existiert nicht.</p>
                <button onClick={onLeaveLocation}>Zurück zur Weltkarte</button>
            </div>
        );
    }
    
    const viewType = location.type === 'city' ? 'Stadt' : 'Dungeon';

    return (
        <div className={`location-view ${location.type}`}>
            <h1>Willkommen in {location.name}</h1>
            <p>({viewType})</p>
            <p>Dies ist ein Platzhalter. Hier könnten Händler, Quests und andere Interaktionen stattfinden.</p>
            <button onClick={onLeaveLocation}>Ort verlassen</button>
        </div>
    );
};

export default LocationView;
