// src/components/character_sheet/EquipmentSlot.jsx
import React, { useRef } from 'react';
import { useDrop, useDrag } from 'react-dnd';
import Tooltip from '../tooltip/Tooltip';
import { ItemTypes } from '../../dnd/itemTypes';
import './EquipmentSlot.css';

// Helper um Bilder zu laden (Vite-kompatibel wäre besser mit import.meta.glob, 
// aber wir nutzen hier den require-Fallback oder Pfad-Check wie im CharacterSheet)
const getIcon = (iconName) => {
    try {
        // Falls du Vite nutzt, müsstest du hier eigentlich die importierte Map nutzen.
        // Da EquipmentSlot aber oft rekursiv/tief ist, geben wir hier oft einfach die URL weiter,
        // wenn sie schon aufgelöst wurde, oder nutzen einen Platzhalter.
        // Wenn iconName schon ein Pfad ist (was bei deiner App so zu sein scheint):
        if (iconName && (iconName.startsWith('http') || iconName.startsWith('data:'))) {
            return iconName;
        }
        // Fallback für direkten Dateinamen (funktioniert nur mit Webpack/require, bei Vite evtl. anpassen)
        return new URL(`../../assets/images/icons/${iconName}`, import.meta.url).href;
    } catch (err) {
        return 'https://placeholder.pics/svg/40x40';
    }
};

const EquipmentSlot = ({ 
    slotType, 
    currentItem, 
    onEquipItem, 
    isTwoHandedDisplay = false,
    // Neue Props für Köcher
    onFillQuiver,
    onUnloadQuiver
}) => {
  const slotRef = useRef(null);

  // --- 1. Drag-Logik (Item aus dem Slot ziehen) ---
  const [{ isDragging }, drag] = useDrag(() => ({
    type: currentItem ? (ItemTypes[currentItem.type.toUpperCase()] || ItemTypes.ITEM) : ItemTypes.ITEM,
    canDrag: !!currentItem && !isTwoHandedDisplay,
    item: { ...currentItem, equippedIn: slotType },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [currentItem, slotType, isTwoHandedDisplay]);

  // --- 2. Drop-Logik (Was darf hier rein?) ---
  const getAcceptedItemTypes = () => {
    // Waffen & Schilde
    if (slotType.includes("hand")) {
      if (slotType === "off-hand") return [ItemTypes.WEAPON, ItemTypes.ARMOR, ItemTypes.SHIELD];
      return [ItemTypes.WEAPON];
    }
    // Fernkampf
    if (slotType === "ranged") return [ItemTypes.WEAPON];
    
    // Rüstungsteile
    if (slotType === "head") return [ItemTypes.HEAD];
    if (slotType === "armor") return [ItemTypes.ARMOR];
    if (slotType === "boots") return [ItemTypes.BOOTS];
    if (slotType === "gloves") return [ItemTypes.HANDS]; // Achtung: JSON type ist 'hands', Slot ist 'gloves'
    if (slotType === "belt") return [ItemTypes.BELT];
    if (slotType === "cloak") return [ItemTypes.CLOTH, ItemTypes.ACCESSORY]; // Umhänge sind oft Accessory oder Cloth

    // Schmuck
    if (slotType.includes("ring") || slotType === "amulet") return [ItemTypes.ACCESSORY];
    
    // +++ FIX: Kleidung explizit erlauben +++
    if (slotType === "cloth") return [ItemTypes.CLOTH]; 

    // +++ FIX: Munition & Köcher +++
    if (slotType === "ammo") {
        // Wenn bereits ein Köcher ausgerüstet ist, erlauben wir Munition (zum Füllen)
        if (currentItem && currentItem.type === 'quiver') {
            return [ItemTypes.AMMO];
        }
        // Sonst erlauben wir Köcher oder Munition
        return [ItemTypes.QUIVER, ItemTypes.AMMO];
    }

    return [];
  };

  const canItemDrop = (item) => {
      // 1. Spezialfall: Off-Hand (Waffen nur wenn leicht, Schilde immer)
      if (slotType === "off-hand") {
          if (item.type === "shield" || (item.type === "armor" && item.subtype === "shield")) return true;
          if (item.type === "weapon") {
              // Erlaube leichte Waffen
              if (item.properties?.some(p => p.includes("Leicht") || p.includes("Light"))) return true;
              return false;
          }
          return false;
      }
      
      // 2. Spezialfall: Ringe (Slot heißt ring1/ring2, Item heißt ring)
      if (item.slot === "ring" && slotType.startsWith("ring")) return true;

      // 3. Spezialfall: Köcher füllen (Slot: ammo, Item: ammo, Current: quiver)
      if (slotType === "ammo" && currentItem?.type === "quiver" && item.type === "ammo") {
          return true; // Wir erlauben das Droppen zum Füllen
      }

      // 4. Standard-Check: Slot muss übereinstimmen
      // (z.B. Item slot="cloth" -> Slot slotType="cloth")
      return item.slot === slotType;
  };

  const [{ isOver, canDrop }, drop] = useDrop(() => ({
      accept: getAcceptedItemTypes(),
      canDrop: (item) => !isTwoHandedDisplay && canItemDrop(item),
      drop: (item) => {
          // Logik: Füllen oder Ausrüsten?
          if (slotType === 'ammo' && currentItem?.type === 'quiver' && item.type === 'ammo') {
             if (onFillQuiver) onFillQuiver(item);
          } else {
             onEquipItem(item, slotType);
          }
      },
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
        canDrop: !!monitor.canDrop(),
      }),
    }), [slotType, onEquipItem, currentItem, onFillQuiver, isTwoHandedDisplay]
  );

  // Refs verbinden
  const combinedRef = (el) => {
    drag(el);
    drop(el);
    slotRef.current = el;
  };

  // --- 3. Anzeige ---
  const renderContent = () => {
      if (!currentItem) {
          // Platzhalter-Text anzeigen, wenn leer
          let label = slotType;
          if (slotType === "main-hand") label = "Main";
          if (slotType === "off-hand") label = "Off";
          if (slotType === "ranged") label = "Fern";
          return <div className="slot-placeholder">{label}</div>;
      }

      // Item Icon holen
      // Wir nehmen an, dass 'currentItem.icon' der Dateiname ist (z.B. "robe.webp")
      // Die getIcon Funktion oben baut den Pfad.
      const iconUrl = getIcon(currentItem.icon);

      return (
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
              <img 
                src={iconUrl} 
                alt={currentItem.name} 
                className="item-icon"
                style={{ 
                    filter: isTwoHandedDisplay ? 'brightness(0.6) sepia(0.5)' : 'none' 
                }}
              />
              
              {/* Indikator für Zweihand-Nutzung (grauer Slot) */}
              {isTwoHandedDisplay && <div className="two-handed-indicator">⚔️</div>}

              {/* Zähler für Köcher (Inhalt / Kapazität) */}
              {currentItem.type === 'quiver' && (
                  <div className="quiver-counter">
                      {currentItem.content ? currentItem.content.quantity : 0}/{currentItem.capacity || 20}
                  </div>
              )}
          </div>
      );
  };

  // Rechtsklick Handler (z.B. um Köcher zu leeren)
  const handleContextMenu = (e) => {
      if (slotType === 'ammo' && currentItem?.type === 'quiver' && currentItem.content) {
          e.preventDefault();
          if (onUnloadQuiver) onUnloadQuiver();
      }
  };

  // Tooltip Text zusammenbauen
  let tooltipText = "";
  if (isTwoHandedDisplay) tooltipText = "Wird zweihändig geführt";
  if (currentItem?.type === 'quiver' && currentItem.content) {
      tooltipText = `Inhalt: ${currentItem.content.quantity}x ${currentItem.content.name}`;
  }

  const showTooltip = currentItem && !isDragging;

  return (
      <div
        ref={combinedRef}
        className={`equipment-slot ${slotType} ${isTwoHandedDisplay ? 'two-handed-display' : ''}`}
        onContextMenu={handleContextMenu}
        style={{ 
            backgroundColor: (isOver && canDrop) ? "rgba(0, 255, 0, 0.2)" : (isOver && !canDrop) ? "rgba(255, 0, 0, 0.2)" : "",
            opacity: isDragging ? 0.5 : 1,
            cursor: currentItem ? 'grab' : 'default'
        }}
      >
        {showTooltip ? (
            <Tooltip item={currentItem} extraText={tooltipText}>
                {renderContent()}
            </Tooltip>
        ) : (
            renderContent()
        )}
      </div>
  );
};

export default EquipmentSlot;