// src/components/character_sheet/EquipmentSlot.js

import React, { useState, useRef } from 'react';
import { useDrop, useDrag } from 'react-dnd'; // useDrag importieren
import Tooltip from '../tooltip/Tooltip';
import { ItemTypes } from '../../dnd/itemTypes';
import './EquipmentSlot.css';

// Diese Funktion aus InventoryItem.js hierher verschieben, um sie direkt zu nutzen
const getIcon = (iconName) => {
    try {
        return require(`../../assets/images/icons/${iconName}`);
    } catch (err) {
        console.warn(`Icon not found: ${iconName}`);
        return 'https://placeholder.pics/svg/40x40';
    }
};

const EquipmentSlot = ({ slotType, currentItem, onEquipItem }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const slotRef = useRef(null);

  // --- Drag-Logik für ausgerüstete Items ---
  const [{ isDragging }, drag] = useDrag(() => ({
    // Bestimme den Typ basierend auf dem aktuellen Item
    type: currentItem ? (ItemTypes[currentItem.type.toUpperCase()] || ItemTypes.ITEM) : ItemTypes.ITEM,
    // Das Item kann nur gezogen werden, WENN es existiert
    canDrag: !!currentItem,
    // Füge die 'equippedIn' Information hinzu, damit das System weiß, woher es kommt
    item: { ...currentItem, equippedIn: slotType },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [currentItem, slotType]); // Abhängigkeiten aktualisieren


  // --- Drop-Logik (unverändert) ---
  const getAcceptedItemTypes = () => {
    // ... (deine Logik hier bleibt unverändert)
    if (slotType.includes("hand") || slotType === "ranged") return [ItemTypes.WEAPON];
    if (slotType.includes("ring") || slotType === "amulet" || slotType === "belt") return [ItemTypes.ACCESSORY];
    if (slotType === "cloth") return [ItemTypes.CLOTH];
    return [ItemTypes.ARMOR];
  };

  const canItemDrop = (item) => {
    if (item.slot === "ring" && (slotType === "ring1" || slotType === "ring2")) return true;
    return item.slot === slotType;
  };

  const [{ isOver, canDrop }, drop] = useDrop(() => ({
      accept: getAcceptedItemTypes(),
      canDrop: (item) => canItemDrop(item),
      drop: (item) => onEquipItem(item, slotType),
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
        canDrop: !!monitor.canDrop(),
      }),
    }), [slotType, onEquipItem]
  );

  // --- Refs kombinieren (für Drag, Drop und Tooltip) ---
  const combinedRef = (el) => {
    drag(el);
    drop(el);
    slotRef.current = el;
  };

  const getBackgroundColor = () => {
    if (isOver && canDrop) return "rgba(0, 255, 0, 0.2)";
    if (isOver && !canDrop) return "rgba(255, 0, 0, 0.2)";
    return "";
  };

  return (
    <div
      ref={combinedRef}
      className={`equipment-slot ${slotType}`}
      style={{ 
        backgroundColor: getBackgroundColor(),
        opacity: isDragging ? 0.5 : 1, // Visuelles Feedback beim Ziehen
        cursor: currentItem ? 'grab' : 'default' // Cursor ändern, wenn Item vorhanden
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {currentItem ? (
        // Item direkt hier rendern, statt InventoryItem zu verwenden
        <img src={getIcon(currentItem.icon)} alt={currentItem.name} className="item-icon" />
      ) : (
        <div className="slot-placeholder">{slotType}</div>
      )}
      {showTooltip && currentItem && !isDragging && !isOver && (
        <Tooltip item={currentItem} parentRef={slotRef} />
      )}
    </div>
  );
};

export default EquipmentSlot;