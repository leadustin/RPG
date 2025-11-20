// src/components/character_creation/BackgroundSelection.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import "./BackgroundSelection.css";
import "./PanelDetails.css";
import backgroundDataRaw from "../../data/backgrounds.json";
import featureDataRaw from "../../data/features.json"; // <--- NEU: Import der Features

// Konvertiere das JSON-Objekt in ein Array für die Liste (Filtert leere Einträge)
const allBackgrounds = Array.isArray(backgroundDataRaw) 
  ? backgroundDataRaw 
  : Object.values(backgroundDataRaw);

export const BackgroundSelection = ({ character, updateCharacter }) => {
  const { t } = useTranslation();
  const selectedBackground = character.background;

  // Lokaler State
  const [asiMode, setAsiMode] = useState('focus'); 
  const [selectedAsi, setSelectedAsi] = useState({
    primary: "",   
    secondary: "", 
    first: "",     
    second: "",    
    third: ""      
  });

  const [equipChoice, setEquipChoice] = useState('a');

  // Beim Wechsel des Hintergrunds: Reset
  useEffect(() => {
    if (selectedBackground?.source === "PHB2024") {
      const allowed = selectedBackground.ability_scores || [];
      if (allowed.length >= 3) {
        setSelectedAsi({
            primary: allowed[0],
            secondary: allowed[1],
            first: allowed[0],
            second: allowed[1],
            third: allowed[2]
        });
      }
      setEquipChoice('a');
      setAsiMode('focus');
    }
  }, [selectedBackground?.key]);

  // Speichern im Charakter
  useEffect(() => {
    if (!selectedBackground || selectedBackground.source !== "PHB2024") return;

    const bonuses = {};

    if (asiMode === 'focus') {
      if (selectedAsi.primary) bonuses[selectedAsi.primary] = (bonuses[selectedAsi.primary] || 0) + 2;
      if (selectedAsi.secondary) bonuses[selectedAsi.secondary] = (bonuses[selectedAsi.secondary] || 0) + 1;
    } else {
      if (selectedAsi.first) bonuses[selectedAsi.first] = (bonuses[selectedAsi.first] || 0) + 1;
      if (selectedAsi.second) bonuses[selectedAsi.second] = (bonuses[selectedAsi.second] || 0) + 1;
      if (selectedAsi.third) bonuses[selectedAsi.third] = (bonuses[selectedAsi.third] || 0) + 1;
    }

    const currentOptions = character.background_options || {};
    const bonusesChanged = JSON.stringify(currentOptions.bonuses) !== JSON.stringify(bonuses);
    const modeChanged = currentOptions.asiMode !== asiMode;
    const equipChanged = currentOptions.equipmentOption !== equipChoice;

    if (bonusesChanged || modeChanged || equipChanged) {
      updateCharacter({ 
        background_options: {
          asiMode,
          bonuses,
          equipmentOption: equipChoice
        }
      });
    }

  }, [selectedAsi, asiMode, equipChoice, selectedBackground, updateCharacter, character.background_options]);


  if (!selectedBackground) {
    if (allBackgrounds.length > 0) {
        setTimeout(() => updateCharacter({ background: allBackgrounds[0] }), 0);
    }
    return <div className="loading-text">{t('common.loadingBackgrounds')}</div>;
  }

  // <--- NEU: Finde das zugehörige Feat-Objekt --->
  const backgroundFeat = featureDataRaw.find(f => f.key === selectedBackground.feat);
  // <--- ENDE NEU --->

  const allowedAttributes = selectedBackground.ability_scores || [];

  const renderAsiSelect = (key, excludeKeys = []) => (
    <select 
      className="panel-select"
      value={selectedAsi[key]} 
      onChange={(e) => setSelectedAsi({ ...selectedAsi, [key]: e.target.value })}
    >
      {allowedAttributes.map(attr => {
        const isDisabled = excludeKeys.map(k => selectedAsi[k]).includes(attr) && selectedAsi[key] !== attr;
        return (
          <option key={attr} value={attr} disabled={isDisabled}>
            {t(`abilities.${attr}`)}
          </option>
        );
      })}
    </select>
  );

  return (
    <div className="background-panel-layout">
      {/* --- LINKE SPALTE (Liste) --- */}
      <div className="background-column-left">
        <div className="background-box">
          <h3>{t('creation.step_background')}</h3>
          <div className="background-list-wrapper">
            {allBackgrounds.map((bg) => (
              <button
                key={bg.key}
                className={`background-button ${selectedBackground.key === bg.key ? "selected" : ""}`}
                onClick={() => updateCharacter({ background: bg })}
              >
                <span className="bg-name">{bg.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* --- RECHTE SPALTE (Details) --- */}
      <div className="background-column-right">
        <div className="background-box">
          <h2 className="panel-details-header">{selectedBackground.name}</h2>
          
          {/* Beschreibung übersetzen, falls Key vorhanden, sonst Fallback */}
          <p className="panel-details-description">
            {t(selectedBackground.description, selectedBackground.description)}
          </p>

          {selectedBackground.source === "PHB2024" ? (
            <div className="phb2024-options">
              
              {/* 1. ATTRIBUTE */}
              <div className="option-section">
                <h4>{t('characterCreation.attributeBonuses')}</h4>
                <p className="option-hint">{t('characterCreation.chooseAttributeBonuses')}</p>
                
                <div className="radio-group">
                    <label className={`radio-button ${asiMode === 'focus' ? 'active' : ''}`}>
                        <input type="radio" name="asiMode" checked={asiMode === 'focus'} onChange={() => setAsiMode('focus')} />
                        {t('characterCreation.strengthsFocused')}
                    </label>
                    <label className={`radio-button ${asiMode === 'balanced' ? 'active' : ''}`}>
                        <input type="radio" name="asiMode" checked={asiMode === 'balanced'} onChange={() => setAsiMode('balanced')} />
                        {t('characterCreation.balanced')}
                    </label>
                </div>

                <div className="asi-dropdowns">
                    {asiMode === 'focus' ? (
                        <div className="asi-row">
                            <div className="asi-input">
                                <label>{t('characterCreation.plus2Bonus')}</label>
                                {renderAsiSelect('primary', ['secondary'])}
                            </div>
                            <div className="asi-input">
                                <label>{t('characterCreation.plus1Bonus')}</label>
                                {renderAsiSelect('secondary', ['primary'])}
                            </div>
                        </div>
                    ) : (
                        <div className="asi-row">
                             <div className="asi-input"><label>{t('characterCreation.plus1BonusA')}</label>{renderAsiSelect('first', ['second', 'third'])}</div>
                             <div className="asi-input"><label>{t('characterCreation.plus1BonusB')}</label>{renderAsiSelect('second', ['first', 'third'])}</div>
                             <div className="asi-input"><label>{t('characterCreation.plus1BonusC')}</label>{renderAsiSelect('third', ['first', 'second'])}</div>
                        </div>
                    )}
                </div>
              </div>
              

              {/* 2. FERTIGKEITEN (Fest) */}
              <div className="features-grid">
                  <div className="feature-item">
                      <strong>{t('background.proficientSkills')}</strong>
                      <ul>
                        {selectedBackground.skills.map(skill => <li key={skill}>{t(`skills.${skill}`, skill)}</li>)}
                      </ul>
                  </div>
                  <div className="feature-item">
                      <strong>{t('background.proficientTools')}</strong>
                      <ul>
                        {selectedBackground.tools.map(tool => <li key={tool}>{t(`tools.${tool}`, tool)}</li>)}
                      </ul>
                  </div>
              </div>

              <div className="details-divider"></div>

              {/* 3. FEAT (Dynamisch geladen) */}
              <div className="option-section">
                  <h4>Talent (Feat)</h4> {/* Hardcoded Header oder via Translation t('background.featTitle') */}
                  <div className="feat-card">
                      {/* Zeige Name aus features.json oder Fallback */}
                      <strong>
                        {backgroundFeat ? backgroundFeat.name : t(`feats.${selectedBackground.feat}`, selectedBackground.feat)}
                      </strong>
                      
                      {/* Zeige Beschreibung aus features.json */}
                      <p className="small-text" style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>
                        {backgroundFeat 
                          ? backgroundFeat.description 
                          : "Beschreibung für dieses Talent konnte nicht geladen werden."
                        }
                      </p>
                  </div>
              </div>

              <div className="details-divider"></div>

              {/* 4. AUSRÜSTUNG */}
              <div className="option-section">
                  <h4>Ausrüstung</h4>
                  <div className="equipment-options">
                      {selectedBackground.equipment_options?.map(option => (
                          <div 
                            key={option.id} 
                            className={`equipment-option clickable-box ${equipChoice === option.id ? 'selected' : ''}`}
                            onClick={() => setEquipChoice(option.id)}
                          >
                              <div className="equip-content">
                                  <span className="equip-label">{option.id === 'a' ? "Paket A: Ausrüstung" : "Paket B: Gold"}</span>
                                  <ul className="equip-list-preview">
                                      {option.items.map((item, i) => (
                                          <li key={i}>{item.quantity}x {t(`items.${item.item_id}`, item.item_id)}</li>
                                      ))}
                                  </ul>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

            </div>
          ) : (
            <div>
                <p>Daten werden geladen...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};