// Diese Datei implementiert die spezifische Klassenlogik für den Druiden
// und seine Unterklasse "Zirkel des Landes".
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
 * Wendet alle passiven Stat-Modifikatoren für den Druiden an.
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
  const wisMod = calculateModifier(abilities.wisdom);
  const proficiencyBonus = getProficiencyBonus(level); 

  newStats.spellcastingAbility = "wisdom";
  newStats.spellSaveDC = 8 + proficiencyBonus + wisMod;
  newStats.spellAttackBonus = proficiencyBonus + wisMod;

  // --- Zauberplätze ---
  newStats.spellSlots = FULL_CASTER_SLOTS[level - 1];
  
  // --- Rüstungsbeschränkung (Passiv) ---
  // Beschreibung: "...(nicht aus Metall)"
  // Die characterEngine (calculateAC) muss dieses Flag prüfen.
  newStats.armorRestriction = "no_metal_armor";

  // --- Level 18: Zeitloser Körper ---
  // (In D&D 5e ist dies Level 18)
  // Beschreibung: "Du alterst langsamer."
  if (level >= 18) {
      newStats.timelessBody = true;
  }

  // =================================================================
  // --- SUBKLASSEN-LOGIK (Zirkel des Landes) ---
  // =================================================================
  if (subclassKey === 'circle_of_the_land') {
      
      // Lvl 2: Zusätzlicher Zaubertrick
      if (level >= 2) {
          // Die Engine (getSpellcastingCapabilities) muss dies lesen
          // und einen zusätzlichen Zaubertrick erlauben.
          newStats.bonusCantrips = (newStats.bonusCantrips || 0) + 1;
      }
      
      // Lvl 3: Zirkelzauber
      if (level >= 3) {
          // Annahme: Die Wahl des Landes (z.B. 'forest', 'mountain') ist gespeichert
          const landChoice = character.choices?.landCircle;
          // Die Engine (getSpellcastingCapabilities) muss dies lesen
          // und die Zauber des gewählten Landes zur Liste hinzufügen.
          newStats.circleSpellsLand = landChoice; 
      }

      // Lvl 6: Land wandelnd
      if (level >= 6) {
          // Bewegung durch schwieriges, nicht-magisches Gelände kostet nichts extra.
          newStats.ignoreDifficultTerrain = "non_magical_terrain";
          // Vorteil bei Rettungswürfen gegen magisch erschaffene Pflanzen
          newStats.advantageOnSaveVs = (newStats.advantageOnSaveVs || []);
          newStats.advantageOnSaveVs.push("magical_plants");
      }
      
      // Lvl 10: Schutz der Natur
      if (level >= 10) {
          if (!newStats.immunities) newStats.immunities = [];
          // Immunität gegen Gift und Krankheiten
          newStats.immunities.push("poison", "disease");
          // Immunität gegen Bezauberung/Verängstigung durch Elementare oder Feenwesen
          newStats.conditionImmunitiesFrom = (newStats.conditionImmunitiesFrom || []);
          newStats.conditionImmunitiesFrom.push({ type: 'charmed', from: ['elemental', 'fey'] });
          newStats.conditionImmunitiesFrom.push({ type: 'frightened', from: ['elemental', 'fey'] });
      }
  }

  return newStats;
}

/**
 * Holt alle aktiven Fähigkeiten (Aktionen, Bonusaktionen),
 * die dem Charakter durch die Druiden-Klasse zur Verfügung stehen.
 * @param {object} character - Das vollständige Charakterobjekt.
 * @returns {Array<object>} - Eine Liste von Fähigkeits-Objekten für die UI/Action-Bar.
 */
export function getActiveSkills(character) {
  const activeSkills = [];
  const level = character.level || 1;
  const subclassKey = character.subclassKey;

  // --- Level 2: Tiergestalt (Wild Shape) ---
  // Beschreibung: "Du kannst deine Aktion verwenden, um dich in ein Tier zu verwandeln..."
  if (level >= 2) {
      // (In D&D 5e 2x pro kurzer Rast)
      const uses = 2; 
      
      activeSkills.push({
        key: "wild_shape",
        name: "Tiergestalt",
        type: "action", // (Bonusaktion für Zirkel des Mondes)
        description: "Als Aktion nimmst du die Gestalt eines Tieres an, das du gesehen hast.",
        uses: uses,
        recharge: "short_rest",
      });
  }

  // --- Level 2: Natürliche Erholung (Zirkel des Landes) ---
  // Beschreibung: "Während einer kurzen Rast kannst du einen Teil deiner verbrauchten Zauberplätze zurückgewinnen."
  if (level >= 2 && subclassKey === 'circle_of_the_land') {
      activeSkills.push({
          key: "natural_recovery",
          name: "Natürliche Erholung",
          type: "out_of_combat", // Wird bei kurzer Rast genutzt
          description: `Stelle bei einer kurzen Rast Zauberplätze im Wert von ${Math.max(1, Math.floor(character.level / 2))} Stufen wieder her. (1x pro Tag)`,
          uses: 1,
          recharge: "long_rest",
      });
  }

  return activeSkills;
}

/**
 * Diese Funktion wird aufgerufen, wenn ein Ereignis im Spiel passiert.
 * @param {string} eventType - Die Art des Ereignisses.
 * @param {object} data - Die Daten des Ereignisses.
 * @param {object} character - Das Charakterobjekt des Druiden.
 * @returns {object} - Modifizierte Ereignisdaten.
 */
export function handleGameEvent(eventType, data, character) {
    const level = character.level || 1;
    const subclassKey = character.subclassKey;

    // Lvl 6: Land wandelnd (Vorteil bei Rettungswürfen)
    if (
        level >= 6 &&
        subclassKey === 'circle_of_the_land' &&
        eventType === 'saving_throw' &&
        data.sourceType === 'magical_plant' // Annahme: Das Event enthält diese Info
    ) {
        return { ...data, advantage: true };
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
 * (NEU) Holt die spezifischen Zauber-Regeln für den Druiden.
 * @param {object} character - Das Charakterobjekt.
 * @param {object} stats - Die finalen Stats des Charakters.
 * @returns {object} - Ein Objekt mit den Zauber-Regeln.
 */
export function getSpellcastingInfo(character, stats) {
    const level = character.level || 1;
    const wisMod = calculateModifier(stats.wisdom);

    return {
        // "prepared": Druiden wählen Zauber aus ihrer gesamten Liste aus.
        spellcastingType: "prepared", 
        // Die Liste, aus der Zauber vorbereitet werden.
        spellList: "druid", 
        // Das Attribut, das für die Vorbereitung genutzt wird.
        preparationAttribute: "wisdom",
        // Maximale Anzahl vorbereiteter Zauber.
        preparationLimit: Math.max(1, wisMod + level) 
    };
}
