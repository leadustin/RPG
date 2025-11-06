// Diese Datei implementiert die spezifische Klassenlogik für den Kämpfer
// und seine Unterklasse "Champion".
// Sie wird von der haupt-characterEngine.js aufgerufen.

/**
 * Eine private Hilfsfunktion zur Berechnung von Attributsmodifikatoren.
 */
function calculateModifier(score) {
  return Math.floor((score - 10) / 2);
}

/**
 * Wendet alle passiven Stat-Modifikatoren für den Kämpfer an.
 * @param {object} character - Das vollständige Charakterobjekt.
 * @param {object} stats - Das aktuelle Stats-Objekt (Basiswerte, Rassenboni etc.).
 * @returns {object} - Das modifizierte Stats-Objekt.
 */
export function applyPassiveStatModifiers(character, stats) {
  const newStats = { ...stats };
  const level = character.level || 1;
  const subclassKey = character.subclassKey;

  // --- Level 1: Kampfstil ---
  // Beschreibung: "Du nimmst einen besonderen Kampfstil als deine Spezialität an (z.B. Bogenschießen, Verteidigung, Duellieren)."
  if (level >= 1) {
    // Wir nehmen an, dass die getroffene Wahl des Spielers
    // im Charakterobjekt gespeichert ist, z.B. unter `character.choices.fightingStyle`
    const style = character.choices?.fightingStyle;

    if (style === "defense") {
      // Wird von `calculateAC` in der Engine geprüft
      newStats.fightingStyle = "defense";
    }
    else if (style === "archery") {
      // Wird von `getAttackModifiers` in der Engine geprüft
      newStats.fightingStyle = "archery";
    }
    // (Andere Stile würden hier ebenfalls implementiert werden)
  }
  
  // --- Level 5: Zusätzlicher Angriff ---
  // (Dies ist ein passiver Bonus, der die "Angriff"-Aktion modifiziert)
  if (level >= 5) {
      newStats.extraAttacks = 1; // Signalisiert der Kampf-Engine: 1 zusätzlicher Angriff
  }
  
  // --- Level 11: Zusätzlicher Angriff (2) ---
  if (level >= 11) {
      newStats.extraAttacks = 2; // Signalisiert 2 zusätzliche Angriffe
  }
  
  // --- Level 20: Zusätzlicher Angriff (3) ---
  // (In 5e ist dies der 4. Angriff (3 zusätzliche) auf Lvl 20)
  if (level >= 20) {
      newStats.extraAttacks = 3;
  }

  // =================================================================
  // --- SUBKLASSEN-LOGIK (Champion) ---
  // =================================================================
  if (subclassKey === 'champion') {
      
      // Lvl 3: Verbesserter kritischer Treffer
      // Beschreibung: "Deine Waffenangriffe erzielen einen kritischen Treffer bei einem Würfelergebnis von 19 oder 20."
      if (level >= 3) {
          // Die Kampf-Engine muss dies lesen und bei 19-20 einen Crit auslösen
          newStats.critRange = 19; 
      }
      
      // Lvl 7: Bemerkenswerter Athlet
      // Beschreibung: "Du kannst die Hälfte deines Übungsbonus zu jedem Stärke-, Geschicklichkeits- oder Konstitutionswurf addieren, bei dem du nicht bereits geübt bist."
      if (level >= 7) {
          // Die Engine (calculateSkillBonus) muss dies prüfen
          newStats.remarkableAthlete = true; 
          // (Die JSON-Datei erwähnt auch Sprungweite, das müsste die Bewegungs-Engine prüfen)
      }
      
      // Lvl 10: Zusätzlicher Kampfstil
      if (level >= 10) {
          const style2 = character.choices?.fightingStyle2;
          // (Hier müsste die Logik hin, um den zweiten Stil anzuwenden,
          // z.B. `newStats.fightingStyle2 = style2;`)
      }
      
      // Lvl 15: Verbesserter kritischer Treffer (Superior Critical)
      // Beschreibung: "Deine Waffenangriffe erzielen nun einen kritischen Treffer bei einem Würfelergebnis von 18–20."
      if (level >= 15) {
          newStats.critRange = 18; // Überschreibt den Lvl 3 Bonus
      }
  }

  return newStats;
}

/**
 * Holt alle aktiven Fähigkeiten (Aktionen, Bonusaktionen),
 * die dem Charakter durch die Kämpfer-Klasse zur Verfügung stehen.
 * @param {object} character - Das vollständige Charakterobjekt.
 * @returns {Array<object>} - Eine Liste von Fähigkeits-Objekten für die UI/Action-Bar.
 */
export function getActiveSkills(character) {
  const activeSkills = [];

  // --- Level 1: Zweite Luft (Second Wind) ---
  // Beschreibung: "Du kannst eine Bonusaktion verwenden, um Trefferpunkte in Höhe von 1W10 + deinem Kämpferlevel zurückzugewinnen."
  if (character.level >= 1) {
    activeSkills.push({
      key: "second_wind",
      name: "Zweite Luft",
      type: "bonus_action",
      description: `Nutze eine Bonusaktion, um 1W10 + ${character.level} TP zu heilen. (1x pro kurzer/langer Rast)`,
      uses: 1,
      recharge: "short_rest",
    });
  }

  // --- Level 2: Tatendrang (Action Surge) ---
  // Beschreibung: "In deinem Zug kannst du eine zusätzliche Aktion ausführen."
  if (character.level >= 2) {
    activeSkills.push({
      key: "action_surge",
      name: "Tatendrang",
      type: "free_action", // (Oder "special", da es keine Aktion kostet, sie zu nutzen)
      description: "Erhalte sofort eine zusätzliche Aktion. (1x pro kurzer/langer Rast)",
      uses: (character.level >= 17 ? 2 : 1), // (Verbesserung auf Lvl 17)
      recharge: "short_rest",
    });
  }
  
  // (Keine aktiven Subklassen-Fähigkeiten für Champion)
  
  return activeSkills;
}

/**
 * Diese Funktion wird aufgerufen, wenn ein Ereignis im Spiel passiert (z.B. ein Rettungswurf).
 * Sie prüft, ob der Kämpfer auf dieses Ereignis reagieren muss.
 * @param {string} eventType - Die Art des Ereignisses (z.B. 'saving_throw').
 * @param {object} data - Die Daten des Ereignisses (z.B. { result: 'fail', ... }).
 * @param {object} character - Das Charakterobjekt des Kämpfers.
 * @returns {object} - Modifizierte Ereignisdaten.
 */
export function handleGameEvent(eventType, data, character) {
    
  // --- Level 9: Unbezwingbar (Indomitable) ---
  // Beschreibung: "Du kannst einen Rettungswurf wiederholen, bei dem du versagt hast."
  if (eventType === 'saving_throw' && data.result === 'fail') {
      let uses = 0;
      if (character.level >= 17) uses = 3;
      else if (character.level >= 13) uses = 2;
      else if (character.level >= 9) uses = 1;
      
      // Annahme: `character.resources.indomitable` zählt die *verbrauchten* Aufladungen
      const usedCharges = character.resources?.indomitable || 0; 
      
      if (uses > usedCharges) {
           // Signalisiere der Engine, dass die Reaktion "Unbezwingbar" verfügbar ist,
           // um den Wurf zu wiederholen.
          return { ...data, canReact: 'indomitable_reroll' };
      }
  }

  // Keine Änderung am Ereignis
  return data;
}

/**
 * (NEU) Holt die Zauber-Fähigkeiten (falls vorhanden, z.B. für Eldritch Knight).
 * @param {object} character - Das Charakterobjekt.
 * @param {object} stats - Die finalen Stats des Charakters.
 * @returns {object} - Ein Objekt mit den Zauber-Regeln.
 */
export function getSpellcastingInfo(character, stats) {
    // Basis-Kämpfer und Champion sind keine Zauberwirker
    if (character.subclassKey === 'eldritch_knight') {
        // (Hier würde die Logik für 1/3-Zauberwirker hinkommen)
        return null; 
    }
    return null;
}
