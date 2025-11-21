import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import './SpellbookTab.css';
import spellsEngine from '../../engine/spellsEngine';
import { getFeatSpells } from '../../engine/rulesEngine';
import Tooltip from '../tooltip/Tooltip';

// --- ICONS LADEN ---
const iconModules = import.meta.glob('../../assets/images/icons/*.(png|webp|jpg|svg)', { eager: true });
const spellIcons = {};
for (const path in iconModules) {
  const fileName = path.split('/').pop();
  spellIcons[fileName] = iconModules[path].default;
}

// --- TOOLTIP CONTENT KOMPONENTE ---
const SpellTooltipContent = ({ spell, t }) => (
  <div className="spell-tooltip-content">
    <div className="spell-tooltip-header">
      <span className="spell-tooltip-name">{spell.name}</span>
      <span className="spell-tooltip-school">{t(`magicSchools.${spell.school}`, spell.school)}</span>
    </div>
    
    <div className="spell-tooltip-meta-grid">
      <div className="meta-item">
        <span className="label">Zeit:</span>
        <span className="value">{spell.ui_casting_time || spell.casting_time}</span>
      </div>
      <div className="meta-item">
        <span className="label">RW:</span>
        <span className="value">{spell.ui_range || spell.range}</span>
      </div>
      <div className="meta-item">
        <span className="label">Dauer:</span>
        <span className="value">{spell.ui_duration || spell.duration}</span>
      </div>
      <div className="meta-item">
        <span className="label">Komp:</span>
        <span className="value">{spell.components?.join(', ')}</span>
      </div>
    </div>

    <div className="spell-tooltip-description">
      {spell.ui_description || spell.description}
    </div>

    {spell.ui_scaling && (
      <div className="spell-tooltip-scaling">
        <strong>Auf höheren Graden:</strong> {spell.ui_scaling}
      </div>
    )}
    
    <div className="spell-tooltip-footer">
      {spell.level === 0 ? t('common.cantrip') : `${t('common.level')} ${spell.level}`}
      {spell.ritual && <span className="tag ritual">Ritual</span>}
      {(spell.duration || "").toLowerCase().includes("konz") && <span className="tag concentration">Konz.</span>}
    </div>
  </div>
);

const SpellbookTab = ({ character, onUpdateCharacter }) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");

  // 1. Slots berechnen
  const spellSlots = useMemo(() => {
    if (!character?.class?.spellcasting?.spell_slots_by_level) return [];
    const levelIndex = (character.level || 1) - 1;
    return character.class.spellcasting.spell_slots_by_level[levelIndex] || [];
  }, [character]);

  // 2. Alle Zauber sammeln
  const allCharacterSpells = useMemo(() => {
    if (!character) return [];

    const uniqueSpells = new Map();

    // Helper
    const add = (key, source, prepared = false) => {
      if (!key) return;
      const data = spellsEngine.getSpell(key);
      if (data && !uniqueSpells.has(key)) {
        uniqueSpells.set(key, { ...data, source, prepared });
      } else if (data && uniqueSpells.has(key) && prepared) {
        // Wenn er schon da ist, aber jetzt prepared status hat, update
        const existing = uniqueSpells.get(key);
        uniqueSpells.set(key, { ...existing, prepared: true });
      }
    };

    // A. Zauberbuch (Wizard) oder Bekannt (Sorcerer/Bard)
    // Wir gehen davon aus, dass `character.spells_prepared` eine Liste von Keys ist
    const preparedSet = new Set(character.spells_prepared || []);

    (character.spellbook || []).forEach(k => add(k, 'spellbook', preparedSet.has(k)));
    (character.spells_known || []).forEach(k => add(k, 'known', true)); // Bekannte sind immer "bereit"
    (character.cantrips_known || []).forEach(k => add(k, 'cantrip', true));

    // B. Talente
    const featSpells = getFeatSpells(character);
    (featSpells.cantrips || []).forEach(k => add(k, 'feat', true));
    (featSpells.level1 || []).forEach(k => add(k, 'feat', true));

    return Array.from(uniqueSpells.values());
  }, [character]);

  // 3. Filtern und Gruppieren
  const filteredAndGroupedSpells = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    
    const filtered = allCharacterSpells.filter(spell => {
      return (
        spell.name.toLowerCase().includes(lowerSearch) ||
        (spell.ui_description || "").toLowerCase().includes(lowerSearch) ||
        spell.school.toLowerCase().includes(lowerSearch)
      );
    });

    const grouped = {};
    filtered.forEach(spell => {
      if (!grouped[spell.level]) grouped[spell.level] = [];
      grouped[spell.level].push(spell);
    });

    return grouped;
  }, [allCharacterSpells, searchTerm]);

  // --- ACTIONS ---

  const togglePrepareSpell = (spell) => {
    // Cantrips und 'Known' Zauber (Sorcerer) müssen meist nicht vorbereitet werden.
    // Wir erlauben das Umschalten nur für Zauberbuch-Zauber oder wenn Logik dies verlangt.
    if (spell.source === 'known' || spell.source === 'feat' || spell.level === 0) return;

    // Hier müssten wir den Character state updaten. 
    // Da ich keinen direkten Setter habe, simuliere ich das Log:
    console.log(`Toggling preparation for: ${spell.name}`);
    
    if (onUpdateCharacter) {
        const currentPrepared = character.spells_prepared || [];
        let newPrepared;
        if (currentPrepared.includes(spell.key)) {
            newPrepared = currentPrepared.filter(k => k !== spell.key);
        } else {
            newPrepared = [...currentPrepared, spell.key];
        }
        // Update des Charakters auslösen
        onUpdateCharacter({ ...character, spells_prepared: newPrepared });
    }
  };

  // --- RENDER HELPER ---
  const renderSpellIcon = (spell) => {
    const iconSrc = spellIcons[spell.icon] || spellIcons['skill_placeholder.png'];
    
    // Prüfen ob vorbereitet oder immer verfügbar (Cantrips/Known)
    const isAlwaysPrepared = spell.level === 0 || spell.source === 'known' || spell.source === 'feat';
    const isPrepared = spell.prepared || isAlwaysPrepared;
    
    // Visueller Status
    const statusClass = isPrepared ? 'prepared' : 'unprepared';
    const clickAction = isAlwaysPrepared ? null : () => togglePrepareSpell(spell);

    return (
      <Tooltip 
        key={spell.key} 
        content={<SpellTooltipContent spell={spell} t={t} />}
      >
        <div 
            className={`spell-icon-card ${statusClass} ${isAlwaysPrepared ? 'fixed' : 'toggleable'}`}
            onClick={clickAction}
        >
            <div className="spell-icon-frame">
                <img src={iconSrc} alt={spell.name} />
                {/* Kleines Badge für Konzentration oder Ritual */}
                <div className="spell-card-badges">
                    {spell.ritual && <span className="badge-icon">R</span>}
                    {(spell.duration||"").includes("Kon") && <span className="badge-icon">C</span>}
                </div>
            </div>
            <div className="spell-card-name">{spell.name}</div>
        </div>
      </Tooltip>
    );
  };

  return (
    <div className="spellbook-tab">
      {/* OBERE LEISTE: Suche & Slots */}
      <div className="spellbook-controls">
        <div className="search-wrapper">
            <input 
                type="text" 
                placeholder="Zauber suchen..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="spell-search-input"
            />
            {searchTerm && (
                <button className="clear-search" onClick={() => setSearchTerm("")}>✕</button>
            )}
        </div>

        {spellSlots.length > 0 && (
            <div className="spell-slots-display">
                {spellSlots.map((count, i) => count > 0 && (
                    <div key={i} className="slot-pill" title={`Grad ${i + 1} Slots`}>
                        <span className="lvl">{i + 1}</span>
                        <span className="amt">{count}</span>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* SCROLLBEREICH: Grid */}
      <div className="spell-grid-container">
        {Object.keys(filteredAndGroupedSpells).length === 0 ? (
            <div className="empty-state">Keine Zauber gefunden.</div>
        ) : (
            Object.keys(filteredAndGroupedSpells)
                .sort((a, b) => parseInt(a) - parseInt(b))
                .map(level => (
                <div key={level} className="spell-level-section">
                    <h3 className="level-header">
                        {level === "0" ? t('common.cantrips') : `${t('common.level')} ${level}`}
                        <span className="spell-count-badge">{filteredAndGroupedSpells[level].length}</span>
                    </h3>
                    <div className="spell-grid">
                        {filteredAndGroupedSpells[level].map(renderSpellIcon)}
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
};

export default SpellbookTab;