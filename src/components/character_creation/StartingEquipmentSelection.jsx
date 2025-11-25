// src/components/character_creation/StartingEquipmentSelection.jsx
import React, { useState, useEffect } from 'react';
import { getItem } from '../../utils/itemLoader';
// Importiere das allgemeine Panel-Design für den Hintergrund (WICHTIG!)
import './PanelDetails.css'; 
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
    return <div className="selection-panel class-summary-box">Keine Startausrüstung definiert.</div>;
  }

  return (
    // HIER: class-summary-box hinzugefügt für den Hintergrund-Look
    <div className="selection-panel class-summary-box starting-equipment-panel">
      <h2 className="panel-title">Startausrüstung wählen</h2>
      <div className="details-divider"></div>
      
      <p className="description-text">
        Wie möchtest du dein Abenteuer beginnen? Mit der bewährten Ausrüstung deiner Klasse oder mit einem Sack voll Gold, um dich selbst auszurüsten?
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
            {/* Gold-Bonus */}
            {equipmentData.default_gold > 0 && (
               <div className="gold-bonus">
                 <span className="icon">💰</span> {equipmentData.default_gold} GM Startgold
               </div>
            )}

            {/* Feste Items */}
            {equipmentData.items && equipmentData.items.length > 0 && (
              <ul className="item-list">
                {equipmentData.items.map((itemRef, idx) => {
                  const item = getItem(itemRef.id);
                  return (
                    <li key={idx}>
                      {itemRef.quantity > 1 ? <span className="qty">{itemRef.quantity}x</span> : ''}
                      <span className="item-name">{item ? item.name : itemRef.id}</span>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* Paket-Auswahl */}
            {equipmentData.choices && equipmentData.choices.length > 0 && (
              <div className="sub-selection">
                <label>Wähle dein Paket:</label>
                <select 
                  value={selectedPackage} 
                  onChange={(e) => setSelectedPackage(Number(e.target.value))}
                  onClick={(e) => e.stopPropagation()}
                >
                  {equipmentData.choices.map((choice, index) => (
                    <option key={index} value={index}>{choice.label}</option>
                  ))}
                </select>
                
                <ul className="item-list sub-list">
                  {equipmentData.choices[selectedPackage].items.map((itemRef, idx) => {
                    const item = getItem(itemRef.id);
                    return (
                      <li key={`pack-${idx}`}>
                        {itemRef.quantity > 1 ? <span className="qty">{itemRef.quantity}x</span> : ''}
                        <span className="item-name">{item ? item.name : itemRef.id}</span>
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
          
          <div className="option-content centered-content">
            <div className="big-gold-icon">💰</div>
            <span className="gold-display">{equipmentData.gold_alternative} GM</span>
            <div className="divider-small"></div>
            <p className="hint-text">
              Du startest <strong>ohne Ausrüstung</strong>. <br/>
              Nutze das Gold, um vor dem Abenteuer im Laden genau das zu kaufen, was du brauchst.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default StartingEquipmentSelection;