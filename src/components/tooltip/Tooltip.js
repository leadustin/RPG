// /src/components/tooltip/Tooltip.js
import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './Tooltip.css';

// Modulweiter "Active Tooltip"-Slot: stellt sicher, dass immer nur ein Tooltip aktiv ist.
let activeTooltip = null;

// Hilfsfunktion für Itemtypen (wie bei dir)
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
  };
  const translatedType = typeTranslations[item.type] || item.type;
  return <div className="item-type">{translatedType}</div>;
};

const Tooltip = ({ text, item, content, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef(null);
  const hideTimerRef = useRef(null);

  // eindeutige id / identity für diese Instanz
  const idRef = useRef(Symbol('tooltip'));

  let tooltipRoot = document.getElementById('tooltip-root');
  if (!tooltipRoot) tooltipRoot = document.body;

  // Funktion, die diese Instanz sofort versteckt (wird vom "activeTooltip"-Slot genutzt)
  const hideImmediately = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    setIsVisible(false);
    // Falls diese Instanz aktuell registriert ist, leeren
    if (activeTooltip && activeTooltip.id === idRef.current) {
      activeTooltip = null;
    }
  };

  // Funktion, die den "activeTooltip"-Slot auf diese Instanz setzt
  const registerAsActive = () => {
    // Falls eine andere Instanz aktiv ist, zwinge sie zu verschwinden
    if (activeTooltip && activeTooltip.id !== idRef.current) {
      if (typeof activeTooltip.hideImmediately === 'function') {
        activeTooltip.hideImmediately();
      }
    }

    // Setze uns als aktive Instanz
    activeTooltip = {
      id: idRef.current,
      hideImmediately,
    };
  };

  const handleMouseEnter = (e) => {
    // Wenn wir selbst einen hide-timer hatten, abbrechen
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }

    // Stelle sicher, dass alle anderen verschwinden und wir als aktiv registriert sind
    registerAsActive();

    // Position setzen und sofort anzeigen
    setPosition({ top: e.clientY + 15, left: e.clientX + 15 });
    setIsVisible(true);
  };

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

  const handleMouseLeave = (e) => {
    const HIDE_DELAY_MS = 150;
    const buffer = 5; // 5px Grace-Zone

    const elem = e.currentTarget;
    const rect = elem.getBoundingClientRect();

    // Maus noch in Nähe? Dann NICHT ausblenden
    if (
      e.clientX >= rect.left - buffer &&
      e.clientX <= rect.right + buffer &&
      e.clientY >= rect.top - buffer &&
      e.clientY <= rect.bottom + buffer
    ) {
      return;
    }

    // Start hide-timer
    hideTimerRef.current = setTimeout(() => {
      // Nur ausblenden, wenn wir noch sichtbar sind
      setIsVisible(false);

      // Wenn wir als active registriert sind, lösen wir die Registrierung
      if (activeTooltip && activeTooltip.id === idRef.current) {
        activeTooltip = null;
      }

      hideTimerRef.current = null;
    }, HIDE_DELAY_MS);
  };

  // Cleanup beim Unmount: Timer clearen und ggf. activeSlot freigeben
  useEffect(() => {
    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
      if (activeTooltip && activeTooltip.id === idRef.current) {
        activeTooltip = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
              left: `${position.left}px`,
            }}
          >
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

                {item.properties && (
                  <div className="item-properties">
                    {item.properties.join(' • ')}
                  </div>
                )}

                {item.description && (
                  <p className="item-description">{item.description}</p>
                )}

                {item.bonus && (
                  <div className="item-bonus">{item.bonus}</div>
                )}
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
