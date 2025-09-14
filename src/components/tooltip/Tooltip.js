import React, { useLayoutEffect, useRef, useState } from "react";
import ReactDOM from "react-dom";
import "./Tooltip.css";

const Tooltip = ({ item, parentRef }) => {
  const tooltipRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (parentRef.current && tooltipRef.current) {
      const parentRect = parentRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();

      let top = parentRect.top;
      let left = parentRect.right + 15; // Etwas mehr Abstand

      if (left + tooltipRect.width > window.innerWidth) {
        left = parentRect.left - tooltipRect.width - 15;
      }
      if (top + tooltipRect.height > window.innerHeight) {
        top = window.innerHeight - tooltipRect.height - 15;
      }
      if (top < 0) {
        top = 15;
      }
      if (left < 0) {
        left = 15;
      }

      setPosition({ top, left });
    }
  }, [item, parentRef]);

  if (!item) {
    return null;
  }
  
  // Helfer-Funktion, um den Item-Typ hübscher darzustellen
  const formatItemType = (item) => {
    if (!item.type) return null;
    const type = item.type.charAt(0).toUpperCase() + item.type.slice(1);
    return <div className="item-type">{type}</div>;
  };

  return ReactDOM.createPortal(
    <div
      ref={tooltipRef}
      className="tooltip"
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
    >
      <h4 className={`item-name rarity-${item.rarity || 'common'}`}>{item.name}</h4>
      {formatItemType(item)}

      <div className="stats-grid">
        {item.damage && <div>Schaden:</div>}
        {item.damage && <div>{item.damage}</div>}

        {item.ac && <div>Rüstungsklasse:</div>}
        {item.ac && <div>{item.ac}</div>}
      </div>

      {item.properties && (
        <div className="item-properties">
          {item.properties.join(' • ')}
        </div>
      )}

      {item.description && <p className="item-description">{item.description}</p>}
      
      {item.bonus && <div className="item-bonus">{item.bonus}</div>}
      {item.malus && <div className="item-malus">{item.malus}</div>}

      <div className="footer-grid">
        <div>Wert:</div>
        <div>{item.value} Gold</div>
        <div>Gewicht:</div>
        <div>{item.weight} Pfund</div>
      </div>
    </div>,
    document.getElementById("tooltip-root")
  );
};

export default Tooltip;