// src/components/location_view/LocationView.jsx
import React, { useState } from "react";
import locationsData from "../../data/locations.json";
import shopsData from "../../data/shops.json";
import ShopScreen from "../shop/ShopScreen";
import "./LocationView.css";

function LocationView({ 
  locationId, 
  character, 
  onLeaveLocation, 
  onShopTransaction,
  onStartCombat // +++ NEU: Prop für Kampfstart empfangen +++
}) {
  const [activeShopId, setActiveShopId] = useState(null);

  const location = locationsData[locationId];

  // Fallback, falls ID nicht gefunden
  if (!location) {
    return (
      <div className="location-view">
        <h2>Unbekannter Ort: {locationId}</h2>
        <button onClick={onLeaveLocation}>Zurück zur Karte</button>
      </div>
    );
  }

  // Shop öffnen
  const handleOpenShop = (shopId) => {
    setActiveShopId(shopId);
  };

  // Shop schließen
  const handleCloseShop = () => {
    setActiveShopId(null);
  };

  // Wenn ein Shop offen ist, zeigen wir diesen an
  if (activeShopId) {
    const shopData = shopsData[activeShopId];
    return (
      <ShopScreen
        shop={shopData}
        character={character}
        onClose={handleCloseShop}
        onTransaction={onShopTransaction}
      />
    );
  }

  return (
    <div className="location-view">
      <div className="location-header">
        <h2>{location.name}</h2>
        {location.type && <span className="location-type">({location.type})</span>}
      </div>

      <div className="location-content">
        {location.image && (
          <img 
            src={location.image} 
            alt={location.name} 
            className="location-image" 
          />
        )}
        <p className="location-description">{location.description}</p>

        {/* Interaktions-Bereich */}
        <div className="location-interactions">
          
          {/* Shops auflisten */}
          {location.shops && location.shops.length > 0 && (
            <div className="location-shops">
              <h3>Händler:</h3>
              <div className="shop-list">
                {location.shops.map(shopId => {
                  const shop = shopsData[shopId];
                  if (!shop) return null;
                  return (
                    <button 
                      key={shopId} 
                      className="shop-btn"
                      onClick={() => handleOpenShop(shopId)}
                    >
                      🛒 {shop.name} betreten
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* NPCs / Quests könnten hier folgen */}
        </div>
      </div>

      <div className="location-footer">
        <div className="location-actions-row">
            {/* +++ NEU: KAMPF-BUTTON (Nur zum Testen oder für gefährliche Orte) +++ */}
            <button 
              className="combat-start-btn" 
              onClick={onStartCombat}
              title="Startet einen Testkampf mit Goblins"
            >
              ⚔️ Kampf starten (Test)
            </button>

            <button className="leave-btn" onClick={onLeaveLocation}>
              🏃 Ort verlassen
            </button>
        </div>
      </div>
    </div>
  );
}

export default LocationView;