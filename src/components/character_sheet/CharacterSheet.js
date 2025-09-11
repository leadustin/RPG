import React from 'react';
import './CharacterSheet.css';

const CharacterSheet = ({ character, onClose }) => {
  // Sicherheitsprüfung, falls character undefined ist
  if (!character) {
    return (
      <div className="character-sheet-overlay">
        <div className="character-sheet">
          <button className="close-button" onClick={onClose}>×</button>
          <h2>Kein Charakter geladen</h2>
          <p>Es wurden keine Charakterdaten gefunden.</p>
        </div>
      </div>
    );
  }

  // Attribute sicher extrahieren
  const stats = character.stats || {};
  const strength = stats.strength || 10;
  const dexterity = stats.dexterity || 10;
  const constitution = stats.constitution || 10;
  const intelligence = stats.intelligence || 10;
  const wisdom = stats.wisdom || 10;
  const charisma = stats.charisma || 10;

  // Charakterinformationen sicher extrahieren
  const name = character.name || 'Unbekannt';
  const level = character.level || 1;
  
  // Rasse und Klasse sicher extrahieren
  const raceName = character.race?.name || 'Unbekannte Rasse';
  const className = character.class?.name || 'Unbekannte Klasse';

  // Modifikatoren berechnen
  const getModifier = (score) => Math.floor((score - 10) / 2);

  return (
    <div className="character-sheet-overlay">
      <div className="character-sheet">
        <div className="character-sheet-header">
          <h2>Charakterbogen</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="character-info">
          <h3>{name}</h3>
          <p><strong>Stufe:</strong> {level}</p>
          <p><strong>Rasse:</strong> {raceName}</p>
          <p><strong>Klasse:</strong> {className}</p>
        </div>

        <div className="character-stats">
          <h4>Attribute</h4>
          <div className="stats-grid">
            <div className="stat-block">
              <div className="stat-name">Stärke</div>
              <div className="stat-value">{strength}</div>
              <div className="stat-modifier">
                {getModifier(strength) >= 0 ? '+' : ''}{getModifier(strength)}
              </div>
            </div>
            
            <div className="stat-block">
              <div className="stat-name">Geschick</div>
              <div className="stat-value">{dexterity}</div>
              <div className="stat-modifier">
                {getModifier(dexterity) >= 0 ? '+' : ''}{getModifier(dexterity)}
              </div>
            </div>
            
            <div className="stat-block">
              <div className="stat-name">Konstitution</div>
              <div className="stat-value">{constitution}</div>
              <div className="stat-modifier">
                {getModifier(constitution) >= 0 ? '+' : ''}{getModifier(constitution)}
              </div>
            </div>
            
            <div className="stat-block">
              <div className="stat-name">Intelligenz</div>
              <div className="stat-value">{intelligence}</div>
              <div className="stat-modifier">
                {getModifier(intelligence) >= 0 ? '+' : ''}{getModifier(intelligence)}
              </div>
            </div>
            
            <div className="stat-block">
              <div className="stat-name">Weisheit</div>
              <div className="stat-value">{wisdom}</div>
              <div className="stat-modifier">
                {getModifier(wisdom) >= 0 ? '+' : ''}{getModifier(wisdom)}
              </div>
            </div>
            
            <div className="stat-block">
              <div className="stat-name">Charisma</div>
              <div className="stat-value">{charisma}</div>
              <div className="stat-modifier">
                {getModifier(charisma) >= 0 ? '+' : ''}{getModifier(charisma)}
              </div>
            </div>
          </div>
        </div>

        {/* Debug-Bereich (können Sie später entfernen) */}
        <div className="debug-info" style={{ marginTop: '20px', padding: '10px', background: '#f0f0f0', fontSize: '12px' }}>
          <h5>Debug - Character Data:</h5>
          <pre>{JSON.stringify(character, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
};

export default CharacterSheet;
