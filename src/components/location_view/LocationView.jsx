// src/components/location_view/LocationView.jsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './LocationView.css';
import locationsData from '../../data/locations.json';
import shopsData from '../../data/shops.json';
import ShopScreen from '../shop/ShopScreen';
import { TileMap } from '../maps/TileMap';
import allGameItems from '../../utils/itemLoader';

const LocationView = ({ 
    locationId, 
    character,
    onLeaveLocation, 
    onShopTransaction,
    onStartCombat // +++ NEU: Prop für Kampfstart +++
}) => {
    const { t } = useTranslation();
    const [activeShop, setActiveShop] = useState(null);

    // Finde den Ort (unterstützt Array-Struktur deiner JSON)
    const location = locationsData.find(loc => loc.id === locationId);

    if (!location) {
        return (
            <div className="location-view-error">
                <h2>⚠️ Ort nicht gefunden: {locationId}</h2>
                <button onClick={onLeaveLocation}>Zurück zur Karte</button>
            </div>
        );
    }

    const viewType = location.type === 'city' ? 'Stadt' : 'Dungeon';

    // Shops auflösen
    const availableShops = location.shops 
        ? location.shops.map(shopId => shopsData.find(s => s.id === shopId)).filter(Boolean)
        : [];

    const handleOpenShop = (shop) => {
        const hydratedInventory = shop.inventory.map(entry => {
            const itemDef = allGameItems.find(i => i.id === entry.itemId);
            if (!itemDef) {
                console.warn(`Shop Item nicht gefunden: ${entry.itemId}`);
                return null;
            }
            return { ...itemDef, quantity: entry.quantity };
        }).filter(Boolean);

        setActiveShop({ ...shop, inventory: hydratedInventory });
    };

    const handleMapInteraction = (eventData) => {
        if (eventData.type === 'shop') {
            const shop = availableShops.find(s => s.id === eventData.shopId);
            if (shop) handleOpenShop(shop);
        }
    };

    return (
        <div className={`location-view ${location.type || 'default'}`}>
            
            <div className="location-header">
                <h1>{t(location.name, location.name)}</h1>
                <p className="location-type">({viewType})</p>
                <p className="location-desc">{t(location.description, location.description)}</p>
            </div>

            <div className="location-map-container">
                {location.mapFile && (
                    <TileMap 
                        mapFile={location.mapFile}
                        character={character}
                        onLeaveLocation={onLeaveLocation}
                        onInteract={handleMapInteraction}
                    />
                )}
            </div>
            
            {/* Aktionen-Leiste (Shops & Kampf) */}
            <div className="location-actions">
                {availableShops.length > 0 && (
                    <div className="shop-buttons">
                        <h3>Orte:</h3>
                        {availableShops.map(shop => (
                            <button key={shop.id} onClick={() => handleOpenShop(shop)}>
                                <span className="icon">🛒</span> {shop.name}
                            </button>
                        ))}
                    </div>
                )}

                {/* +++ KAMPF-BUTTON (Nur anzeigen wenn Funktion übergeben wurde) +++ */}
                {onStartCombat && (
                    <div className="combat-section" style={{ marginTop: '10px' }}>
                        <button 
                            className="combat-start-btn" 
                            onClick={onStartCombat}
                            style={{ backgroundColor: '#8b0000', color: 'white', fontWeight: 'bold' }}
                        >
                            ⚔️ Kampf testen
                        </button>
                    </div>
                )}
            </div>

            <div className="location-footer">
                 <button className="leave-btn" onClick={onLeaveLocation}>Ort verlassen</button>
            </div>

            {activeShop && (
                <ShopScreen 
                    shop={activeShop}
                    character={character}
                    onTransaction={onShopTransaction}
                    onClose={() => setActiveShop(null)}
                />
            )}
        </div>
    );
};

export default LocationView;