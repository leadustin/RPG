// src/components/event_log/EventLog.jsx

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Rnd } from 'react-rnd';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next'; // Importieren
import './EventLog.css';

// LocalStorage Helpers (unverändert)
const loadFromStorage = (key, defaultValue) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return defaultValue;
  }
};

const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

export const EventLog = ({ entries = [] }) => {
  // i18n-Hook initialisieren
  const { t } = useTranslation();

  // Dynamische Konstanten basierend auf der Sprache (mit "eventLog."-Präfix)
  const LOG_TYPES = useMemo(() => ({
    general: t('eventLog.logTypes.general'),
    combat: t('eventLog.logTypes.combat'),
    xp: t('eventLog.logTypes.xp'),
    level: t('eventLog.logTypes.level'),
    item: t('eventLog.logTypes.item'),
    dialog: t('eventLog.logTypes.dialog'),
  }), [t]);

  const FONT_SIZES = useMemo(() => ({
    small: { label: t('eventLog.fontSizes.small'), value: '0.75em' },
    medium: { label: t('eventLog.fontSizes.medium'), value: '0.9em' },
    large: { label: t('eventLog.fontSizes.large'), value: '1.1em' },
  }), [t]);

  // Einstellungen aus localStorage laden
  const [activeFilters, setActiveFilters] = useState(
    () => new Set(loadFromStorage('eventLog_filters', Object.keys(LOG_TYPES)))
  );
  // ... (Restlicher State bleibt unverändert) ...
  const [isHovered, setIsHovered] = useState(false);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(() => loadFromStorage('eventLog_visible', true));
  const [fontSize, setFontSize] = useState(() => loadFromStorage('eventLog_fontSize', 'medium'));
  const [opacity, setOpacity] = useState(() => loadFromStorage('eventLog_opacity', 0.9));
  const [showTimestamps, setShowTimestamps] = useState(() => loadFromStorage('eventLog_showTimestamps', true));
  const [maxEntries, setMaxEntries] = useState(() => loadFromStorage('eventLog_maxEntries', 100));
  const [searchText, setSearchText] = useState('');
  const [position, setPosition] = useState(() => loadFromStorage('eventLog_position', {
    x: 20,
    y: window.innerHeight - 350,
  }));
  const [size, setSize] = useState(() => loadFromStorage('eventLog_size', {
    width: 400,
    height: 300,
  }));
  const [toggleButtonPosition, setToggleButtonPosition] = useState(() => 
    loadFromStorage('eventLog_toggleButtonPosition', { x: 180, y: window.innerHeight - 80 })
  );
  const [lastSeenCount, setLastSeenCount] = useState(entries.length);
  const [isDraggingToggle, setIsDraggingToggle] = useState(false);
  const toggleDragStart = useRef({ x: 0, y: 0 });
  const listRef = useRef(null);

  // Filter-Handler mit localStorage (unverändert)
  const handleFilterChange = (type) => {
    setActiveFilters((prevFilters) => {
      const newFilters = new Set(prevFilters);
      if (newFilters.has(type)) {
        newFilters.delete(type);
      } else {
        newFilters.add(type);
      }
      saveToStorage('eventLog_filters', Array.from(newFilters));
      return newFilters;
    });
  };

  // ... (Alle useEffects zum Speichern in localStorage bleiben unverändert) ...
  useEffect(() => { saveToStorage('eventLog_visible', isVisible); }, [isVisible]);
  useEffect(() => { saveToStorage('eventLog_fontSize', fontSize); }, [fontSize]);
  useEffect(() => { saveToStorage('eventLog_opacity', opacity); }, [opacity]);
  useEffect(() => { saveToStorage('eventLog_showTimestamps', showTimestamps); }, [showTimestamps]);
  useEffect(() => { saveToStorage('eventLog_maxEntries', maxEntries); }, [maxEntries]);
  useEffect(() => { saveToStorage('eventLog_position', position); }, [position]);
  useEffect(() => { saveToStorage('eventLog_size', size); }, [size]);
  useEffect(() => { saveToStorage('eventLog_toggleButtonPosition', toggleButtonPosition); }, [toggleButtonPosition]);
  
  // Neue Einträge zählen (unverändert)
  const newEntriesCount = useMemo(() => {
    return isVisible ? 0 : Math.max(0, entries.length - lastSeenCount);
  }, [entries.length, lastSeenCount, isVisible]);

  // Beim Öffnen des Logs die Zählung zurücksetzen (unverändert)
  useEffect(() => {
    if (isVisible) {
      setLastSeenCount(entries.length);
    }
  }, [isVisible, entries.length]);

  // Gefilterte Einträge (unverändert)
  const filteredEntries = useMemo(() => {
    let filtered = entries
      .filter((entry) => activeFilters.has(entry.type))
      .filter((entry) => {
        if (!searchText) return true;
        return entry.message.toLowerCase().includes(searchText.toLowerCase());
      });
    
    if (filtered.length > maxEntries) {
      filtered = filtered.slice(filtered.length - maxEntries);
    }
    
    return filtered.reverse();
  }, [entries, activeFilters, searchText, maxEntries]);

  // useEffect für Scroll (unverändert)
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = 0; 
    }
  }, [entries]);

  // Toggle Button Drag Handler (unverändert)
  const handleToggleMouseDown = (e) => {
    e.preventDefault();
    setIsDraggingToggle(true);
    toggleDragStart.current = {
      x: e.clientX - toggleButtonPosition.x,
      y: e.clientY - toggleButtonPosition.y,
      startX: e.clientX,
      startY: e.clientY
    };
  };

  // useEffect für Drag-Logik (unverändert)
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingToggle) {
        setToggleButtonPosition({
          x: e.clientX - toggleDragStart.current.x,
          y: e.clientY - toggleDragStart.current.y
        });
      }
    };

    const handleMouseUp = (e) => {
      if (isDraggingToggle) {
        const deltaX = Math.abs(e.clientX - toggleDragStart.current.startX);
        const deltaY = Math.abs(e.clientY - toggleDragStart.current.startY);
        
        if (deltaX < 5 && deltaY < 5) {
          setIsVisible(true);
        }
        
        setIsDraggingToggle(false);
      }
    };

    if (isDraggingToggle) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingToggle]);


  return (
    <>
      {/* Toggle Button wenn Log ausgeblendet (mit i18n) */}
      {!isVisible && (
        <button
          className="event-log-toggle-btn"
          style={{
            left: `${toggleButtonPosition.x}px`,
            top: `${toggleButtonPosition.y}px`,
            cursor: isDraggingToggle ? 'grabbing' : 'grab'
          }}
          onMouseDown={handleToggleMouseDown}
          onClick={(e) => {
            if (!isDraggingToggle) {
              setIsVisible(true);
            }
          }}
          title={t('eventLog.toggleButtonTitle')} // i18n
        >
          📋 {t('eventLog.toggleButtonLabel')} {/* i18n */}
          {newEntriesCount > 0 && (
            <span className="new-entries-badge">{newEntriesCount}</span>
          )}
        </button>
      )}

      {/* Rnd-Container (mit i18n) */}
      {isVisible && (
        <Rnd
          // ... (props unverändert) ...
          className={clsx('event-log-rnd-container', { 'is-hovered': isHovered })}
          position={position}
          size={size}
          minWidth={250}
          minHeight={200}
          bounds="window"
          dragHandleClassName="event-log-drag-handle"
          cancel=".event-log-filters, .event-log-list, .event-log-settings-filters, .header-buttons, .search-input, .opacity-slider, .max-entries-input"
          enableUserSelectHack={false}
          resizeHandleStyles={{
            bottom: { cursor: 'ns-resize' },
            right: { cursor: 'ew-resize' },
            bottomRight: { cursor: 'nwse-resize' },
          }}
          onDragStop={(e, d) => { setPosition({ x: d.x, y: d.y }); }}
          onResizeStop={(e, direction, ref, delta, position) => {
            setSize({ width: ref.offsetWidth, height: ref.offsetHeight, });
            setPosition(position);
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          style={{ opacity: opacity }}
        >
          <div className="event-log-header event-log-drag-handle">
            <div className="header-content">
              <h4>{t('eventLog.headerTitle')}</h4> {/* i18n */}
              <div className="header-buttons">
                <button
                  className="filter-toggle-btn"
                  onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                  title={t('eventLog.settingsButtonTitle')} // i18n
                >
                  {isFilterExpanded ? '▼' : '▶'}
                </button>
                <button
                  className="hide-log-btn"
                  onClick={() => setIsVisible(false)}
                  title={t('eventLog.hideButtonTitle')} // i18n
                >
                  ✕
                </button>
              </div>
            </div>
          </div>

          {/* Collapsible Settings & Filter (mit i18n) */}
          {isFilterExpanded && (
            <div className="event-log-settings-filters">
              {/* Suche */}
              <div className="settings-row">
                <label className="setting-label">{t('eventLog.settings.searchLabel')}</label> {/* i18n */}
                <input
                  type="text"
                  className="search-input"
                  placeholder={t('eventLog.settings.searchPlaceholder')} // i18n
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>

              {/* Transparenz */}
              <div className="settings-row">
                <label className="setting-label">
                  {/* i18n (mit Interpolation) */}
                  {t('eventLog.settings.opacityLabel', { percent: Math.round(opacity * 100) })}
                </label>
                <input
                  type="range"
                  className="opacity-slider"
                  min="0.3"
                  max="1"
                  step="0.05"
                  value={opacity}
                  onChange={(e) => setOpacity(parseFloat(e.target.value))}
                />
              </div>

              {/* Textgröße */}
              <div className="settings-row">
                <label className="setting-label">{t('eventLog.settings.fontSizeLabel')}</label> {/* i18n */}
                <div className="font-size-buttons">
                  {/* Nutzt jetzt FONT_SIZES useMemo */}
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

              {/* Max. Einträge */}
              <div className="settings-row">
                <label className="setting-label">{t('eventLog.settings.maxEntriesLabel')}</label> {/* i18n */}
                <input
                  type="number"
                  className="max-entries-input"
                  min="10"
                  max="1000"
                  step="10"
                  value={maxEntries}
                  onChange={(e) => setMaxEntries(parseInt(e.target.value) || 100)}
                />
              </div>

              {/* Timestamps Toggle */}
              <div className="settings-row">
                <label className="setting-checkbox-label">
                  <input
                    type="checkbox"
                    checked={showTimestamps}
                    onChange={(e) => setShowTimestamps(e.target.checked)}
                  />
                  {t('eventLog.settings.showTimestampsLabel')} {/* i18n */}
                </label>
              </div>

              {/* Filter */}
              <div className="filter-section">
                <label className="setting-label">{t('eventLog.settings.filterLabel')}</label> {/* i18n */}
                <div className="event-log-filters">
                  {/* Nutzt jetzt LOG_TYPES useMemo */}
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
            style={{ fontSize: FONT_SIZES[fontSize]?.value || '0.9em' }} // Fallback
            // ... (Event-Handler unverändert) ...
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
                  {showTimestamps && (
                    <span className="log-timestamp">
                      {entry.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  )}
                  <span className="log-message">{entry.message}</span>
                </li>
              ))
            ) : (
              <li className="log-empty">
                {/* i18n */}
                {searchText ? t('eventLog.emptyLogSearch') : t('eventLog.emptyLogNoFilter')}
              </li>
            )}
          </ul>
        </Rnd>
      )}
    </>
  );
};