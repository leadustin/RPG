// Diese Datei implementiert die spezifische Klassenlogik für den Magier.
// Sie wird von der haupt-characterEngine.js aufgerufen.

/**
 * Eine private Hilfsfunktion zur Berechnung von Attributsmodifikatoren.
 */
function calculateModifier(score) {
  return Math.floor((score - 10) / 2);
}

/**
 * Zauberplätze pro Stufe für einen Voll-Zauberwirker (Magier, Kleriker, Barde, Druide, Zauberer)
 * Index 0 = Level 1, Index 1 = Level 2, ...
 * Das innere Array repräsentiert die Zaubergrade (Index 0 = Grad 1, ... Index 8 = Grad 9)
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
 * Wendet alle passiven Stat-Modifikatoren für den Magier an.
 * @param {object} character - Das vollständige Charakterobjekt.
 * @param {object} stats - Das aktuelle Stats-Objekt (Basiswerte, Rassenboni etc.).
 * @returns {object} - Das modifizierte Stats-Objekt.
 */
export function applyPassiveStatModifiers(character, stats) {
  const newStats = { ...stats };
  const abilities = stats; // `stats` enthält bereits die finalen Rassen-modifizierten Werte
  const level = character.level || 1;
  
  // --- Zauberwirken-Kernattribute ---
  const intMod = calculateModifier(abilities.intelligence);
  const proficiencyBonus = getProficiencyBonus(level); // Annahme: getProficiencyBonus ist in der Engine vorhanden

  newStats.spellcastingAbility = "intelligence";
  newStats.spellSaveDC = 8 + proficiencyBonus + intMod;
  newStats.spellAttackBonus = proficiencyBonus + intMod;

  // --- Zauberplätze ---
  // Wir weisen die Zauberplätze basierend auf dem Level zu
  // (Level 1 ist Index 0)
  newStats.spellSlots = FULL_CASTER_SLOTS[level - 1];

  // --- Subklassen-Features (Schule der Hervorrufung) ---
  const subclassKey = character.subclassKey;

  // Level 10: Ermächtigte Hervorrufung
  // Beschreibung: "Du kannst deinen Intelligenz-Modifikator zu den Schadenswürfen deiner Hervorrufungszauber addieren."
  if (level >= 10 && subclassKey === "school_of_evocation") {
    // Die Kampf-Engine kann dieses Flag prüfen, wenn ein Hervorrufungszauber Schaden verursacht
    newStats.empoweredEvocation = true; 
  }

  return newStats;
}

/**
 * Holt alle aktiven Fähigkeiten (Aktionen, Bonusaktionen),
 * die dem Charakter durch die Magier-Klasse zur Verfügung stehen.
 * @param {object} character - Das vollständige Charakterobjekt.
 * @returns {Array<object>} - Eine Liste von Fähigkeits-Objekten für die UI/Action-Bar.
 */
export function getActiveSkills(character) {
  const activeSkills = [];

  // --- Level 1: Arkane Erholung ---
  // Beschreibung: "Einmal pro Tag, wenn du eine kurze Rast beendest, kannst du eine Anzahl von Zauberplätzen zurückgewinnen..."
  if (character.level >= 1) {
    activeSkills.push({
      key: "arcane_recovery",
      name: "Arkane Erholung",
      type: "out_of_combat", // Dies ist eine Fähigkeit, die bei kurzer Rast genutzt wird
      description: `Stelle bei einer kurzen Rast Zauberplätze im Wert von ${Math.max(1, Math.floor(character.level / 2))} Stufen wieder her. (1x pro Tag)`,
      uses: 1,
      recharge: "long_rest",
    });
  }

  return activeSkills;
}

/**
 * Diese Funktion wird aufgerufen, wenn ein Ereignis im Spiel passiert.
 * @param {string} eventType - Die Art des Ereignisses (z.B. 'cast_spell').
 * @param {object} data - Die Daten des Ereignisses (z.B. { spell: fireball, targets: [...] }).
 * @param {object} character - Das Charakterobjekt des Magiers.
 * @returns {object} - Modifizierte Ereignisdaten.
 */
export function handleGameEvent(eventType, data, character) {
  const level = character.level || 1;
  const subclassKey = character.subclassKey;

  // --- Level 2: Zauber formen (Schule der Hervorrufung) ---
  // Beschreibung: "Wenn du einen Hervorrufungszauber wirkst, kannst du eine Anzahl von Kreaturen... wählen, die automatisch... erfolgreich sind..."
  if (
    level >= 2 &&
    subclassKey === "school_of_evocation" &&
    eventType === "before_cast_spell" &&
    data.spell.school === "evocation" && // Annahme: Zauberdaten haben eine "school"
    data.spell.aoe === true // Annahme: Zauber ist als AoE markiert
  ) {
    // Signalisieren, dass die Engine eine Zielauswahl für "Sculpt Spells" anbieten muss.
    // Die Anzahl der sicheren Kreaturen ist 1 + Zaubergrad.
    const safeCreaturesCount = 1 + data.spell.level;
    return { ...data, canReact: "sculpt_spells", sculptCreatureCount: safeCreaturesCount };
  }

  // Keine Änderung am Ereignis
  return data;
}

/**
 * (Helper) Holt den Übungsbonus (lokal, falls nicht von der Engine bereitgestellt).
 * Diese Funktion ist ein Duplikat aus der characterEngine und dient als Fallback.
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
 * (NEU) Holt die spezifischen Zauber-Regeln für den Magier.
 * @param {object} character - Das Charakterobjekt.
 * @param {object} stats - Die finalen Stats des Charakters.
 * @returns {object} - Ein Objekt mit den Zauber-Regeln.
 */
export function getSpellcastingInfo(character, stats) {
    const level = character.level || 1;
    const intMod = calculateModifier(stats.intelligence);

    return {
        // "prepared": Magier wählt Zauber aus einer Liste (Zauberbuch) aus.
        spellcastingType: "prepared", 
        // Die Liste, aus der Zauber gelernt/kopiert werden.
        spellList: "wizard", 
        // Das Attribut, das für die Vorbereitung genutzt wird.
        preparationAttribute: "intelligence", 
        // Maximale Anzahl vorbereiteter Zauber.
        preparationLimit: Math.max(1, intMod + level) 
    };
}