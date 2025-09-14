import React from 'react';
import './ActionBar.css';

function ActionBar({ character, onToggleCharacterSheet }) {
  const handleCharacterClick = () => {
    console.log('Character button clicked', character);
    onToggleCharacterSheet();
  };
  return (
    <div className="action-bar">
      <button>Aktion 1</button>
      <button>Aktion 2</button>
      <button onClick={handleCharacterClick}>Charakter</button>
      <button>Zauberbuch</button>
      <button>Inventar</button>
    </div>
  );
}

export default ActionBar;