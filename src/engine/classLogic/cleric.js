// Diese Datei implementiert die spezifische Klassenlogik für den Kleriker.
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
 * Wendet alle passiven Stat-Modifikatoren für den Kleriker an.
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
  const proficiencyBonus = getProficiencyBonus(level); // Annahme: getProficiencyBonus ist global verfügbar

  newStats.spellcastingAbility = "wisdom";
  newStats.spellSaveDC = 8 + proficiencyBonus + wisMod;
  newStats.spellAttackBonus = proficiencyBonus + wisMod;

  // --- Zauberplätze ---
  newStats.spellSlots = FULL_CASTER_SLOTS[level - 1];

  // --- Subklassen-Features (Domäne des Lebens) ---

  // Level 1: Bonusübung (Schwere Rüstung)
  // Beschreibung: "Du erhältst Übung mit schwerer Rüstung."
  if (level >= 1 && subclassKey === "life_domain") {
    if (!newStats.proficiencies) {
      newStats.proficiencies = { armor: [], weapons: [], skills: [] };
    }
    if (!newStats.proficiencies.armor.includes("heavy")) {
      newStats.proficiencies.armor.push("heavy");
    }
  }
  
  // Level 8: Göttlicher Schlag (Domäne des Lebens)
  // Beschreibung: "Du verursachst zusätzlich 1W8 gleißenden Schaden..."
  // (Wir fügen dies als Flag hinzu, `handleGameEvent` kümmert sich um die Ausführung)
  if (level >= 8 && subclassKey === "life_domain") {
      newStats.divineStrike = { 
          dice: (level >= 14 ? "2d8" : "1d8"), 
          damageType: "radiant" 
      };
  }

  return newStats;
}

/**
 * Holt alle aktiven Fähigkeiten (Aktionen, Bonusaktionen),
 * die dem Charakter durch die Kleriker-Klasse zur Verfügung stehen.
 * @param {object} character - Das vollständige Charakterobjekt.
 * @returns {Array<object>} - Eine Liste von Fähigkeits-Objekten für die UI/Action-Bar.
 */
export function getActiveSkills(character) {
  const activeSkills = [];
  const level = character.level || 1;
  const subclassKey = character.subclassKey;

  // --- Level 2: Göttliche Macht fokussieren ---
  // Beschreibung: "Du kannst die göttliche Macht deiner Gottheit kanalisieren..."
  if (level >= 2) {
    const uses = level >= 18 ? 3 : level >= 6 ? 2 : 1;
    
    // Basis-Fähigkeit: Untote vertreiben (Standard für alle Kleriker)
    activeSkills.push({
      key: "turn_undead",
      name: "Göttliche Macht: Untote vertreiben",
      type: "action",
      description: "Als Aktion zeigst du dein heiliges Symbol und sprichst ein Gebet, das Untote vertreibt.",
      uses: uses, // Channel Divinity hat geteilte Aufladungen
      recharge: "short_rest", 
    });

    // Subklassen-Fähigkeit (Domäne des Lebens)
    // Beschreibung: "Als Aktion kannst du eine Anzahl von Trefferpunkten ... heilen..."
    if (subclassKey === "life_domain") {
        activeSkills.push({
            key: "preserve_life",
            name: "Göttliche Macht: Leben erhalten",
            type: "action",
            description: `Als Aktion heilst du ${level * 5} TP, verteilt auf Kreaturen deiner Wahl in Reichweite (bis max. 50% ihrer TP).`,
            uses: uses, // Geteilte Aufladung mit "Untote vertreiben"
            recharge: "short_rest",
        });
    }
  }
  
  // --- Level 10: Göttliche Intervention ---
  // Beschreibung: "Du kannst deine Gottheit um Hilfe bitten..."
  if (level >= 10) {
      activeSkills.push({
          key: "divine_intervention",
          name: "Göttliche Intervention",
          type: "action",
          description: `Als Aktion bittest du deine Gottheit um Hilfe. (Chance: ${level}%)`,
          uses: 1,
          recharge: "long_rest", // (Technisch gesehen 7 Tage, aber long_rest ist einfacher)
      });
  }

  return activeSkills;
}

/**
 * Diese Funktion wird aufgerufen, wenn ein Ereignis im Spiel passiert.
 * @param {string} eventType - Die Art des Ereignisses (z.B. 'spell_heal').
 * @param {object} data - Die Daten des Ereignisses (z.B. { spell: { level: 1 }, healing: 5 }).
 * @param {object} character - Das Charakterobjekt des Klerikers.
 * @returns {object} - Modifizierte Ereignisdaten.
 */
export function handleGameEvent(eventType, data, character) {
    const level = character.level || 1;
    const subclassKey = character.subclassKey;

    // --- Level 1: Jünger des Lebens (Domäne des Lebens) ---
    // Beschreibung: "Immer wenn du einen Zauber des 1. oder höheren Grades wirkst, um eine Kreatur zu heilen, erhält diese zusätzliche Trefferpunkte in Höhe von 2 + dem Grad des Zaubers."
    if (
        subclassKey === "life_domain" &&
        eventType === 'spell_heal' && // Wir definieren ein neues Event 'spell_heal'
        data.spell &&
        data.spell.level >= 1
    ) {
        const bonusHealing = 2 + data.spell.level;
        return { ...data, healing: data.healing + bonusHealing };
    }

    // --- Level 6: Gesegneter Heiler (Domäne des Lebens) ---
    // Beschreibung: "Wenn du einen Zauber des 1. oder höheren Grades auf eine andere Kreatur wirkst... erhältst du selbst Trefferpunkte..."
    if (
        level >= 6 &&
        subclassKey === "life_domain" &&
        eventType === 'spell_heal' &&
        data.spell &&
        data.spell.level >= 1 &&
        data.target !== character.id // Prüft, ob das Ziel NICHT der Kleriker selbst ist
    ) {
        const selfHealAmount = 2 + data.spell.level;
        // Signalisieren, dass die Engine den Kleriker heilen soll
        return { ...data, selfHeal: selfHealAmount }; 
    }

    // =================================================================
    // --- NEUE HINZUFÜGUNG: Level 8: Göttlicher Schlag ---
    // =================================================================
    if (
        level >= 8 &&
        subclassKey === 'life_domain' &&
        eventType === 'attack_hit' &&
        data.attackType.includes('weapon') && // Trifft bei Waffenangriffen
        !character.status?.hasUsedDivineStrikeThisTurn // Nur 1x pro Zug
    ) {
        const dice = (level >= 14 ? "2d8" : "1d8");
        
        return {
            ...data,
            // Fügt den gleißenden Schaden hinzu
            bonusDamage: (data.bonusDamage || "") + `+${dice}`,
            // Fügt den Schaden für Kritische Treffer hinzu
            bonusDamageCrit: (data.bonusDamageCrit || "") + `+${dice}`,
            // Setze das Flag, damit es nur 1x pro Zug passiert
            setStatus: 'hasUsedDivineStrikeThisTurn'
        };
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

/**
 * (NEU) Holt die spezifischen Zauber-Regeln für den Kleriker.
 * @param {object} character - Das Charakterobjekt.
 * @param {object} stats - Die finalen Stats des Charakters.
 * @returns {object} - Ein Objekt mit den Zauber-Regeln.
 */
export function getSpellcastingInfo(character, stats) {
    const level = character.level || 1;
    const wisMod = calculateModifier(stats.wisdom);

    return {
        // "prepared": Kleriker wählen Zauber aus ihrer gesamten Liste aus.
        spellcastingType: "prepared", 
        // Die Liste, aus der Zauber vorbereitet werden.
        spellList: "cleric", 
        // Das Attribut, das für die Vorbereitung genutzt wird.
        preparationAttribute: "wisdom", 
        // Maximale Anzahl vorbereiteter Zauber (plus Domänenzauber, die immer vorbereitet sind).
        preparationLimit: Math.max(1, wisMod + level) 
    };
}
