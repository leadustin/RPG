// src/components/character_sheet/EquipmentSlot.js

import React, { useRef } from 'react'; // useState entfernt
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
  // const [showTooltip, setShowTooltip] = useState(false); // ENTFERNT
  const slotRef = useRef(null);

  // --- Drag-Logik (unverändert) ---
  const [{ isDragging }, drag] = useDrag(() => ({
    type: currentItem ? (ItemTypes[currentItem.type.toUpperCase()] || ItemTypes.ITEM) : ItemTypes.ITEM,
    canDrag: !!currentItem && !isTwoHandedDisplay,
    item: { ...currentItem, equippedIn: slotType },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [currentItem, slotType, isTwoHandedDisplay]);

  // --- Drop-Logik (größtenteils unverändert) ---
  const getAcceptedItemTypes = () => {
    // --- WAFFEN (Main/Off/Range) ---
    if (slotType.includes("hand")) {
      if (slotType === "off-hand") {
        return [ItemTypes.WEAPON, ItemTypes.ARMOR]; // Schilde sind 'armor'
      }
      return [ItemTypes.WEAPON];
    }
    if (slotType === "ranged") return [ItemTypes.WEAPON];

    // --- SCHMUCK (Ringe/Amulette) ---
    if (slotType.includes("ring") || slotType === "amulet") return [ItemTypes.ACCESSORY];
    
    // --- RÜSTUNGSTEILE (Gürtel, Schuhe, Handschuhe, Kopf) ---
    if (slotType === "belt") return [ItemTypes.BELT];
    if (slotType === "boots") return [ItemTypes.BOOTS];
    if (slotType === "gloves") return [ItemTypes.HANDS];
    if (slotType === "head") return [ItemTypes.HEAD];

    // --- +++ NEU: KLEIDUNG & MUNITION +++ ---
    if (slotType === "cloth") return [ItemTypes.CLOTH];
    if (slotType === "ammo") return [ItemTypes.AMMO];
    // --- ENDE NEU ---

    // --- STANDARD RÜSTUNG (Brust) ---
    if (slotType === "armor") return [ItemTypes.ARMOR];

    return []; // Fallback
  };

  const canItemDrop = (item) => {
    if (slotType === "off-hand") {
      if (item.type === "armor" && item.subtype === "shield") {
        return true;
      }
      if (item.type === "weapon" && item.properties && 
          (item.properties.includes("Leicht") || item.properties.includes("Light"))) {
        return true;
      }
      if (item.type === "weapon" && item.properties && 
          item.properties.some(p => p.startsWith('Vielseitig'))) {
        return true;
      }
      return false;
    }
    if (item.slot === "ring" && (slotType === "ring1" || slotType === "ring2")) return true;
    return item.slot === slotType;
  };

  const [{ isOver, canDrop }, drop] = useDrop(() => ({
      accept: getAcceptedItemTypes(),
      canDrop: (item) => {
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
  // KORREKTUR: Wir müssen slotRef hier setzen, damit der Wrapper funktioniert
  const combinedRef = (el) => {
    drag(el);
    drop(el);
    slotRef.current = el;
  };

  const getBackgroundColor = () => {
    if (isTwoHandedDisplay) return "rgba(100, 100, 100, 0.3)";
    if (isOver && canDrop) return "rgba(0, 255, 0, 0.2)";
    if (isOver && !canDrop) return "rgba(255, 0, 0, 0.2)";
    return "";
  };

  const getSlotLabel = () => {
    switch(slotType) {
      case "main-hand": return "Main";
      case "off-hand": return "Off";
      case "ranged": return "Range";
      default: return slotType;
    }
  };

  // --- KORREKTUR: Logik aufteilen für Wrapper ---

  // 1. Definiere das DIV, das WIRKLICH angezeigt wird
  const slotDiv = (
    <div
      ref={combinedRef}
      className={`equipment-slot ${slotType} ${isTwoHandedDisplay ? 'two-handed-display' : ''}`}
      style={{ 
        backgroundColor: getBackgroundColor(),
        opacity: isDragging ? 0.5 : (isTwoHandedDisplay ? 0.8 : 1),
        cursor: (currentItem && !isTwoHandedDisplay) ? 'grab' : 'default'
      }}
      // onMouseEnter/Leave ENTFERNT
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
      {/* Tooltip-Aufruf HIER ENTFERNT */}
    </div>
  );

  // 2. Entscheide, ob der Wrapper (Tooltip) benötigt wird
  
  // Zeige Tooltip nur, wenn ein Item da ist, nicht gezogen wird und nicht (erfolglos) darüber geschwebt wird
  const showTooltipWrapper = currentItem && !isDragging;

  return showTooltipWrapper ? (
    <Tooltip 
      item={currentItem} 
      // parentRef ist nicht mehr nötig, da Tooltip.js es über children bekommt
      extraText={isTwoHandedDisplay ? "Zweihändig geführt" : ""}
    >
      {slotDiv}
    </Tooltip>
  ) : (
    slotDiv // Andernfalls gib nur das nackte DIV zurück
  );
};

export default EquipmentSlot;