import React from 'react';
import './Tooltip.css';

const Tooltip = ({ item }) => {
  if (!item) {
    return null;
  }

  // Hier kannst du alle gewünschten Item-Infos anzeigen
  return (
    <div className="tooltip">
      <h4>{item.name}</h4>
      <p>{item.description || 'Keine Beschreibung verfügbar.'}</p>
      {item.damage && <p>Schaden: {item.damage}</p>}
      {item.armor && <p>Rüstung: {item.armor}</p>}
    </div>
  );
};

export default Tooltip;