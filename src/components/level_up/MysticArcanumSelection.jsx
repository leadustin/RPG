// src/components/level_up/MysticArcanumSelection.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import spellsData from '../../data/spells.json';
import Tooltip from '../tooltip/Tooltip';
import './LevelUpScreen.css';

// Icons laden
const iconModules = import.meta.glob('../../assets/images/icons/*.(png|webp|jpg|svg)', { eager: true });
const icons = {};
for (const path in iconModules) {
  icons[path.split('/').pop()] = iconModules[path].default;
}

const SpellTooltip = ({ spell, t }) => (
    <div className="spell-tooltip-content">
        <div className="spell-tooltip-header">
            <span className="spell-tooltip-name">{spell.name}</span>
            <span className="tag" style={{background: '#d4af37', color: '#000'}}>Arkanum</span>
        </div>
        <div className="spell-tooltip-description" style={{marginTop: '10px'}}>
            {spell.ui_description || spell.description}
        </div>
    </div>
);

export const MysticArcanumSelection = ({ character, arcanumLevel, selectedKey, onSelect }) => {
    const { t } = useTranslation();
    const classKey = character.class.key;

    const availableSpells = spellsData.filter(s => 
        s.level === arcanumLevel && 
        s.classes.includes(classKey) && 
        !(character.spells_known || []).includes(s.key)
    );

    return (
        <div className="invocation-ui-vertical">
             <div className="inv-status-bar">
                <span>Mystisches Arkanum (Grad {arcanumLevel}): <strong style={{color: selectedKey ? '#4caf50' : '#d4af37'}}>{selectedKey ? '1' : '0'} / 1</strong></span>
            </div>

            <div className="inv-scroll-container">
                <div className="inv-section">
                    <h5 className="inv-section-title">Wähle einen Zauber</h5>
                    {availableSpells.length === 0 ? <p className="empty-msg">Keine Zauber verfügbar.</p> : (
                        <div className="inv-grid">
                            {availableSpells.map(spell => {
                                const iconSrc = icons[spell.icon] || icons['skill_placeholder.png'];
                                const isSelected = selectedKey === spell.key;

                                return (
                                    <Tooltip key={spell.key} content={<SpellTooltip spell={spell} t={t} />}>
                                        <div 
                                            className={`inv-compact-card ${isSelected ? 'selected-add' : ''}`}
                                            style={isSelected ? {borderColor: '#d4af37', background: 'rgba(212, 175, 55, 0.2)'} : {}}
                                            onClick={() => onSelect(spell.key)}
                                        >
                                            <img src={iconSrc} alt={spell.name} />
                                            {isSelected && <div className="check-marker" style={{color: '#d4af37', borderColor: '#d4af37'}}>★</div>}
                                        </div>
                                    </Tooltip>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};