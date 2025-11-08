// /src/components/tooltip/Tooltip.js
import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import './Tooltip.css'; // Wir verwenden deine Tooltip.css weiter

const Tooltip = ({ text, item, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Finde das Portal-Ziel. Standard ist tooltip-root, Fallback ist document.body
  let tooltipRoot = document.getElementById('tooltip-root');
  if (!tooltipRoot) {
    tooltipRoot = document.body; 
  }

  // Wird ausgelöst, wenn die Maus das Element betritt
  const handleMouseEnter = (e) => {
    // Setzt die Position leicht versetzt zur Maus
    setPosition({ top: e.clientY + 15, left: e.clientX + 15 });
    setIsVisible(true);
  };

  // Folgt der Maus, solange sie über dem Element ist
  const handleMouseMove = (e) => {
    
    let newTop = e.clientY + 15;
    let newLeft = e.clientX + 15;

    // TODO: Fügen Sie hier Logik hinzu, um ein Überlaufen des Bildschirms zu verhindern
    // (Fürs Erste lassen wir es einfach der Maus folgen)

    setPosition({ top: newTop, left: newLeft });
  };

  // Wird ausgelöst, wenn die Maus das Element verlässt
  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  // Klont das Kind-Element (z.B. das <li>) und fügt ihm die Maus-Events hinzu
  const triggerElement = React.cloneElement(children, {
    onMouseEnter: handleMouseEnter,
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
  });

  // --- Logik für Item-Tooltips (aus deiner Originaldatei) ---
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
            // Wir verwenden die Originalklasse .tooltip
            className={`tooltip ${tooltipClass}`} 
            // Wendet die Mausposition als Inline-Stil an
            style={{ 
              top: `${position.top}px`, 
              left: `${position.left}px` 
            }}
          >
            {/* Logik zur Anzeige von Items ODER Text (aus deiner Originaldatei) */}
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