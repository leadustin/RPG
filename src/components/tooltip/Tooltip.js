import React, { useLayoutEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import "./Tooltip.css";

// Die Komponente akzeptiert jetzt "item" ODER "text" als Prop
const Tooltip = ({ item, text, parentRef }) => {
  const tooltipRef = useRef(null);

  useLayoutEffect(() => {
    if (parentRef.current && tooltipRef.current) {
      const parentRect = parentRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      let top = parentRect.top;
      let left = parentRect.right + 15;

      if (left + tooltipRect.width > window.innerWidth) {
        left = parentRect.left - tooltipRect.width - 15;
      }
      if (top + tooltipRect.height > window.innerHeight) {
        top = window.innerHeight - tooltipRect.height - 15;
      }
      if (top < 0) top = 15;
      if (left < 0) left = 15;
      
      tooltipRef.current.style.top = `${top}px`;
      tooltipRef.current.style.left = `${left}px`;
    }
  }, [item, text, parentRef]);

  // Wenn weder item noch text vorhanden ist, wird nichts gerendert.
  if (!item && !text) {
    return null;
  }
  
  const formatItemType = (item) => {
    if (!item || !item.type) return null;
    const type = item.type.charAt(0).toUpperCase() + item.type.slice(1);
    return <div className="item-type">{type}</div>;
  };

  // Bestimmt die CSS-Klasse basierend auf dem Inhaltstyp.
  const tooltipClass = item ? 'item-tooltip' : 'text-tooltip';

  return ReactDOM.createPortal(
    // Die Klasse wird hier dynamisch gesetzt.
    <div ref={tooltipRef} className={`tooltip ${tooltipClass}`}>
      {/* Wenn ein "item"-Objekt vorhanden ist, render die Item-Details */}
      {item && (
        <>
          <h4 className={`item-name rarity-${item.rarity || 'common'}`}>{item.name}</h4>
          {formatItemType(item)}
          <div className="stats-grid">
            {item.damage && <><div>Schaden:</div><div>{item.damage}</div></>}
            {item.ac && <><div>Rüstungsklasse:</div><div>{item.ac}</div></>}
          </div>
          {item.properties && <div className="item-properties">{item.properties.join(' • ')}</div>}
          {item.description && <p className="item-description">{item.description}</p>}
          {item.bonus && <div className="item-bonus">{item.bonus}</div>}
        </>
      )}
      {/* Wenn nur "text" vorhanden ist, render ein einfaches Paragraphen-Element */}
      {text && <p>{text}</p>}
    </div>,
    document.body
  );
};

export default Tooltip;