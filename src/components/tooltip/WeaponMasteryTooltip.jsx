// src/components/tooltip/WeaponMasteryTooltip.js
import React from 'react';

// Wir importieren die CSS-Datei NICHT mehr,
// da wir die globale tooltip.css nutzen, die vom Wrapper geladen wird.
// import './WeaponMasteryTooltip.css'; 

export const WeaponMasteryTooltip = ({ data, name }) => {
  // 'name' ist der Schlüssel (z.B. "Streitaxt")
  // 'data' ist das Objekt aus der weaponMasteryDetails.json

  // Fallback, falls data={undefined} übergeben wird
  if (!data) {
    // Verwendet die CSS-Klassen aus Ihrer tooltip.css
    return (
      <>
        <h4 className="item-name">{name}</h4>
        <p className="item-description">
          Für diese Waffe sind keine Detailinformationen hinterlegt.
        </p>
      </>
    );
  }

  // Wir extrahieren die Daten aus dem Objekt
  const { description, type, damage, damage_type, mastery } = data;

  // Wir bauen jetzt das HTML, das exakt zu Ihrer tooltip.css passt
  return (
    <>
      {/* 1. Der Name */}
      <h4 className="item-name">{name}</h4>
      
      {/* 2. Der Typ (z.B. "Kriegswaffe · Vielseitig") */}
      <div className="item-type">{type}</div>

      {/* 3. Das Stats-Grid für Schaden und Art */}
      <div className="stats-grid">
        {/* Label (ungerades Kind) */}
        <div>Schaden:</div>
        {/* Wert (gerades Kind) */}
        <div>{damage}</div>
        
        {/* Label (ungerades Kind) */}
        <div>Art:</div>
        {/* Wert (gerades Kind) */}
        <div>{damage_type}</div>
      </div>
      
      {/* 4. Die Beschreibung */}
      <p className="item-description">{description}</p>

      {/* 5. Die Mastery (wir verwenden die "item-bonus"-Klasse) */}
      {mastery && (
        <div className="item-bonus">
          {/* Ich füge ein <p> hinzu, damit es besser aussieht als reiner Text */}
          <p style={{ margin: 0, fontWeight: 'bold' }}>
            Mastery: {mastery.name}
          </p>
          <p style={{ margin: '4px 0 0 0', color: '#e0e0e0', fontStyle: 'italic' }}>
            {mastery.description}
          </p>
        </div>
      )}
    </>
  );
};