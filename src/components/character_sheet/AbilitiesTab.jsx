// src/components/character_sheet/AbilitiesTab.jsx
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import './AbilitiesTab.css';
import Tooltip from '../tooltip/Tooltip';
import allClassData from '../../data/classes.json';
import featuresData from '../../data/features.json';
import skillDetails from '../../data/skillDetails.json';
import { isProficientInSkill } from '../../engine/characterEngine';

// --- ICONS LADEN ---
const masteryModules = import.meta.glob('../../assets/images/weaponmasteries/*.png', { eager: true });
const masteryIcons = {};
for (const path in masteryModules) {
  const fileName = path.split('/').pop().replace('.png', '');
  masteryIcons[fileName] = masteryModules[path].default;
}

const classModules = import.meta.glob('../../assets/images/classes/*.png', { eager: true });
const classIcons = {};
for (const path in classModules) {
  const fileName = path.split('/').pop();
  classIcons[fileName] = classModules[path].default;
}

const skillModules = import.meta.glob('../../assets/images/skills/*.png', { eager: true });
const skillIcons = {};
for (const path in skillModules) {
  const fileName = path.split('/').pop().replace('.png', '');
  skillIcons[fileName] = skillModules[path].default;
}

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
  const { t } = useTranslation();

  // 1. Waffenmeisterschaften
  const masteries = useMemo(() => {
    return (character.weapon_mastery_choices || []).map(weaponName => ({
      name: weaponName,
      type: 'mastery',
      icon: masteryIcons[weaponName] || genericIcons['placeholder_weapon.webp'], 
      description: `Du beherrschst die Meisterschaftseigenschaft für ${weaponName}.`
    }));
  }, [character]);

  // 2. Klassen-Features (mit Lookup)
  const classFeatures = useMemo(() => {
    if (!character.features) return [];
    
    const charClass = allClassData.find(c => c.key === character.class?.key);
    const iconSrc = charClass && classIcons[charClass.icon] 
        ? classIcons[charClass.icon] 
        : genericIcons['skill_placeholder.png'];

    const findFeatureData = (featIdentifier) => {
        let found = charClass?.features?.find(f => (f.key === featIdentifier || f.name === featIdentifier));
        if (!found && character.subclassKey && charClass?.subclasses) {
            const subclass = charClass.subclasses.find(sc => sc.key === character.subclassKey);
            found = subclass?.features?.find(f => (f.key === featIdentifier || f.name === featIdentifier));
        }
        if (!found) {
            found = featuresData.find(f => (f.key === featIdentifier || f.name === featIdentifier));
        }
        return found;
    };

    return character.features
        .map(featIdentifier => {
            const featureData = findFeatureData(featIdentifier);
            if (!featureData) return null;
            return {
                ...featureData, 
                type: 'feature',
                icon: iconSrc, 
                source: `Stufe ${featureData.level || '?'}`
            };
        })
        .filter(Boolean)
        .sort((a, b) => (a.level || 0) - (b.level || 0));
  }, [character]);

  // 3. Talente
  const feats = useMemo(() => {
    const allFeatKeys = [...(character.feats || [])];
    if (character.background?.feat && !allFeatKeys.includes(character.background.feat)) {
        allFeatKeys.push(character.background.feat);
    }
    return allFeatKeys.map(featKey => {
      const featData = featuresData.find(f => f.key === featKey);
      if (!featData) return null;
      return {
        ...featData,
        type: 'feat',
        icon: genericIcons['skill_placeholder.png'], 
        source: 'Talent'
      };
    }).filter(Boolean);
  }, [character]);

  // 4. Fertigkeiten
  const skills = useMemo(() => {
    const learnedSkills = [];
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

  const renderResources = () => {
    const classKey = character.class?.key;
    if (classKey === 'barbarian') {
        const barbarianData = allClassData.find(c => c.key === 'barbarian');
        let maxRages = 2;
        if (barbarianData?.rage_progression) {
            const prog = barbarianData.rage_progression.find(p => p.level === character.level);
            if (prog) maxRages = prog.uses === "∞" ? 99 : prog.uses;
        }
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
    // Weitere Klassenlogik hier (Monk, Fighter etc.)
    if (classKey === 'monk') {
      return <div className="resource-bar"><span className="resource-label">Ki:</span><span className="resource-value">{character.level}/{character.level}</span></div>;
    }
    if (classKey === 'fighter') {
      return <div className="resource-bar"><span className="resource-label">Tatendrang:</span><div className="resource-pills"><span className="pill filled" /></div></div>;
    }
    return null;
  };

  return (
    <div className="abilities-tab">
        {/* HEADER (Controls & Resources) - geht über die volle Breite */}
        <div className="abilities-header">
             <div className="abilities-controls">
                {/* Platzhalter für Filter/Suche */}
             </div>
             <div className="abilities-resources">
                {renderResources()}
             </div>
        </div>

        {/* HAUPT LAYOUT (2-Spalten Grid) */}
        <div className="abilities-content-wrapper">
            
            {/* LINKE SPALTE: Inhalte */}
            <div className="abilities-main-column">
                
                {masteries.length > 0 && (
                    <div className="ability-section">
                        <h3 className="section-header">Waffenmeisterschaften <span className="count-badge">{masteries.length}</span></h3>
                        <div className="ability-grid">
                            {masteries.map((m, i) => renderAbilityCard(m, i))}
                        </div>
                    </div>
                )}

                {skills.length > 0 && (
                    <div className="ability-section">
                        <h3 className="section-header">Fertigkeiten <span className="count-badge">{skills.length}</span></h3>
                        <div className="ability-grid">
                            {skills.map((s, i) => renderAbilityCard(s, i))}
                        </div>
                    </div>
                )}

                {feats.length > 0 && (
                    <div className="ability-section">
                        <h3 className="section-header">Talente <span className="count-badge">{feats.length}</span></h3>
                        <div className="ability-grid">
                            {feats.map((f, i) => renderAbilityCard(f, i))}
                        </div>
                    </div>
                )}

                {classFeatures.length > 0 && (
                    <div className="ability-section">
                        <h3 className="section-header">Klassenmerkmale <span className="count-badge">{classFeatures.length}</span></h3>
                        <div className="ability-grid">
                            {classFeatures.map((f, i) => renderAbilityCard(f, i))}
                        </div>
                    </div>
                )}
            </div>

            {/* RECHTE SPALTE: Sideboard / Platzhalter */}
            <div className="abilities-side-column">
                <div className="side-panel-placeholder">
                    <span style={{opacity: 0.5}}>Details / Info</span>
                </div>
            </div>

        </div>
    </div>
  );
};

export default AbilitiesTab;