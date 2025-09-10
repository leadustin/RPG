import React from 'react';
import './ActionBar.css';

function ActionBar({ onToggleCharacterSheet }) {
  return (
    <div className="action-bar">
      <button>Aktion 1</button>
      <button>Aktion 2</button>
      <button onClick={onToggleCharacterSheet}>Charakter</button>
      <button>Zauberbuch</button>
      <button>Inventar</button>
    </div>
  );
}

export default ActionBar;