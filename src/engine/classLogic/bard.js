// Diese Datei implementiert die spezifische Klassenlogik für den Barden.
// Sie wird von der haupt-characterEngine.js aufgerufen.

/**
 * Eine private Hilfsfunktion zur Berechnung von Attributsmodifikatoren.
 */
function calculateModifier(score) {
  return Math.floor((score - 10) / 2);
}

/**
 * (Kopiert aus wizard.js)
 * Zauberplätze pro Stufe für einen Voll-Zauberwirker (Magier, Kleriker, Barde, Druide, Zauberer)
 * Index 0 = Level 1, Index 1 = Level 2, ...
 */
const FULL_CASTER_SLOTS = [
  // Lvl 1-20
  // G1, G2, G3, G4, G5, G6, G7, G8, G9
  [2, 0, 0, 0, 0, 0, 0, 0, 0], // Level 1
  [3, 0, 0, 0, 0, 0, 0, 0, 0], // Level 2
  [4, 2, 0, 0, 0, 0, 0, 0, 0], // Level 3
  [4, 3, 0, 0, 0, 0, 0, 0, 0], // Level 4
  [4, 3, 2, 0, 0, 0, 0, 0, 0], // Level 5
  [4, 3, 3, 0, 0, 0, 0, 0, 0], // Level 6
  [4, 3, 3, 1, 0, 0, 0, 0, 0], // Level 7
  [4, 3, 3, 2, 0, 0, 0, 0, 0], // Level 8
  [4, 3, 3, 3, 1, 0, 0, 0, 0], // Level 9
  [4, 3, 3, 3, 2, 0, 0, 0, 0], // Level 10
  [4, 3, 3, 3, 2, 1, 0, 0, 0], // Level 11
  [4, 3, 3, 3, 2, 1, 0, 0, 0], // Level 12
  [4, 3, 3, 3, 2, 1, 1, 0, 0], // Level 13
  [4, 3, 3, 3, 2, 1, 1, 0, 0], // Level 14
  [4, 3, 3, 3, 2, 1, 1, 1, 0], // Level 15
  [4, 3, 3, 3, 2, 1, 1, 1, 0], // Level 16
  [4, 3, 3, 3, 2, 1, 1, 1, 1], // Level 17
  [4, 3, 3, 3, 3, 1, 1, 1, 1], // Level 18
  [4, 3, 3, 3, 3, 2, 1, 1, 1], // Level 19
  [4, 3, 3, 3, 3, 2, 2, 1, 1], // Level 20
];

/**
 * (NEU) Tabelle für bekannte Zauber des Barden (Standard-5e-Regeln)
 * Index = Level (Index 0 ist ungenutzt)
 */
const BARD_SPELLS_KNOWN = [
    0, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, // Level 1-10
    14, 15, 15, 16, 16, 18, 18, 19, 19, 22 // Level 11-20
];

/**
 * Wendet alle passiven Stat-Modifikatoren für den Barden an.
 * @param {object} character - Das vollständige Charakterobjekt.
 * @param {object} stats - Das aktuelle Stats-Objekt (Basiswerte, Rassenboni etc.).
 * @returns {object} - Das modifizierte Stats-Objekt.
 */
export function applyPassiveStatModifiers(character, stats) {
  const newStats = { ...stats };
  const abilities = stats;
  const level = character.level || 1;
  const subclassKey = character.subclassKey;

  // --- Zauberwirken-Kernattribute ---
  const chaMod = calculateModifier(abilities.charisma);
  const proficiencyBonus = getProficiencyBonus(level); 

  newStats.spellcastingAbility = "charisma";
  newStats.spellSaveDC = 8 + proficiencyBonus + chaMod;
  newStats.spellAttackBonus = proficiencyBonus + chaMod;

  // --- Zauberplätze ---
  newStats.spellSlots = FULL_CASTER_SLOTS[level - 1];
  
  // --- Level 1: Bardische Inspiration ---
  const bardicInspirationDie =
    level >= 15 ? 12 : level >= 10 ? 10 : level >= 5 ? 8 : 6;
  newStats.bardicInspiration = {
      die: `1d${bardicInspirationDie}`,
      uses: Math.max(1, chaMod), // Aufladungen = CHA-Mod (min 1)
      recharge: level >= 5 ? 'short_rest' : 'long_rest' // Ab Lvl 5: "Quelle der Inspiration"
  };

  // --- Level 2: Hansdampf in allen Gassen ---
  // Beschreibung: "Du kannst die Hälfte deines Übungsbonus zu jedem Attributswurf addieren, bei dem du nicht bereits geübt bist."
  if (level >= 2) {
      newStats.jackOfAllTrades = true;
      // Die `calculateSkillBonus`-Funktion in der Engine muss dies prüfen.
  }

  // --- Level 3: Expertise ---
  // Beschreibung: "Wähle zwei deiner Fertigkeiten, bei denen du geübt bist. Dein Übungsbonus verdoppelt sich..."
  if (level >= 3) {
    const expertiseChoices = character.choices?.expertise || [];
    newStats.expertiseSkills = (newStats.expertiseSkills || []).concat(expertiseChoices);
  }
  // --- Level 10: Expertise (erneut) ---
  if (level >= 10) {
    // (Logik, um ZWEI WEITERE Skills hinzuzufügen, falls implementiert)
  }
  
  // --- Subklassen-Features ---
  if (subclassKey === 'college_of_valor') {
      // Level 3: Bonus-Übungen (Kolleg des Mutes)
      // Beschreibung: "Du bist im Umgang mit mittlerer Rüstung, Schilden und Kriegswaffen geübt."
      if (level >= 3) {
          if (!newStats.proficiencies) newStats.proficiencies = { armor: [], weapons: [] };
          newStats.proficiencies.armor.push("medium", "shields");
          newStats.proficiencies.weapons.push("martial");
      }
      
      // Level 6: Zusätzlicher Angriff
      // Beschreibung: "Du kannst zweimal statt einmal angreifen..."
      if (level >= 6) {
          newStats.extraAttacks = (newStats.extraAttacks || 0) + 1;
      }
  }

  return newStats;
}

/**
 * Holt alle aktiven Fähigkeiten (Aktionen, Bonusaktionen),
 * die dem Charakter durch die Barden-Klasse zur Verfügung stehen.
 * @param {object} character - Das vollständige Charakterobjekt.
 * @returns {Array<object>} - Eine Liste von Fähigkeits-Objekten für die UI/Action-Bar.
 */
export function getActiveSkills(character) {
  const activeSkills = [];
  const level = character.level || 1;
  const subclassKey = character.subclassKey;
  // const stats = character.stats || {}; // (Engine muss stats hier bereitstellen)
  // Workaround, da stats nicht übergeben werden:
  const chaMod = calculateModifier(character.abilities.charisma);
  const bardicInspirationDie =
    level >= 15 ? 12 : level >= 10 ? 10 : level >= 5 ? 8 : 6;
  const inspirationUses = Math.max(1, chaMod);
  const inspirationRecharge = level >= 5 ? 'short_rest' : 'long_rest';


  // --- Level 1: Bardische Inspiration ---
  // Beschreibung: "Als Bonusaktion kannst du eine Kreatur inspirieren."
  if (level >= 1) {
    activeSkills.push({
      key: "bardic_inspiration",
      name: "Bardische Inspiration",
      type: "bonus_action",
      description: `Als Bonusaktion inspirierst du eine Kreatur. Sie erhält einen 1d${bardicInspirationDie}, den sie zu einem Wurf addieren kann.`,
      uses: inspirationUses,
      recharge: inspirationRecharge,
    });
  }
  
  // --- Subklassen-Features ---
  
  // Level 3: Schneidende Worte (Kolleg des Wissens)
  // Beschreibung: "...kannst du als Reaktion... einen Bardischen Inspirationswürfel... abziehen."
  if (level >= 3 && subclassKey === 'college_of_lore') {
      activeSkills.push({
          key: "cutting_words",
          name: "Schneidende Worte",
          type: "reaction_modifier", // Signalisiert, dass dies als Reaktion genutzt wird
          description: "Wenn eine Kreatur (nicht du) einen Angriffs-, Attributs- oder Schadenswurf macht, nutze deine Reaktion und einen Inspirationswürfel, um den Wurf zu verringern."
      });
  }
  
  return activeSkills;
}

/**
 * Diese Funktion wird aufgerufen, wenn ein Ereignis im Spiel passiert.
 * @param {string} eventType - Die Art des Ereignisses (z.B. 'attack_roll', 'ability_check').
 * @param {object} data - Die Daten des Ereignisses (z.B. { target: 'enemy_1', value: 15 }).
 * @param {object} character - Das Charakterobjekt des Barden.
 * @returns {object} - Modifizierte Ereignisdaten.
 */
export function handleGameEvent(eventType, data, character) {
    const level = character.level || 1;
    const subclassKey = character.subclassKey;

    // --- Level 3: Schneidende Worte (Kolleg des Wissens) ---
    // Beschreibung: "Wenn eine Kreatur einen Angriff-, Attributs- oder Schadenswurf macht, kannst du als Reaktion... den Wurf verringern."
    if (
        level >= 3 &&
        subclassKey === 'college_of_lore' &&
        (eventType === 'attack_roll' || eventType === 'ability_check' || eventType === 'damage_roll') &&
        data.source !== character.id && // Darf nicht der Barde selbst sein
        (character.resources?.bardicInspiration || 0) > 0 // Prüft, ob Inspiration vorhanden ist
    ) {
        // Signalisieren, dass die Reaktion "Schneidende Worte" verfügbar ist.
        return { ...data, canReact: 'cutting_words' };
    }

    // Keine Änderung am Ereignis
    return data;
}


/**
 * (Helper) Holt den Übungsbonus (lokal, falls nicht von der Engine bereitgestellt).
 */
function getProficiencyBonus(level) {
  if (level < 5) return 2;
  if (level < 9) return 3;
  if (level < 13) return 4;
  if (level < 17) return 5;
  return 6; // Stufe 17-20
}

// =================================================================
// --- NEUE FUNKTION HINZUGEFÜGT ---
// =================================================================

/**
 * (NEU) Holt die spezifischen Zauber-Regeln für den Barden.
 * @param {object} character - Das Charakterobjekt.
 * @param {object} stats - Die finalen Stats des Charakters.
 * @returns {object} - Ein Objekt mit den Zauber-Regeln.
 */
export function getSpellcastingInfo(character, stats) {
    const level = character.level || 1;

    return {
        // "known": Barden wählen beim Stufenaufstieg eine feste Anzahl Zauber.
        spellcastingType: "known", 
        // Die Liste, aus der Zauber gelernt werden.
        spellList: "bard", 
        // Das Attribut, das für die Zauber genutzt wird.
        spellcastingAttribute: "charisma", 
        // Maximale Anzahl bekannter Zauber (ohne Zaubertricks).
        knownSpellsCount: BARD_SPELLS_KNOWN[level] 
    };
}