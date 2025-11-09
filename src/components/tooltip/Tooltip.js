// /src/components/tooltip/Tooltip.js
import React, { useState, useRef } from 'react'; // <-- useRef importieren
import ReactDOM from 'react-dom';
import './Tooltip.css';

const Tooltip = ({ text, item, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  
  // Ref für das Tooltip-Element selbst, um seine Größe zu messen
  const tooltipRef = useRef(null); // <-- NEU

  // Finde das Portal-Ziel. Standard ist tooltip-root, Fallback ist document.body
  let tooltipRoot = document.getElementById('tooltip-root');
  if (!tooltipRoot) {
    tooltipRoot = document.body; 
  }

  // Wird ausgelöst, wenn die Maus das Element betritt
  const handleMouseEnter = (e) => {
    // Setzt die Position leicht versetzt zur Maus
    // Die Overflow-Logik wird im handleMouseMove behandelt, da wir erst
    // nach dem ersten Rendern die Maße des Tooltips kennen.
    setPosition({ top: e.clientY + 15, left: e.clientX + 15 });
    setIsVisible(true);
  };

  // Folgt der Maus, solange sie über dem Element ist
  const handleMouseMove = (e) => {
    
    let newTop = e.clientY + 15;
    let newLeft = e.clientX + 15;

    // --- KORREKTUR: Overflow-Logik ---
    // Prüfe, ob das Tooltip-Element bereits gerendert wurde
    if (tooltipRef.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      // 1. Check, ob es RECHTS überläuft
      if (newLeft + tooltipRect.width > screenWidth) {
        // Positioniere es LINKS vom Cursor
        newLeft = e.clientX - 15 - tooltipRect.width;
      }

      // 2. Check, ob es UNTEN überläuft
      if (newTop + tooltipRect.height > screenHeight) {
        // Positioniere es ÜBER dem Cursor
        newTop = e.clientY - 15 - tooltipRect.height;
      }

      // 3. Check, ob es LINKS überläuft (nachdem es evtl. nach links geklappt wurde)
      if (newLeft < 0) {
        newLeft = 15; // Am linken Rand festpinnen (mit 15px Puffer)
      }

      // 4. Check, ob es OBEN überläuft (nachdem es evtl. nach oben geklappt wurde)
      if (newTop < 0) {
        newTop = 15; // Am oberen Rand festpinnen (mit 15px Puffer)
      }
    }
    // --- ENDE KORREKTUR ---

    setPosition({ top: newTop, left: newLeft });
  };

  // Wird ausgelöst, wenn die Maus das Element verlässt
  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  // Klont das Kind-Element (unverändert)
  const triggerElement = React.cloneElement(children, {
    onMouseEnter: handleMouseEnter,
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
  });

  // --- Logik für Item-Tooltips (unverändert) ---
  const formatItemType = (item) => {
    if (!item || !item.type) return null;
    return <div className="item-type">{item.type}</div>;
  };

  const tooltipClass = item ? 'item-tooltip' : 'text-tooltip';
  // --- Ende Item-Logik ---

  return (
    <>
      {/* Das ist das Element, das den Tooltip auslöst (z.B. <li>) */}
      {triggerElement}
      
      {/* Das ist der Tooltip selbst, der ins Portal gerendert wird */}
      {isVisible && tooltipRoot &&
        ReactDOM.createPortal(
          <div
            ref={tooltipRef} // <-- NEU: Ref an das Element binden
            // Wir verwenden die Originalklasse .tooltip
            className={`tooltip ${tooltipClass}`} 
            // Wendet die Mausposition als Inline-Stil an
            style={{ 
              top: `${position.top}px`, 
              left: `${position.left}px` 
            }}
          >
            {/* Logik zur Anzeige von Items ODER Text (unverändert) */}
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
          tooltipRoot // Sendet es an unser Portal
        )}
    </>
  );
};

export default Tooltip;