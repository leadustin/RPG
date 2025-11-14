// /src/components/tooltip/Tooltip.js
import React, { useState, useRef } from 'react';
import ReactDOM from 'react-dom';
import './Tooltip.css';

// +++ NEU: Fehlende Hilfsfunktion +++
// Diese Funktion wird in deinem JSX aufgerufen, war aber in der
// hochgeladenen Datei nicht definiert. Sie wird für Item-Tooltips benötigt.
const formatItemType = (item) => {
  if (!item || !item.type) return null;
  const typeTranslations = {
    weapon: 'Waffe',
    armor: 'Rüstung',
    shield: 'Schild',
    helmet: 'Kopf',
    chest: 'Brust',
    hands: 'Hände',
    boots: 'Füße',
    accessory: 'Accessoire',
    belt: 'Gürtel',
    // Fügen Sie bei Bedarf weitere hinzu
  };
  const translatedType = typeTranslations[item.type] || item.type;
  return <div className="item-type">{translatedType}</div>;
};
// +++ ENDE NEU +++


// +++ GEÄNDERT: "content" als Prop hinzugefügt +++
// (Diese Änderung hattest du schon, aber ich nehme sie für die Vollständigkeit mit auf)
const Tooltip = ({ text, item, content, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef(null); 

  // +++ NEU: Ref für den Ausblende-Timer +++
  // Wir verwenden useRef, damit der Timer-Wert zwischen 
  // den Render-Vorgängen bestehen bleibt, ohne einen Re-Render auszulösen.
  const hideTimerRef = useRef(null);
  // +++ ENDE NEU +++

  let tooltipRoot = document.getElementById('tooltip-root');
  if (!tooltipRoot) {
    tooltipRoot = document.body; 
  }

  // +++ GEÄNDERT: handleMouseEnter +++
  const handleMouseEnter = (e) => {
    // 1. Breche jeden "Ausblende"-Timer ab, der evtl. noch läuft.
    // Das ist der Schlüssel, um das Flackern zu verhindern.
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    // 2. Setze Position und zeige den Tooltip sofort an.
    setPosition({ top: e.clientY + 15, left: e.clientX + 15 });
    setIsVisible(true);
  };
  // +++ ENDE GEÄNDERT +++

  const handleMouseMove = (e) => {
    let newTop = e.clientY + 15;
    let newLeft = e.clientX + 15;

    if (tooltipRef.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      if (e.clientX + 15 + tooltipRect.width > viewportWidth) {
        newLeft = e.clientX - 15 - tooltipRect.width;
      }
      if (e.clientY + 15 + tooltipRect.height > viewportHeight) {
        newTop = e.clientY - 15 - tooltipRect.height;
      }
    }
    
    setPosition({ top: newTop, left: newLeft });
  };

  // +++ GEÄNDERT: handleMouseLeave +++
  const handleMouseLeave = () => {
    // 1. Setze einen Timer, um den Tooltip zu verbergen.
    const HIDE_DELAY_MS = 150; // 150ms Verzögerung

    hideTimerRef.current = setTimeout(() => {
      setIsVisible(false);
    }, HIDE_DELAY_MS);
  };
  // +++ ENDE GEÄNDERT +++

  const tooltipClass = item ? 'item-tooltip' : 'text-tooltip';

  return (
    <>
      {React.Children.map(children, (child) =>
        React.cloneElement(child, {
          onMouseEnter: handleMouseEnter,
          onMouseMove: handleMouseMove,
          onMouseLeave: handleMouseLeave,
        })
      )}

      {isVisible &&
        ReactDOM.createPortal(
          <div
            ref={tooltipRef}
            className={`tooltip ${tooltipClass}`} 
            style={{ 
              top: `${position.top}px`, 
              left: `${position.left}px` 
            }}
          >
            {/* +++ GEÄNDERT: Logik zur Anzeige von "content" +++ */}
            {/* Priorisiere "content", wenn es existiert */}
            {content && content} 

            {!content && item && (
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
            
            {!content && text && !item && <div>{text}</div>}
            
          </div>,
          tooltipRoot
        )}
    </>
  );
};

export default Tooltip;