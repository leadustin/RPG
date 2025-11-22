// src/components/character_sheet/AbilitiesTab.jsx
import React, { useMemo } from 'react';
import './AbilitiesTab.css';
import Tooltip from '../tooltip/Tooltip';
import allClassData from '../../data/classes.json';
import featuresData from '../../data/features.json';

// --- ICONS LADEN ---
// 1. Waffenmeisterschaften
const masteryModules = import.meta.glob('../../assets/images/weaponmasteries/*.png', { eager: true });
const masteryIcons = {};
for (const path in masteryModules) {
  // Dateiname z.B. "Langschwert.png" -> Key: "Langschwert"
  const fileName = path.split('/').pop().replace('.png', '');
  masteryIcons[fileName] = masteryModules[path].default;
}

// 2. Klassen-Icons (für Features)
const classModules = import.meta.glob('../../assets/images/classes/*.png', { eager: true });
const classIcons = {};
for (const path in classModules) {
  const fileName = path.split('/').pop();
  classIcons[fileName] = classModules[path].default;
}

// 3. Generische Icons (Fallback)
const genericModules = import.meta.glob('../../assets/images/icons/*.(png|webp)', { eager: true });
const genericIcons = {};
for (const path in genericModules) {
  const fileName = path.split('/').pop();
  genericIcons[fileName] = genericModules[path].default;
}

// --- TOOLTIP CONTENT ---
const AbilityTooltipContent = ({ title, type, subtitle, description }) => (
  <div className="ability-tooltip-content">
    <div className="ability-tooltip-header">
      <span className="ability-tooltip-name">{title}</span>
      <span className="ability-tooltip-type">{type}</span>
    </div>
    {subtitle && <div className="ability-tooltip-meta">{subtitle}</div>}
    <div className="ability-tooltip-description">
      {description}
    </div>
  </div>
);

const AbilitiesTab = ({ character }) => {
  
  // 1. Waffenmeisterschaften sammeln
  const masteries = useMemo(() => {
    return (character.weapon_mastery_choices || []).map(weaponName => ({
      name: weaponName,
      type: 'mastery',
      icon: masteryIcons[weaponName] || genericIcons['placeholder_weapon.webp'], 
      description: `Du beherrschst die Meisterschaftseigenschaft für ${weaponName}.`
    }));
  }, [character]);

  // 2. Klassen-Features sammeln
  const classFeatures = useMemo(() => {
    if (!character.features) return [];
    
    // Hole das Klassen-Icon für visuelles Feedback
    const charClass = allClassData.find(c => c.key === character.class?.key);
    const iconSrc = charClass && classIcons[charClass.icon] 
        ? classIcons[charClass.icon] 
        : genericIcons['skill_placeholder.png'];

    return character.features.map(feat => ({
      ...feat,
      type: 'feature',
      icon: iconSrc, // Nutze Klassen-Icon für alle Klassenfeatures (oder spezifische wenn vorhanden)
      source: `Stufe ${feat.level}`
    })).sort((a, b) => a.level - b.level);
  }, [character]);

  // 3. Talente (Feats) sammeln
  const feats = useMemo(() => {
    if (!character.feats) return [];
    return character.feats.map(featKey => {
      const featData = featuresData.find(f => f.key === featKey);
      if (!featData) return null;
      return {
        ...featData,
        type: 'feat',
        icon: genericIcons['skill_placeholder.png'], // TODO: Spezifische Feat-Icons
        source: 'Talent'
      };
    }).filter(Boolean);
  }, [character]);

  // --- RENDER HELPER (Karte) ---
  const renderAbilityCard = (item, index) => {
    // Unterscheidung Typ für Label
    let typeLabel = "Merkmal";
    if (item.type === 'mastery') typeLabel = "Waffenkunst";
    if (item.type === 'feat') typeLabel = "Talent";

    return (
      <Tooltip 
        key={`${item.type}-${index}`}
        content={
          <AbilityTooltipContent 
            title={item.name} 
            type={typeLabel}
            subtitle={item.source}
            description={item.description}
          />
        }
      >
        <div className="ability-icon-card">
            <div className="ability-icon-frame">
                <img src={item.icon || genericIcons['skill_placeholder.png']} alt={item.name} />
            </div>
        </div>
      </Tooltip>
    );
  };

  // --- RESSOURCEN ANZEIGE (Wut, Ki, etc.) ---
  const renderResources = () => {
    const classKey = character.class?.key;
    // Beispiel: Barbar
    if (classKey === 'barbarian') {
        return (
            <div className="resource-bar">
                <span className="resource-label">Kampfrausch:</span>
                <div className="resource-pills">
                    {[...Array(2)].map((_, i) => <span key={i} className="pill filled" />)} {/* Mockup */}
                    <span className="pill empty" />
                </div>
            </div>
        );
    }
    // Beispiel: Mönch
    if (classKey === 'monk') {
        return (
            <div className="resource-bar">
                <span className="resource-label">Ki-Punkte:</span>
                <span className="resource-value">{character.level} / {character.level}</span>
            </div>
        );
    }
    return null;
  };

  return (
    <div className="abilities-tab">
      
      {/* HEADER MIT RESSOURCEN */}
      {(character.class?.key === 'barbarian' || character.class?.key === 'monk' || character.class?.key === 'fighter') && (
          <div className="abilities-controls">
            {renderResources()}
          </div>
      )}

      <div className="ability-grid-container">
        
        {/* GRUPPE 1: WAFFENMEISTERSCHAFTEN */}
        {masteries.length > 0 && (
            <div className="ability-section">
                <h3 className="section-header">
                    Waffenmeisterschaften
                    <span className="count-badge">{masteries.length}</span>
                </h3>
                <div className="ability-grid">
                    {masteries.map((m, i) => renderAbilityCard(m, i))}
                </div>
            </div>
        )}

        {/* GRUPPE 2: TALENTE */}
        {feats.length > 0 && (
            <div className="ability-section">
                <h3 className="section-header">
                    Talente
                    <span className="count-badge">{feats.length}</span>
                </h3>
                <div className="ability-grid">
                    {feats.map((f, i) => renderAbilityCard(f, i))}
                </div>
            </div>
        )}

        {/* GRUPPE 3: KLASSENMERKMALE */}
        {classFeatures.length > 0 && (
            <div className="ability-section">
                <h3 className="section-header">
                    Klassenmerkmale
                    <span className="count-badge">{classFeatures.length}</span>
                </h3>
                <div className="ability-grid">
                    {classFeatures.map((f, i) => renderAbilityCard(f, i))}
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default AbilitiesTab;