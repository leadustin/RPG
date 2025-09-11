import React from 'react';
import './CharacterSheet.css';
// Importiere die Berechnungs-Engine
import { getRacialAbilityBonus, getAbilityModifier } from '../../engine/characterEngine';

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

  // Greife auf die korrekten Fähigkeitswerte aus character.abilities zu
  const baseAbilities = character.abilities || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };

  // Berechne die finalen Werte inkl. Rassenboni
  const strength = baseAbilities.str + getRacialAbilityBonus(character, 'str');
  const dexterity = baseAbilities.dex + getRacialAbilityBonus(character, 'dex');
  const constitution = baseAbilities.con + getRacialAbilityBonus(character, 'con');
  const intelligence = baseAbilities.int + getRacialAbilityBonus(character, 'int');
  const wisdom = baseAbilities.wis + getRacialAbilityBonus(character, 'wis');
  const charisma = baseAbilities.cha + getRacialAbilityBonus(character, 'cha');
  
  // Charakterinformationen sicher extrahieren
  const name = character.name || 'Unbekannt';
  const level = character.level || 1;
  
  // Rasse und Klasse sicher extrahieren
  const raceName = character.race?.name || 'Unbekannte Rasse';
  const className = character.class?.name || 'Unbekannte Klasse';

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
                {getAbilityModifier(strength) >= 0 ? '+' : ''}{getAbilityModifier(strength)}
              </div>
            </div>
            
            <div className="stat-block">
              <div className="stat-name">Geschick</div>
              <div className="stat-value">{dexterity}</div>
              <div className="stat-modifier">
                {getAbilityModifier(dexterity) >= 0 ? '+' : ''}{getAbilityModifier(dexterity)}
              </div>
            </div>
            
            <div className="stat-block">
              <div className="stat-name">Konstitution</div>
              <div className="stat-value">{constitution}</div>
              <div className="stat-modifier">
                {getAbilityModifier(constitution) >= 0 ? '+' : ''}{getAbilityModifier(constitution)}
              </div>
            </div>
            
            <div className="stat-block">
              <div className="stat-name">Intelligenz</div>
              <div className="stat-value">{intelligence}</div>
              <div className="stat-modifier">
                {getAbilityModifier(intelligence) >= 0 ? '+' : ''}{getAbilityModifier(intelligence)}
              </div>
            </div>
            
            <div className="stat-block">
              <div className="stat-name">Weisheit</div>
              <div className="stat-value">{wisdom}</div>
              <div className="stat-modifier">
                {getAbilityModifier(wisdom) >= 0 ? '+' : ''}{getAbilityModifier(wisdom)}
              </div>
            </div>
            
            <div className="stat-block">
              <div className="stat-name">Charisma</div>
              <div className="stat-value">{charisma}</div>
              <div className="stat-modifier">
                {getAbilityModifier(charisma) >= 0 ? '+' : ''}{getAbilityModifier(charisma)}
              </div>
            </div>
          </div>
        </div>

        <div className="character-traits">
          <h3>Besondere Fähigkeiten</h3>
          {character.race?.traits && character.race.traits.length > 0 && (
            <div className="race-traits">
              <h4>Rasseneigenschaften:</h4>
              {character.race.traits.map((trait, index) => (
                <div key={index} className="trait">
                  <strong>{trait.name}:</strong> 
                  <span>{trait.description}</span>
                </div>
              ))}
            </div>
          )}
          
          {character.class?.features && character.class.features.length > 0 && (
            <div className="class-features">
              <h4>Klassenfähigkeiten:</h4>
              {character.class.features.map((feature, index) => (
                <div key={index} className="feature">
                  <strong>{feature.name}:</strong> 
                  <span>{feature.description}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CharacterSheet;