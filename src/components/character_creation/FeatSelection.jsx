// src/components/character_creation/FeatSelection.jsx
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './SelectionPanel.css'; 
import './SkillSelection.css'; 
import spellsData from '../../data/spells.json';
import Tooltip from '../tooltip/Tooltip';
import skillDetails from '../../data/skillDetails.json';

// --- BILDER IMPORTIEREN ---
const spellIconModules = import.meta.glob('../../assets/images/icons/*.(png|webp|jpg|svg)', { eager: true });
const spellIcons = {};
for (const path in spellIconModules) {
  const fileName = path.split('/').pop();
  spellIcons[fileName] = spellIconModules[path].default;
}

const toolIconModules = import.meta.glob('../../assets/images/proficiencies/*.(png|webp|jpg|svg)', { eager: true });
const toolIcons = {};
for (const path in toolIconModules) {
  const fileName = path.split('/').pop().replace(/\.(png|webp|jpg|svg)$/, '');
  toolIcons[fileName] = toolIconModules[path].default;
}

const skillIconModules = import.meta.glob('../../assets/images/skills/*.(png|webp|jpg|svg)', { eager: true });
const skillIcons = {};
for (const path in skillIconModules) {
  const fileName = path.split('/').pop().replace(/\.(png|webp|jpg|svg)$/, '');
  skillIcons[fileName] = skillIconModules[path].default;
}

// --- LISTEN ---
const ARTISAN_TOOLS = [
  "alchemist", "brewer", "calligrapher", "carpenter", "cartographer", 
  "cobbler", "cook", "glassblower", "jeweler", "leatherworker", 
  "mason", "painter", "potter", "smith", "stonecarver", 
  "tinker", "weaver", "woodcarver"
];

const INSTRUMENTS = [
  "bagpipes", "drum", "dulcimer", "flute", "lute", "lyre", 
  "horn", "panflute", "shawm", "viol"
];

const OTHER_TOOLS = [
    "thieves_tools", "disguise_kit", "forgery_kit", "herbalism_kit", 
    "navigator_tools", "poisoner_kit", "dice", "card", "dragonchess"
];

const SKILLS = [
    "acrobatics", "animal_handling", "arcana", "athletics", "deception", 
    "history", "insight", "intimidation", "investigation", "medicine", 
    "nature", "perception", "performance", "persuasion", "religion", 
    "sleight_of_hand", "stealth", "survival"
];

// Hilfsfunktion zum Filtern von Zaubern
const getSpellsByClassAndLevel = (className, level) => {
  return spellsData.filter(spell => 
    spell.classes.includes(className) && spell.level === level
  );
};

// --- TOOLTIPS ---
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
  </div>
);

const ItemTooltipContent = ({ name, type, description }) => (
    <div className="tooltip-content">
      <h4 className="item-name">{name}</h4>
      <div className="item-type">{type}</div>
      {description && <p className="item-description">{description}</p>}
    </div>
);

export const FeatSelection = ({ feat, character, updateCharacter }) => {
  const { t } = useTranslation();
  const [selections, setSelections] = useState({});
  const [openPanels, setOpenPanels] = useState({ 
      cantrips: true, spells: true, 
      tools: true, instruments: true, 
      skills: true 
  });

  const togglePanel = (panel) => {
    setOpenPanels(prev => ({ ...prev, [panel]: !prev[panel] }));
  };

  // Safe Check: Wenn feat oder mechanics fehlen, breche ab
  if (!feat || !feat.mechanics) {
    return <div className="feat-selection-info"><p className="small-text text-muted">Keine Auswahl erforderlich.</p></div>;
  }

  useEffect(() => {
    if (character.feat_choices && character.feat_choices[feat.key]) {
      setSelections(character.feat_choices[feat.key]);
    } else {
      setSelections({});
    }
  }, [feat.key]);

  const updateSelections = (newSelections) => {
      setSelections(newSelections);
      const updatedFeatChoices = {
          ...character.feat_choices,
          [feat.key]: newSelections
      };
      updateCharacter({ feat_choices: updatedFeatChoices });
  };

  const handleSelection = (type, index, value) => {
    const newSelections = { ...selections, [`${type}_${index}`]: value };
    updateSelections(newSelections);
  };

  const handleGridClick = (type, key, maxSlots, sharedPoolPrefix = null) => {
      const storagePrefix = sharedPoolPrefix || type;
      const existingEntry = Object.entries(selections).find(([k, v]) => k.startsWith(storagePrefix) && v === key);
      
      if (existingEntry) {
          const [slotKey] = existingEntry;
          const newSelections = { ...selections };
          delete newSelections[slotKey];
          updateSelections(newSelections);
      } else {
          for (let i = 0; i < maxSlots; i++) {
              if (!selections[`${storagePrefix}_${i}`]) {
                  handleSelection(storagePrefix, i, key);
                  return;
              }
          }
          handleSelection(storagePrefix, maxSlots - 1, key);
      }
  };

  const mechanicType = feat.mechanics.type;

  // === LOGIK 1: MAGIC INITIATE (Zauber) ===
  if (mechanicType === 'magic_initiate') {
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

  // === LOGIK 2: HANDWERKER (Crafter) ===
  if (mechanicType === 'crafter_utility') {
    // SICHERER ZUGRIFF: Nutze ?. falls proficiencies fehlt
    const toolCount = feat.mechanics.proficiencies?.count || 3;
    const selectedCount = Object.keys(selections).filter(k => k.startsWith('tool') && selections[k]).length;

    return (
        <div className="feat-selection-container">
            <p className="small-text">{t('featSelection.crafterPrompt')}</p>
            <div className="collapsible-section">
                 <h4 className={`collapsible-header ${openPanels.tools ? 'open' : ''}`} onClick={() => togglePanel('tools')}>
                    {t('tools.categories.artisan')} ({selectedCount}/{toolCount})
                </h4>
                {openPanels.tools && (
                    <div className="skill-grid">
                        {ARTISAN_TOOLS.map(key => {
                            const isSelected = Object.values(selections).includes(key);
                            const name = t(`tools.${key}`, key);
                            const iconSrc = toolIcons[name]; 
                            return (
                                <Tooltip key={key} content={<ItemTooltipContent name={name} type={t('tools.categories.artisan')} description={t('featSelection.toolTooltipDescription')} />}>
                                    <div className={`skill-choice ${isSelected ? 'selected' : ''}`} onClick={() => handleGridClick('tool', key, toolCount)}>
                                        {iconSrc ? <img src={iconSrc} alt={name} className="skill-icon" /> : <span className="skill-name-fallback">{name.substring(0,2)}</span>}
                                    </div>
                                </Tooltip>
                            );
                        })}
                    </div>
                )}
            </div>
            <div className="passive-bonuses">
                 <p className="small-text text-muted" style={{marginTop: '10px'}}><strong>Passiv:</strong> {t('featSelection.crafterPassive')}</p>
            </div>
        </div>
    );
  }

  // === LOGIK 3: MUSIKER (Musician) ===
  if (mechanicType === 'musician_inspiration') {
    // SICHERER ZUGRIFF
    const count = feat.mechanics.proficiencies?.count || 3;
    const selectedCount = Object.keys(selections).filter(k => k.startsWith('instrument') && selections[k]).length;

    return (
        <div className="feat-selection-container">
             <p className="small-text">Wähle 3 Musikinstrumente.</p>
             <div className="collapsible-section">
                 <h4 className={`collapsible-header ${openPanels.instruments ? 'open' : ''}`} onClick={() => togglePanel('instruments')}>
                    {t('instruments.category')} ({selectedCount}/{count})
                </h4>
                {openPanels.instruments && (
                    <div className="skill-grid">
                        {INSTRUMENTS.map(key => {
                            const isSelected = Object.values(selections).includes(key);
                            const name = t(`instruments.${key}`, key);
                            const iconSrc = toolIcons[name];
                            return (
                                <Tooltip key={key} content={<ItemTooltipContent name={name} type={t('instruments.category')} />}>
                                    <div className={`skill-choice ${isSelected ? 'selected' : ''}`} onClick={() => handleGridClick('instrument', key, count)}>
                                        {iconSrc ? <img src={iconSrc} alt={name} className="skill-icon" /> : <span className="skill-name-fallback">{name.substring(0,2)}</span>}
                                    </div>
                                </Tooltip>
                            );
                        })}
                    </div>
                )}
            </div>
             <div className="passive-bonuses">
                 <p className="small-text text-muted" style={{marginTop: '10px'}}><strong>Passiv:</strong> Gewährt Inspiration nach einer Rast.</p>
            </div>
        </div>
    );
  }

  // === LOGIK 4: GEÜBT (Skilled) ===
  if (mechanicType === 'gain_proficiency_choice') {
    const count = feat.mechanics.count || 3;
    const selectedCount = Object.keys(selections).filter(k => k.startsWith('choice') && selections[k]).length;
    
    return (
        <div className="feat-selection-container">
            <p className="small-text">Wähle eine Kombination aus 3 Fertigkeiten oder Werkzeugen.</p>
            
            <div className="collapsible-section">
                <h4 className={`collapsible-header ${openPanels.skills ? 'open' : ''}`} onClick={() => togglePanel('skills')}>
                    {t('skills.title')}
                </h4>
                {openPanels.skills && (
                    <div className="skill-grid">
                        {SKILLS.map(key => {
                            const isSelected = Object.values(selections).includes(key);
                            const name = t(`skills.${key}`, key);
                            const iconSrc = skillIcons[key];
                            const desc = skillDetails[key]?.description;
                            return (
                                <Tooltip key={key} content={<ItemTooltipContent name={name} type={t('skills.title')} description={desc} />}>
                                    <div className={`skill-choice ${isSelected ? 'selected' : ''}`} onClick={() => handleGridClick('skill', key, count, 'choice')}>
                                        {iconSrc ? <img src={iconSrc} alt={name} className="skill-icon" /> : <span className="skill-name-fallback">{name.substring(0,2)}</span>}
                                    </div>
                                </Tooltip>
                            );
                        })}
                    </div>
                )}
            </div>

             <div className="collapsible-section" style={{marginTop: '10px'}}>
                <h4 className={`collapsible-header ${openPanels.tools ? 'open' : ''}`} onClick={() => togglePanel('tools')}>
                    {t('tools.categories.artisan')} & mehr
                </h4>
                {openPanels.tools && (
                    <div className="skill-grid">
                        {[...ARTISAN_TOOLS, ...INSTRUMENTS, ...OTHER_TOOLS].map(key => {
                            const isSelected = Object.values(selections).includes(key);
                            const name = t(`tools.${key}`, { defaultValue: t(`instruments.${key}`, key)});
                            const iconSrc = toolIcons[name];
                            return (
                                <Tooltip key={key} content={<ItemTooltipContent name={name} type="Werkzeug" />}>
                                    <div className={`skill-choice ${isSelected ? 'selected' : ''}`} onClick={() => handleGridClick('tool', key, count, 'choice')}>
                                        {iconSrc ? <img src={iconSrc} alt={name} className="skill-icon" /> : <span className="skill-name-fallback">{name.substring(0,2)}</span>}
                                    </div>
                                </Tooltip>
                            );
                        })}
                    </div>
                )}
            </div>
             <div className="passive-bonuses">
                 <p className="small-text text-muted" style={{marginTop: '10px'}}><strong>Gesamt gewählt:</strong> {selectedCount}/{count}</p>
            </div>
        </div>
    );
  }

  // === LOGIK 5: PASSIVE TALENTE (Fallbacks) ===
  const passiveDescriptions = {
      'hp_bonus_per_level': "Deine Trefferpunkte erhöhen sich um 2 pro Level.",
      'initiative_bonus': "Du erhältst einen Bonus auf Initiative-Würfe.",
      'healer_feat_utility': "Du kannst das Heilerset besser nutzen und heilst mehr.",
      'resource_lucky_points': "Du hast Glückspunkte, um Würfe zu beeinflussen.",
      'unarmed_upgrade': "Deine waffenlosen Schläge sind stärker (1W4 + STÄ) und können stoßen.",
      'damage_reroll_advantage': "Du kannst Schadenswürfel von Waffenangriffen wiederholen.",
      'crafter_utility': "Schnelleres Herstellen und Rabatte."
  };

  const desc = passiveDescriptions[mechanicType];

  return (
    <div className="feat-selection-info">
      {desc ? (
          <p className="small-text text-muted"><strong>Effekt:</strong> {desc}</p>
      ) : (
          <p className="small-text text-muted">Keine weitere Auswahl erforderlich.</p>
      )}
    </div>
  );
};