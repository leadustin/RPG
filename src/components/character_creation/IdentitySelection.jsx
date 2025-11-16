// src/components/character_creation/IdentitySelection.js

import React from 'react';
import { useTranslation } from 'react-i18next'; // Importieren
import './PanelDetails.css';
import './IdentitySelection.css';

// Statische Schlüssel für Gesinnungen (Werte, die gespeichert werden)
const ALIGNMENT_KEYS = [
  "lg",
  "ng",
  "cg",
  "ln",
  "n",
  "cn",
  "le",
  "ne",
  "ce"
];

// Funktion aus RaceSelection.js - angepasst für 'male'/'female'
const getPortraitModule = (raceKey, gender, portraitIndex) => {
  // Stellt sicher, dass gender 'male' oder 'female' ist
  const genderString = gender === 'male' ? 'male' : 'female';
  try {
    return require(`../../assets/images/portraits/${raceKey}/${genderString}/${portraitIndex}.webp`);
  } catch (e) {
    console.error("Portrait not found:", raceKey, genderString, portraitIndex);
    return '';
  }
};

export const IdentitySelection = ({ character, updateCharacter }) => {
  const { t } = useTranslation(); // i18n-Hook initialisieren
  const selectedRace = character.race;
  const physicalProps = selectedRace?.physical_props || {};

  // Default-Werte aus physical_props oder Fallbacks
  const ageConfig = physicalProps.age || { min: 18, max: 80, default: 25, step: 1 };
  const heightConfig = physicalProps.height || { min: 1.60, max: 1.95, default: 1.75, step: 0.01 };
  const weightConfig = physicalProps.weight || { min: 60, max: 110, default: 75, step: 1 };

  // Sicherstellen, dass portrait initial gesetzt ist
  React.useEffect(() => {
    // Standard-Geschlecht auf 'male' setzen, falls nicht definiert
    const currentGender = character.gender || 'male';
    if (!character.gender) {
        updateCharacter({ gender: 'male' });
    }

    if (!character.portrait && selectedRace) {
      const defaultPortrait = getPortraitModule(selectedRace.key, currentGender, 1);
      if (defaultPortrait) {
        updateCharacter({ portrait: defaultPortrait });
      }
    }
  }, [character.portrait, character.gender, selectedRace, updateCharacter]);

  const portraitCount = selectedRace?.portraits || 4;

  // Helper-Funktion für Höhe-Formatierung (z.B. 1.75 -> "1,75m")
  const formatHeight = (value) => {
    return value ? `${value.toFixed(2).replace('.', ',')}m` : '';
  };

  // Helper-Funktion für Gewicht-Formatierung (z.B. 75 -> "75kg")
  const formatWeight = (value) => {
    return value ? `${Math.round(value)}kg` : '';
  };

  return (
    <div className="identity-selection-wrapper">
      <h2 className="panel-details-header">{t('creation.identity.title')}</h2>
      <p className="panel-details-description">
        {t('creation.identity.description')}
      </p>

      <div className="summary-panel-layout">

        {/* --- LINKE SPALTE (Eingabefelder) --- */}
        <div className="summary-column-left">

          {/* Box 1: Name & Geschlecht */}
          <div className="summary-box">
            <h3>{t('creation.identity.general')}</h3>
            <div className="identity-grid-two-columns">
              <div className="input-group">
                <label htmlFor="char-name">{t('creation.identity.name')}</label>
                <input
                  id="char-name"
                  type="text"
                  value={character.name}
                  onChange={(e) => updateCharacter({ name: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label>{t('creation.identity.gender')}</label>
                <div className="gender-buttons">
                  <button
                    className={character.gender === 'male' ? 'selected' : ''}
                    onClick={() => updateCharacter({ gender: 'male' })}
                  >
                    {t('creation.identity.male')}
                  </button>
                  <button
                    className={character.gender === 'female' ? 'selected' : ''}
                    onClick={() => updateCharacter({ gender: 'female' })}
                  >
                    {t('creation.identity.female')}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Box 2: Details mit Slidern */}
          <div className="summary-box">
            <h3>{t('creation.identity.details')}</h3>
            <div className="details-sliders">

              {/* Alter */}
              <div className="slider-group">
                <label htmlFor="char-age">
                  {t('creation.identity.age')}{' '}
                  <span className="slider-value">{character.age || ageConfig.default}</span>
                </label>
                <input
                  id="char-age"
                  type="range"
                  className="identity-slider"
                  min={ageConfig.min}
                  max={ageConfig.max}
                  step={ageConfig.step}
                  value={character.age || ageConfig.default}
                  onChange={(e) => updateCharacter({ age: parseFloat(e.target.value) })}
                />
                <div className="slider-minmax">
                  <span>{ageConfig.min}</span>
                  <span>{ageConfig.max}</span>
                </div>
              </div>

              {/* Größe */}
              <div className="slider-group">
                <label htmlFor="char-height">
                  {t('creation.identity.height')}{' '}
                  <span className="slider-value">{formatHeight(character.height || heightConfig.default)}</span>
                </label>
                <input
                  id="char-height"
                  type="range"
                  className="identity-slider"
                  min={heightConfig.min}
                  max={heightConfig.max}
                  step={heightConfig.step}
                  value={character.height || heightConfig.default}
                  onChange={(e) => updateCharacter({ height: parseFloat(e.target.value) })}
                />
                <div className="slider-minmax">
                  <span>{formatHeight(heightConfig.min)}</span>
                  <span>{formatHeight(heightConfig.max)}</span>
                </div>
              </div>

              {/* Gewicht */}
              <div className="slider-group">
                <label htmlFor="char-weight">
                  {t('creation.identity.weight')}{' '}
                  <span className="slider-value">{formatWeight(character.weight || weightConfig.default)}</span>
                </label>
                <input
                  id="char-weight"
                  type="range"
                  className="identity-slider"
                  min={weightConfig.min}
                  max={weightConfig.max}
                  step={weightConfig.step}
                  value={character.weight || weightConfig.default}
                  onChange={(e) => updateCharacter({ weight: parseFloat(e.target.value) })}
                />
                <div className="slider-minmax">
                  <span>{formatWeight(weightConfig.min)}</span>
                  <span>{formatWeight(weightConfig.max)}</span>
                </div>
              </div>

              {/* Gesinnung als Dropdown */}
              <div className="input-group" style={{ marginTop: '15px' }}>
                <label htmlFor="char-alignment">{t('creation.identity.alignment')}</label>
                <select
                  id="char-alignment"
                  className="identity-select"
                  value={character.alignment || ''}
                  onChange={(e) => updateCharacter({ alignment: e.target.value })}
                >
                  <option value="" disabled>{t('creation.identity.chooseAlignment')}</option>
                  {ALIGNMENT_KEYS.map(key => (
                    <option key={key} value={key}>{t(`alignments.${key}`)}</option>
                  ))}
                </select>
              </div>

            </div>
          </div>
        </div>

        {/* --- RECHTE SPALTE (Scrollbare Portraits) --- */}
        <div className="summary-column-right">

          {/* Box 3: Portrait (scrollbar) */}
          <div className="summary-box">
            <h3>{t('creation.identity.portrait')}</h3>
            <ul className="portrait-grid">
              {Array.from({ length: portraitCount }, (_, i) => i + 1).map(index => {
                const portraitModule = getPortraitModule(selectedRace.key, character.gender, index);
                return (
                  <li key={index}>
                    <img
                      src={portraitModule}
                      alt={`Portrait ${index}`}
                      className={`portrait-image ${character.portrait === portraitModule ? 'selected' : ''}`}
                      onClick={() => updateCharacter({ portrait: portraitModule })}
                    />
                  </li>
                );
              })}
            </ul>
          </div>

        </div>

      </div>
    </div>
  );
};