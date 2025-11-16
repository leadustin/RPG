// src/components/character_sheet/DraggableItem.js

import React, { useRef, useState } from 'react';
import { useDrag } from 'react-dnd';
import './DraggableItem.css';
import Tooltip from '../tooltip/Tooltip';

const DraggableItem = ({ item, index }) => {
  const dragRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

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
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <img src={item.icon || 'https://placeholder.pics/svg/48'} alt={item.name} />
      </div>
      {/* Tooltip nur anzeigen, wenn isHovered true ist UND das Item nicht gezogen wird */}
      {isHovered && !isDragging && <Tooltip item={item} parentRef={dragRef} />}
    </>
  );
};

export default DraggableItem;