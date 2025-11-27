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
  onStartCombat 
}) {
  const [activeShopId, setActiveShopId] = useState(null);

  // --- LOGIK: Ort korrekt finden ---
  // Wir prüfen, ob locationsData eine Liste (Array) oder ein Objekt ist.
  // Das ist kein "Fallback", sondern eine saubere Typprüfung.
  let location = null;
  
  if (Array.isArray(locationsData)) {
    // Wenn JSON ein Array ist: Suche den Eintrag mit der passenden ID
    location = locationsData.find(loc => loc.id === locationId);
  } else {
    // Wenn JSON ein Objekt ist: Direkter Zugriff über den Key
    location = locationsData[locationId];
  }

  // --- FEHLERBEHANDLUNG: Wenn ID wirklich nicht existiert ---
  if (!location) {
    console.error(`Fehler: Ort mit ID "${locationId}" nicht in locations.json gefunden.`);
    return (
      <div className="location-view error-view">
        <h2 style={{ color: 'red' }}>⚠️ Ort nicht gefunden</h2>
        <p>Das Spiel sucht nach ID: <strong>{locationId}</strong></p>
        <p>Bitte prüfe, ob die ID in <code>src/data/locations.json</code> exakt so geschrieben ist.</p>
        <button onClick={onLeaveLocation}>Zurück zur Weltkarte</button>
      </div>
    );
  }

  // --- SHOP-SCREEN ANZEIGEN ---
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

  // --- NORMALE ORTS-ANSICHT ---
  return (
    <div className="location-view">
      <div className="location-header">
        {/* Wir nutzen eine Übersetzungs-Logik oder Fallback auf den Key, falls kein i18n da ist */}
        <h2>{location.name.startsWith("location.") ? location.id.toUpperCase() : location.name}</h2>
        {/* Zeige Beschreibung (hier vereinfacht direkt gerendert) */}
      </div>

      <div className="location-content">
        {/* Bild rendern falls vorhanden */}
        {location.image && (
          <img src={location.image} alt={location.name} className="location-image" />
        )}
        
        {/* Beschreibungstext */}
        <p className="location-description">
          {location.description.startsWith("location.") ? "Eine kurze Rast an diesem Ort." : location.description}
        </p>

        {/* Händler Buttons */}
        {location.shops && location.shops.length > 0 && (
          <div className="location-shops">
            <h3>🛒 Händler:</h3>
            <div className="shop-list">
              {location.shops.map(shopId => {
                const shop = shopsData[shopId];
                if (!shop) {
                    console.warn(`Shop-ID "${shopId}" in shops.json nicht gefunden.`);
                    return null;
                }
                return (
                  <button 
                    key={shopId} 
                    className="shop-btn"
                    onClick={() => setActiveShopId(shopId)}
                  >
                    {shop.name} betreten
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="location-footer">
        <div className="location-actions-row">
            {/* KAMPF-BUTTON: Nur anzeigen, wenn die Funktion bereitsteht */}
            {onStartCombat && (
              <button 
                className="combat-start-btn" 
                onClick={onStartCombat}
                style={{ 
                    backgroundColor: '#8b0000', 
                    color: 'white', 
                    fontWeight: 'bold', 
                    marginRight: '10px' 
                }}
              >
                ⚔️ Kampf starten
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