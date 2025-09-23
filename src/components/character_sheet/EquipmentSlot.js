// src/components/character_sheet/EquipmentSlot.js

import React, { useState, useRef } from 'react';
import { useDrop, useDrag } from 'react-dnd';
import Tooltip from '../tooltip/Tooltip';
import { ItemTypes } from '../../dnd/itemTypes';
import './EquipmentSlot.css';

const getIcon = (iconName) => {
    try {
        return require(`../../assets/images/icons/${iconName}`);
    } catch (err) {
        console.warn(`Icon not found: ${iconName}`);
        return 'https://placeholder.pics/svg/40x40';
    }
};

const EquipmentSlot = ({ slotType, currentItem, onEquipItem, isTwoHandedDisplay = false }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const slotRef = useRef(null);

  // --- Drag-Logik für ausgerüstete Items ---
  const [{ isDragging }, drag] = useDrag(() => ({
    type: currentItem ? (ItemTypes[currentItem.type.toUpperCase()] || ItemTypes.ITEM) : ItemTypes.ITEM,
    canDrag: !!currentItem && !isTwoHandedDisplay, // Two-Handed Display Items können nicht gezogen werden
    item: { ...currentItem, equippedIn: slotType },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [currentItem, slotType, isTwoHandedDisplay]);

  // --- Erweiterte Drop-Logik für Schilde ---
  const getAcceptedItemTypes = () => {
    if (slotType.includes("hand")) {
      // Off-hand kann sowohl Waffen als auch Schilde (Armor) akzeptieren
      if (slotType === "off-hand") {
        return [ItemTypes.WEAPON, ItemTypes.ARMOR];
      }
      // Main-hand nur Waffen
      return [ItemTypes.WEAPON];
    }
    if (slotType === "ranged") return [ItemTypes.WEAPON];
    if (slotType.includes("ring") || slotType === "amulet" || slotType === "belt") return [ItemTypes.ACCESSORY];
    if (slotType === "cloth") return [ItemTypes.CLOTH];
    return [ItemTypes.ARMOR];
  };

  const canItemDrop = (item) => {
    // Spezielle Logik für Off-Hand Slot
    if (slotType === "off-hand") {
      // Schilde können in Off-Hand
      if (item.type === "armor" && item.subtype === "shield") {
        return true;
      }
      // Leichte Waffen können in Off-Hand für Two-Weapon Fighting
      if (item.type === "weapon" && item.properties && 
          (item.properties.includes("Leicht") || item.properties.includes("Light"))) {
        return true;
      }
      // Vielseitige Waffen können in Off-Hand, aber nur einhändig
      if (item.type === "weapon" && item.properties && 
          item.properties.some(p => p.startsWith('Vielseitig'))) {
        return true;
      }
      return false;
    }

    // Standard-Slot-Logik
    if (item.slot === "ring" && (slotType === "ring1" || slotType === "ring2")) return true;
    return item.slot === slotType;
  };

  const [{ isOver, canDrop }, drop] = useDrop(() => ({
      accept: getAcceptedItemTypes(),
      canDrop: (item) => {
        // Wenn es ein Two-Handed Display ist, können keine Items gedroppt werden
        if (isTwoHandedDisplay) return false;
        return canItemDrop(item);
      },
      drop: (item) => onEquipItem(item, slotType),
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
        canDrop: !!monitor.canDrop(),
      }),
    }), [slotType, onEquipItem, isTwoHandedDisplay]
  );

  // --- Refs kombinieren ---
  const combinedRef = (el) => {
    drag(el);
    drop(el);
    slotRef.current = el;
  };

  const getBackgroundColor = () => {
    if (isTwoHandedDisplay) return "rgba(100, 100, 100, 0.3)"; // Grauer Hintergrund für Two-Handed Display
    if (isOver && canDrop) return "rgba(0, 255, 0, 0.2)";
    if (isOver && !canDrop) return "rgba(255, 0, 0, 0.2)";
    return "";
  };

  // Slot-Label anzeigen
  const getSlotLabel = () => {
    switch(slotType) {
      case "main-hand": return "Main";
      case "off-hand": return "Off";
      case "ranged": return "Range";
      default: return slotType;
    }
  };

  return (
    <div
      ref={combinedRef}
      className={`equipment-slot ${slotType} ${isTwoHandedDisplay ? 'two-handed-display' : ''}`}
      style={{ 
        backgroundColor: getBackgroundColor(),
        opacity: isDragging ? 0.5 : (isTwoHandedDisplay ? 0.8 : 1),
        cursor: (currentItem && !isTwoHandedDisplay) ? 'grab' : 'default'
      }}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {currentItem ? (
        <div style={{ position: 'relative' }}>
          <img 
            src={getIcon(currentItem.icon)} 
            alt={currentItem.name} 
            className="item-icon"
            style={{ 
              filter: isTwoHandedDisplay ? 'brightness(0.7) sepia(0.2)' : 'none' 
            }}
          />
          {isTwoHandedDisplay && (
            <div className="two-handed-indicator">⚔️</div>
          )}
        </div>
      ) : (
        <div className="slot-placeholder">{getSlotLabel()}</div>
      )}
      {showTooltip && currentItem && !isDragging && !isOver && (
        <Tooltip 
          item={currentItem} 
          parentRef={slotRef}
          extraText={isTwoHandedDisplay ? "Zweihändig geführt" : ""}
        />
      )}
    </div>
  );
};

export default EquipmentSlot;