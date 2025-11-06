// Diese Datei implementiert die spezifische Klassenlogik für den Waldläufer.
// Sie wird von der haupt-characterEngine.js aufgerufen.

/**
 * Eine private Hilfsfunktion zur Berechnung von Attributsmodifikatoren.
 */
function calculateModifier(score) {
  return Math.floor((score - 10) / 2);
}

/**
 * (Kopiert aus paladin.js)
 * Zauberplätze pro Stufe für einen Halb-Zauberwirker (Paladin, Waldläufer)
 * Index 0 = Level 1 (keine Slots), Index 1 = Level 2 (erste Slots), ...
 */
const HALF_CASTER_SLOTS = [
  // Lvl 1-20
  // G1, G2, G3, G4, G5
  [0, 0, 0, 0, 0], // Level 1
  [2, 0, 0, 0, 0], // Level 2
  [3, 0, 0, 0, 0], // Level 3
  [3, 0, 0, 0, 0], // Level 4
  [4, 2, 0, 0, 0], // Level 5
  [4, 2, 0, 0, 0], // Level 6
  [4, 3, 0, 0, 0], // Level 7
  [4, 3, 0, 0, 0], // Level 8
  [4, 3, 2, 0, 0], // Level 9
  [4, 3, 2, 0, 0], // Level 10
  [4, 3, 3, 0, 0], // Level 11
  [4, 3, 3, 0, 0], // Level 12
  [4, 3, 3, 1, 0], // Level 13
  [4, 3, 3, 1, 0], // Level 14
  [4, 3, 3, 2, 0], // Level 15
  [4, 3, 3, 2, 0], // Level 16
  [4, 3, 3, 3, 1], // Level 17
  [4, 3, 3, 3, 1], // Level 18
  [4, 3, 3, 3, 2], // Level 19
  [4, 3, 3, 3, 2], // Level 20
];

/**
 * Wendet alle passiven Stat-Modifikatoren für den Waldläufer an.
 * @param {object} character - Das vollständige Charakterobjekt.
 * @param {object} stats - Das aktuelle Stats-Objekt (Basiswerte, Rassenboni etc.).
 * @returns {object} - Das modifizierte Stats-Objekt.
 */
export function applyPassiveStatModifiers(character, stats) {
  const newStats = { ...stats };
  const abilities = stats;
  const level = character.level || 1;
  const subclassKey = character.subclassKey;

  // --- Level 1: Bevorzugter Feind ---
  // Beschreibung: "Du wählst eine Art von Kreatur als deinen bevorzugten Feind."
  if (level >= 1) {
    // Annahme: Die Wahl (z.B. 'goblinoid', 'undead') ist im Charakterobjekt gespeichert.
    const favored = character.choices?.favoredEnemy || [];
    // Die Engine kann dieses Flag bei relevanten Würfen (Survival, Intelligence) prüfen.
    newStats.favoredEnemies = favored; 
  }

  // --- Level 2: Kampfstil ---
  // Beschreibung: "Du wählst einen besonderen Kampfstil als Spezialität."
  if (level >= 2) {
    const style = character.choices?.fightingStyle; // Dieselbe Logik wie beim Kämpfer

    if (style === "defense") {
      // Wird von `calculateAC` in der Engine geprüft
      newStats.fightingStyle = "defense";
    } else if (style === "archery") {
      // Wird von `getAttackModifiers` in der Engine geprüft
      newStats.fightingStyle = "archery";
    }
    // (Andere Stile wie 'Dueling' oder 'Two-Weapon Fighting' würden hier implementiert)
  }

  // --- Zauberwirken-Kernattribute (ab Level 2) ---
  if (level >= 2) {
    const wisMod = calculateModifier(abilities.wisdom);
    const proficiencyBonus = getProficiencyBonus(level); 

    newStats.spellcastingAbility = "wisdom";
    newStats.spellSaveDC = 8 + proficiencyBonus + wisMod;
    newStats.spellAttackBonus = proficiencyBonus + wisMod;

    // --- Zauberplätze ---
    newStats.spellSlots = HALF_CASTER_SLOTS[level - 1];
  }
  
  // --- Level 5: Zusätzlicher Angriff ---
  if (level >= 5) {
      newStats.extraAttacks = 1; // Signalisiert der Kampf-Engine: 1 zusätzlicher Angriff
  }
  
  // --- Level 8: Land wandelnd ---
  // Beschreibung: "Die Bewegung durch schwieriges, nicht-magisches Gelände kostet dich keine zusätzliche Bewegung."
  if (level >= 8) {
      newStats.ignoreDifficultTerrain = true; // (oder spezifischer: 'non_magical_difficult_terrain')
  }

  return newStats;
}

/**
 * Holt alle aktiven Fähigkeiten (Aktionen, Bonusaktionen),
 * die dem Charakter durch die Waldläufer-Klasse zur Verfügung stehen.
 * @param {object} character - Das vollständige Charakterobjekt.
 * @returns {Array<object>} - Eine Liste von Fähigkeits-Objekten für die UI/Action-Bar.
 */
export function getActiveSkills(character) {
  const activeSkills = [];
  const level = character.level || 1;
  const subclassKey = character.subclassKey;

  // --- Level 3: Ursprüngliches Bewusstsein ---
  // Beschreibung: "...kannst du deine Aktion und einen Waldläufer-Zauberplatz verwenden, um zu spüren, ob bestimmte Kreaturenarten in deiner Nähe sind."
  if (level >= 3) {
    activeSkills.push({
      key: "primeval_awareness",
      name: "Ursprüngliches Bewusstsein",
      type: "action",
      description: "Verbrauche einen Zauberplatz, um 1 Minute lang zu spüren, ob Aberrationen, Himmlische, Drachen, Elementare, Feenwesen, Unholde oder Untote in 1,5 km Umkreis sind (6 km im bevorzugten Gelände)."
    });
  }
  
  // (Fähigkeiten des Jäger-Archetyps wie 'Multiangriff' sind oft passive Modifikatoren
  // oder Aktionen, die hier hinzugefügt würden)

  return activeSkills;
}

/**
 * Diese Funktion wird aufgerufen, wenn ein Ereignis im Spiel passiert.
 * @param {string} eventType - Die Art des Ereignisses (z.B. 'attack_hit').
 * @param {object} data - Die Daten des Ereignisses.
 * @param {object} character - Das Charakterobjekt des Waldläufers.
 * @returns {object} - Modifizierte Ereignisdaten.
 */
export function handleGameEvent(eventType, data, character) {
    const level = character.level || 1;
    const subclassKey = character.subclassKey;

    // =================================================================
    // --- NEUE HINZUFÜGUNG: Level 3: Koloss-Töter ---
    // =================================================================
    const hunterPreyChoice = character.choices?.huntersPrey; // z.B. 'colossus_slayer'

    // Beschreibung: "Koloss-Töter: ...einmal pro Zug zusätzlich 1W8 Schaden verursachen, wenn das Ziel unter seinen maximalen Trefferpunkten liegt."
    if (
        level >= 3 &&
        subclassKey === 'hunter' &&
        hunterPreyChoice === 'colossus_slayer' &&
        eventType === 'attack_hit' && // Beim Treffer
        data.attackType.includes('weapon') && // Nur bei Waffenangriffen
        !character.status?.hasUsedColossusSlayerThisTurn && // Nur 1x pro Zug
        data.target.currentHp < data.target.maxHp // Ziel ist verletzt
    ) {
        const dice = "1d8";
        
        // Füge den Bonusschaden hinzu
        return { 
            ...data, 
            bonusDamage: (data.bonusDamage || "") + `+${dice}`, 
            // Fügt den Schaden für Kritische Treffer hinzu
            bonusDamageCrit: (data.bonusDamageCrit || "") + `+${dice}`,
            // Setze das Flag, damit es nur 1x pro Zug passiert
            setStatus: 'hasUsedColossusSlayerThisTurn' 
        };
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


/**
 * (NEU) Holt die spezifischen Zauber-Regeln für den Waldläufer.
 * @param {object} character - Das Charakterobjekt.
 * @param {object} stats - Die finalen Stats des Charakters.
 * @returns {object} - Ein Objekt mit den Zauber-Regeln.
 */
export function getSpellcastingInfo(character, stats) {
    const level = character.level || 1;
    
    // Waldläufer erhalten Zauberwirken erst ab Stufe 2
    if (level < 2) {
        return null;
    }
    
    const wisMod = calculateModifier(stats.wisdom);

    return {
        // "prepared": Waldläufer wählen Zauber aus ihrer gesamten Liste aus.
        spellcastingType: "prepared", 
        // Die Liste, aus der Zauber vorbereitet werden.
        spellList: "ranger", 
        // Das Attribut, das für die Vorbereitung genutzt wird.
        preparationAttribute: "wisdom",
        // Maximale Anzahl vorbereiteter Zauber.
        preparationLimit: Math.max(1, wisMod + Math.floor(level / 2)) 
    };
}
