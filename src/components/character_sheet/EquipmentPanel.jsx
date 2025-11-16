import React from 'react';
import EquipmentSlot from './EquipmentSlot';
import './EquipmentPanel.css';

// onMoveItem kommt jetzt als Prop hinzu
const EquipmentPanel = ({ character, onMoveItem }) => { 
  const equipment = character.equipment || {};

  return (
    <div className="equipment-panel-grid">
      <div className="character-preview">
        <p>{character.name}</p>
      </div>

      {/* Alle Slots erhalten jetzt `onDropItem={onMoveItem}` */}
      <div className="slot-head">        <EquipmentSlot slotName="Head" item={equipment.head} onDropItem={onMoveItem} slotType="head" /> </div>
      <div className="slot-amulet">      <EquipmentSlot slotName="Amulet" item={equipment.amulet} onDropItem={onMoveItem} slotType="amulet" /> </div>
      <div className="slot-armor">       <EquipmentSlot slotName="Armor" item={equipment.armor} onDropItem={onMoveItem} slotType="armor" /> </div>
      <div className="slot-main-hand">   <EquipmentSlot slotName="Main Hand" item={equipment.mainHand} onDropItem={onMoveItem} slotType="mainHand" /> </div>
      <div className="slot-off-hand">    <EquipmentSlot slotName="Off Hand" item={equipment.offHand} onDropItem={onMoveItem} slotType="offHand" /> </div>
      <div className="slot-hands">       <EquipmentSlot slotName="Hands" item={equipment.hands} onDropItem={onMoveItem} slotType="hands" /> </div>
      <div className="slot-ring1">       <EquipmentSlot slotName="Ring" item={equipment.ring1} onDropItem={onMoveItem} slotType="ring1" /> </div>
      <div className="slot-ring2">       <EquipmentSlot slotName="Ring" item={equipment.ring2} onDropItem={onMoveItem} slotType="ring2" /> </div>
      <div className="slot-feet">        <EquipmentSlot slotName="Feet" item={equipment.feet} onDropItem={onMoveItem} slotType="feet" /> </div>
      <div className="slot-ranged">      <EquipmentSlot slotName="Ranged" item={equipment.ranged} onDropItem={onMoveItem} slotType="ranged" /> </div>
    </div>
  );
};

export default EquipmentPanel;