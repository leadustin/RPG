// src/components/location_view/LocationView.jsx
import React, { useState, useEffect } from "react";
import locationsData from "../../data/locations.json";
import shopsData from "../../data/shops.json";
import ShopScreen from "../shop/ShopScreen";
import "./LocationView.css";

function LocationView({ 
  locationId, 
  character, 
  onLeaveLocation, 
  onShopTransaction,
  onStartCombat 
}) {
  const [activeShopId, setActiveShopId] = useState(null);
  const [resolvedLocation, setResolvedLocation] = useState(null);

  // Versuche, den Ort zu finden (auch bei Schreibfehlern in der ID)
  useEffect(() => {
    if (!locationId) return;

    // 1. Direkter Treffer?
    let loc = locationsData[locationId];

    // 2. Falls nicht gefunden, suche case-insensitive (Groß/Klein egal)
    if (!loc) {
      const foundKey = Object.keys(locationsData).find(
        key => key.toLowerCase() === locationId.toLowerCase()
      );
      if (foundKey) {
        loc = locationsData[foundKey];
      }
    }

    setResolvedLocation(loc);
  }, [locationId]);

  // --- FALL 1: SHOP OFFEN ---
  if (activeShopId) {
    const shopData = shopsData[activeShopId];
    return (
      <ShopScreen
        shop={shopData}
        character={character}
        onClose={() => setActiveShopId(null)}
        onTransaction={onShopTransaction}
      />
    );
  }

  // --- FALL 2: ORT NICHT GEFUNDEN (Fehleranzeige) ---
  if (!resolvedLocation) {
    return (
      <div className="location-view error-view" style={{ padding: '20px', textAlign: 'center' }}>
        <h2 style={{ color: 'red' }}>⚠️ Ort nicht gefunden</h2>
        <p>Gesuchte ID: <strong>{locationId}</strong></p>
        <p>Verfügbare IDs in Datenbank: {Object.keys(locationsData).slice(0, 5).join(', ')}...</p>
        <button onClick={onLeaveLocation} style={{ marginTop: '20px', padding: '10px' }}>
          Zurück zur Weltkarte
        </button>
      </div>
    );
  }

  // --- FALL 3: ORT ANZEIGEN (Normal) ---
  return (
    <div className="location-view">
      <div className="location-header">
        <h2>{resolvedLocation.name}</h2>
        {resolvedLocation.type && <span className="location-type">({resolvedLocation.type})</span>}
      </div>

      <div className="location-content">
        {resolvedLocation.image && (
          <img 
            src={resolvedLocation.image} 
            alt={resolvedLocation.name} 
            className="location-image" 
          />
        )}
        <p className="location-description">{resolvedLocation.description}</p>

        {/* Händler Buttons */}
        {resolvedLocation.shops && resolvedLocation.shops.length > 0 && (
          <div className="location-shops">
            <h3>Händler:</h3>
            <div className="shop-list">
              {resolvedLocation.shops.map(shopId => {
                const shop = shopsData[shopId];
                // Falls Shop-Daten fehlen, zeige Warnung statt nichts
                if (!shop) return <div key={shopId} className="error-msg">⚠️ Shop "{shopId}" fehlt</div>;
                
                return (
                  <button 
                    key={shopId} 
                    className="shop-btn"
                    onClick={() => setActiveShopId(shopId)}
                  >
                    🛒 {shop.name} betreten
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="location-footer">
        <div className="location-actions-row">
            {/* KAMPF-BUTTON: Wird IMMER angezeigt, wenn onStartCombat existiert */}
            {onStartCombat && (
              <button 
                className="combat-start-btn" 
                onClick={onStartCombat}
                style={{ 
                    backgroundColor: '#8b0000', 
                    color: 'white', 
                    border: '1px solid #ff0000',
                    marginRight: '10px'
                }}
              >
                ⚔️ Kampf starten (Test)
              </button>
            )}

            <button className="leave-btn" onClick={onLeaveLocation}>
              🏃 Ort verlassen
            </button>
        </div>
      </div>
    </div>
  );
}

export default LocationView;