// /src/components/tooltip/Tooltip.js

import React, { useLayoutEffect, useRef } from "react";
import ReactDOM from "react-dom";
import "./Tooltip.css";

const Tooltip = ({ item, text, parentRef }) => {
  const tooltipRef = useRef(null);

  // --- KORREKTUR START ---
  useLayoutEffect(() => {
    if ((item || text) && parentRef && parentRef.current && tooltipRef.current) {
      const parentRect = parentRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const tooltipEl = tooltipRef.current;

      // Positioniere den Tooltip rechts neben dem Parent-Element
      let top = parentRect.top;
      let left = parentRect.right + 10; // 10px Abstand

      // Prüfen, ob der Tooltip aus dem Bildschirm herausragt
      if (left + tooltipRect.width > window.innerWidth) {
        left = parentRect.left - tooltipRect.width - 10; // Links positionieren
      }
      if (top + tooltipRect.height > window.innerHeight) {
        top = parentRect.bottom - tooltipRect.height; // Nach oben anpassen
      }
      if (top < 0) {
        top = 0; // Sicherstellen, dass er nicht oben aus dem Bild ragt
      }

      // Die berechneten Werte anwenden
      tooltipEl.style.top = `${top}px`;
      tooltipEl.style.left = `${left}px`;
    }
  }, [item, text, parentRef]);
  // --- KORREKTUR ENDE ---


  if (!item && !text) {
    return null;
  }

  const formatItemType = (item) => {
    // Diese Funktion muss noch implementiert werden, falls sie benötigt wird.
    // Beispiel:
    if (!item || !item.type) return null;
    return <div className="item-type">{item.type}</div>;
  };

  const tooltipClass = item ? 'item-tooltip' : 'text-tooltip';

  return ReactDOM.createPortal(
    <div ref={tooltipRef} className={`tooltip ${tooltipClass}`}>
      {item && (
        <>
          <h4 className={`item-name rarity-${item.rarity || 'common'}`}>{item.name}</h4>
          {formatItemType(item)}
          <div className="stats-grid">
            {item.damage && <><div>Schaden:</div><div>{item.damage}</div></>}
            {item.ac && <><div>Rüstungsklasse:</div><div>{item.ac}</div></>}
            {item.weight && <><div>Gewicht:</div><div>{item.weight}</div></>}
            {item.value && <><div>Wert:</div><div>{item.value}</div></>}
          </div>
          {item.properties && <div className="item-properties">{item.properties.join(' • ')}</div>}
          {item.description && <p className="item-description">{item.description}</p>}
          {item.bonus && <div className="item-bonus">{item.bonus}</div>}
        </>
      )}
      {text && !item && <div>{text}</div>}
    </div>,
    document.body
  );
};

export default Tooltip;