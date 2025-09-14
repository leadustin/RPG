import React, { useRef, useState } from 'react'; // useState hinzufügen
import { useDrag } from 'react-dnd';
import './DraggableItem.css';
import Tooltip from '../tooltip/Tooltip'; // Der Pfad sollte bereits stimmen

const DraggableItem = ({ item, index }) => {
  const dragRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false); // Hover-Zustand hinzufügen

  const [{ isDragging }, drag] = useDrag(() => ({
    type: item.type,
    item: { ...item, originalIndex: index },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  drag(dragRef);

  return (
    <>
      <div
        ref={dragRef}
        className={`draggable-item ${isDragging ? 'dragging' : ''}`}
        onMouseEnter={() => setIsHovered(true)} // Maus-Events hinzufügen
        onMouseLeave={() => setIsHovered(false)}
      >
        <img src={item.icon || 'https://placeholder.pics/svg/48'} alt={item.name} />
      </div>
      {/* Tooltip nur anzeigen, wenn isHovered true ist */}
      {isHovered && <Tooltip item={item} parentRef={dragRef} />}
    </>
  );
};

export default DraggableItem;