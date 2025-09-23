import allArmor from '../data/items/armor.json';
/**
 * Berechnet den Modifikator für einen Attributswert.
 */
export const getAbilityModifier = (score) => {
  return Math.floor((score - 10) / 2);
};

/**
 * Gibt den Übungsbonus für ein gegebenes Level zurück.
 */
export const getProficiencyBonus = (level) => {
  if (level < 5) return 2;
  if (level < 9) return 3;
  if (level < 13) return 4;
  return 5;
};

/**
 * Holt den vom Spieler zugewiesenen Attributsbonus für ein Attribut.
 * Unterstützt sowohl fixe als auch floating Boni.
 */
export const getRacialAbilityBonus = (character, abilityKey) => {
  if (!character) return 0;
  
  let totalBonus = 0;
  
  // Fixe Boni (z.B. bei Menschen)
  if (character.ability_bonus_assignments && character.ability_bonus_assignments[abilityKey]) {
    totalBonus += character.ability_bonus_assignments[abilityKey];
  }
  
  // Floating Boni (z.B. bei Halbelfen)
  if (character.race?.ability_bonuses?.floating && character.floating_bonus_assignments) {
    const floatingBonuses = character.race.ability_bonuses.floating;
    const bonusIndex = character.floating_bonus_assignments[abilityKey];
    
    if (bonusIndex !== undefined && floatingBonuses[bonusIndex] !== undefined) {
      totalBonus += floatingBonuses[bonusIndex];
    }
  }
  
  return totalBonus;
};

/**
 * Berechnet die maximalen Lebenspunkte auf Stufe 1.
 */
export const calculateInitialHP = (character) => {
  if (!character.class || !character.race) return 0;
  
  const finalCon = character.abilities.con + getRacialAbilityBonus(character, 'con');
  const conModifier = getAbilityModifier(finalCon);
  let hp = character.class.hit_die + conModifier;

  if (character.subrace?.key === 'hill-dwarf') {
    hp += 1;
  }
  return hp;
};

/**
 * Berechnet die Rüstungsklasse (AC) nach 5e-Regeln.
 * Berücksichtigt angelegte Rüstung, Schilde und Klassen-Features.
 * @param {object} character - Das zentrale Charakter-Objekt.
 * @returns {number} - Die finale Rüstungsklasse.
 */
export const calculateAC = (character) => {
  if (!character || !character.abilities || !character.class) {
    return 10; // Fallback
  }

  // 1. FINALE ATTRIBUT-MODIFIKATOREN BERECHNEN
  const finalDex = character.abilities.dex + getRacialAbilityBonus(character, 'dex');
  const dexModifier = getAbilityModifier(finalDex);

  // 2. AUSGERÜSTETE ITEMS IDENTIFIZIEREN
  const equippedArmorData = character.equipment?.chest ? allArmor.find(a => a.key === character.equipment.chest) : null;
  const equippedShieldData = character.equipment?.off_hand ? allArmor.find(a => a.key === character.equipment.off_hand && a.type === 'shield') : null;

  let baseAC = 10;
  let armorDexBonus = dexModifier; // Standardmäßig wird der volle DEX-Bonus angewendet

  // 3. AC BASIEREND AUF GERTRAGENER RÜSTUNG BERECHNEN
  if (equippedArmorData) {
    baseAC = equippedArmorData.ac;
    
    switch (equippedArmorData.type) {
      case 'light_armor':
        // Leichte Rüstung: Voller DEX-Bonus
        armorDexBonus = dexModifier;
        break;
      case 'medium_armor':
        // Mittlere Rüstung: DEX-Bonus bis maximal +2
        armorDexBonus = Math.min(dexModifier, 2);
        break;
      case 'heavy_armor':
        // Schwere Rüstung: Kein DEX-Bonus
        armorDexBonus = 0;
        break;
      default:
        // Wenn das Item keine Rüstung ist (z.B. Kleidung)
        armorDexBonus = dexModifier;
        baseAC = 10;
    }
  } 
  // 4. SONDERFÄLLE FÜR UNGEPANZERTE VERTEIDIGUNG PRÜFEN
  else { 
    let unarmoredDefenseAC = 0;
    if (character.class.key === 'barbarian') {
      const finalCon = character.abilities.con + getRacialAbilityBonus(character, 'con');
      const conModifier = getAbilityModifier(finalCon);
      unarmoredDefenseAC = 10 + dexModifier + conModifier;
    } else if (character.class.key === 'monk' && !equippedShieldData) { // Mönche verlieren den Bonus mit Schild
      const finalWis = character.abilities.wis + getRacialAbilityBonus(character, 'wis');
      const wisModifier = getAbilityModifier(finalWis);
      unarmoredDefenseAC = 10 + dexModifier + wisModifier;
    }
    
    // Wähle den HÖHEREN Wert zwischen normaler AC und der Spezialfähigkeit
    return Math.max(10 + dexModifier, unarmoredDefenseAC) + (equippedShieldData ? 2 : 0);
  }

  // 5. FINALE BERECHNUNG: Basis-AC + Rüstungs-DEX-Bonus + Schild
  const shieldBonus = equippedShieldData ? 2 : 0;
  return baseAC + armorDexBonus + shieldBonus;
};

// Eine Zuordnung aller Fertigkeiten zu ihren Hauptattributen
export const SKILL_MAP = {
  acrobatics: 'dex',
  animal_handling: 'wis',
  arcana: 'int',
  athletics: 'str',
  deception: 'cha',
  history: 'int',
  insight: 'wis',
  intimidation: 'cha',
  investigation: 'int',
  medicine: 'wis',
  nature: 'int',
  perception: 'wis',
  performance: 'cha',
  persuasion: 'cha',
  religion: 'int',
  sleight_of_hand: 'dex',
  stealth: 'dex',
  survival: 'wis'
};

// Deutsche Namen für die Anzeige
export const SKILL_NAMES_DE = {
  acrobatics: "Akrobatik",
  animal_handling: "Tierkunde",
  arcana: "Arkanum",
  athletics: "Athletik",
  deception: "Täuschung",
  history: "Geschichte",
  insight: "Einblick",
  intimidation: "Einschüchtern",
  investigation: "Nachforschungen",
  medicine: "Medizin",
  nature: "Naturkunde",
  perception: "Wahrnehmung",
  performance: "Darbietung",
  persuasion: "Überzeugen",
  religion: "Religion",
  sleight_of_hand: "Fingerfertigkeit",
  stealth: "Heimlichkeit",
  survival: "Überlebenskunst"
};

/**
 * Prüft, ob ein Charakter in einer Fertigkeit geübt ist.
 * @param {object} character - Das zentrale Charakter-Objekt.
 * @param {string} skillKey - Der Schlüssel der Fertigkeit (z.B. 'stealth').
 * @returns {boolean} - True, wenn geübt, sonst false.
 */
export const isProficientInSkill = (character, skillKey) => {
  const { race, class: charClass, background, skill_proficiencies_choice } = character;
  
  // 1. Übung durch Hintergrund
  if (background.skill_proficiencies.map(s => s.toLowerCase()).includes(SKILL_NAMES_DE[skillKey].toLowerCase())) {
    return true;
  }
  // 2. Übung durch Volk (z.B. Elfen in Wahrnehmung)
  if (race.traits.some(trait => trait.name === "Geschärfte Sinne" && skillKey === 'perception')) {
    return true;
  }
  // 3. Übung durch die Klassen-Auswahl
  if (skill_proficiencies_choice && skill_proficiencies_choice.includes(skillKey)) {
    return true;
  }

  return false;
};

/**
 * Berechnet den finalen Bonus für eine bestimmte Fertigkeit.
 * @param {object} character - Das zentrale Charakter-Objekt.
 * @param {string} skillKey - Der Schlüssel der Fertigkeit.
 * @returns {number} - Der finale Bonus.
 */
export const calculateSkillBonus = (character, skillKey) => {
  const abilityKey = SKILL_MAP[skillKey];
  const finalAbilityScore = character.abilities[abilityKey] + getRacialAbilityBonus(character, abilityKey);
  const modifier = getAbilityModifier(finalAbilityScore);
  
  if (isProficientInSkill(character, skillKey)) {
    return modifier + getProficiencyBonus(1); // Annahme: Level 1
  }
  
  return modifier;
};

/**
 * Berechnet den Nahkampfschaden basierend auf der Waffe und den Attributen.
 */
export const calculateMeleeDamage = (character) => {
  // Stärke-Modifikator berechnen
  const strModifier = getAbilityModifier(character.stats.abilities.str);
  
  // Prüfen, ob eine Waffe in der Haupthand ausgerüstet ist
  const mainHandWeapon = character.equipment['main-hand'];

  if (mainHandWeapon && mainHandWeapon.damage) {
    // Wenn eine Waffe mit Schadenswert vorhanden ist
    let damage = mainHandWeapon.damage;
    const versatileProperty = mainHandWeapon.properties?.find(p => p.startsWith("Vielseitig"));

    // Prüfen, ob die Waffe vielseitig ist und beidhändig geführt wird
    if (versatileProperty && mainHandWeapon.isTwoHanded) {
      const twoHandedDamage = versatileProperty.match(/\((.*?)\)/)?.[1];
      if (twoHandedDamage) {
        damage = twoHandedDamage;
      }
    }

    const modifierString = strModifier >= 0 ? `+${strModifier}` : strModifier.toString();
    return `${damage} ${modifierString}`;
  } else {
    // Standard für waffenlosen Schlag (1 + Stärke-Modifikator)
    const unarmedDamage = 1 + strModifier;
    return unarmedDamage.toString();
  }
};

// Deutsche Beschreibungen für die Hauptattribute
export const ABILITY_DESCRIPTIONS_DE = {
  str: "Stärke: Misst die körperliche Kraft. Wichtig für Nahkampfangriffe und Athletik.",
  dex: "Geschicklichkeit: Misst die Agilität, Reflexe und Balance. Wichtig für Rüstungsklasse, Fernkampfangriffe und Akrobatik.",
  con: "Konstitution: Misst die Ausdauer und Lebenskraft. Bestimmt die Trefferpunkte und Widerstandsfähigkeit.",
  int: "Intelligenz: Misst die geistige Schärfe, Gedächtnis und logisches Denken. Wichtig für arkane Magie und Nachforschungen.",
  wis: "Weisheit: Misst die Wahrnehmung, Intuition und Willenskraft. Wichtig für göttliche Magie, Wahrnehmung und Einblick.",
  cha: "Charisma: Misst die Überzeugungskraft, Persönlichkeit und Führungsstärke. Wichtig für soziale Interaktion und einige Magieformen."
};

// Deutsche Beschreibungen für die Kampfwerte
export const COMBAT_STATS_DESCRIPTIONS_DE = {
  ac: "Gibt an, wie schwer es ist, dich im Kampf zu treffen. Basiert auf 10 + deinem Geschicklichkeits-Modifikator. Rüstung und Schilde können diesen Wert erhöhen.",
  hp: "Deine Lebensenergie. Erreicht sie 0, bist du kampfunfähig. Basiert auf dem Trefferwürfel deiner Klasse und deinem Konstitutions-Modifikator.",
  proficiency: "Ein Bonus, den du auf alle Würfe addierst, in denen du geübt bist (Angriffe, Fertigkeiten, etc.). Er steigt mit deinem Charakterlevel an."
  };

// Deutsche Beschreibungen für die Fertigkeiten
export const SKILL_DESCRIPTIONS_DE = {
  acrobatics: "Akrobatik (Geschicklichkeit): Die Fähigkeit, auf den Beinen zu bleiben, Sprünge zu meistern und akrobatische Manöver auszuführen.",
  animal_handling: "Tierkunde (Weisheit): Die Fähigkeit, Tiere zu beruhigen, zu verstehen und zu kontrollieren.",
  arcana: "Arkanum (Intelligenz): Das Wissen über Magie, magische Kreaturen, Zauber und arkane Symbole.",
  athletics: "Athletik (Stärke): Die Fähigkeit, zu klettern, springen, schwimmen und körperliche Kraft anzuwenden.",
  deception: "Täuschung (Charisma): Die Fähigkeit, die Wahrheit zu verbergen, sei es durch Lügen, Verkleidung oder Ablenkung.",
  history: "Geschichte (Intelligenz): Das Wissen über historische Ereignisse, legendäre Personen und vergangene Zivilisationen.",
  insight: "Einblick (Weisheit): Die Fähigkeit, die wahren Absichten einer Kreatur durch Körpersprache und Verhalten zu erkennen.",
  intimidation: "Einschüchtern (Charisma): Die Fähigkeit, andere durch Drohungen, feindselige Handlungen und körperliche Präsenz zu beeinflussen.",
  investigation: "Nachforschungen (Intelligenz): Die Fähigkeit, nach Hinweisen zu suchen, Schlussfolgerungen zu ziehen und Details zu analysieren.",
  medicine: "Medizin (Weisheit): Die Fähigkeit, Verletzungen zu stabilisieren, Krankheiten zu diagnostizieren und Wunden zu behandeln.",
  nature: "Naturkunde (Intelligenz): Das Wissen über Gelände, Pflanzen, Tiere und das Wetter.",
  perception: "Wahrnehmung (Weisheit): Die Fähigkeit, etwas zu sehen, zu hören, zu riechen oder auf andere Weise wahrzunehmen.",
  performance: "Darbietung (Charisma): Die Fähigkeit, ein Publikum durch Musik, Tanz, Schauspiel oder eine andere Form der Unterhaltung zu fesseln.",
  persuasion: "Überzeugen (Charisma): Die Fähigkeit, andere durch Takt, Freundlichkeit und gute Argumente zu beeinflussen.",
  religion: "Religion (Intelligenz): Das Wissen über Gottheiten, religiöse Riten, heilige Symbole und die Ebenen der Existenz.",
  sleight_of_hand: "Fingerfertigkeit (Geschicklichkeit): Die Fähigkeit, Taschendiebstahl zu begehen, Schlösser zu knacken und andere manuelle Tricks auszuführen.",
  stealth: "Heimlichkeit (Geschicklichkeit): Die Fähigkeit, sich ungesehen und ungehört an anderen vorbeizuschleichen.",
  survival: "Überlebenskunst (Weisheit): Die Fähigkeit, Spuren zu lesen, in der Wildnis zu jagen, Gefahren zu vermeiden und den Weg zu finden."
};