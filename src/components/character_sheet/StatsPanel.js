import React, { useState } from 'react';
import './StatsPanel.css';

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
        return (
          <div>
            <h3>Skills</h3>
            {/* Diese Daten sind momentan Platzhalter und müssen noch in characterEngine.js hinzugefügt werden */}
            <p>Acrobatics: 0</p>
            <p>Animal Handling: 0</p>
            <p>Arcana: 0</p>
            <p>Athletics: 0</p>
            <p>Deception: 0</p>
            <p>History: 0</p>
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