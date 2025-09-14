// Dein Pfad: src/components/character_sheet/InventoryItem.js

import React, { useState } from 'react'; // <-- useState importieren
import { useDrag } from 'react-dnd';
import { ItemTypes } from '../../dnd/itemTypes';
import Tooltip from '../tooltip/Tooltip'; // <-- Tooltip-Komponente importieren

// Diese Funktion hilft uns, den richtigen Bildpfad dynamisch zu erstellen.
const getIcon = (iconName) => {
    try {
        return require(`../../assets/images/icons/${iconName}`);
    } catch (err) {
        console.warn(`Icon not found: ${iconName}`);
        return 'https://placeholder.pics/svg/40x40';
    }
};

const InventoryItem = ({ item, equippedIn = null }) => {
  const [showTooltip, setShowTooltip] = useState(false); // <-- Zustand für den Tooltip
  const itemType = item.type.toUpperCase();

  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes[itemType] || ItemTypes.ITEM,
    item: { ...item, equippedIn },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className="inventory-slot"
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'grab',
        position: 'relative', // <-- Wichtig für die Positionierung des Tooltips
      }}
      // Das 'title'-Attribut kannst du entfernen, da wir es durch den neuen Tooltip ersetzen
      // title={item.name} 
      onMouseEnter={() => setShowTooltip(true)} // <-- Tooltip anzeigen
      onMouseLeave={() => setShowTooltip(false)} // <-- Tooltip ausblenden
    >
      {item && <img src={getIcon(item.icon)} alt={item.name} style={{ width: '100%', height: '100%' }} />}

      {/* Hier wird der Tooltip angezeigt, wenn showTooltip true ist */}
      {showTooltip && !isDragging && <Tooltip item={item} />}
    </div>
  );
};

export default InventoryItem;