import React, { useState } from 'react';
import './StatsPanel.css';
import Tooltip from '../tooltip/Tooltip'; // Tooltip importieren
import { 
    SKILL_MAP, 
    SKILL_NAMES_DE, 
    calculateSkillBonus, 
    SKILL_DESCRIPTIONS_DE 
} from '../../engine/characterEngine';

const StatsPanel = ({ character }) => {
  const [activeTab, setActiveTab] = useState('stats');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'stats':
        return (
          <div>
            <h3>Attributes</h3>
            <p>Strength: {character.abilities.strength}</p>
            <p>Dexterity: {character.abilities.dexterity}</p>
            <p>Constitution: {character.abilities.constitution}</p>
            <p>Intelligence: {character.abilities.intelligence}</p>
            <p>Wisdom: {character.abilities.wisdom}</p>
            <p>Charisma: {character.abilities.charisma}</p>
          </div>
        );
      case 'skills':
    const skillKeys = Object.keys(SKILL_MAP); // Alle Fertigkeiten-Schlüssel holen
    return (
      <div>
        <h3>Fertigkeiten</h3>
        {skillKeys.map(key => {
          const skillName = SKILL_NAMES_DE[key] || key;
          const bonus = calculateSkillBonus(character, key);
          const description = SKILL_DESCRIPTIONS_DE[key] || "Keine Beschreibung verfügbar.";
          const bonusString = bonus >= 0 ? `+${bonus}` : bonus;

          return (
            <Tooltip key={key} text={description}>
              <div className="skill-entry">
                <span>{skillName}</span>
                <span>{bonusString}</span>
              </div>
            </Tooltip>
          );
        })}
      </div>
    );
      case 'proficiencies':
        return (
          <div>
            <h3>Proficiencies</h3>
            {/* Diese Daten sind momentan Platzhalter und müssen noch in characterEngine.js hinzugefügt werden */}
            <p>Armor: Light Armor, Medium Armor</p>
            <p>Weapons: Simple Weapons, Martial Weapons</p>
            <p>Tools: Thieves' Tools</p>
          </div>
        );
      default:
        return null;
    }
  };
  return (
    <div className="stats-panel-container">
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          Stats
        </button>
        <button
          className={`tab ${activeTab === 'skills' ? 'active' : ''}`}
          onClick={() => setActiveTab('skills')}
        >
          Skills
        </button>
        <button
          className={`tab ${activeTab === 'proficiencies' ? 'active' : ''}`}
          onClick={() => setActiveTab('proficiencies')}
        >
          Proficiencies
        </button>
      </div>
      <div className="tab-content">
        {renderTabContent()}
      </div>
    </div>
  );
};
export default StatsPanel;