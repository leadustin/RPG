import React, { useState } from 'react';
import './CharacterSheet.css';
import StatsPanel from './StatsPanel';
import EquipmentPanel from './EquipmentPanel';
import InventoryPanel from './InventoryPanel';

const CharacterSheet = ({ character: initialCharacter, onClose }) => {
  const [character, setCharacter] = useState(initialCharacter);

  const handleMoveItem = (draggedItem, dropTarget) => {
    setCharacter((prevCharacter) => {
      const newCharacter = JSON.parse(JSON.stringify(prevCharacter));
      const { source } = draggedItem;

      // Fall A: Item kommt aus dem Inventar
      if (source === 'inventory') {
        const fromIndex = draggedItem.index;

        // Fall A.1: Inventar -> Inventar (Umsortieren)
        if (typeof dropTarget === 'number') {
          const toIndex = dropTarget;
          [newCharacter.inventory[fromIndex], newCharacter.inventory[toIndex]] = 
          [newCharacter.inventory[toIndex], newCharacter.inventory[fromIndex]];
        }
        // Fall A.2: Inventar -> Ausrüstung (Anlegen)
        else if (typeof dropTarget === 'string') {
          const toSlot = dropTarget;
          [newCharacter.equipment[toSlot], newCharacter.inventory[fromIndex]] = 
          [newCharacter.inventory[fromIndex], newCharacter.equipment[toSlot]];
        }
      } 
      // Fall B: Item kommt von einem Ausrüstungs-Slot
      else if (source === 'equipment') {
        const fromSlot = draggedItem.slotType;

        // Fall B.1: Ausrüstung -> Inventar (Ablegen)
        if (typeof dropTarget === 'number') {
          const toIndex = dropTarget;
          [newCharacter.inventory[toIndex], newCharacter.equipment[fromSlot]] = 
          [newCharacter.equipment[fromSlot], newCharacter.inventory[toIndex]];
        }
        // Fall B.2: Ausrüstung -> Ausrüstung (Slots tauschen)
        else if (typeof dropTarget === 'string') {
          const toSlot = dropTarget;
          [newCharacter.equipment[toSlot], newCharacter.equipment[fromSlot]] = 
          [newCharacter.equipment[fromSlot], newCharacter.equipment[toSlot]];
        }
      }

      return newCharacter;
    });
  };

  if (!character) {
    return null;
  }

  return (
    <div className="character-sheet">
      <div className="sheet-header">
        <h2>{character.name}</h2>
        <button onClick={onClose} className="close-sheet-button">X</button>
      </div>

      <div className="stats-panel">
        <StatsPanel character={character} />
      </div>
      
      <div className="equipment-panel">
        {/* Wichtig: onMoveItem hier übergeben */}
        <EquipmentPanel character={character} onMoveItem={handleMoveItem} />
      </div>

      <div className="inventory-panel">
        <InventoryPanel character={character} onMoveItem={handleMoveItem} />
      </div>
    </div>
  );
};

export default CharacterSheet;