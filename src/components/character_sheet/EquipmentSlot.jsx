// src/components/character_sheet/EquipmentSlot.jsx
import React from 'react';
import { useDrop, useDrag } from 'react-dnd';
import { ItemTypes } from '../../dnd/itemTypes';
import Tooltip from '../tooltip/Tooltip';
import './EquipmentSlot.css';

// Helper für Bilder
const getIconPath = (iconName) => {
    if (!iconName) return null;
    if (iconName.startsWith("http") || iconName.startsWith("data:")) return iconName;
    if (iconName.includes('/')) return iconName;
    return `/src/assets/images/icons/${iconName}`;
};

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

const EquipmentSlot = ({ 
  slotType, 
  currentItem, 
  onEquipItem, 
  onFillQuiver, 
  onUnloadQuiver, 
  isTwoHandedDisplay 
}) => {

  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: [ItemTypes.ITEM, ItemTypes.AMMO, ItemTypes.QUIVER, ItemTypes.WEAPON, ItemTypes.ARMOR, ItemTypes.SHIELD, ItemTypes.HEAD, ItemTypes.HANDS, ItemTypes.BOOTS, ItemTypes.BELT, ItemTypes.CLOTH, ItemTypes.ACCESSORY, ItemTypes.CLOAK],
    
    canDrop: (item) => {
      if (slotType === 'ammo') {
          if (!currentItem) return item.type === 'quiver';
          if (currentItem.type === 'quiver') return item.type === 'ammo';
          return false;
      }
      if (['main-hand','off-hand'].includes(slotType)) return ['weapon','shield'].includes(item.type);
      if (slotType === 'armor') return item.type === 'armor';
      if (item.type === slotType) return true;

      return true; 
    },

    drop: (item) => {
      if (slotType === 'ammo') {
          if (currentItem && currentItem.type === 'quiver' && item.type === 'ammo') {
              if (onFillQuiver) onFillQuiver(item);
              return;
          }
          if (!currentItem && item.type === 'ammo') return; 
      }
      if (onEquipItem) onEquipItem(item, slotType);
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }), [currentItem, slotType, onEquipItem, onFillQuiver]);

  const [{ isDragging }, drag] = useDrag(() => ({
    type: currentItem ? getDragType(currentItem) : ItemTypes.ITEM,
    item: { ...currentItem, equippedIn: slotType }, 
    canDrag: !!currentItem, 
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [currentItem, slotType]);


  const getTooltipContent = (item) => (
    <div className="item-tooltip-content">
      <div className="item-tooltip-header">
        <span className="item-tooltip-title">{item.name}</span>
      </div>
      <div className="item-tooltip-type">
        {item.category ? `${t_type(item.category)} ` : ''}{t_type(item.type)}
      </div>
      <div className="tooltip-divider"></div>
      <div className="item-tooltip-stats-grid">
         {item.damage && (
            <div className="stat-row">
                <span className="label">Schaden:</span>
                <span className="value highlight">{item.damage} {t_type(item.damage_type)}</span>
            </div>
         )}
         {(item.ac || item.ac_bonus) && (
            <div className="stat-row">
                <span className="label">Rüstungsklasse:</span>
                <span className="value highlight">{item.ac ? item.ac : `+${item.ac_bonus}`}</span>
            </div>
         )}
         {item.properties && item.properties.length > 0 && (
            <div className="stat-row">
                <span className="label">Eigenschaften:</span>
                <span className="value">{item.properties.join(', ')}</span>
            </div>
         )}
         {item.mastery && (
            <div className="stat-row">
                <span className="label mastery">Meisterschaft:</span>
                <span className="value mastery">{item.mastery}</span>
            </div>
         )}
         {item.range && (
            <div className="stat-row">
                <span className="label">Reichweite:</span>
                <span className="value">{item.range} ft</span>
            </div>
         )}
      </div>
      {item.description && (
          <>
            <div className="tooltip-divider"></div>
            <div className="item-tooltip-desc">{item.description}</div>
          </>
      )}
      {item.effect && <div className="item-tooltip-effect">{item.effect}</div>}
    </div>
  );

  if (isTwoHandedDisplay) {
    return (
      <div className="equipment-slot two-handed-blocked">
        <div className="slot-label">{slotType}</div>
        <div className="slot-placeholder">🚫</div>
      </div>
    );
  }

  return (
    <div 
        ref={drop} 
        className={`equipment-slot ${isOver && canDrop ? 'hover' : ''} ${!canDrop && isOver ? 'invalid' : ''}`}
        title={!currentItem ? slotType : ''} 
    >
      {currentItem ? (
        <Tooltip content={getTooltipContent(currentItem)}>
            <div 
                ref={drag} 
                className={`equipped-item ${isDragging ? 'dragging' : ''}`}
                style={{ opacity: isDragging ? 0.5 : 1, cursor: 'grab' }}
            >
                <img 
                    src={getIconPath(currentItem.icon) || "https://placehold.co/50x50?text=?"} 
                    alt={currentItem.name} 
                    className="slot-icon"
                />
                
                {/* HIER WURDE DIE ZEILE MIT item-name-overlay ENTFERNT */}
                
                {currentItem.type === 'quiver' && (
                    <div className="quiver-status">
                        {currentItem.content ? (
                            <span className="ammo-count">{currentItem.content.quantity}</span>
                        ) : (
                            <span className="ammo-empty">0</span>
                        )}
                        {currentItem.content && onUnloadQuiver && (
                            <button 
                                className="unload-btn" 
                                onClick={(e) => { e.stopPropagation(); onUnloadQuiver(); }}
                            >⏏️</button>
                        )}
                    </div>
                )}
            </div>
        </Tooltip>
      ) : (
        <div className="slot-placeholder">
           {slotType === 'ammo' ? '🏹' : slotType.substring(0,2).toUpperCase()}
        </div>
      )}
    </div>
  );
};

export default EquipmentSlot;