// src/components/character_sheet/InventoryItem.js

import React, { useState, useRef } from 'react';
import { useDrag } from 'react-dnd';
import { ItemTypes } from '../../dnd/itemTypes';
import Tooltip from '../tooltip/Tooltip';

const getIcon = (iconName) => {
    try {
        return require(`../../assets/images/icons/${iconName}`);
    } catch (err) {
        console.warn(`Icon not found: ${iconName}`);
        return 'https://placeholder.pics/svg/40x40';
    }
};

// Die Prop 'equippedIn' wird hier nicht mehr benötigt
const InventoryItem = ({ item }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const itemRef = useRef(null);
  const itemType = item ? item.type.toUpperCase() : "ITEM";

  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes[itemType] || ItemTypes.ITEM,
    // Da dieses Item aus dem Inventar kommt, hat es keinen 'equippedIn' Status
    item: { ...item },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  // Die kombinierte Ref-Funktion bleibt für den Tooltip erhalten
  const combinedRef = (el) => {
    drag(el);
    itemRef.current = el;
  };

  if (!item) {
    return <div className="inventory-slot"></div>;
  }

  return (
    <div
      ref={combinedRef}
      className="inventory-slot"
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'grab',
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <img src={getIcon(item.icon)} alt={item.name} className="item-icon" />
      {showTooltip && !isDragging && <Tooltip item={item} parentRef={itemRef} />}
    </div>
  );
};

export default InventoryItem;