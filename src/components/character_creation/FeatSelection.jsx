// src/components/character_creation/FeatSelection.jsx
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import './SelectionPanel.css'; // Wir nutzen existierende Styles
import spellsData from '../../data/spells.json';

// Hilfsfunktion zum Filtern von Zaubern
const getSpellsByClassAndLevel = (className, level) => {
  return spellsData.filter(spell => 
    spell.classes.includes(className) && spell.level === level
  );
};

export const FeatSelection = ({ feat, character, updateCharacter }) => {
  const { t } = useTranslation();
  
  // Wir speichern die Auswahlen im lokalen State, bevor wir sie hochreichen
  // Struktur: { selections: { "cantrip_0": "light", "spell_0": "bless" } }
  const [selections, setSelections] = useState({});

  // Lade existierende Auswahlen, falls vorhanden
  useEffect(() => {
    if (character.feat_choices && character.feat_choices[feat.key]) {
      setSelections(character.feat_choices[feat.key]);
    } else {
        setSelections({});
    }
  }, [feat.key]);

  // Handler für Änderungen
  const handleChange = (type, index, value) => {
    const newSelections = { ...selections, [`${type}_${index}`]: value };
    setSelections(newSelections);

    // Update Character: Wir speichern dies unter 'feat_choices'
    // Struktur im Charakter: feat_choices: { "magic_initiate_cleric": { "cantrip_0": "...", ... } }
    const updatedFeatChoices = {
        ...character.feat_choices,
        [feat.key]: newSelections
    };
    
    updateCharacter({ feat_choices: updatedFeatChoices });
  };

  // --- LOGIK FÜR "MAGIC INITIATE" (Magischer Adept) ---
  if (feat.mechanics?.type === 'magic_initiate') {
    const spellClass = feat.mechanics.spell_class; // z.B. "cleric"
    const cantripCount = feat.mechanics.cantrips_choose || 0;
    const spellCount = feat.mechanics.spells_level_1_choose || 0;

    const availableCantrips = getSpellsByClassAndLevel(spellClass, 0);
    const availableSpells = getSpellsByClassAndLevel(spellClass, 1);

    return (
      <div className="feat-selection-container">
        <p className="small-text" style={{marginBottom: '10px'}}>
          {t('featSelection.magicInitiatePrompt', { class: t(`classes.${spellClass}`, spellClass) })}
        </p>

        {/* Cantrip Auswahl */}
        {Array.from({ length: cantripCount }).map((_, i) => (
          <div key={`cantrip-${i}`} className="selection-row">
            <label>{t('common.cantrip')} {i + 1}:</label>
            <select 
              value={selections[`cantrip_${i}`] || ""}
              onChange={(e) => handleChange('cantrip', i, e.target.value)}
              className="panel-select"
            >
              <option value="" disabled>{t('common.choose')}</option>
              {availableCantrips.map(spell => (
                <option key={spell.key} value={spell.key}>
                  {spell.name}
                </option>
              ))}
            </select>
          </div>
        ))}

        {/* Level 1 Zauber Auswahl */}
        {Array.from({ length: spellCount }).map((_, i) => (
          <div key={`spell-${i}`} className="selection-row">
            <label>{t('common.level1Spell')} {i + 1}:</label>
            <select 
              value={selections[`spell_${i}`] || ""}
              onChange={(e) => handleChange('spell', i, e.target.value)}
              className="panel-select"
            >
              <option value="" disabled>{t('common.choose')}</option>
              {availableSpells.map(spell => (
                <option key={spell.key} value={spell.key}>
                  {spell.name}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    );
  }

  // --- LOGIK FÜR "SKILLED" (Geübt) ---
  // Hier könnte man später Skill-Dropdowns einfügen. 
  // Für jetzt zeigen wir nur einen Platzhalter, falls es kein Magic Initiate ist.
  
  return (
    <div className="feat-selection-info">
      {/* Falls das Talent keine aktive Auswahl erfordert (z.B. "Tough"), wird nichts angezeigt */}
      {feat.mechanics?.type === 'hp_bonus_per_level' && (
         <p className="small-text text-muted">Passiver Bonus: +2 HP pro Level (wird automatisch angewendet).</p>
      )}
      {feat.mechanics?.type === 'initiative_bonus' && (
         <p className="small-text text-muted">Passiver Bonus: Initiative erhöht (wird automatisch angewendet).</p>
      )}
    </div>
  );
};