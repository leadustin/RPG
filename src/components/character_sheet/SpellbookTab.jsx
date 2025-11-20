// src/components/character_sheet/SpellbookTab.jsx
import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import './SpellbookTab.css';
import spellsEngine from '../../engine/spellsEngine';
import { getFeatSpells } from '../../engine/rulesEngine';

// --- ICONS LADEN ---
const iconModules = import.meta.glob('../../assets/images/icons/*.(png|webp|jpg|svg)', { eager: true });
const spellIcons = {};
for (const path in iconModules) {
  const fileName = path.split('/').pop();
  spellIcons[fileName] = iconModules[path].default;
}

const SpellbookTab = ({ character }) => {
  const { t } = useTranslation();
  const [expandedSpell, setExpandedSpell] = useState(null);

  // 1. Slots berechnen (Generisch für alle Klassen)
  const spellSlots = useMemo(() => {
    if (!character?.class?.spellcasting?.spell_slots_by_level) {
      return [];
    }
    // Level - 1, da Array bei Index 0 beginnt (Level 1 = Index 0)
    const levelIndex = (character.level || 1) - 1;
    return character.class.spellcasting.spell_slots_by_level[levelIndex] || [];
  }, [character]);

  // 2. Alle Zauber sammeln und gruppieren
  const spellsByLevel = useMemo(() => {
    if (!character) return {};

    // A. Zauber aus der Klasse (Zauberbuch, Bekannt, Vorbereitet)
    const classKeys = new Set([
      ...(character.cantrips_known || []),
      ...(character.spells_known || []),
      ...(character.spells_prepared || []),
      ...(character.spellbook || []) // Auch Zauberbuch anzeigen
    ]);

    // B. Zauber aus Talenten (via RulesEngine)
    const featSpells = getFeatSpells(character);
    const featKeys = new Set([
      ...(featSpells.cantrips || []),
      ...(featSpells.level1 || [])
    ]);

    const grouped = {};

    // Helper zum Hinzufügen
    const addSpell = (key, isFeat) => {
      const spell = spellsEngine.getSpell(key);
      if (!spell) return;

      const level = spell.level;
      if (!grouped[level]) grouped[level] = [];

      // Vermeide Duplikate in der Anzeige
      if (!grouped[level].some(s => s.key === spell.key)) {
        grouped[level].push({ ...spell, isFeat });
      }
    };

    classKeys.forEach(k => addSpell(k, false));
    featKeys.forEach(k => addSpell(k, true));

    return grouped;
  }, [character]);


  const toggleSpell = (key) => {
    setExpandedSpell(expandedSpell === key ? null : key);
  };

  // --- RENDER HELPER ---
  const renderSpellRow = (spell) => {
    const iconSrc = spellIcons[spell.icon] || spellIcons['skill_placeholder.png'];
    const isExpanded = expandedSpell === spell.key;

    return (
      <div key={spell.key} className={`spell-row-container ${isExpanded ? 'expanded' : ''}`}>
        {/* Hauptzeile (Klickbar) */}
        <div className="spell-row-header" onClick={() => toggleSpell(spell.key)}>
            <div className="spell-icon-wrapper">
                <img src={iconSrc} alt={spell.name} className="spell-icon-small" />
            </div>
            <div className="spell-info">
                <span className="spell-name">
                    {spell.name} 
                    {spell.isFeat && <span className="feat-badge" title="Durch Talent gewährt"> (T)</span>}
                </span>
                <span className="spell-meta">
                    {spell.casting_time} • {spell.range}
                </span>
            </div>
            <div className="spell-arrow">
                {isExpanded ? '▲' : '▼'}
            </div>
        </div>

        {/* Details (Ausklappbar) */}
        {isExpanded && (
            <div className="spell-row-details">
                <div className="detail-grid">
                    <div><strong>Dauer:</strong> {spell.duration}</div>
                    <div><strong>Komponenten:</strong> {spell.components?.join(', ')}</div>
                    <div><strong>Schule:</strong> {t(`magicSchools.${spell.school}`, spell.school)}</div>
                </div>
                <p className="spell-description">{spell.description}</p>
                {spell.damage && (
                    <div className="spell-damage-tag">
                        Schaden: {spell.damage} ({t(`damageTypes.${spell.damage_type}`, spell.damage_type)})
                    </div>
                )}
            </div>
        )}
      </div>
    );
  };

  // --- UI RENDER ---
  return (
    <div className="spellbook-tab">
      <div className="spellbook-header">
          <h2>Zauberbuch</h2>
          {/* Slot-Anzeige */}
          {spellSlots.length > 0 && (
            <div className="spell-slots-bar">
                {spellSlots.map((count, i) => (
                    count > 0 && (
                        <div key={i} className="slot-badge">
                            <span className="slot-level">Grad {i + 1}</span>
                            <span className="slot-amount">{count}</span>
                        </div>
                    )
                ))}
            </div>
          )}
      </div>

      <div className="spell-list-container">
        {Object.keys(spellsByLevel).length === 0 ? (
            <div className="empty-state">Keine Zauber bekannt.</div>
        ) : (
            // Sortiere Level (0 zuerst)
            Object.keys(spellsByLevel).sort((a, b) => parseInt(a) - parseInt(b)).map(level => (
                <div key={level} className="spell-level-group">
                    <h3 className="level-header">
                        {level === "0" ? t('common.cantrip') : `${t('common.level1Spell').replace('1', level)}`}
                    </h3>
                    <div className="spell-list">
                        {spellsByLevel[level].map(spell => renderSpellRow(spell))}
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
};

export default SpellbookTab;