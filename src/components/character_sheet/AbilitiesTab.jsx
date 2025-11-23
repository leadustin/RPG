// src/components/character_sheet/AbilitiesTab.jsx
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next'; // Falls du i18n nutzt, sonst optional
import './AbilitiesTab.css';
import Tooltip from '../tooltip/Tooltip';
import allClassData from '../../data/classes.json';
import featuresData from '../../data/features.json';
import skillDetails from '../../data/skillDetails.json';
import { isProficientInSkill } from '../../engine/characterEngine';

// --- ICONS LADEN ---
// 1. Waffenmeisterschaften
const masteryModules = import.meta.glob('../../assets/images/weaponmasteries/*.png', { eager: true });
const masteryIcons = {};
for (const path in masteryModules) {
  const fileName = path.split('/').pop().replace('.png', '');
  masteryIcons[fileName] = masteryModules[path].default;
}

// 2. Klassen-Icons
const classModules = import.meta.glob('../../assets/images/classes/*.png', { eager: true });
const classIcons = {};
for (const path in classModules) {
  const fileName = path.split('/').pop();
  classIcons[fileName] = classModules[path].default;
}

// 3. Skill-Icons (NEU)
const skillModules = import.meta.glob('../../assets/images/skills/*.png', { eager: true });
const skillIcons = {};
for (const path in skillModules) {
  // Dateiname z.B. "athletics.png" -> Key: "athletics"
  const fileName = path.split('/').pop().replace('.png', '');
  skillIcons[fileName] = skillModules[path].default;
}

// 4. Generische Icons (Fallback)
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
  const { t } = useTranslation(); // Optional, falls Texte übersetzt werden sollen

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
    
    const charClass = allClassData.find(c => c.key === character.class?.key);
    const iconSrc = charClass && classIcons[charClass.icon] 
        ? classIcons[charClass.icon] 
        : genericIcons['skill_placeholder.png'];

    return character.features.map(feat => ({
      ...feat,
      type: 'feature',
      icon: iconSrc, 
      source: `Stufe ${feat.level}`
    })).sort((a, b) => a.level - b.level);
  }, [character]);

  // 3. Talente (Feats) sammeln - INKLUSIVE HINTERGRUND
  const feats = useMemo(() => {
    // Liste aller Feat-Keys (Level-Up + Background)
    const allFeatKeys = [...(character.feats || [])];
    
    // Prüfen ob Background ein Feat hat und ob es noch nicht in der Liste ist
    if (character.background?.feat && !allFeatKeys.includes(character.background.feat)) {
        allFeatKeys.push(character.background.feat);
    }

    return allFeatKeys.map(featKey => {
      const featData = featuresData.find(f => f.key === featKey);
      if (!featData) return null;
      return {
        ...featData,
        type: 'feat',
        icon: genericIcons['skill_placeholder.png'], // TODO: Feat Icons
        source: 'Talent'
      };
    }).filter(Boolean);
  }, [character]);

  // 4. Fertigkeiten (Skills) sammeln - NEU
  const skills = useMemo(() => {
    const learnedSkills = [];
    // Iteriere über alle möglichen Skills und prüfe Proficiency
    Object.keys(skillDetails).forEach(skillKey => {
        if (isProficientInSkill(character, skillKey)) {
            learnedSkills.push({
                name: skillDetails[skillKey].name,
                key: skillKey,
                type: 'skill',
                icon: skillIcons[skillKey] || genericIcons['skill_placeholder.png'],
                description: skillDetails[skillKey].description,
                source: 'Geübt'
            });
        }
    });
    return learnedSkills.sort((a, b) => a.name.localeCompare(b.name));
  }, [character]);


  // --- RENDER HELPER (Karte) ---
  const renderAbilityCard = (item, index) => {
    let typeLabel = "Merkmal";
    if (item.type === 'mastery') typeLabel = "Waffenkunst";
    if (item.type === 'feat') typeLabel = "Talent";
    if (item.type === 'skill') typeLabel = "Fertigkeit";

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
            <div className="ability-card-name">{item.name}</div>
        </div>
      </Tooltip>
    );
  };

  // --- RESSOURCEN ANZEIGE ---
  const renderResources = () => {
    const classKey = character.class?.key;
    if (classKey === 'barbarian') {
        // TODO: Aktuelle Wut aus Character State holen (falls vorhanden)
        // Default Logik: 2 bei Lv1-2, 3 bei Lv3-5 etc. (vereinfacht)
        // Hier nutzen wir 'rage_progression' aus classes.json wenn möglich, oder Hardcode fallback
        
        // Finde Barbaren Daten für Progression
        const barbarianData = allClassData.find(c => c.key === 'barbarian');
        let maxRages = 2;
        if (barbarianData?.rage_progression) {
            const prog = barbarianData.rage_progression.find(p => p.level === character.level);
            if (prog) maxRages = prog.uses === "∞" ? 99 : prog.uses;
        }

        // Dummy State: Wir gehen davon aus, dass alle da sind, solange wir kein Tracking haben
        const currentRages = character.resources?.rage || maxRages; 

        return (
            <div className="resource-bar">
                <span className="resource-label">Kampfrausch:</span>
                <div className="resource-pills">
                    {[...Array(maxRages)].map((_, i) => (
                        <span key={i} className={`pill ${i < currentRages ? 'filled' : 'empty'}`} />
                    ))}
                </div>
            </div>
        );
    }
    if (classKey === 'monk') {
        return (
            <div className="resource-bar">
                <span className="resource-label">Ki-Punkte:</span>
                <span className="resource-value">{character.level} / {character.level}</span>
            </div>
        );
    }
    if (classKey === 'fighter') {
         return (
            <div className="resource-bar">
                <span className="resource-label">Tatendrang:</span>
                <div className="resource-pills">
                     <span className="pill filled" /> {/* Fighter hat meist nur 1, ab Lv17 2 */}
                </div>
            </div>
        );
    }
    return null;
  };

  return (
    <div className="abilities-tab">
      
      {/* HEADER MIT RESSOURCEN */}
      <div className="abilities-controls">
         {/* Platzhalter links, falls wir Filter wollen */}
         <div className="abilities-filter-placeholder"></div>
         
         {/* Ressourcen mittig/rechts */}
         {renderResources()}
      </div>

      <div className="ability-grid-container">
        
        {/* 1. WAFFENMEISTERSCHAFTEN */}
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

        {/* 2. FERTIGKEITEN (NEU) */}
        {skills.length > 0 && (
            <div className="ability-section">
                <h3 className="section-header">
                    Fertigkeiten
                    <span className="count-badge">{skills.length}</span>
                </h3>
                <div className="ability-grid">
                    {skills.map((s, i) => renderAbilityCard(s, i))}
                </div>
            </div>
        )}

        {/* 3. TALENTE (INKL. BACKGROUND) */}
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

        {/* 4. KLASSENMERKMALE */}
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