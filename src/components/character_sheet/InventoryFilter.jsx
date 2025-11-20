// src/components/character_sheet/InventoryFilter.jsx
import React from 'react';
import './InventoryFilter.css';

const InventoryFilter = ({ activeFilter, onFilterChange }) => {
  const filters = [
    { key: 'all', label: 'Alle' },
    { key: 'weapon', label: 'Waffen' },
    { key: 'armor', label: 'Rüstung' }, // Zeigt Rüstung, Schilde, Helme, Handschuhe, Stiefel, Kleidung
    { key: 'potion', label: 'Tränke' },
    { key: 'scroll', label: 'Rollen' },
    { key: 'tool', label: 'Werkzeug' },
    { key: 'ammo', label: 'Munition' },
    { key: 'resource', label: 'Material' },
    { key: 'loot', label: 'Plunder' },
  ];

  return (
    <div className="inventory-filter">
      {filters.map(filter => (
        <button
          key={filter.key}
          className={`filter-btn ${activeFilter === filter.key ? 'active' : ''}`}
          onClick={() => onFilterChange(filter.key)}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
};

export default InventoryFilter;