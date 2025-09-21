// src/components/character_sheet/InventoryItem.js

import React, { useState, useRef } from "react";
import { useDrag } from "react-dnd";
import { ItemTypes } from "../../dnd/itemTypes";
import Tooltip from "../tooltip/Tooltip";

const getIcon = (iconName) => {
  try {
    return require(`../../assets/images/icons/${iconName}`);
  } catch (err) {
    console.warn(`Icon not found: ${iconName}`);
    return "https://placeholder.pics/svg/40x40";
  }
};

const InventoryItem = ({ item }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const itemRef = useRef(null);
  const itemType = item ? item.type.toUpperCase() : "ITEM";

  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes[itemType] || ItemTypes.ITEM,
    item: { ...item },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

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
        cursor: "grab",
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <img src={getIcon(item.icon)} alt={item.name} className="item-icon" />
      {/* Tooltip nur anzeigen, wenn showTooltip true ist UND das Item nicht gezogen wird */}
      {showTooltip && !isDragging && itemRef.current && (
        <Tooltip item={item} parentRef={itemRef} />
      )}
    </div>
  );
};

export default InventoryItem;
