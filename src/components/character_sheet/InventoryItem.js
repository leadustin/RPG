import React from 'react';
import { useDrag } from 'react-dnd';
import { ItemTypes } from '../../dnd/itemTypes';

// Diese Funktion hilft uns, den richtigen Bildpfad dynamisch zu erstellen.
// Webpack wird dadurch angewiesen, alle Bilder im Ordner 'icons' zu berücksichtigen.
const getIcon = (iconName) => {
    try {
        return require(`../../assets/images/icons/${iconName}`);
    } catch (err) {
        // Fallback-Bild, falls ein Icon nicht gefunden wird
        console.warn(`Icon not found: ${iconName}`);
        return 'https://placeholder.pics/svg/40x40'; 
    }
};

const InventoryItem = ({ item, equippedIn = null }) => {
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
      }}
      title={item.name}
    >
      {/* Die getIcon-Funktion wird hier aufgerufen, um das Bild zu laden */}
      {item && <img src={getIcon(item.icon)} alt={item.name} style={{ width: '100%', height: '100%' }} />}
    </div>
  );
};

export default InventoryItem;