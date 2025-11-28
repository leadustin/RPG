// src/components/location_view/LocationView.jsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './LocationView.css';
import locationsData from '../../data/locations.json';
import shopsData from '../../data/shops.json';
import ShopScreen from '../shop/ShopScreen';
import { TileMap } from '../maps/TileMap'; // Sicherstellen, dass der Import stimmt (benannter Import { TileMap } vs default)
import allGameItems from '../../utils/itemLoader';

const LocationView = ({ 
    locationId, 
    character,
    onLeaveLocation, 
    onShopTransaction,
    onStartCombat 
}) => {
    const { t } = useTranslation();
    const [activeShop, setActiveShop] = useState(null);

    // Finde den Ort
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
        setActiveShop(shop);
    };

    // Prüfung, ob Gegner vorhanden sind
    const hasEnemies = location.enemies && location.enemies.length > 0;

    return (
        <div className="location-view-container">
            <div className="location-header">
                <h2>{t(location.name)}</h2>
                <span className="location-type">({viewType})</span>
            </div>

            <div className="location-content">
                <div className="location-image-placeholder">
                    {/* TileMap Rendering */}
                    {location.mapFile ? (
                       <div className="mini-map-preview">
                           <TileMap 
                             mapFile={location.mapFile} 
                             character={character} // <--- KORREKTUR: Charakter übergeben
                             scale={0.5} 
                           />
                       </div>
                    ) : (
                        <div className="placeholder-text">Bild / Karte von {t(location.name)}</div>
                    )}
                </div>

                <p className="location-description">{t(location.description)}</p>

                {availableShops.length > 0 && (
                    <div className="location-shops">
                        <h3>Händler:</h3>
                        {availableShops.map(shop => (
                            <button key={shop.id} onClick={() => handleOpenShop(shop)}>
                                <span className="icon">🛒</span> {shop.name}
                            </button>
                        ))}
                    </div>
                )}

                {onStartCombat && hasEnemies && (
                    <div className="combat-section" style={{ marginTop: '10px' }}>
                        <button 
                            className="combat-start-btn" 
                            onClick={onStartCombat}
                            style={{ backgroundColor: '#8b0000', color: 'white', fontWeight: 'bold' }}
                        >
                            ⚔️ Kampf beginnen
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