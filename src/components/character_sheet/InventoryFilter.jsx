// src/components/character_sheet/InventoryFilter.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import './InventoryFilter.css';

const InventoryFilter = ({ currentFilter, onFilterChange }) => {
  const { t } = useTranslation();

  const filters = [
    { key: 'all', label: 'Alle Items' },
    { key: 'weapon', label: 'Waffen' },
    { key: 'armor', label: 'Rüstung & Schilde' },
    { key: 'potion', label: 'Tränke' },
    { key: 'scroll', label: 'Schriftrollen' },
    { key: 'loot', label: 'Schätze & Wertsachen' },
    { key: 'tool', label: 'Werkzeuge' },
    { key: 'resource', label: 'Materialien' },
    { key: 'ammo', label: 'Munition' }, // Hab ich ergänzt, da wichtig
  ];

  return (
    <div className="inventory-filter-container">
      <label htmlFor="inv-filter" className="filter-label">Kategorie:</label>
      <div className="select-wrapper">
        <select
          id="inv-filter"
          className="inventory-filter-select"
          value={currentFilter}
          onChange={(e) => onFilterChange(e.target.value)}
        >
          {filters.map((filter) => (
            <option key={filter.key} value={filter.key}>
              {t(`filter.${filter.key}`, filter.label)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default InventoryFilter;