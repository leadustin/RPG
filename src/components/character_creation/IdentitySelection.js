// src/components/character_creation/IdentitySelection.js

import React from 'react';
import './PanelDetails.css';
import './IdentitySelection.css';

// Die 9 D&D-Gesinnungen
const ALIGNMENT_OPTIONS = [
  "Rechtschaffen Gut",
  "Neutral Gut",
  "Chaotisch Gut",
  "Rechtschaffen Neutral",
  "Neutral",
  "Chaotisch Neutral",
  "Rechtschaffen Böse",
  "Neutral Böse",
  "Chaotisch Böse"
];

// Funktion aus RaceSelection.js
const getPortraitModule = (raceKey, gender, portraitIndex) => {
  const genderString = gender === 'Männlich' ? 'male' : 'female';
  try {
    return require(`../../assets/images/portraits/${raceKey}/${genderString}/${portraitIndex}.webp`);
  } catch (e) {
    console.error("Portrait not found:", raceKey, genderString, portraitIndex);
    return '';
  }
};

export const IdentitySelection = ({ character, updateCharacter }) => {
  const selectedRace = character.race;
  const physicalProps = selectedRace?.physical_props || {};

  // Default-Werte aus physical_props oder Fallbacks
  const ageConfig = physicalProps.age || { min: 18, max: 80, default: 25, step: 1 };
  const heightConfig = physicalProps.height || { min: 1.60, max: 1.95, default: 1.75, step: 0.01 };
  const weightConfig = physicalProps.weight || { min: 60, max: 110, default: 75, step: 1 };

  // Sicherstellen, dass portrait initial gesetzt ist
  React.useEffect(() => {
    if (!character.portrait && selectedRace) {
      const defaultPortrait = getPortraitModule(selectedRace.key, character.gender, 1);
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
      <h2 className="panel-details-header">Identität</h2>
      <p className="panel-details-description">
        Lege das Aussehen und die persönlichen Details deines Charakters fest.
      </p>

      <div className="summary-panel-layout"> 

        {/* --- LINKE SPALTE (Eingabefelder) --- */}
        <div className="summary-column-left">

          {/* Box 1: Name & Geschlecht */}
          <div className="summary-box">
            <h3>Allgemein</h3>
            <div className="identity-grid-two-columns">
              <div className="input-group">
                <label htmlFor="char-name">Charaktername</label>
                <input
                  id="char-name"
                  type="text"
                  value={character.name}
                  onChange={(e) => updateCharacter({ name: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label>Geschlecht</label>
                <div className="gender-buttons">
                  <button
                    className={character.gender === 'Männlich' ? 'selected' : ''}
                    onClick={() => updateCharacter({ gender: 'Männlich' })}
                  >
                    Männlich
                  </button>
                  <button
                    className={character.gender === 'Weiblich' ? 'selected' : ''}
                    onClick={() => updateCharacter({ gender: 'Weiblich' })}
                  >
                    Weiblich
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Box 2: Details mit Slidern */}
          <div className="summary-box">
            <h3>Details</h3>
            <div className="details-sliders">

              {/* Alter */}
              <div className="slider-group">
                <label htmlFor="char-age">
                  Alter: <span className="slider-value">{character.age || ageConfig.default}</span>
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
                  Größe: <span className="slider-value">{formatHeight(character.height || heightConfig.default)}</span>
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
                  Gewicht: <span className="slider-value">{formatWeight(character.weight || weightConfig.default)}</span>
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
                <label htmlFor="char-alignment">Gesinnung</label>
                <select
                  id="char-alignment"
                  className="identity-select" 
                  value={character.alignment || ''}
                  onChange={(e) => updateCharacter({ alignment: e.target.value })}
                >
                  <option value="" disabled>Wähle Gesinnung...</option>
                  {ALIGNMENT_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
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
            <h3>Portrait</h3>
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