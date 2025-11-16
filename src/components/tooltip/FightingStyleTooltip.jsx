// src/components/tooltip/FightingStyleTooltip.js
import React from 'react';

// Wir verwenden die CSS-Klassen aus der globalen Tooltip.css

export const FightingStyleTooltip = ({ data }) => {
  // 'data' ist ein Objekt aus der fightingStyles.json

  // Fallback, falls data={undefined} übergeben wird
  if (!data) {
    return (
      <>
        <h4 className="item-name">Unbekannter Kampfstil</h4>
        <p className="item-description">
          Für diesen Kampfstil sind keine Detailinformationen hinterlegt.
        </p>
      </>
    );
  }

  // Wir extrahieren die Daten aus dem Objekt
  const { name, description } = data;

  return (
    <>
      {/* 1. Der Name (z.B. "Verteidigung") */}
      <h4 className="item-name">{name}</h4>
      
      {/* 2. Der Typ (Statisch, um dem Skill-Layout zu entsprechen) */}
      <div className="item-type">Kampfstil</div>

      {/* 3. Die Beschreibung */}
      <p className="item-description">{description}</p>
    </>
  );
};