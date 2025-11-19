// src/components/character_creation/BackgroundSelection.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import "./BackgroundSelection.css";
import "./PanelDetails.css";
import backgroundDataRaw from "../../data/backgrounds.json";

// Konvertiere das JSON-Objekt in ein Array für die Liste
const allBackgrounds = Object.values(backgroundDataRaw);

export const BackgroundSelection = ({ character, updateCharacter }) => {
  const { t } = useTranslation();
  const selectedBackground = character.background;

  // Lokaler State für die Attributsverteilung (nur UI-State, bevor gespeichert wird)
  const [asiMode, setAsiMode] = useState('focus'); // 'focus' (+2/+1) oder 'balanced' (+1/+1/+1)
  const [selectedAsi, setSelectedAsi] = useState({
    primary: "",   // für +2
    secondary: "", // für +1 (bei Focus)
    first: "",     // für +1 (bei Balanced)
    second: "",    // für +1 (bei Balanced)
    third: ""      // für +1 (bei Balanced)
  });

  // Lokaler State für Ausrüstungswahl ('a' oder 'b')
  const [equipChoice, setEquipChoice] = useState('a');

  // Beim Wechsel des Hintergrunds: Reset der lokalen Auswahl & Speichern des Defaults
  useEffect(() => {
    if (selectedBackground?.source === "PHB2024") {
      // Default Attribute setzen (die ersten verfügbaren)
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

  // Speichert die Attributsboni im Charakter-Objekt, wenn sich die Auswahl ändert
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

    // Update des Charakters
    // Wir speichern auch die Equip-Choice und die Boni
    updateCharacter({ 
      background_options: {
        asiMode,
        bonuses,
        equipmentOption: equipChoice
      }
    });

  }, [selectedAsi, asiMode, equipChoice, selectedBackground, updateCharacter]);


  if (!selectedBackground) {
    // Wähle automatisch den ersten Hintergrund, falls keiner gewählt ist
    if (allBackgrounds.length > 0) {
        setTimeout(() => updateCharacter({ background: allBackgrounds[0] }), 0);
    }
    return <div className="loading-text">{t('common.loadingBackgrounds')}</div>;
  }

  const allowedAttributes = selectedBackground.ability_scores || [];

  // Hilfsfunktion zum Rendern der Attributs-Dropdowns
  const renderAsiSelect = (key, excludeKeys = []) => (
    <select 
      className="panel-select"
      value={selectedAsi[key]} 
      onChange={(e) => setSelectedAsi({ ...selectedAsi, [key]: e.target.value })}
    >
      {allowedAttributes.map(attr => {
        // Deaktiviere bereits gewählte Attribute (außer es ist das aktuelle Feld)
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
                {bg.source === "PHB2024" && <span className="bg-badge">2024</span>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* --- RECHTE SPALTE (Details & Auswahl) --- */}
      <div className="background-column-right">
        <div className="background-box">
          <h2 className="panel-details-header">{selectedBackground.name}</h2>
          <p className="panel-details-description">{t(selectedBackground.description)}</p>

          {/* PHB 2024 Logik */}
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
              
              <div className="details-divider"></div>

              {/* 2. PROFICIENCIES (Fest) */}
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

              {/* 3. FEAT (Fest) */}
              <div className="option-section">
                  <h4>{t('background.feature', { name: t(`feats.${selectedBackground.feat}`, selectedBackground.feat) })}</h4>
                  <div className="feat-card">
                      <strong>{t(`feats.${selectedBackground.feat}`)}</strong>
                      {/* Hier könnte später eine Beschreibung des Feats stehen */}
                      <p className="small-text">Gewährt durch Hintergrund.</p>
                  </div>
              </div>

              <div className="details-divider"></div>

              {/* 4. EQUIPMENT */}
              <div className="option-section">
                  <h4>Ausrüstung</h4>
                  <div className="equipment-options">
                      {selectedBackground.equipment_options?.map(option => (
                          <label key={option.id} className={`equipment-option ${equipChoice === option.id ? 'selected' : ''}`}>
                              <input 
                                type="radio" 
                                name="equipChoice" 
                                value={option.id} 
                                checked={equipChoice === option.id} 
                                onChange={() => setEquipChoice(option.id)} 
                              />
                              <div className="equip-content">
                                  <span className="equip-label">{option.id === 'a' ? "Paket A: Ausrüstung" : "Paket B: Gold"}</span>
                                  <ul className="equip-list-preview">
                                      {option.items.map((item, i) => (
                                          <li key={i}>{item.quantity}x {t(`items.${item.item_id}`, item.item_id)}</li>
                                      ))}
                                  </ul>
                              </div>
                          </label>
                      ))}
                  </div>
              </div>

            </div>
          ) : (
            // FALLBACK FÜR ALTE DATENSTRUKTUR
            <div>
                <p>Dieser Hintergrund nutzt veraltete Daten.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};