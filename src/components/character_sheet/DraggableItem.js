import React from 'react';
import { useDrag } from 'react-dnd';
import { ItemTypes } from '../../dnd/itemTypes';
import './DraggableItem.css';

const DraggableItem = ({ item, index }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.ITEM,
    // Hier packen wir die Daten rein, die beim Ziehen verfügbar sein sollen
    item: { ...item, index, source: 'inventory' }, 
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }), [item, index]);

  // Wenn ein Item gezogen wird, machen wir es halbtransparent
  const style = {
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={drag} className="draggable-item" style={style}>
      <div className="item-icon-placeholder">{item.name.substring(0, 2)}</div>
      {item.quantity > 1 && (
        <span className="item-quantity">{item.quantity}</span>
      )}
    </div>
  );
};

export default DraggableItem;