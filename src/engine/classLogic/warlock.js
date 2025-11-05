// Diese Datei implementiert die spezifische Klassenlogik für den Hexenmeister.
// Sie wird von der haupt-characterEngine.js aufgerufen.

/**
 * Eine private Hilfsfunktion zur Berechnung von Attributsmodifikatoren.
 */
function calculateModifier(score) {
  return Math.floor((score - 10) / 2);
}

/**
 * Paktmagie-Tabelle für den Hexenmeister.
 * Index 0 = Level 1, Index 1 = Level 2, ...
 * Das innere Array ist: [Anzahl Slots, Slot-Grad]
 */
const PACT_MAGIC_SLOTS = [
  // Lvl 1-20
  // Slots, Grad
  [1, 1], // Level 1
  [2, 1], // Level 2
  [2, 2], // Level 3
  [2, 2], // Level 4
  [2, 3], // Level 5
  [2, 3], // Level 6
  [2, 4], // Level 7
  [2, 4], // Level 8
  [2, 5], // Level 9
  [2, 5], // Level 10
  [3, 5], // Level 11
  [3, 5], // Level 12
  [3, 5], // Level 13
  [3, 5], // Level 14
  [3, 5], // Level 15
  [3, 5], // Level 16
  [4, 5], // Level 17
  [4, 5], // Level 18
  [4, 5], // Level 19
  [4, 5], // Level 20
];

// =================================================================
// --- KORREKTUR: Fehlende Konstante hinzugefügt ---
// =================================================================
/**
 * Tabelle für bekannte Zauber des Hexenmeisters (Standard-5e-Regeln)
 * Index = Level (Index 0 ist ungenutzt)
 */
const WARLOCK_SPELLS_KNOWN = [
    0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, // Level 1-10
    11, 11, 12, 12, 13, 13, 14, 14, 15, 15 // Level 11-20
];
// =================================================================
// --- ENDE DER KORREKTUR ---
// =================================================================


/**
 * Wendet alle passiven Stat-Modifikatoren für den Hexenmeister an.
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

  // --- Paktmagie-Zauberplätze ---
  // Beschreibung: "...regenerieren sich aber nach einer kurzen Rast."
  const [slotCount, slotLevel] = PACT_MAGIC_SLOTS[level - 1];
  newStats.pactMagic = {
      slots: slotCount,
      level: slotLevel,
      recharge: "short_rest"
  };
  
  // --- Level 11: Mystisches Arkanum ---
  // Beschreibung: "...einmal pro langer Rast einen mächtigen Zauber des 6. Grades wirken."
  // (In 5e: Lvl 11 (Grad 6), Lvl 13 (Grad 7), Lvl 15 (Grad 8), Lvl 17 (Grad 9))
  newStats.mysticArcanum = [];
  if (level >= 11) newStats.mysticArcanum.push(6); // 1x Grad 6
  if (level >= 13) newStats.mysticArcanum.push(7); // 1x Grad 7
  if (level >= 15) newStats.mysticArcanum.push(8); // 1x Grad 8
  if (level >= 17) newStats.mysticArcanum.push(9); // 1x Grad 9
  
  // --- Subklassen-Features (Der Unhold) ---

  // Level 10: Unholdische Widerstandsfähigkeit
  // Beschreibung: "Wähle einen Schadenstyp, gegen den du Resistenz erhältst."
  if (level >= 10 && subclassKey === 'the_fiend') {
      // Annahme: Die Wahl ist im Charakter gespeichert, z.B. 'fire'
      const resistanceChoice = character.choices?.fiendishResilience; 
      if (resistanceChoice) {
          if (!newStats.resistances) newStats.resistances = [];
          newStats.resistances.push(resistanceChoice);
      }
  }

  return newStats;
}

/**
 * Holt alle aktiven Fähigkeiten (Aktionen, Bonusaktionen),
 * die dem Charakter durch die Hexenmeister-Klasse zur Verfügung stehen.
 * @param {object} character - Das vollständige Charakterobjekt.
 * @returns {Array<object>} - Eine Liste von Fähigkeits-Objekten für die UI/Action-Bar.
 */
export function getActiveSkills(character) {
  const activeSkills = [];
  const level = character.level || 1;
  const subclassKey = character.subclassKey;

  // --- Level 2: Mystische Anrufungen ---
  // Beschreibung: "Du lernst mystische Anrufungen..."
  // (Beispiel: Agonizing Blast)
  const invocations = character.choices?.invocations || [];
  
  if (invocations.includes('agonizing_blast')) {
      activeSkills.push({
          key: "invocation_agonizing_blast",
          name: "Anrufung: Quälender Strahl",
          type: "passive_modifier", // Modifiziert den Zaubertrick "Eldritch Blast"
          description: "Füge deinen CHA-Modifikator zum Schaden von 'Eldritch Blast' hinzu."
      });
  }
  
  // --- Level 6: Gunst des Dunklen (Der Unhold) ---
  // Beschreibung: "Du kannst einen W10 zu einem Attributs- oder Rettungswurf hinzufügen."
  if (level >= 6 && subclassKey === 'the_fiend') {
      activeSkills.push({
          key: "dark_ones_own_luck",
          name: "Gunst des Dunklen",
          type: "reaction_modifier", // Kann nach dem Wurf, vor dem Ergebnis genutzt werden
          description: "Addiere einen W10 zu einem Attributs- oder Rettungswurf, bei dem du versagt hast.",
          uses: 1,
          recharge: "short_rest"
      });
  }

  return activeSkills;
}

/**
 * Diese Funktion wird aufgerufen, wenn ein Ereignis im Spiel passiert.
 * @param {string} eventType - Die Art des Ereignisses (z.B. 'kill_enemy').
 * @param {object} data - Die Daten des Ereignisses (z.B. { target: 'goblin' }).
 * @param {object} character - Das Charakterobjekt des Hexenmeisters.
 * @returns {object} - Modifizierte Ereignisdaten.
 */
export function handleGameEvent(eventType, data, character) {
    const level = character.level || 1;
    const subclassKey = character.subclassKey;

    // --- Level 1: Segen des Dunklen (Der Unhold) ---
    // Beschreibung: "Wenn du eine feindliche Kreatur auf 0 Trefferpunkte reduzierst, erhältst du temporäre Trefferpunkte..."
    if (
        level >= 1 &&
        subclassKey === 'the_fiend' &&
        eventType === 'kill_enemy' && // Wir definieren ein Event 'kill_enemy'
        data.killer === character.id
    ) {
        const chaMod = calculateModifier(character.abilities.charisma); // (Engine sollte finale Stats nutzen)
        const tempHp = Math.max(1, chaMod + level);
        
        // Signalisieren, dass die Engine temporäre HP hinzufügen soll
        return { ...data, grantTempHp: tempHp, target: character.id };
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
 * (NEU) Holt die spezifischen Zauber-Regeln für den Hexenmeister.
 * @param {object} character - Das Charakterobjekt.
 *_@param {object} stats - Die finalen Stats des Charakters (enthält `pactMagic` und `mysticArcanum`).
 * @returns {object} - Ein Objekt mit den Zauber-Regeln.
 */
export function getSpellcastingInfo(character, stats) {
    const level = character.level || 1;

    return {
        // "pact": Hexenmeister nutzen Paktmagie (wenige Slots, kurze Rast)
        spellcastingType: "pact", 
        // Die Liste, aus der Zauber gelernt werden.
        spellList: "warlock", 
        // Das Attribut, das für die Zauber genutzt wird.
        spellcastingAttribute: "charisma",
        // Maximale Anzahl bekannter Zauber (ohne Zaubertricks und Arkanum).
        knownSpellsCount: WARLOCK_SPELLS_KNOWN[level],
        
        // Die Engine holt diese Infos direkt aus den `stats`,
        // die von `applyPassiveStatModifiers` berechnet wurden.
        pactMagic: stats.pactMagic,
        mysticArcanum: stats.mysticArcanum
    };
}