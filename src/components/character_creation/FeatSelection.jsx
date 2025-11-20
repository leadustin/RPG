// src/components/character_creation/FeatSelection.jsx
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './SelectionPanel.css'; 
import './SkillSelection.css'; 
import spellsData from '../../data/spells.json';
import Tooltip from '../tooltip/Tooltip';

// --- BILDER IMPORTIEREN ---
// 1. Zauber-Icons
const spellIconModules = import.meta.glob('../../assets/images/icons/*.(png|webp|jpg|svg)', { eager: true });
const spellIcons = {};
for (const path in spellIconModules) {
  const fileName = path.split('/').pop();
  spellIcons[fileName] = spellIconModules[path].default;
}

// 2. Werkzeug-Icons (Proficiencies)
const toolIconModules = import.meta.glob('../../assets/images/proficiencies/*.(png|webp|jpg|svg)', { eager: true });
const toolIcons = {};
for (const path in toolIconModules) {
  // Wir entfernen die Dateiendung für den Key, um leichter zu matchen
  const fileName = path.split('/').pop().replace(/\.(png|webp|jpg|svg)$/, '');
  toolIcons[fileName] = toolIconModules[path].default;
}

// --- DATEN: Handwerkerwerkzeuge ---
const ARTISAN_TOOLS = [
  "alchemist", "brewer", "calligrapher", "carpenter", "cartographer", 
  "cobbler", "cook", "glassblower", "jeweler", "leatherworker", 
  "mason", "painter", "potter", "smith", "stonecarver", 
  "tinker", "weaver", "woodcarver"
];

// Hilfsfunktion zum Filtern von Zaubern
const getSpellsByClassAndLevel = (className, level) => {
  return spellsData.filter(spell => 
    spell.classes.includes(className) && spell.level === level
  );
};

// Tooltip Inhalt für Zauber
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

// Tooltip Inhalt für Werkzeuge (Angepasst an Skill-Tooltip Design)
const ToolTooltipContent = ({ name, type, description }) => (
    <div className="tooltip-content">
      <h4 className="item-name">{name}</h4>
      <div className="item-type">{type}</div>
      {description && <p className="item-description">{description}</p>}
    </div>
);

export const FeatSelection = ({ feat, character, updateCharacter }) => {
  const { t } = useTranslation();
  const [selections, setSelections] = useState({});
  const [openPanels, setOpenPanels] = useState({ cantrips: true, spells: true, tools: true });

  const togglePanel = (panel) => {
    setOpenPanels(prev => ({ ...prev, [panel]: !prev[panel] }));
  };

  useEffect(() => {
    if (character.feat_choices && character.feat_choices[feat.key]) {
      setSelections(character.feat_choices[feat.key]);
    } else {
      setSelections({});
    }
  }, [feat.key]);

  const handleSelection = (type, index, value) => {
    // Check: Ist Wert schon in einem anderen Slot gewählt?
    const isAlreadySelected = Object.entries(selections).some(
        ([key, selectedVal]) => key.startsWith(type) && key !== `${type}_${index}` && selectedVal === value
    );

    if (isAlreadySelected && value !== "") return; 

    const newSelections = { ...selections, [`${type}_${index}`]: value };
    setSelections(newSelections);

    const updatedFeatChoices = {
        ...character.feat_choices,
        [feat.key]: newSelections
    };
    
    updateCharacter({ feat_choices: updatedFeatChoices });
  };

  // Generische Grid-Klick-Logik (funktioniert für Spells UND Tools)
  const handleGridClick = (type, key, maxSlots) => {
      // 1. Ist dieses Element schon gewählt? -> Abwählen
      const existingSlotEntry = Object.entries(selections).find(([k, v]) => k.startsWith(type) && v === key);
      
      if (existingSlotEntry) {
          const [slotKey] = existingSlotEntry;
          const newSelections = { ...selections };
          delete newSelections[slotKey];
          setSelections(newSelections);
          updateCharacter({ feat_choices: { ...character.feat_choices, [feat.key]: newSelections } });
      } else {
          // 2. Freien Slot suchen
          for (let i = 0; i < maxSlots; i++) {
              if (!selections[`${type}_${i}`]) {
                  handleSelection(type, i, key);
                  return;
              }
          }
          // 3. Wenn voll, letzten Slot überschreiben
          handleSelection(type, maxSlots - 1, key);
      }
  };

  // === 1. LOGIK: MAGIC INITIATE ===
  if (feat.mechanics?.type === 'magic_initiate') {
    const spellClass = feat.mechanics.spell_class; 
    const cantripCount = feat.mechanics.cantrips_choose || 0;
    const spellCount = feat.mechanics.spells_level_1_choose || 0;

    const availableCantrips = getSpellsByClassAndLevel(spellClass, 0);
    const availableSpells = getSpellsByClassAndLevel(spellClass, 1);

    const selectedCantripsCount = Object.keys(selections).filter(k => k.startsWith('cantrip') && selections[k]).length;
    const selectedSpellsCount = Object.keys(selections).filter(k => k.startsWith('spell') && selections[k]).length;

    return (
      <div className="feat-selection-container">
        <p className="small-text" style={{marginBottom: '10px'}}>
            {t('featSelection.magicInitiatePrompt', { class: t(`classes.${spellClass}`, spellClass) })}
        </p>
        {/* Cantrips */}
        <div className="collapsible-section">
            <h4 className={`collapsible-header ${openPanels.cantrips ? 'open' : ''}`} onClick={() => togglePanel('cantrips')}>
                {t('common.cantrip')} ({selectedCantripsCount}/{cantripCount})
            </h4>
            {openPanels.cantrips && (
                <div className="skill-grid">
                    {availableCantrips.map(spell => {
                        const isSelected = Object.values(selections).includes(spell.key);
                        const iconSrc = spellIcons[spell.icon] || spellIcons['skill_placeholder.png'];
                        return (
                            <Tooltip key={spell.key} content={<SpellTooltipContent spell={spell} />}>
                                <div className={`skill-choice ${isSelected ? 'selected' : ''}`} onClick={() => handleGridClick('cantrip', spell.key, cantripCount)}>
                                    {iconSrc && <img src={iconSrc} alt={spell.name} className="skill-icon" />}
                                    <span className="skill-name">{spell.name}</span>
                                </div>
                            </Tooltip>
                        );
                    })}
                </div>
            )}
        </div>
        {/* Level 1 Spells */}
        <div className="collapsible-section" style={{marginTop: '10px'}}>
            <h4 className={`collapsible-header ${openPanels.spells ? 'open' : ''}`} onClick={() => togglePanel('spells')}>
                {t('common.level1Spell')} ({selectedSpellsCount}/{spellCount})
            </h4>
            {openPanels.spells && (
                <div className="skill-grid">
                    {availableSpells.map(spell => {
                        const isSelected = Object.values(selections).includes(spell.key);
                        const iconSrc = spellIcons[spell.icon] || spellIcons['skill_placeholder.png'];
                        return (
                            <Tooltip key={spell.key} content={<SpellTooltipContent spell={spell} />}>
                                <div className={`skill-choice ${isSelected ? 'selected' : ''}`} onClick={() => handleGridClick('spell', spell.key, spellCount)}>
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

  // === 2. LOGIK: CRAFTER (Handwerker) ===
  if (feat.mechanics?.type === 'crafter_utility') {
    const toolCount = feat.mechanics.proficiencies?.count || 3;
    const selectedToolsCount = Object.keys(selections).filter(k => k.startsWith('tool') && selections[k]).length;

    return (
        <div className="feat-selection-container">
            <p className="small-text">{t('featSelection.crafterPrompt')}</p>
            
            <div className="collapsible-section">
                 <h4 className={`collapsible-header ${openPanels.tools ? 'open' : ''}`} onClick={() => togglePanel('tools')}>
                    {t('tools.categories.artisan')} ({selectedToolsCount}/{toolCount})
                </h4>
                
                {openPanels.tools && (
                    <div className="skill-grid">
                        {ARTISAN_TOOLS.map(toolKey => {
                            const isSelected = Object.values(selections).includes(toolKey);
                            const toolName = t(`tools.${toolKey}`, toolKey);
                            
                            // Bild-Matching: Versuche, den übersetzten Namen als Dateinamen zu finden
                            // z.B. "Alchemistenwerkzeug" -> "Alchemistenwerkzeug.png"
                            const iconSrc = toolIcons[toolName] || null;

                            return (
                                <Tooltip 
                                    key={toolKey} 
                                    content={
                                        <ToolTooltipContent 
                                            name={toolName} 
                                            type={t('tools.categories.artisan')} 
                                            description={t('featSelection.toolTooltipDescription')} 
                                        />
                                    }
                                >
                                    <div 
                                        className={`skill-choice ${isSelected ? 'selected' : ''}`} 
                                        onClick={() => handleGridClick('tool', toolKey, toolCount)}
                                    >
                                        {iconSrc ? (
                                            <img src={iconSrc} alt={toolName} className="skill-icon" />
                                        ) : (
                                            <span className="skill-name-fallback">{toolName.substring(0, 2)}</span>
                                        )}
                                        {/* Falls kein Icon da ist, zeigen wir den Namen (oder bei Hover durch Tooltip) */}
                                    </div>
                                </Tooltip>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="passive-bonuses">
                 <p className="small-text text-muted" style={{marginTop: '10px'}}>
                    <strong>Passiv:</strong> {t('featSelection.crafterPassive')}
                 </p>
            </div>
        </div>
    );
  }

  // Fallback
  return (
    <div className="feat-selection-info">
      {feat.mechanics?.type === 'hp_bonus_per_level' && (
         <p className="small-text text-muted">Passiver Bonus: +2 HP pro Level (automatisch).</p>
      )}
      {feat.mechanics?.type === 'initiative_bonus' && (
         <p className="small-text text-muted">Passiver Bonus: Initiative erhöht (automatisch).</p>
      )}
      {!feat.mechanics && <p className="small-text text-muted">Keine Auswahl erforderlich.</p>}
    </div>
  );
};