import React from "react";
import { useDrop } from "react-dnd";
import InventoryItem from "./InventoryItem";
import "./EquipmentSlot.css";
import { ItemTypes } from "../../dnd/itemTypes";

const EquipmentSlot = ({ slotType, currentItem, onEquipItem }) => {
  // Bestimmt, welche Item-Typen dieser Slot akzeptiert
  const getAcceptedItemTypes = () => {
    if (slotType.includes("hand") || slotType === "ranged") {
      return [ItemTypes.WEAPON];
    }
    if (
      slotType.includes("ring") ||
      slotType === "amulet" ||
      slotType === "belt"
    ) {
      return [ItemTypes.ACCESSORY];
    }

    if (slotType === "cloth") {
      return [ItemTypes.CLOTH];
    }
    return [ItemTypes.ARMOR];
  };

  const canItemDrop = (item) => {
    if (
      item.slot === "ring" &&
      (slotType === "ring1" || slotType === "ring2")
    ) {
      return true;
    }
    return item.slot === slotType;
  };

  const [{ isOver, canDrop }, drop] = useDrop(
    () => ({
      accept: getAcceptedItemTypes(),
      canDrop: (item) => canItemDrop(item),
      drop: (item) => onEquipItem(item, slotType),
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
        canDrop: !!monitor.canDrop(),
      }),
    }),
    [slotType, onEquipItem]
  );

  const getBackgroundColor = () => {
    if (isOver && canDrop) return "rgba(0, 255, 0, 0.2)";
    if (isOver && !canDrop) return "rgba(255, 0, 0, 0.2)";
    return "var(--slot-bg)";
  };

  return (
    <div
      ref={drop}
      className="equipment-slot"
      style={{ backgroundColor: getBackgroundColor() }}
    >
      {currentItem ? (
        <InventoryItem item={currentItem} equippedIn={slotType} />
      ) : null}
    </div>
  );
};

export default EquipmentSlot;
