// src/components/character_sheet/InventoryPanel.jsx
import React, { useState, useEffect, useRef } from 'react';
import './InventoryPanel.css';
import InventoryFilter from './InventoryFilter';
import InventoryItem from './InventoryItem';
import { useTranslation } from 'react-i18next';

const InventoryPanel = ({ inventory, onEquip, onUnequip, currency, handleUnpackItem }) => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('all');
  
  // State für Einklappen
  const [isCollapsed, setIsCollapsed] = useState(false);

  // State für das Kontextmenü (inkl. Ziel-Koordinaten relativ zum Item)
  const [contextMenu, setContextMenu] = useState({ 
      visible: false, 
      x: 0, 
      y: 0, 
      item: null,
      itemId: null // ID speichern, um Tooltip beim Item zu deaktivieren
  });
  
  const menuRef = useRef(null);

  // Schließt Menü bei Klick woanders hin
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        closeContextMenu();
      }
    };
    document.addEventListener("click", handleClickOutside);
    // Auch bei Scrollen schließen, damit Menü nicht "schwebt"
    document.addEventListener("scroll", closeContextMenu, true); 
    return () => {
        document.removeEventListener("click", handleClickOutside);
        document.removeEventListener("scroll", closeContextMenu, true);
    };
  }, []);

  const closeContextMenu = () => {
      setContextMenu({ visible: false, x: 0, y: 0, item: null, itemId: null });
  };

  // Handler für Rechtsklick auf Item
  const handleContextMenu = (e, item) => {
    e.preventDefault(); // Browser-Menü unterdrücken
    
    // Position berechnen: Rechts neben dem Mauszeiger oder dem Item
    // Wir nehmen hier Mauszeiger + kleiner Offset, damit es sich wie ein "Smart Tooltip" anfühlt
    const xPos = e.clientX + 10; 
    const yPos = e.clientY + 5;

    setContextMenu({
      visible: true,
      x: xPos,
      y: yPos,
      item: item,
      itemId: item.instanceId || item.id // Eindeutige ID für Tooltip-Deaktivierung
    });
  };

  // Aktion ausführen
  const executeAction = (action) => {
    if (!contextMenu.item) return;

    switch(action) {
        case 'equip':
            if (onEquip) onEquip(contextMenu.item, contextMenu.item.slot || 'main-hand'); 
            break;
        case 'unpack':
            if (handleUnpackItem) {
                handleUnpackItem(contextMenu.item);
            }
            break;
        default:
            break;
    }
    closeContextMenu();
  };

  const safeInventory = inventory || [];
  
  const filteredInventory = safeInventory.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'armor') return ["armor", "shield", "head", "hands", "boots", "cloth", "belt", "cloak"].includes(item.type);
    return item.type === filter;
  });

  // Berechnung des Gesamtgewichts für die Anzeige im Header
  const currentWeight = safeInventory.reduce((acc, i) => acc + (i.weight || 0) * (i.quantity || 1), 0);

  return (
    <div className={`inventory-panel ${isCollapsed ? 'collapsed' : ''}`}>
      
      {/* --- HEADER (Collapsible) --- */}
      <div className="inventory-header" onClick={() => setIsCollapsed(!isCollapsed)}>
        <div className="header-title-row">
            <h3>{t('inventory.title', 'Inventar')}</h3>
            <div className="header-stats">
                <span className="weight-info">{currentWeight.toFixed(1)} kg</span>
                <span className="toggle-icon">{isCollapsed ? '+' : '−'}</span>
            </div>
        </div>
        
        {/* Währung zeigen wir immer an, auch wenn eingeklappt (oder man schiebt es in den Body) */}
        <div className="currency-display">
           <span title="Gold" className="coin gold">{currency?.gold || 0}</span>
           <span title="Silber" className="coin silver">{currency?.silver || 0}</span>
           <span title="Kupfer" className="coin copper">{currency?.copper || 0}</span>
        </div>
      </div>

      {/* --- BODY (Wird ausgeblendet) --- */}
      {!isCollapsed && (
        <>
          <InventoryFilter currentFilter={filter} onFilterChange={setFilter} />

          <div className="inventory-list">
            {filteredInventory.length === 0 ? (
              <div className="empty-inventory">{t('inventory.empty', 'Leer')}</div>
            ) : (
              filteredInventory.map((item, index) => {
                // Prüfen ob dies das Item ist, dessen Kontextmenü offen ist
                const isCtxOpen = contextMenu.visible && contextMenu.itemId === (item.instanceId || item.id);
                
                return (
                    <div 
                        key={item.instanceId || item.id || index} 
                        className={`inventory-slot-wrapper ${isCtxOpen ? 'active-context' : ''}`}
                        onContextMenu={(e) => handleContextMenu(e, item)}
                    >
                        <InventoryItem 
                          item={item} 
                          onEquip={onEquip} 
                          isContextMenuOpen={isCtxOpen} // Prop weitergeben!
                        />
                    </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* --- KONTEXT MENÜ (PORTAL-ARTIG) --- */}
      {contextMenu.visible && (
        <div 
            ref={menuRef}
            className="inventory-context-menu"
            style={{ 
                top: contextMenu.y, 
                left: contextMenu.x,
            }}
        >
            <div className="menu-header">{contextMenu.item.name}</div>
            
            {/* Dynamische Aktionen */}
            <div className="menu-actions">
                {!contextMenu.item.equipped && (contextMenu.item.slot || ['weapon','armor','shield'].includes(contextMenu.item.type)) && (
                    <button onClick={() => executeAction('equip')}>⚔️ Ausrüsten</button>
                )}

                {contextMenu.item.type === 'pack' && (
                    <button onClick={() => executeAction('unpack')}>🎒 Auspacken</button>
                )}
                
                {/* Platzhalter für später: Wegwerfen, Ansehen, etc. */}
                <button className="info-only">Gewicht: {contextMenu.item.weight} kg</button>
            </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPanel;