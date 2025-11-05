import React, { useState } from 'react';
import './ActionBar.css';
import OptionsMenu from './OptionsMenu';

function ActionBar({ onSaveGame, onLoadGame, onToggleCharacterSheet }) { 
    const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
    
    const [activeTab, setActiveTab] = useState('Inventar');
    const [tabBeforeOptions, setTabBeforeOptions] = useState('Inventar');

    // State für die Anzahl der sichtbaren Reihen (Standard ist 2)
    const [visibleRows, setVisibleRows] = useState(2);

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

    // Eigener Handler für den Inventar-Button
    const handleInventoryClick = () => {
        handleTabClick('Inventar'); 
        onToggleCharacterSheet(); 
    };

    const getTabClassName = (tabName) => {
        return `hotbar-tab ${activeTab === tabName ? 'active' : ''}`;
    };

    // Funktionen zum Ändern der Reihen
    const handleIncreaseRows = () => {
        setVisibleRows(prev => Math.min(prev + 1, 3));
    };

    const handleDecreaseRows = () => {
        setVisibleRows(prev => Math.max(prev - 1, 2));
    };

    // Helfer-Komponente für leere Slots
    const EmptySlot = () => <div className="hotbar-slot"></div>;
    // Definiert 16 leere Slots für die Reihen
    const slots = Array(16).fill(<EmptySlot />);

    return (
        <>
            <div className="ui-container">
                <div className="hotbar-container">
                    
                    {/* ZENTRALE HOTBAR */}
                    <div className="hotbar ui-panel">
                        
                        <div className="global-controls">
                            <div className="global-control-icon"></div>
                            <div className="global-control-icon"></div>
                            <div className="global-control-icon"></div>
                            <div className="global-control-icon"></div>
                            <div className="global-control-icon"></div>
                        </div>

                        {/* HAUPTBEREICH FÜR ALLE SLOTS */}
                        <div className="hotbar-main-area">

                            {/* LINKE SLOTS (INTEGRIERT) */}
                            <div className="left-side-slots-integrated">
                                <div className="side-slot-column">
                                    <div className="hotbar-slot"></div>
                                    <div className="hotbar-slot hotbar-slot-half"></div>
                                    <div className="hotbar-slot hotbar-slot-half"></div>
                                </div>
                                <div className="side-slot-column">
                                    <div className="hotbar-slot"></div>
                                    <div className="hotbar-slot hotbar-slot-half"></div>
                                    <div className="hotbar-slot hotbar-slot-half"></div>
                                </div>
                            </div>

                            {/* ZENTRALE SLOTS (Konditionales Rendering) */}
                            <div className="main-slots-container">
                                
                                {/* Reihe 3 (Oben) */}
                                {visibleRows === 3 && (
                                    <div className="hotbar-extra-row">
                                        {slots.map((slot, index) => <EmptySlot key={index} />)}
                                    </div>
                                )}
                                
                                {/* --- GEÄNDERT: Reihe 2 (Mitte) - Alle <img> entfernt --- */}
                                {visibleRows >= 2 && (
                                    <div className="hotbar-top-row">
                                        {slots.map((slot, index) => <EmptySlot key={index} />)}
                                    </div>
                                )}

                                {/* Reihe 1 (Unten) */}
                                {visibleRows >= 1 && (
                                    <div className="hotbar-bottom-row">
                                        {slots.map((slot, index) => <EmptySlot key={index} />)}
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Footer mit Tabs und den neuen Buttons */}
                        <div className="hotbar-footer">
                            <div className="hotbar-tab-container">
                                
                                {/* Inventar Button */}
                                <div className={getTabClassName('Inventar')} onClick={handleInventoryClick}>Inventar</div>
                                
                                <div className={getTabClassName('Allgem.')} onClick={() => handleTabClick('Allgem.')}>Allgem.</div>
                                <div className={getTabClassName('Magier')} onClick={() => handleTabClick('Magier')}>Magier</div>
                                <div className={getTabClassName('Gegenst.')} onClick={() => handleTabClick('Gegenst.')}>Gegenst.</div>
                                <div className={getTabClassName('Passiv')} onClick={() => handleTabClick('Passiv')}>Passiv</div>
                                <div 
                                    className={getTabClassName('Optionen')} 
                                    onClick={handleOpenOptions}
                                >
                                    Optionen
                                </div>
                            </div>

                            {/* +/- Buttons */}
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

            {/* Modal-Rendering bleibt gleich */}
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