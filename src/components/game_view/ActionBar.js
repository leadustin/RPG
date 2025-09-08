import React from 'react';
import './ActionBar.css';

export const ActionBar = () => {
  return (
    <div className="action-bar-container">
      <div className="combat-log">
        <p>Willkommen im Spiel!</p>
        {/* Kampflog-Nachrichten kommen hierhin */}
      </div>
      <div className="skill-bar">
        {/* Skill-Buttons kommen hierhin */}
        <div className="skill-slot">1</div>
        <div className="skill-slot">2</div>
        <div className="skill-slot">3</div>
        <div className="skill-slot">4</div>
      </div>
    </div>
  );
};
