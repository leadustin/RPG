// src/components/character_creation/IdentitySelection.js
import React from 'react';
import './PanelDetails.css'; // Für allgemeine Details-Header
import './IdentitySelection.css'; // Eigene Stile (jetzt mit Layout-Stilen)

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

// Funktion aus RaceSelection.js hierher verschoben
const getPortraitModule = (raceKey, gender, portraitIndex) => {
  const genderString = gender === 'Männlich' ? 'male' : 'female';
  try {
    return require(`../../assets/images/portraits/${raceKey}/${genderString}/${portraitIndex}.webp`);
  } catch (e) {
    console.error("Portrait not found:", raceKey, genderString, portraitIndex);
    return ''; // Fallback
  }
};

export const IdentitySelection = ({ character, updateCharacter }) => {
  
  const selectedRace = character.race;
  // Sicherstellen, dass portrait initial gesetzt ist, falls noch nicht geschehen
  React.useEffect(() => {
    if (!character.portrait && selectedRace) {
      const defaultPortrait = getPortraitModule(selectedRace.key, character.gender, 1);
      if (defaultPortrait) {
        updateCharacter({ portrait: defaultPortrait });
      }
    }
  }, [character.portrait, character.gender, selectedRace, updateCharacter]);

  const portraitCount = selectedRace.portraits || 4; 
  
  return (
    // NEU: Wrapper, um Header/Beschreibung und Layout-Grid korrekt zu verwalten
    <div className="identity-selection-wrapper"> 
      <h2 className="panel-details-header">Identität</h2>
      <p className="panel-details-description">
        Lege das Aussehen und die persönlichen Details deines Charakters fest.
      </p>

      {/* Zweispaltiges Dashboard-Layout (Stile jetzt in IdentitySelection.css) */}
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

          {/* Box 2: Details */}
          <div className="summary-box">
            <h3>Details</h3>
            <div className="identity-grid-two-columns">
              <div className="input-group">
                <label htmlFor="char-age">Alter</label>
                <input
                  id="char-age"
                  type="text"
                  value={character.age || ''}
                  onChange={(e) => updateCharacter({ age: e.target.value })}
                  placeholder="z.B. 25"
                />
              </div>
              <div className="input-group">
                <label htmlFor="char-height">Größe</label>
                <input
                  id="char-height"
                  type="text"
                  value={character.height || ''}
                  onChange={(e) => updateCharacter({ height: e.target.value })}
                  placeholder="z.B. 1,80m"
                />
              </div>
              <div className="input-group">
                <label htmlFor="char-weight">Gewicht</label>
                <input
                  id="char-weight"
                  type="text"
                  value={character.weight || ''}
                  onChange={(e) => updateCharacter({ weight: e.target.value })}
                  placeholder="z.B. 80kg"
                />
              </div>
              
              {/* Gesinnung als Dropdown */}
              <div className="input-group">
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
        </div> {/* Ende linke Spalte */}

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
        </div> {/* Ende rechte Spalte */}

      </div> {/* Ende summary-panel-layout */}
    </div> // Ende identity-selection-wrapper
  );
};