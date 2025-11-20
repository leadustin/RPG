// src/components/character_creation/FeatSelection.jsx
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './SelectionPanel.css'; // Nutzt globale Styles für Grid etc.
import './SkillSelection.css'; // Für das Grid-Layout
import spellsData from '../../data/spells.json';
import Tooltip from '../tooltip/Tooltip';

// --- BILDER IMPORTIEREN ---
// Wir laden alle Icons aus dem Ordner, um sie den Zaubern zuzuordnen
const iconModules = import.meta.glob('../../assets/images/icons/*.(png|webp|jpg|svg)', { eager: true });
const icons = {};
for (const path in iconModules) {
  const fileName = path.split('/').pop();
  icons[fileName] = iconModules[path].default;
}

// Hilfsfunktion zum Filtern von Zaubern
const getSpellsByClassAndLevel = (className, level) => {
  return spellsData.filter(spell => 
    spell.classes.includes(className) && spell.level === level
  );
};

// Kleine interne Komponente für den Spell-Tooltip-Inhalt
const SpellTooltipContent = ({ spell }) => (
  <div className="tooltip-content">
    <h4 className="item-name">{spell.name}</h4>
    <div className="item-type">
        {spell.school} • {spell.level === 0 ? "Zaubertrick" : `Grad ${spell.level}`}
    </div>
    <div className="item-stats">
        <span>Zeit: {spell.ui_casting_time || spell.casting_time}</span>
        <span>Reichweite: {spell.ui_range || spell.range}</span>
    </div>
    <p className="item-description">{spell.ui_description || spell.description}</p>
    {spell.ui_scaling && (
        <p className="item-scaling"><em>{spell.ui_scaling}</em></p>
    )}
  </div>
);

export const FeatSelection = ({ feat, character, updateCharacter }) => {
  const { t } = useTranslation();
  
  // State für Auswahlen
  const [selections, setSelections] = useState({});
  
  // State für Collapsible Panels (Standardmäßig offen)
  const [openPanels, setOpenPanels] = useState({ cantrips: true, spells: true });

  const togglePanel = (panel) => {
    setOpenPanels(prev => ({ ...prev, [panel]: !prev[panel] }));
  };

  // Lade existierende Auswahlen
  useEffect(() => {
    if (character.feat_choices && character.feat_choices[feat.key]) {
      setSelections(character.feat_choices[feat.key]);
    } else {
      setSelections({});
    }
  }, [feat.key]);

  const handleSelection = (type, index, value) => {
    // Prüfen, ob dieser Zauber schon in einem ANDEREN Slot gewählt wurde
    // (Man soll nicht 2x denselben Cantrip wählen können)
    const isAlreadySelected = Object.entries(selections).some(
        ([key, selectedVal]) => key.startsWith(type) && key !== `${type}_${index}` && selectedVal === value
    );

    if (isAlreadySelected && value !== "") return; // Nichts tun, wenn schon gewählt

    // Neue Auswahl setzen (Toggle-Logik: Wenn schon gewählt, abwählen)
    const currentVal = selections[`${type}_${index}`];
    const newValue = currentVal === value ? "" : value;

    const newSelections = { ...selections, [`${type}_${index}`]: newValue };
    setSelections(newSelections);

    const updatedFeatChoices = {
        ...character.feat_choices,
        [feat.key]: newSelections
    };
    
    updateCharacter({ feat_choices: updatedFeatChoices });
  };

  // Helper: Find next empty slot or current slot for a type
  const handleGridClick = (type, spellKey, maxSlots) => {
      // 1. Ist dieser Spell schon irgendwo gewählt?
      const existingSlotEntry = Object.entries(selections).find(([k, v]) => k.startsWith(type) && v === spellKey);
      
      if (existingSlotEntry) {
          // ABWÄHLEN: Den Slot leeren
          const [slotKey] = existingSlotEntry;
          const newSelections = { ...selections };
          delete newSelections[slotKey];
          setSelections(newSelections);
          updateCharacter({ feat_choices: { ...character.feat_choices, [feat.key]: newSelections } });
      } else {
          // AUSWÄHLEN: Freien Slot suchen
          for (let i = 0; i < maxSlots; i++) {
              if (!selections[`${type}_${i}`]) {
                  handleSelection(type, i, spellKey);
                  return;
              }
          }
          // Wenn voll, ersetze den letzten (oder gib Feedback - hier: einfach ersetzen)
          handleSelection(type, maxSlots - 1, spellKey);
      }
  };

  // --- LOGIK FÜR "MAGIC INITIATE" ---
  if (feat.mechanics?.type === 'magic_initiate') {
    const spellClass = feat.mechanics.spell_class; 
    const cantripCount = feat.mechanics.cantrips_choose || 0;
    const spellCount = feat.mechanics.spells_level_1_choose || 0;

    const availableCantrips = getSpellsByClassAndLevel(spellClass, 0);
    const availableSpells = getSpellsByClassAndLevel(spellClass, 1);

    // Zähle aktuell gewählte
    const selectedCantripsCount = Object.keys(selections).filter(k => k.startsWith('cantrip') && selections[k]).length;
    const selectedSpellsCount = Object.keys(selections).filter(k => k.startsWith('spell') && selections[k]).length;

    return (
      <div className="feat-selection-container">
        
        {/* --- SECTION: CANTRIPS --- */}
        <div className="collapsible-section">
            <h4 
                className={`collapsible-header ${openPanels.cantrips ? 'open' : ''}`} 
                onClick={() => togglePanel('cantrips')}
            >
                {t('common.cantrip')} ({selectedCantripsCount}/{cantripCount})
            </h4>
            
            {openPanels.cantrips && (
                <div className="skill-grid">
                    {availableCantrips.map(spell => {
                        const isSelected = Object.values(selections).includes(spell.key);
                        const iconSrc = icons[spell.icon] || icons['skill_placeholder.png'];

                        return (
                            <Tooltip key={spell.key} content={<SpellTooltipContent spell={spell} />}>
                                <div 
                                    className={`skill-choice ${isSelected ? 'selected' : ''}`}
                                    onClick={() => handleGridClick('cantrip', spell.key, cantripCount)}
                                >
                                    {iconSrc && <img src={iconSrc} alt={spell.name} className="skill-icon" />}
                                    <span className="skill-name">{spell.name}</span>
                                </div>
                            </Tooltip>
                        );
                    })}
                </div>
            )}
        </div>

        {/* --- SECTION: LEVEL 1 SPELLS --- */}
        <div className="collapsible-section" style={{marginTop: '10px'}}>
            <h4 
                className={`collapsible-header ${openPanels.spells ? 'open' : ''}`} 
                onClick={() => togglePanel('spells')}
            >
                {t('common.level1Spell')} ({selectedSpellsCount}/{spellCount})
            </h4>
            
            {openPanels.spells && (
                <div className="skill-grid">
                    {/* KORREKTUR: Hier stand vorher 'availableLevel1Spells' */}
                    {availableSpells.map(spell => { 
                        const isSelected = Object.values(selections).includes(spell.key);
                        const iconSrc = icons[spell.icon] || icons['skill_placeholder.png'];

                        return (
                            <Tooltip key={spell.key} content={<SpellTooltipContent spell={spell} />}>
                                <div 
                                    className={`skill-choice ${isSelected ? 'selected' : ''}`}
                                    onClick={() => handleGridClick('spell', spell.key, spellCount)}
                                >
                                    {iconSrc && <img src={iconSrc} alt={spell.name} className="skill-icon" />}
                                    <span className="skill-name">{spell.name}</span>
                                </div>
                            </Tooltip>
                        );
                    })}
                </div>
            )}
        </div>

      </div>
    );
  }

  // Fallback für andere Feats
  return (
    <div className="feat-selection-info">
      {feat.mechanics?.type === 'hp_bonus_per_level' && (
         <p className="small-text text-muted">Passiver Bonus: +2 HP pro Level (automatisch).</p>
      )}
      {feat.mechanics?.type === 'initiative_bonus' && (
         <p className="small-text text-muted">Passiver Bonus: Initiative erhöht (automatisch).</p>
      )}
      {!feat.mechanics && <p>Keine Auswahl erforderlich.</p>}
    </div>
  );
};