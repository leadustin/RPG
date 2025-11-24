// src/components/shop/ShopScreen.jsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './ShopScreen.css';
import { buyItem, sellItem, getBuyPrice, getSellPrice } from '../../engine/shopEngine';
import { ItemTypes } from '../../dnd/itemTypes';

// Helper für Icons (wie im EquipmentSlot)
const getIcon = (iconName) => {
    try {
        if (iconName && (iconName.startsWith('http') || iconName.startsWith('data:') || iconName.startsWith('/'))) {
            return iconName;
        }
        return new URL(`../../assets/images/icons/${iconName}`, import.meta.url).href;
    } catch (err) {
        return 'https://placeholder.pics/svg/40x40';
    }
};

const ShopItemRow = ({ item, price, actionLabel, onAction, canAfford = true }) => {
    const iconSrc = getIcon(item.icon);
    
    return (
        <div className={`shop-item-row ${!canAfford ? 'disabled' : ''}`}>
            <div className="item-info">
                <img src={iconSrc} alt={item.name} className="shop-icon" />
                <div className="item-details">
                    <span className="item-name">{item.name}</span>
                    {item.quantity > 1 && <span className="item-qty">x{item.quantity}</span>}
                </div>
            </div>
            <div className="item-action">
                <span className="item-price">{price} GM</span>
                <button onClick={() => onAction(item)} disabled={!canAfford}>
                    {actionLabel}
                </button>
            </div>
        </div>
    );
};

const ShopScreen = ({ shop, character, onTransaction, onClose }) => {
    const { t } = useTranslation();
    const [mode, setMode] = useState('buy'); // 'buy' oder 'sell'

    // --- KAUFEN LOGIK ---
    const handleBuy = (itemDef) => {
        const result = buyItem(character, itemDef, 1);
        if (result.success) {
            onTransaction(result.newCharacter, result.message);
        } else {
            alert(result.message);
        }
    };

    // --- VERKAUFEN LOGIK ---
    const handleSell = (itemInstance) => {
        const result = sellItem(character, itemInstance, 1);
        if (result.success) {
            onTransaction(result.newCharacter, result.message);
        } else {
            alert(result.message);
        }
    };

    // Filter für verkaufbare Items (keine Quest-Items, etc.)
    const sellableItems = character.inventory.filter(item => item.type !== ItemTypes.QUEST);

    return (
        <div className="shop-screen-overlay">
            <div className="shop-window">
                <div className="shop-header">
                    <div className="shop-title">
                        <h2>{shop.name}</h2>
                        <span className="shop-type">{t(`shops.types.${shop.type}`, shop.type)}</span>
                    </div>
                    <div className="shop-gold">
                        💰 {character.wallet?.gold || 0} GM
                    </div>
                    <button className="close-btn" onClick={onClose}>X</button>
                </div>

                <div className="shop-tabs">
                    <button className={mode === 'buy' ? 'active' : ''} onClick={() => setMode('buy')}>Kaufen</button>
                    <button className={mode === 'sell' ? 'active' : ''} onClick={() => setMode('sell')}>Verkaufen</button>
                </div>

                <div className="shop-content">
                    {mode === 'buy' && (
                        <div className="item-list">
                            {shop.inventory.map((shopItem, idx) => {
                                // Wir müssen hier die vollen Item-Daten laden. 
                                // In einer echten App würde man das über eine ID-Map machen.
                                // Da wir hier nur ItemDefs haben, nehmen wir an, shopEngine löst das intern oder wir haben Zugriff.
                                // Für dieses Beispiel gehe ich davon aus, dass 'shop.inventory' bereits hydrierte Objekte oder IDs enthält.
                                // HINWEIS: Du musst sicherstellen, dass in 'shops.json' oder beim Laden des Shops
                                // die Item-Daten aus 'items.json' etc. gemerged werden!
                                // Hier ein Fallback, falls du es noch nicht hast:
                                // const fullItem = allItems.find(i => i.id === shopItem.itemId);
                                // Da wir hier keinen direkten Zugriff auf allItems haben, 
                                // wäre es besser, wenn LocationView den Shop bereits "fertig" übergibt.
                                
                                // Temporäre Lösung: Wir gehen davon aus, dass shopItem bereits Daten hat 
                                // ODER wir importieren die Items hier (weniger sauber, aber funktioniert).
                                // Besser: Wir importieren ItemLoader Logik.
                                
                                // Nehmen wir an, shopItem hat { itemId, quantity, ... }
                                // Wir brauchen Zugriff auf die Item-Datenbank.
                                // Da dies UI ist, laden wir es einfachheitshalber direkt oder übergeben es.
                                return (
                                    <ShopItemRow 
                                        key={idx} 
                                        item={shopItem} // Achtung: Muss Name/Icon haben!
                                        price={getBuyPrice(shopItem, character)}
                                        actionLabel="Kaufen"
                                        onAction={handleBuy}
                                        canAfford={(character.wallet?.gold || 0) >= getBuyPrice(shopItem, character)}
                                    />
                                );
                            })}
                        </div>
                    )}

                    {mode === 'sell' && (
                        <div className="item-list">
                            {sellableItems.length === 0 ? (
                                <p className="empty-msg">Nichts zu verkaufen.</p>
                            ) : (
                                sellableItems.map((item, idx) => (
                                    <ShopItemRow 
                                        key={item.instanceId || idx}
                                        item={item}
                                        price={getSellPrice(item, character)}
                                        actionLabel="Verkaufen"
                                        onAction={handleSell}
                                    />
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShopScreen;