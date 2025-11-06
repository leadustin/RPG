// Diese Datei implementiert die spezifische Klassenlogik für den Paladin
// und seine Unterklasse "Eid der Hingabe".
// Sie wird von der haupt-characterEngine.js aufgerufen.

/**
 * Eine private Hilfsfunktion zur Berechnung von Attributsmodifikatoren.
 */
function calculateModifier(score) {
  return Math.floor((score - 10) / 2);
}

/**
 * Zauberplätze pro Stufe für einen Halb-Zauberwirker (Paladin, Waldläufer)
 * Index 0 = Level 1 (keine Slots), Index 1 = Level 2 (erste Slots), ...
 * Das innere Array repräsentiert die Zaubergrade (Index 0 = Grad 1, ... Index 4 = Grad 5)
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
 * Wendet alle passiven Stat-Modifikatoren für den Paladin an.
 * @param {object} character - Das vollständige Charakterobjekt.
 * @param {object} stats - Das aktuelle Stats-Objekt (Basiswerte, Rassenboni etc.).
 * @returns {object} - Das modifizierte Stats-Objekt.
 */
export function applyPassiveStatModifiers(character, stats) {
  const newStats = { ...stats };
  const abilities = stats;
  const level = character.level || 1;
  const subclassKey = character.subclassKey;

  // --- Zauberwirken-Kernattribute (ab Level 2) ---
  if (level >= 2) {
    const chaMod = calculateModifier(abilities.charisma);
    const proficiencyBonus = getProficiencyBonus(level); 

    newStats.spellcastingAbility = "charisma";
    newStats.spellSaveDC = 8 + proficiencyBonus + chaMod;
    newStats.spellAttackBonus = proficiencyBonus + chaMod;

    // --- Zauberplätze ---
    newStats.spellSlots = HALF_CASTER_SLOTS[level - 1];
  }

  // --- Level 3: Göttliche Gesundheit ---
  // Beschreibung: "Du bist immun gegen Krankheiten."
  if (level >= 3) {
    if (!newStats.immunities) newStats.immunities = [];
    newStats.immunities.push("disease");
  }

  // --- Level 6: Aura des Schutzes ---
  // Beschreibung: "...erhält die Kreatur einen Bonus auf den Rettungswurf in Höhe deines Charisma-Modifikators."
  if (level >= 6) {
    const chaMod = calculateModifier(abilities.charisma);
    if (chaMod > 0) {
      newStats.aura = {
        name: "Aura des Schutzes",
        radius: (level >= 18 ? 9 : 3), // (Radius erhöht sich auf Lvl 18)
        bonus: chaMod,
        type: "saving_throw",
      };
    }
  }

  // --- Level 10: Aura des Mutes ---
  // Beschreibung: "...können nicht verängstigt werden."
  if (level >= 10) {
    if (!newStats.auraImmunities) newStats.auraImmunities = [];
    newStats.auraImmunities.push("frightened");
    // (Radius wird von Aura des Schutzes übernommen)
  }
  
  // =================================================================
  // --- SUBKLASSEN-LOGIK (Eid der Hingabe) ---
  // =================================================================
  if (subclassKey === 'oath_of_devotion') {
      
      // Lvl 7: Aura der Hingabe
      // Beschreibung: "Du und befreundete Kreaturen innerhalb von 3 Metern ... können nicht bezaubert werden."
      if (level >= 7) {
          if (!newStats.auraImmunities) newStats.auraImmunities = [];
          newStats.auraImmunities.push("charmed");
          // (Radius wird von Aura des Schutzes übernommen)
      }
  }

  return newStats;
}

/**
 * Holt alle aktiven Fähigkeiten (Aktionen, Bonusaktionen),
 * die dem Charakter durch die Paladin-Klasse zur Verfügung stehen.
 * @param {object} character - Das vollständige Charakterobjekt.
 * @returns {Array<object>} - Eine Liste von Fähigkeits-Objekten für die UI/Action-Bar.
 */
export function getActiveSkills(character) {
  const activeSkills = [];
  const level = character.level || 1;
  const subclassKey = character.subclassKey;

  // --- Level 1: Göttliches Gespür ---
  // Beschreibung: "...kannst du deine Aktion verwenden, um die Anwesenheit von starkem Bösen oder Gutem ... zu spüren."
  if (level >= 1) {
    const uses = Math.max(1, calculateModifier(character.abilities.charisma) + 1); // 1 + CHA-Mod
    activeSkills.push({
      key: "divine_sense",
      name: "Göttliches Gespür",
      type: "action",
      description: `Als Aktion spürst du Himmlische, Unholde oder Untote in 18m Umkreis. (${uses}x pro langer Rast)`,
      uses: uses,
      recharge: "long_rest",
    });
  }

  // --- Level 1: Handauflegen ---
  // Beschreibung: "Du hast einen Vorrat an Heilkraft... (Level x 5)"
  if (level >= 1) {
    activeSkills.push({
      key: "lay_on_hands",
      name: "Handauflegen",
      type: "action",
      description: `Als Aktion heilst du eine Kreatur um bis zu ${level * 5} TP.`,
      // Der "Pool" (level * 5) muss im Charakter-Ressourcen-Management gespeichert werden.
      resource: "lay_on_hands_pool", 
    });
  }

  // --- Level 2: Göttliches Niederstrecken (Divine Smite) ---
  // (Dies wird als 'action_modifier' hinzugefügt, den die Kampf-Engine beim Treffer anbietet)
  if (level >= 2) {
    activeSkills.push({
      key: "divine_smite",
      name: "Göttliches Niederstrecken",
      type: "action_modifier",
      description: "Wenn du mit einem Nahkampfangriff triffst, kannst du einen Zauberplatz verbrauchen, um zusätzlichen gleißenden Schaden zu verursachen (2W8 + 1W8 pro Grad über 1).",
    });
  }
  
  // =================================================================
  // --- SUBKLASSEN-LOGIK (Eid der Hingabe) ---
  // =================================================================
  if (level >= 3 && subclassKey === "oath_of_devotion") {
    activeSkills.push(
      {
        key: "channel_divinity_sacred_weapon",
        name: "Göttliche Macht: Heilige Waffe",
        type: "action",
        description: "Als Aktion wird deine Waffe 1 Min. lang magisch und du addierst deinen CHA-Mod auf Angriffswürfe.",
        uses: 1, // Channel Divinity Aufladungen
        recharge: "short_rest",
      },
      {
        key: "channel_divinity_turn_unholy",
        name: "Göttliche Macht: Böses vertreiben",
        type: "action",
        description: "Als Aktion vertreibst du Unholde und Untote.",
        uses: 1, // Geteilte Aufladung
        recharge: "short_rest",
      }
    );
  }

  return activeSkills;
}

/**
 * Diese Funktion wird aufgerufen, wenn ein Ereignis im Spiel passiert.
 * @param {string} eventType - Die Art des Ereignisses (z.B. 'attack_hit').
 * @param {object} data - Die Daten des Ereignisses.
 * @param {object} character - Das Charakterobjekt des Paladins.
 * @returns {object} - Modifizierte Ereignisdaten.
 */
export function handleGameEvent(eventType, data, character) {
    const level = character.level || 1;

    // --- Level 2: Göttliches Niederstrecken (Divine Smite) ---
    if (
        level >= 2 &&
        eventType === 'attack_hit' &&
        data.attackType.includes('melee_weapon') && // Nur bei Nahkampfwaffenangriffen
        data.attacker === character.id
    ) {
        // Prüfen, ob der Paladin verfügbare Zauberplätze hat.
        // Annahme: `character.resources.spellSlots` hält den *aktuellen* Stand.
        const availableSlots = character.resources?.spellSlots || [];
        const hasAvailableSlots = availableSlots.some(slotCount => slotCount > 0);

        if (hasAvailableSlots) {
            // Signalisieren, dass die Reaktion "Divine Smite" verfügbar ist.
            // Die Engine muss den Spieler fragen, ob und welchen Slot er nutzen will.
            return { ...data, canReact: 'divine_smite' };
        }
    }

    // =================================================================
    // --- SUBKLASSEN-LOGIK (Eid der Hingabe) ---
    // =================================================================
    
    // Lvl 7: Aura der Hingabe (Immunität)
    if (
        level >= 7 &&
        character.subclassKey === 'oath_of_devotion' &&
        eventType === 'saving_throw' &&
        data.effectType === 'charmed'
    ) {
        // (Annahme: Engine prüft, ob der Paladin in Reichweite ist)
        // Wir geben Vorteil (statt Immunität, da dies einfacher zu handhaben ist
        // oder die Engine muss `immunity: true` interpretieren)
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
 * (NEU) Holt die spezifischen Zauber-Regeln für den Paladin.
 * @param {object} character - Das Charakterobjekt.
 * @param {object} stats - Die finalen Stats des Charakters.
 * @returns {object} - Ein Objekt mit den Zauber-Regeln.
 */
export function getSpellcastingInfo(character, stats) {
    const level = character.level || 1;
    
    // Paladine erhalten Zauberwirken erst ab Stufe 2
    if (level < 2) {
        return null;
    }
    
    const chaMod = calculateModifier(stats.charisma);

    return {
        // "prepared": Paladine wählen Zauber aus ihrer gesamten Liste aus.
        spellcastingType: "prepared", 
        // Die Liste, aus der Zauber vorbereitet werden.
        spellList: "paladin", 
        // Das Attribut, das für die Vorbereitung genutzt wird.
        preparationAttribute: "charisma",
        // Maximale Anzahl vorbereiteter Zauber (plus Eidzauber, die immer vorbereitet sind).
        preparationLimit: Math.max(1, chaMod + Math.floor(level / 2)) 
    };
}
