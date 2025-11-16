import React from 'react';
import { useDrop } from 'react-dnd'; // useDrop importieren
import { ItemTypes } from '../../dnd/itemTypes'; // Unsere Item-Typen
import DraggableItem from './DraggableItem';
import './InventoryPanel.css';

// Wir erstellen eine neue, interne Slot-Komponente
const DroppableSlot = ({ item, index, onDropItem }) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemTypes.ITEM,
    // Diese Funktion wird aufgerufen, wenn ein Item auf dem Slot losgelassen wird
    drop: (draggedItem) => onDropItem(draggedItem, index),
    collect: (monitor) => ({
      // isOver ist true, wenn gerade ein Item über diesem Slot schwebt
      isOver: !!monitor.isOver(),
    }),
  }), [index, onDropItem]); // Abhängigkeiten des Hooks

  return (
    // Wir heften die `drop`-Referenz an das Slot-DIV, um es als Ziel zu markieren
    <div ref={drop} className={`inventory-slot ${isOver ? 'hover' : ''}`}>
      {item && <DraggableItem item={item} index={index} />}
    </div>
  );
};

// Das Hauptpanel rendert jetzt die DroppableSlots
const InventoryPanel = ({ character, onMoveItem }) => {
  const inventory = character.inventory || [];

  return (
    <div className="inventory-container">
      <h3>Inventar</h3>
      <div className="inventory-grid">
        {inventory.map((item, index) => (
          <DroppableSlot
            key={index}
            item={item}
            index={index}
            onDropItem={onMoveItem} // Eine neue Funktion, die wir von oben bekommen
          />
        ))}
      </div>
    </div>
  );
};

export default InventoryPanel;