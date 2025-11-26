// src/components/location_view/LocationView.jsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './LocationView.css';
import locationsData from '../../data/locations.json';
import shopsData from '../../data/shops.json';
import ShopScreen from '../shop/ShopScreen';
import { TileMap } from '../maps/TileMap';

// FIX: Statt einzelne JSON-Dateien zu importieren (die teils gelöscht wurden),
// nutzen wir jetzt den zentralen itemLoader. Dieser enthält ALLE Items.
import allGameItems from '../../utils/itemLoader';

const LocationView = ({ 
    locationId, 
    character,
    onLeaveLocation, 
    onShopTransaction 
}) => {
    const { t } = useTranslation();
    const [activeShop, setActiveShop] = useState(null);

    const location = locationsData.find(loc => loc.id === locationId);

    if (!location) {
        return <div className="location-view-error">Ort nicht gefunden: {locationId}</div>;
    }

    const viewType = location.type === 'city' ? 'Stadt' : 'Dungeon';

    // Shops auflösen: Wir suchen in shops.json nach den IDs, die in locations.json stehen
    const availableShops = location.shops 
        ? location.shops.map(shopId => shopsData.find(s => s.id === shopId)).filter(Boolean)
        : [];

    const handleOpenShop = (shop) => {
        // Inventar des Shops mit echten Item-Daten anreichern
        const hydratedInventory = shop.inventory.map(entry => {
            // FIX: Suche im allGameItems Array (aus itemLoader)
            const itemDef = allGameItems.find(i => i.id === entry.itemId);
            
            if (!itemDef) {
                console.warn(`Shop Item nicht gefunden: ${entry.itemId}`);
                return null;
            }
            return { ...itemDef, quantity: entry.quantity };
        }).filter(Boolean);

        setActiveShop({ ...shop, inventory: hydratedInventory });
    };

    // Handler für Klicks auf die Karte (wenn Events in der Map definiert sind)
    const handleMapInteraction = (eventData) => {
        if (eventData.type === 'shop') {
            const shop = availableShops.find(s => s.id === eventData.shopId);
            if (shop) {
                handleOpenShop(shop);
            }
        }
    };

    return (
        <div className={`location-view ${location.type}`}>
            
            {/* Header */}
            <div className="location-header">
                <h1>{t(location.name, location.name)}</h1>
                <p className="location-type">({viewType})</p>
                <p className="location-desc">{t(location.description, location.description)}</p>
            </div>

            {/* Karte */}
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
            
            {/* Shop Buttons (Overlay) */}
            {availableShops.length > 0 && (
                <div className="location-actions">
                    <h3>Orte</h3>
                    <div className="shop-buttons">
                        {availableShops.map(shop => (
                            <button key={shop.id} onClick={() => handleOpenShop(shop)}>
                                <span className="icon">🛒</span> {shop.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="location-footer">
                 <button className="leave-btn" onClick={onLeaveLocation}>Ort verlassen</button>
            </div>

            {/* Shop Fenster (Modal) */}
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