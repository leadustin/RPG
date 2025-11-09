// ActionBar.js (Finale Korrektur)

import React, { useState } from 'react'; // <-- KORREKT
import './ActionBar.css';
import OptionsMenu from './OptionsMenu';
import Tooltip from '../tooltip/Tooltip'; 

// 'character' ist jetzt der *aktive* Charakter (aus GameView)
function ActionBar({ onSaveGame, onLoadGame, onToggleCharacterSheet, character }) { 
    const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
    
    const [activeTab, setActiveTab] = useState('Inventar');
    const [tabBeforeOptions, setTabBeforeOptions] = useState('Inventar');

    const [visibleRows, setVisibleRows] = useState(2);

    // Item-Daten (bleibt gleich)
    const equipment = character ? character.equipment : {};
    const mainHandWeapon = equipment['main-hand'] || null;
    const rangedWeapon = equipment['ranged'] || null;

    // Hover-Logik ist nicht mehr nötig
    
    const classTabName = (character && character.class && character.class.name) 
                            ? character.class.name 
                            : "Klasse";

    const handleOpenOptions = () => {
        setTabBeforeOptions(activeTab); 
        setActiveTab('Optionen');
        setIsOptionsModalOpen(true);
    };

    const handleCloseOptions = () => {
        setIsOptionsModalOpen(false);
        setActiveTab(tabBeforeOptions); 
    };

    const handleTabClick = (tabName) => {
        setActiveTab(tabName);
        setTabBeforeOptions(tabName); 
    };

    const handleInventoryClick = () => {
        handleTabClick('Inventar'); 
        onToggleCharacterSheet(); 
    };

    const getTabClassName = (tabName) => {
        return `hotbar-tab ${activeTab === tabName ? 'active' : ''}`;
    };

    const handleIncreaseRows = () => {
        setVisibleRows(prev => Math.min(prev + 1, 3));
    };

    const handleDecreaseRows = () => {
        setVisibleRows(prev => Math.max(prev - 1, 2));
    };

    const EmptySlot = () => <div className="hotbar-slot"></div>;
    
    // Helfer-Komponente: Leitet ...rest (z.B. onMouseEnter) an das div weiter
    const EquippedItemSlot = ({ item, ...rest }) => {
        if (!item) {
            return <EmptySlot />; 
        }

        let iconSrc = null;
        if (item.icon) {
            try {
                iconSrc = require(`../../assets/images/icons/${item.icon}`);
            } catch (e) {
                try {
                    iconSrc = require(`../../assets/images/icons/placeholder_weapon.webp`);
                } catch (e2) {
                    iconSrc = null; 
                }
            }
        }

        return (
            <div 
                className="hotbar-slot equipped" 
                {...rest} // <-- Wichtig: Leitet Tooltip-Events weiter
            >
                {iconSrc && <img src={iconSrc} alt={item.name} />}
            </div>
        );
    };
    
    const slots = Array(16).fill(<EmptySlot />);

    return (
        <>
            <div className="ui-container">
                <div className="hotbar-container">
                    
                    <div className="hotbar ui-panel">
                        
                        <div className="global-controls">
                            <div className="global-control-icon"></div>
                            <div className="global-control-icon"></div>
                            <div className="global-control-icon"></div>
                            <div className="global-control-icon"></div>
                            <div className="global-control-icon"></div>
                        </div>

                        <div className="hotbar-main-area">

                            {/* Linke Slots (Wrapper korrigiert) */}
                            <div className="left-side-slots-integrated">
                                <div className="side-slot-column">
                                    
                                    {/* KORREKTUR: 'item' statt 'text' für vollen Tooltip */}
                                    {mainHandWeapon ? (
                                        <Tooltip item={mainHandWeapon}>
                                            <EquippedItemSlot item={mainHandWeapon} />
                                        </Tooltip>
                                    ) : (
                                        <EquippedItemSlot item={null} />
                                    )}

                                    <div className="hotbar-slot hotbar-slot-half"></div>
                                    <div className="hotbar-slot hotbar-slot-half"></div>
                                </div>
                                <div className="side-slot-column">
                                    
                                    {/* KORREKTUR: 'item' statt 'text' für vollen Tooltip */}
                                    {rangedWeapon ? (
                                        <Tooltip item={rangedWeapon}>
                                            <EquippedItemSlot item={rangedWeapon} />
                                        </Tooltip>
                                    ) : (
                                        <EquippedItemSlot item={null} />
                                    )}

                                    <div className="hotbar-slot hotbar-slot-half"></div>
                                    <div className="hotbar-slot hotbar-slot-half"></div>
                                </div>
                            </div>

                            {/* Zentrale Slots (bleibt gleich) */}
                            <div className="main-slots-container">
                                {visibleRows === 3 && (
                                    <div className="hotbar-extra-row">
                                        {slots.map((slot, index) => <EmptySlot key={index} />)}
                                    </div>
                                )}
                                {visibleRows >= 2 && (
                                    <div className="hotbar-top-row">
                                        {slots.map((slot, index) => <EmptySlot key={index} />)}
                                    </div>
                                )}
                                {visibleRows >= 1 && (
                                    <div className="hotbar-bottom-row">
                                        {slots.map((slot, index) => <EmptySlot key={index} />)}
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Footer mit Tabs (bleibt gleich) */}
                        <div className="hotbar-footer">
                            <div className="hotbar-tab-container">
                                <div className={getTabClassName('Inventar')} onClick={handleInventoryClick}>Inventar</div>
                                <div className={getTabClassName('Allgem.')} onClick={() => handleTabClick('AllGEm.')}>Allgem.</div>
                                <div 
                                    className={getTabClassName(classTabName)} 
                                    onClick={() => handleTabClick(classTabName)}
                                >
                                    {classTabName}
                                </div>
                                <div className={getTabClassName('Gegenst.')} onClick={() => handleTabClick('Gegenst.')}>Gegenst.</div>
                                <div className={getTabClassName('Passiv')} onClick={() => handleTabClick('Passiv')}>Passiv</div>
                                <div 
                                    className={getTabClassName('Optionen')} 
                                    onClick={handleOpenOptions}
                                >
                                    Optionen
                                </div>
                            </div>

                            {/* +/- Buttons (bleibt gleich) */}
                            <div className="hotbar-row-controls">
                                <button 
                                    className="hotbar-row-button" 
                                    onClick={handleDecreaseRows} 
                                    disabled={visibleRows === 2}
                                >
                                    -
                                </button>
                                <button 
                                    className="hotbar-row-button" 
                                    onClick={handleIncreaseRows} 
                                    disabled={visibleRows === 3}
                                >
                                    +
                                </button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Tooltip-Rendering (ENTFERNT) */}
            
            {/* Modal-Rendering (bleibt gleich) */}
            {isOptionsModalOpen && (
                <OptionsMenu 
                    onSave={onSaveGame} 
                    onLoad={onLoadGame} 
                    onClose={handleCloseOptions} 
                />
            )}
        </>
    );
}

export default ActionBar;