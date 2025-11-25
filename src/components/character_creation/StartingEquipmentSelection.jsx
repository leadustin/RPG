// src/components/character_creation/StartingEquipmentSelection.jsx
import React, { useState, useEffect } from 'react';
import { getItem } from '../../utils/itemLoader';
// WICHTIG: CSS Importieren
import './StartingEquipmentSelection.css';

const StartingEquipmentSelection = ({ classData, onSelect }) => {
  const [choiceType, setChoiceType] = useState('equipment'); // 'equipment' oder 'gold'
  const [selectedPackage, setSelectedPackage] = useState(0);

  useEffect(() => {
    updateParent();
  }, [choiceType, selectedPackage, classData]);

  const equipmentData = classData?.starting_equipment;

  const updateParent = () => {
    if (!equipmentData) return;

    if (choiceType === 'gold') {
      // Option B: Nur Gold
      onSelect({
        type: 'gold',
        gold: equipmentData.gold_alternative,
        items: []
      });
    } else {
      // Option A: Items + Standard Gold
      let finalItems = [];

      // 1. Feste Items
      if (equipmentData.items) {
        finalItems = [...equipmentData.items];
      }

      // 2. Paket-Auswahl (Choices)
      if (equipmentData.choices && equipmentData.choices.length > 0) {
        const packItems = equipmentData.choices[selectedPackage].items;
        finalItems = [...finalItems, ...packItems];
      }

      onSelect({
        type: 'equipment',
        gold: equipmentData.default_gold,
        items: finalItems
      });
    }
  };

  if (!equipmentData) {
    return <div className="selection-panel">Keine Startausrüstung für diese Klasse definiert.</div>;
  }

  return (
    <div className="selection-panel">
      <h2>Startausrüstung wählen</h2>
      <p className="description-text">
        Wie möchtest du dein Abenteuer beginnen? Mit der bewährten Ausrüstung deiner Klasse oder mit einem Sack voll Gold?
      </p>

      <div className="options-container">
        
        {/* --- OPTION A: AUSRÜSTUNG --- */}
        <div 
          className={`option-card ${choiceType === 'equipment' ? 'selected' : ''}`}
          onClick={() => setChoiceType('equipment')}
        >
          {choiceType === 'equipment' && <div className="check-badge">✓</div>}
          <h3>Option A: Ausrüstung</h3>
          
          <div className="option-content">
            {/* Anzeige für zusätzliches Gold bei Option A */}
            {equipmentData.default_gold > 0 && (
               <div style={{marginBottom: '10px', color: '#ffd700', fontWeight: 'bold'}}>
                 + {equipmentData.default_gold} Goldmünzen
               </div>
            )}

            {/* Feste Items */}
            {equipmentData.items && equipmentData.items.length > 0 && (
              <ul>
                {equipmentData.items.map((itemRef, idx) => {
                  const item = getItem(itemRef.id);
                  return (
                    <li key={idx}>
                      {itemRef.quantity > 1 ? `${itemRef.quantity}x ` : ''}
                      {item ? item.name : itemRef.id}
                    </li>
                  );
                })}
              </ul>
            )}

            {/* Auswahl für Pakete (z.B. Kämpfer) */}
            {equipmentData.choices && equipmentData.choices.length > 0 && (
              <div className="sub-selection">
                <label>Wähle dein Paket:</label>
                <select 
                  value={selectedPackage} 
                  onChange={(e) => setSelectedPackage(Number(e.target.value))}
                  onClick={(e) => e.stopPropagation()} // Verhindert, dass Klick auf Select die Card toggelt
                >
                  {equipmentData.choices.map((choice, index) => (
                    <option key={index} value={index}>{choice.label}</option>
                  ))}
                </select>
                
                {/* Inhalt des gewählten Pakets anzeigen */}
                <ul style={{marginTop: '10px'}}>
                  {equipmentData.choices[selectedPackage].items.map((itemRef, idx) => {
                    const item = getItem(itemRef.id);
                    return (
                      <li key={`pack-${idx}`}>
                        {itemRef.quantity > 1 ? `${itemRef.quantity}x ` : ''}
                        {item ? item.name : itemRef.id}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* --- OPTION B: GOLD --- */}
        <div 
          className={`option-card ${choiceType === 'gold' ? 'selected' : ''}`}
          onClick={() => setChoiceType('gold')}
        >
          {choiceType === 'gold' && <div className="check-badge">✓</div>}
          <h3>Option B: Reichtum</h3>
          
          <div className="option-content" style={{justifyContent: 'center'}}>
            <span className="gold-display">{equipmentData.gold_alternative} GM</span>
            <p className="hint-text">
              Du startest ohne Ausrüstung. <br/>
              Nutze das Gold, um vor dem Abenteuer im Laden einzukaufen.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default StartingEquipmentSelection;