// src/components/event_log/EventLog.js

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import clsx from 'clsx';
import './EventLog.css';

const LOG_TYPES = {
  general: 'Allgemein',
  combat: 'Kampf',
  xp: 'EP',
  level: 'Level Up',
  item: 'Gegenstand',
  dialog: 'Dialog',
};

const FONT_SIZES = {
  small: { label: 'Klein', value: '0.75em' },
  medium: { label: 'Mittel', value: '0.9em' },
  large: { label: 'Groß', value: '1.1em' },
};

export const EventLog = ({ entries = [] }) => {
  const [activeFilters, setActiveFilters] = useState(
    new Set(Object.keys(LOG_TYPES))
  );
  const [isHovered, setIsHovered] = useState(false);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [fontSize, setFontSize] = useState('medium');
  const [position, setPosition] = useState({
    x: 20,
    y: window.innerHeight - 350,
  });
  const [size, setSize] = useState({
    width: 400,
    height: 300,
  });
  const listRef = useRef(null);

  const handleFilterChange = (type) => {
    setActiveFilters((prevFilters) => {
      const newFilters = new Set(prevFilters);
      if (newFilters.has(type)) {
        newFilters.delete(type);
      } else {
        newFilters.add(type);
      }
      return newFilters;
    });
  };

  const filteredEntries = useMemo(() => {
    return entries
      .filter((entry) => activeFilters.has(entry.type))
      .reverse();
  }, [entries, activeFilters]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = 0; 
    }
  }, [entries]);

  return (
    <>
      {/* Toggle Button wenn Log ausgeblendet */}
      {!isVisible && (
        <button
          className="event-log-toggle-btn"
          onClick={() => setIsVisible(true)}
          title="Ereignis-Log einblenden"
        >
          📋 Log
        </button>
      )}

      {isVisible && (
        <Rnd
          className={clsx('event-log-rnd-container', { 'is-hovered': isHovered })}
          position={position}
          size={size}
          minWidth={250}
          minHeight={200}
          bounds="window"
          dragHandleClassName="event-log-drag-handle"
          cancel=".event-log-filters, .event-log-list, .event-log-settings-filters, .header-buttons"
          enableUserSelectHack={false}
          resizeHandleStyles={{
            bottom: { cursor: 'ns-resize' },
            right: { cursor: 'ew-resize' },
            bottomRight: { cursor: 'nwse-resize' },
          }}
          onDragStop={(e, d) => {
            setPosition({ x: d.x, y: d.y });
          }}
          onResizeStop={(e, direction, ref, delta, position) => {
            setSize({
              width: ref.offsetWidth,
              height: ref.offsetHeight,
            });
            setPosition(position);
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="event-log-header event-log-drag-handle">
            <div className="header-content">
              <h4>Ereignis-Log</h4>
              <div className="header-buttons">
                <button
                  className="filter-toggle-btn"
                  onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                  title="Einstellungen"
                >
                  {isFilterExpanded ? '▼' : '▶'}
                </button>
                <button
                  className="hide-log-btn"
                  onClick={() => setIsVisible(false)}
                  title="Log ausblenden"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>

          {/* Collapsible Settings & Filter */}
          {isFilterExpanded && (
            <div className="event-log-settings-filters">
              {/* Textgröße */}
              <div className="settings-row">
                <label className="setting-label">Textgröße:</label>
                <div className="font-size-buttons">
                  {Object.entries(FONT_SIZES).map(([key, { label }]) => (
                    <button
                      key={key}
                      className={clsx('font-size-btn', { active: fontSize === key })}
                      onClick={() => setFontSize(key)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filter */}
              <div className="filter-section">
                <label className="setting-label">Filter:</label>
                <div className="event-log-filters">
                  {Object.entries(LOG_TYPES).map(([key, label]) => (
                    <label key={key} title={label}>
                      <input
                        type="checkbox"
                        checked={activeFilters.has(key)}
                        onChange={() => handleFilterChange(key)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          <ul 
            className="event-log-list" 
            ref={listRef}
            style={{ fontSize: FONT_SIZES[fontSize].value }}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onMouseMove={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onWheel={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (listRef.current) {
                listRef.current.scrollTop += e.deltaY;
              }
            }}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            {filteredEntries.length > 0 ? (
              filteredEntries.map((entry) => (
                <li key={entry.id} className={`log-type-${entry.type}`}>
                  <span className="log-timestamp">
                    {entry.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                  <span className="log-message">{entry.message}</span>
                </li>
              ))
            ) : (
              <li className="log-empty">Keine passenden Log-Einträge.</li>
            )}
          </ul>
        </Rnd>
      )}
    </>
  );
};