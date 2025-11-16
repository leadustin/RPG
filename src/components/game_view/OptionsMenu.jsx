import React from 'react';
import './OptionsMenu.css'; //

/**
 * A modal menu for game options like saving and loading.
 * @param {object} props - Component properties.
 * @param {Function} props.onSave - Function to call when the save button is clicked.
 * @param {Function} props.onLoad - Function to call when the load button is clicked.
 * @param {Function} props.onClose - Function to call to close the menu.
 */
const OptionsMenu = ({ onSave, onLoad, onClose }) => {

  // --- NEUE HANDLER START ---
  // Dieser Handler schließt das Options-Modal (onClose)
  // und öffnet dann das Save-Modal (onSave).
  const handleSaveClick = () => {
    onClose();
    onSave();
  };

  // Dieser Handler schließt das Options-Modal (onClose)
  // und öffnet dann das Load-Modal (onLoad).
  const handleLoadClick = () => {
    onClose();
    onLoad();
  };
  // --- NEUE HANDLER ENDE ---


  // The outer div handles closing the menu when clicking the background.
  // The inner div stops that click from propagating, so clicking the menu itself doesn't close it.
  return (
    <div className="options-menu-overlay" onClick={onClose}>
      <div className="options-menu" onClick={(e) => e.stopPropagation()}>
        <h2>Optionen</h2>
        
        {/* Buttons verwenden jetzt die neuen Handler */}
        <button onClick={handleSaveClick}>Spiel speichern</button>
        <button onClick={handleLoadClick}>Spiel laden</button>
        <button onClick={onClose}>Schließen</button>
      </div>
    </div>
  );
};

export default OptionsMenu;