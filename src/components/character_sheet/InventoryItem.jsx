// src/components/character_sheet/InventoryItem.jsx
import React from 'react';
import { useDrag } from 'react-dnd';
import { ItemTypes } from '../../dnd/itemTypes';
import Tooltip from '../tooltip/Tooltip';
import './InventoryItem.css';

const InventoryItem = ({ item, onEquip, isContextMenuOpen }) => {
  
  const [{ isDragging }, drag] = useDrag(() => ({
    type: getDragType(item),
    item: { ...item, equippedIn: null }, 
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [item]);

  const handleDoubleClick = () => {
    if (onEquip) onEquip(item, item.slot || 'main-hand');
  };

  // --- ERWEITERTER TOOLTIP INHALT ---
  const tooltipContent = (
    <div className="item-tooltip-content">
      {/* Header */}
      <div className="item-tooltip-header">
        <span className="item-tooltip-title">{item.name}</span>
        {item.quantity > 1 && <span className="item-tooltip-qty">x{item.quantity}</span>}
      </div>
      
      <div className="item-tooltip-type">
        {item.rarity && <span className={`rarity-${item.rarity}`}>{item.rarity} </span>}
        {item.category ? `${t_type(item.category)} ` : ''}{t_type(item.type)}
      </div>

      <div className="tooltip-divider"></div>

      {/* Stats Grid */}
      <div className="item-tooltip-stats-grid">
         
         {/* Waffe: Schaden */}
         {item.damage && (
            <div className="stat-row">
                <span className="label">Schaden:</span>
                <span className="value highlight">{item.damage} {t_type(item.damage_type)}</span>
            </div>
         )}

         {/* Rüstung / Schild: AC */}
         {(item.ac || item.ac_bonus) && (
            <div className="stat-row">
                <span className="label">Rüstungsklasse:</span>
                <span className="value highlight">
                    {item.ac ? item.ac : `+${item.ac_bonus}`}
                </span>
            </div>
         )}

         {/* Eigenschaften (Leicht, Finesse, etc.) */}
         {item.properties && item.properties.length > 0 && (
            <div className="stat-row">
                <span className="label">Eigenschaften:</span>
                <span className="value">{item.properties.join(', ')}</span>
            </div>
         )}

         {/* Waffen-Meisterschaft */}
         {item.mastery && (
            <div className="stat-row">
                <span className="label mastery">Meisterschaft:</span>
                <span className="value mastery">{item.mastery}</span>
            </div>
         )}

         {/* Reichweite */}
         {item.range && (
            <div className="stat-row">
                <span className="label">Reichweite:</span>
                <span className="value">{item.range} ft</span>
            </div>
         )}
      </div>

      <div className="tooltip-divider"></div>

      {/* Beschreibung & Effekt */}
      {item.description && <div className="item-tooltip-desc">{item.description}</div>}
      {item.effect && <div className="item-tooltip-effect">Effekt: {item.effect}</div>}

      {/* Footer (Gewicht/Wert) */}
      <div className="item-tooltip-footer">
         <span>⚖️ {item.weight} kg</span>
         <span>💰 {item.value} GM</span>
      </div>
    </div>
  );

  // Rendern
  if (isContextMenuOpen) {
      return (
        <div 
            ref={drag}
            className={`inventory-item ${isDragging ? 'dragging' : ''} context-active`}
            onDoubleClick={handleDoubleClick}
        >
            <div className="item-icon-wrapper">
                <img src={getIconPath(item.icon)} alt={item.name} className="item-icon" />
                {item.quantity > 1 && <span className="item-qty">{item.quantity}</span>}
            </div>
        </div>
      );
  }

  return (
    <Tooltip content={tooltipContent}>
        <div 
          ref={drag}
          className={`inventory-item ${isDragging ? 'dragging' : ''}`}
          onDoubleClick={handleDoubleClick}
        >
          <div className="item-icon-wrapper">
             <img 
                src={getIconPath(item.icon)} 
                alt={item.name} 
                className="item-icon" 
                onError={(e) => e.target.src = 'https://placehold.co/50x50?text=?'} 
             />
             {item.quantity > 1 && <span className="item-qty">{item.quantity}</span>}
          </div>
        </div>
    </Tooltip>
  );
};

// Helper für Icon Pfade
const getIconPath = (iconName) => {
    if (!iconName) return null;
    if (iconName.includes('/') || iconName.startsWith('http')) return iconName;
    return `/src/assets/images/icons/${iconName}`;
};

// Einfache Übersetzung (kann später via i18n ersetzt werden)
const t_type = (key) => {
    const map = {
        'simple': 'Einfache', 'martial': 'Kriegs', 'weapon': 'Waffe', 
        'armor': 'Rüstung', 'shield': 'Schild', 'slashing': 'Hieb', 
        'piercing': 'Stich', 'bludgeoning': 'Wucht', 'light': 'Leichte', 
        'medium': 'Mittlere', 'heavy': 'Schwere'
    };
    return map[key] || key;
};

const getDragType = (item) => {
    if (!item) return ItemTypes.ITEM;
    switch (item.type) {
        case 'weapon': return ItemTypes.WEAPON;
        case 'armor': return ItemTypes.ARMOR;
        case 'shield': return ItemTypes.SHIELD;
        case 'head': return ItemTypes.HEAD;
        case 'hands': return ItemTypes.HANDS;
        case 'boots': return ItemTypes.BOOTS;
        case 'belt': return ItemTypes.BELT;
        case 'accessory': return ItemTypes.ACCESSORY;
        case 'cloth': return ItemTypes.CLOTH;
        case 'cloak': return ItemTypes.CLOAK;
        case 'ammo': return ItemTypes.AMMO;
        case 'quiver': return ItemTypes.QUIVER;
        default: return ItemTypes.ITEM;
    }
};

export default InventoryItem;