// src/components/tooltip/SubclassTooltip.js
import React from 'react';

// Wir verwenden die CSS-Klassen aus der globalen Tooltip.css
// (z.B. item-name, item-type, item-description)

export const SubclassTooltip = ({ data, type }) => {
  // 'data' ist ein Unterklassen-Objekt (z.B. { key, name, description })
  // 'type' ist ein String (z.B. "Göttliche Domäne", "Arkane Tradition")

  // Fallback, falls data={undefined} übergeben wird
  if (!data) {
    return (
      <>
        <h4 className="item-name">Unbekannte Unterklasse</h4>
        <p className="item-description">
          Für diese Unterklasse sind keine Detailinformationen hinterlegt.
        </p>
      </>
    );
  }

  // Wir extrahieren die Daten aus dem Objekt
  const { name, description } = data;

  return (
    <>
      {/* 1. Der Name (z.B. "Domäne des Lebens") */}
      <h4 className="item-name">{name}</h4>
      
      {/* 2. Der Typ (Jetzt dynamisch über die 'type' prop) */}
      {/* Fallback auf "Unterklasse", falls 'type' nicht übergeben wird */}
      <div className="item-type">{type || "Unterklasse"}</div>

      {/* 3. Die Beschreibung */}
      <p className="item-description">{description}</p>
    </>
  );
};