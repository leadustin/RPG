// src/components/character_sheet/InventoryItem.jsx
import React from 'react';
import { useDrag } from 'react-dnd';
import { ItemTypes } from '../../dnd/itemTypes';
import Tooltip from '../tooltip/Tooltip';
import './InventoryItem.css'; // Stelle sicher, dass diese Datei existiert oder Styles inline sind

const InventoryItem = ({ item, onEquip, isContextMenuOpen }) => {
  
  // Drag-Logik (zum Ausrüsten via Drag & Drop)
  const [{ isDragging }, drag] = useDrag(() => ({
    type: getDragType(item),
    item: { ...item, equippedIn: null }, // Kommt aus Inventar -> kein Slot
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [item]);

  // Doppelklick zum Ausrüsten
  const handleDoubleClick = () => {
    if (onEquip) onEquip(item, item.slot || 'main-hand');
  };

  // Tooltip-Text zusammenbauen
  // NEU: Name wird jetzt explizit als Titel im Tooltip angezeigt
  const tooltipContent = (
    <div className="item-tooltip-content">
      <div className="item-tooltip-title">{item.name}</div>
      <div className="item-tooltip-stats">
         Gewicht: {item.weight} kg <br/>
         Wert: {item.value} GM
      </div>
      {item.description && <div className="item-tooltip-desc">{item.description}</div>}
      {/* Hier könnten weitere Stats stehen (Schaden, RK etc.) */}
    </div>
  );

  return (
    // WICHTIG: Wenn Kontextmenü offen ist (isContextMenuOpen), rendern wir KEINEN Tooltip,
    // sondern nur das Item-Div. Das verhindert überlappende Popups.
    isContextMenuOpen ? (
      <div 
        ref={drag}
        className={`inventory-item ${isDragging ? 'dragging' : ''} context-active`}
        onDoubleClick={handleDoubleClick}
      >
        <div className="item-icon-wrapper">
           {/* Pfad-Logik für Icon (vereinfacht, nutze deinen bestehenden Image-Loader wenn nötig) */}
           <img src={`/assets/images/icons/${item.icon || 'placeholder_item.webp'}`} alt={item.name} className="item-icon" />
           {item.quantity > 1 && <span className="item-qty">{item.quantity}</span>}
        </div>
      </div>
    ) : (
      <Tooltip content={tooltipContent}>
        <div 
          ref={drag}
          className={`inventory-item ${isDragging ? 'dragging' : ''}`}
          onDoubleClick={handleDoubleClick}
        >
          <div className="item-icon-wrapper">
             {/* Hier nutzen wir direkten Pfad oder importierte Bilder. 
                 Falls du den glob-Import nutzt, müsste der hier rein oder durchgereicht werden. 
                 Der Einfachheit halber gehe ich davon aus, dass item.icon korrekt aufgelöst wird oder Pfad stimmt. */}
             <img src={item.icon.includes('/') ? item.icon : `/src/assets/images/icons/${item.icon}`} alt={item.name} className="item-icon" onError={(e) => e.target.src = 'https://placehold.co/50x50?text=?'} />
             
             {item.quantity > 1 && <span className="item-qty">{item.quantity}</span>}
          </div>
        </div>
      </Tooltip>
    )
  );
};

// Hilfsfunktion für DragType
const getDragType = (item) => {
    if (!item) return ItemTypes.ITEM;
    switch (item.type) {
        case 'weapon': return ItemTypes.WEAPON;
        case 'armor': return ItemTypes.ARMOR;
        case 'shield': return ItemTypes.SHIELD;
        case 'head': return ItemTypes.HEAD;
        // ... weitere Typen ...
        default: return ItemTypes.ITEM;
    }
};

export default InventoryItem;