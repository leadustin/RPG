// src/components/tooltip/SkillTooltip.js
import React from 'react';

// Wir verwenden die CSS-Klassen aus der globalen Tooltip.css

export const SkillTooltip = ({ data }) => {
  // 'data' ist das Objekt aus der skillDetails.json

  // Fallback, falls data={undefined} übergeben wird
  if (!data) {
    return (
      <>
        <h4 className="item-name">Unbekannte Fertigkeit</h4>
        <p className="item-description">
          Für diese Fertigkeit sind keine Detailinformationen hinterlegt.
        </p>
      </>
    );
  }

  // Wir extrahieren die Daten aus dem Objekt
  const { name, attribute, description } = data;

  return (
    <>
      {/* 1. Der Name (z.B. "Athletik") */}
      <h4 className="item-name">{name}</h4>
      
      {/* 2. Das Attribut (z.B. "Stärke") */}
      <div className="item-type">Attribut: {attribute}</div>

      {/* 3. Die Beschreibung */}
      <p className="item-description">{description}</p>
    </>
  );
};