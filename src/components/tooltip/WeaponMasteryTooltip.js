// src/components/tooltip/WeaponMasteryTooltip.js
import React from 'react';
import './WeaponMasteryTooltip.css'; // Wir erstellen diese CSS-Datei gleich

export const WeaponMasteryTooltip = ({ data }) => {
  if (!data) {
    return null; // Zeigt nichts an, wenn keine Daten für diese Waffe existieren
  }

  const { name, description, type, damage, damage_type, mastery } = data;

  return (
    <div className="wm-tooltip">
      {/* Name wird oft schon im Button angezeigt, aber hier als Titel */}
      {/* <h4>{name}</h4> */} 
      <p className="wm-description">{description}</p>
      
      <div className="wm-divider"></div>
      
      <div className="wm-stats">
        <div><strong>Art:</strong> {type}</div>
        <div><strong>Schaden:</strong> {damage} ({damage_type})</div>
      </div>
      
      {mastery && (
        <>
          <div className="wm-divider"></div>
          <div className="wm-mastery">
            <strong>Mastery: {mastery.name}</strong>
            <p>{mastery.description}</p>
          </div>
        </>
      )}
    </div>
  );
};