// src/engine/shopEngine.js
import { calculateItemPriceForCharacter } from './characterEngine';

// FIX: Statt viele einzelne JSON-Dateien zu laden (die teils gelöscht wurden),
// nutzen wir den zentralen itemLoader.
import allGameItems from '../utils/itemLoader';

const getItemDef = (itemId) => allGameItems.find(i => i.id === itemId);

/**
 * Berechnet den Verkaufspreis (Spieler an Händler).
 * Regel: Spieler erhalten meist 50% des Wertes.
 */
export const getSellPrice = (item, character) => {
    const baseValue = item.value || 0;
    return Math.floor(baseValue / 2);
};

/**
 * Berechnet den Kaufpreis (Händler an Spieler).
 * Berücksichtigt 'Crafter'-Rabatt aus characterEngine.
 */
export const getBuyPrice = (item, character) => {
    const baseValue = item.value || 0;
    return calculateItemPriceForCharacter(character, baseValue);
};

/**
 * Führt einen Kauf aus.
 */
export const buyItem = (character, itemDef, quantity = 1) => {
    const pricePerUnit = getBuyPrice(itemDef, character);
    const totalPrice = pricePerUnit * quantity;
    const currentGold = character.wallet?.gold || 0;

    if (currentGold < totalPrice) {
        return { success: false, message: "Nicht genügend Gold." };
    }

    // Gold abziehen
    const newWallet = { ...character.wallet, gold: currentGold - totalPrice };

    // Item zum Inventar hinzufügen
    const inventory = [...character.inventory];
    
    // Definition von stapelbaren Typen (kann bei Bedarf erweitert werden)
    const stackableTypes = ['ammo', 'potion', 'scroll', 'loot', 'food', 'resource', 'currency', 'gem'];
    
    const existingItemIndex = inventory.findIndex(i => i.itemId === itemDef.id && stackableTypes.includes(itemDef.type));

    if (existingItemIndex >= 0) {
        const existingItem = { ...inventory[existingItemIndex] };
        existingItem.quantity = (existingItem.quantity || 1) + quantity;
        inventory[existingItemIndex] = existingItem;
    } else {
        inventory.push({
            ...itemDef,
            itemId: itemDef.id,
            instanceId: crypto.randomUUID(), // Moderne UUID statt Date.now()
            quantity: quantity,
            equipped: false
        });
    }

    return {
        success: true,
        newCharacter: { ...character, wallet: newWallet, inventory },
        message: `${quantity}x ${itemDef.name} für ${totalPrice} GM gekauft.`
    };
};

/**
 * Führt einen Verkauf aus.
 */
export const sellItem = (character, itemInstance, quantity = 1) => {
    const sellPrice = getSellPrice(itemInstance, character);
    const totalGain = sellPrice * quantity;

    // Item aus Inventar entfernen/reduzieren
    const inventory = [...character.inventory];
    const itemIndex = inventory.findIndex(i => i.id === itemInstance.id || (i.itemId === itemInstance.itemId && i.instanceId === itemInstance.instanceId));

    if (itemIndex === -1) return { success: false, message: "Item nicht gefunden." };

    const currentItem = inventory[itemIndex];
    
    if (currentItem.quantity > quantity) {
        // Reduzieren
        inventory[itemIndex] = { ...currentItem, quantity: currentItem.quantity - quantity };
    } else {
        // Entfernen
        inventory.splice(itemIndex, 1);
    }

    // Gold hinzufügen
    const newWallet = { ...character.wallet, gold: (character.wallet?.gold || 0) + totalGain };

    return {
        success: true,
        newCharacter: { ...character, wallet: newWallet, inventory },
        message: `${quantity}x ${currentItem.name} für ${totalGain} GM verkauft.`
    };
};