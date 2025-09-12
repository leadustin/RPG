import React from 'react';
import { useDrop } from 'react-dnd';
import { ItemTypes } from '../../dnd/itemTypes';
import DraggableItem from './DraggableItem'; // Wir brauchen das auch hier
import './EquipmentSlot.css';

const EquipmentSlot = ({ slotName, item, onDropItem, slotType }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.ITEM,
    // Wenn ein Item hier abgelegt wird, rufen wir onDropItem mit dem Slot-Typ auf
    drop: (draggedItem) => onDropItem(draggedItem, slotType),
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }), [onDropItem, slotType]);

  return (
    <div className="equipment-slot">
      <div ref={drop} className={`slot-background ${isOver ? 'hover' : ''}`}>
        {/* Wenn ein Item ausgerüstet ist, machen wir es ziehbar */}
        {item && (
          <DraggableItem 
            item={item} 
            source="equipment" // Wichtig: Wir markieren die Quelle als 'equipment'
            slotType={slotType} // Und geben den Slot-Typ mit
          />
        )}
      </div>
      <span className="slot-name">{slotName}</span>
    </div>
  );
};

export default EquipmentSlot;