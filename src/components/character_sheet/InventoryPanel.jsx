// src/components/character_sheet/InventoryPanel.jsx
import React, { useState, useEffect, useRef } from 'react';
import './InventoryPanel.css';
import InventoryFilter from './InventoryFilter';
import InventoryItem from './InventoryItem';
import { useTranslation } from 'react-i18next';

const InventoryPanel = ({ inventory, onEquip, onUnequip, currency, handleUnpackItem, handleDestroyItem }) => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('all');
  
  // State für Einklappen
  const [isCollapsed, setIsCollapsed] = useState(false);

  // State für Kontextmenü
  const [contextMenu, setContextMenu] = useState({ 
      visible: false, 
      x: 0, 
      y: 0, 
      item: null,
      itemId: null
  });

  // +++ NEU: State für das Zerstören-Modal +++
  const [destroyModal, setDestroyModal] = useState({ visible: false, item: null });
  
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        closeContextMenu();
      }
    };
    document.addEventListener("click", handleClickOutside);
    document.addEventListener("scroll", closeContextMenu, true); 
    return () => {
        document.removeEventListener("click", handleClickOutside);
        document.removeEventListener("scroll", closeContextMenu, true);
    };
  }, []);

  const closeContextMenu = () => {
      setContextMenu({ visible: false, x: 0, y: 0, item: null, itemId: null });
  };

  const handleContextMenu = (e, item) => {
    e.preventDefault();
    const xPos = e.clientX + 10; 
    const yPos = e.clientY + 5;

    setContextMenu({
      visible: true,
      x: xPos,
      y: yPos,
      item: item,
      itemId: item.instanceId || item.id
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
        case 'destroy':
            if (handleDestroyItem) {
                // +++ NEU: Statt window.confirm öffnen wir unser Modal +++
                setDestroyModal({ visible: true, item: contextMenu.item });
            }
            break;
        default:
            break;
    }
    closeContextMenu();
  };

  // +++ NEU: Bestätigungshandler +++
  const confirmDestroy = () => {
      if (handleDestroyItem && destroyModal.item) {
          handleDestroyItem(destroyModal.item);
      }
      setDestroyModal({ visible: false, item: null });
  };

  const safeInventory = inventory || [];
  
  const filteredInventory = safeInventory.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'armor') return ["armor", "shield", "head", "hands", "boots", "cloth", "belt", "cloak"].includes(item.type);
    return item.type === filter;
  });

  const currentWeight = safeInventory.reduce((acc, i) => acc + (i.weight || 0) * (i.quantity || 1), 0);

  return (
    <div className={`inventory-panel ${isCollapsed ? 'collapsed' : ''}`}>
      
      <div className="inventory-header" onClick={() => setIsCollapsed(!isCollapsed)}>
        <div className="header-title-row">
            <h3>{t('inventory.title', 'Inventar')}</h3>
            <div className="header-stats">
                <span className="weight-info">{currentWeight.toFixed(1)} kg</span>
                <span className="toggle-icon">{isCollapsed ? '+' : '−'}</span>
            </div>
        </div>
        
        <div className="currency-display">
           <span title="Gold" className="coin gold">{currency?.gold || 0}</span>
           <span title="Silber" className="coin silver">{currency?.silver || 0}</span>
           <span title="Kupfer" className="coin copper">{currency?.copper || 0}</span>
        </div>
      </div>

      {!isCollapsed && (
        <>
          <InventoryFilter currentFilter={filter} onFilterChange={setFilter} />

          <div className="inventory-list">
            {filteredInventory.length === 0 ? (
              <div className="empty-inventory">{t('inventory.empty', 'Leer')}</div>
            ) : (
              filteredInventory.map((item, index) => {
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
                          isContextMenuOpen={isCtxOpen} 
                        />
                    </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* --- KONTEXT MENÜ --- */}
      {contextMenu.visible && (
        <div 
            ref={menuRef}
            className="inventory-context-menu"
            style={{ top: contextMenu.y, left: contextMenu.x }}
        >
            <div className="menu-header">{contextMenu.item.name}</div>
            
            <div className="menu-actions">
                {!contextMenu.item.equipped && (contextMenu.item.slot || ['weapon','armor','shield'].includes(contextMenu.item.type)) && (
                    <button onClick={() => executeAction('equip')}>⚔️ Ausrüsten</button>
                )}
                {contextMenu.item.type === 'pack' && (
                    <button onClick={() => executeAction('unpack')}>🎒 Auspacken</button>
                )}
                
                {/* Zerstören Button */}
                <button className="destroy-btn" onClick={() => executeAction('destroy')}>🗑️ Zerstören</button>
                <button className="info-only">Gewicht: {contextMenu.item.weight} kg</button>
            </div>
        </div>
      )}

      {/* +++ NEU: Zerstören MODAL (Overlay) +++ */}
      {destroyModal.visible && (
        <div className="inventory-modal-overlay">
            <div className="inventory-modal">
                <h3>Gegenstand zerstören?</h3>
                <p>
                    Möchtest du <strong>{destroyModal.item?.name}</strong> wirklich wegwerfen/zerstören?
                </p>
                <p className="modal-warning">Diese Aktion kann nicht rückgängig gemacht werden.</p>
                
                <div className="modal-actions">
                    <button className="btn-cancel" onClick={() => setDestroyModal({ visible: false, item: null })}>
                        Abbrechen
                    </button>
                    <button className="btn-confirm-destroy" onClick={confirmDestroy}>
                        🗑️ Weg damit!
                    </button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default InventoryPanel;