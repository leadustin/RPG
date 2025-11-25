import React, { useState, useEffect, useRef } from 'react';
import './InventoryPanel.css';
// Stelle sicher, dass du diese Komponenten hast oder entferne die Imports, falls du sie inline baust
// Ich gehe davon aus, dass du InventoryFilter und InventoryItem hast, wie vorher besprochen.
import InventoryFilter from './InventoryFilter';
import InventoryItem from './InventoryItem';
import { useTranslation } from 'react-i18next';

const InventoryPanel = ({ inventory, onEquip, onUnequip, currency, handleUnpackItem }) => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('all');
  
  // State für das Kontextmenü
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, item: null });
  const menuRef = useRef(null);

  // Schließt Menü bei Klick woanders hin
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setContextMenu({ ...contextMenu, visible: false });
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [contextMenu]);

  // Handler für Rechtsklick auf Item
  const handleContextMenu = (e, item) => {
    e.preventDefault(); // Browser-Menü unterdrücken
    setContextMenu({
      visible: true,
      x: e.pageX,
      y: e.pageY,
      item: item
    });
  };

  // Aktion ausführen
  const executeAction = (action) => {
    if (!contextMenu.item) return;

    switch(action) {
        case 'equip':
            // Einfache Logik für Equip via Kontextmenü
            if (onEquip) onEquip(contextMenu.item, contextMenu.item.slot || 'main-hand'); 
            break;
        case 'unpack':
            if (handleUnpackItem) {
                handleUnpackItem(contextMenu.item);
            } else {
                console.warn("handleUnpackItem wurde nicht übergeben!");
            }
            break;
        default:
            break;
    }
    setContextMenu({ ...contextMenu, visible: false });
  };

  // Filter-Logik
  // Wir prüfen, ob inventory existiert, um Fehler zu vermeiden
  const safeInventory = inventory || [];
  
  const filteredInventory = safeInventory.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'armor') return ["armor", "shield", "head", "hands", "boots", "cloth", "belt", "cloak"].includes(item.type);
    return item.type === filter;
  });

  return (
    <div className="inventory-panel">
      <div className="inventory-header">
        <h3>{t('inventory.title', 'Inventar')}</h3>
        <div className="currency-display">
           <span title="Gold" className="coin gold">{currency?.gold || 0} GM</span>
           <span title="Silber" className="coin silver">{currency?.silver || 0} SM</span>
           <span title="Kupfer" className="coin copper">{currency?.copper || 0} KM</span>
        </div>
      </div>

      {/* Filter Komponente */}
      <InventoryFilter currentFilter={filter} onFilterChange={setFilter} />

      <div className="inventory-list">
        {filteredInventory.length === 0 ? (
          <div className="empty-inventory">{t('inventory.empty', 'Leer')}</div>
        ) : (
          filteredInventory.map((item, index) => (
            <div 
                key={item.instanceId || item.id || index} 
                onContextMenu={(e) => handleContextMenu(e, item)} // Rechtsklick Event
            >
                <InventoryItem 
                  item={item} 
                  // onEquip wird hier für Linksklick/Drag genutzt, falls InventoryItem das unterstützt
                  onEquip={onEquip} 
                />
            </div>
          ))
        )}
      </div>

      {/* --- KONTEXT MENÜ --- */}
      {contextMenu.visible && (
        <div 
            ref={menuRef}
            className="inventory-context-menu"
            style={{ top: contextMenu.y, left: contextMenu.x }}
        >
            <div className="menu-header">{contextMenu.item.name}</div>
            
            {/* Ausrüsten Button (nur wenn ausrüstbar und nicht ausgerüstet) */}
            {!contextMenu.item.equipped && (contextMenu.item.slot || contextMenu.item.type === 'weapon' || contextMenu.item.type === 'armor') && (
                <button onClick={() => executeAction('equip')}>Ausrüsten</button>
            )}

            {/* Auspacken Button (nur für Packs) */}
            {contextMenu.item.type === 'pack' && (
                <button onClick={() => executeAction('unpack')}>Auspacken</button>
            )}

            <button className="cancel" onClick={() => setContextMenu({...contextMenu, visible: false})}>Abbrechen</button>
        </div>
      )}
    </div>
  );
};

export default InventoryPanel;