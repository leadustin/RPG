// src/components/character_sheet/InventoryFilter.js
import React from 'react';
import './InventoryFilter.css';

// KORREKTUR: Ein Objekt für die deutschen Bezeichnungen
const filterOptions = [
  { key: 'all', label: 'Alles' },
  { key: 'weapon', label: 'Waffen' },
  { key: 'armor', label: 'Rüstung' },
  { key: 'accessory', label: 'Schmuck' },
  { key: 'consumable', label: 'Verbrauch' }
];

const InventoryFilter = ({ activeFilter, onFilterChange }) => {
  return (
    <div className="inventory-filter-container">
      {filterOptions.map(option => (
        <button
          key={option.key}
          className={`filter-btn ${activeFilter === option.key ? 'active' : ''}`}
          onClick={() => onFilterChange(option.key)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default InventoryFilter;