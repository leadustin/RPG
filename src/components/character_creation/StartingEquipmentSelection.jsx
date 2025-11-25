// src/components/character_creation/StartingEquipmentSelection.jsx
import React, { useState, useEffect } from 'react';
import { getItem } from '../../utils/itemLoader';
// Wir importieren PanelDetails.css nur für globale Variablen, falls nötig,
// verlassen uns aber für das Layout auf unser eigenes CSS.
import './PanelDetails.css'; 
import './StartingEquipmentSelection.css';

const StartingEquipmentSelection = ({ classData, onSelect }) => {
  const [choiceType, setChoiceType] = useState('equipment'); 
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

      if (equipmentData.items) {
        finalItems = [...equipmentData.items];
      }

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
    return <div className="ui-panel ses-container">Keine Startausrüstung definiert.</div>;
  }

  return (
    // 'ui-panel' liefert NUR den Rahmen/Hintergrund. 
    // 'ses-container' kontrolliert das Layout komplett neu.
    <div className="ui-panel ses-container">
      
      <div className="ses-header">
        <h2 className="ses-title">Startausrüstung</h2>
        <p className="ses-subtitle">Wähle deine Ausstattung</p>
      </div>

      <div className="ses-options-grid">
        
        {/* --- OPTION A --- */}
        <div 
          className={`ses-card ${choiceType === 'equipment' ? 'ses-selected' : ''}`}
          onClick={() => setChoiceType('equipment')}
        >
          {choiceType === 'equipment' && <div className="ses-check">✓</div>}
          
          <div className="ses-card-header">
            <h3>Klassenausrüstung</h3>
          </div>
          
          <div className="ses-card-body">
            {/* Gold Bonus */}
            {equipmentData.default_gold > 0 && (
               <div className="ses-gold-row">
                 <span className="ses-icon">💰</span> 
                 <span>+ {equipmentData.default_gold} GM</span>
               </div>
            )}

            {/* Feste Items */}
            {equipmentData.items && equipmentData.items.length > 0 && (
              <ul className="ses-list">
                {equipmentData.items.map((itemRef, idx) => {
                  const item = getItem(itemRef.id);
                  return (
                    <li key={idx}>
                      <span className="ses-qty">{itemRef.quantity}x</span>
                      <span className="ses-name">{item ? item.name : itemRef.id}</span>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* Auswahl (Dropdown) */}
            {equipmentData.choices && equipmentData.choices.length > 0 && (
              <div className="ses-choice-block">
                <label>Paket wählen:</label>
                <select 
                  className="ses-select"
                  value={selectedPackage} 
                  onChange={(e) => setSelectedPackage(Number(e.target.value))}
                  onClick={(e) => e.stopPropagation()}
                >
                  {equipmentData.choices.map((choice, index) => (
                    <option key={index} value={index}>{choice.label}</option>
                  ))}
                </select>
                
                <ul className="ses-list ses-sublist">
                  {equipmentData.choices[selectedPackage].items.map((itemRef, idx) => {
                    const item = getItem(itemRef.id);
                    return (
                      <li key={`pack-${idx}`}>
                        <span className="ses-qty">{itemRef.quantity}x</span>
                        <span className="ses-name">{item ? item.name : itemRef.id}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* --- OPTION B --- */}
        <div 
          className={`ses-card ${choiceType === 'gold' ? 'ses-selected' : ''}`}
          onClick={() => setChoiceType('gold')}
        >
          {choiceType === 'gold' && <div className="ses-check">✓</div>}
          
          <div className="ses-card-header">
            <h3>Startgold</h3>
          </div>
          
          <div className="ses-card-body ses-center">
            <div className="ses-big-icon">💰</div>
            <span className="ses-gold-value">{equipmentData.gold_alternative} GM</span>
            <p className="ses-hint">
              Du erhältst keine Gegenstände, dafür aber Gold, um selbst einzukaufen.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default StartingEquipmentSelection;