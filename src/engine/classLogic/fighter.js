// Diese Datei implementiert die spezifische Klassenlogik für den Kämpfer.
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
 * @param {object} stats - Das aktuelle Stats-Objekt (mit Basiswerten, Rassenboni etc.).
 * @returns {object} - Das modifizierte Stats-Objekt.
 */
export function applyPassiveStatModifiers(character, stats) {
  const newStats = { ...stats };

  // --- Level 1: Kampfstil ---
  // Beschreibung: "Du nimmst einen besonderen Kampfstil als deine Spezialität an (z.B. Bogenschießen, Verteidigung, Duellieren)."
  if (character.level >= 1) {
    // Wir nehmen an, dass die getroffene Wahl des Spielers
    // im Charakterobjekt gespeichert ist, z.B. unter `character.choices.fightingStyle`
    const style = character.choices?.fightingStyle;

    if (style === "defense") {
      // Kampfstil: Verteidigung
      // "Solange du Rüstung trägst, erhältst du einen Bonus von +1 auf deine Rüstungsklasse."
      if (character.equipment.armor) {
        newStats.armorClass += 1;
      }
    }
    // Andere Stile würden hier ebenfalls implementiert werden:
    // else if (style === 'dueling') { ... }
    // else if (style === 'archery') { newStats.rangedAttackBonus += 2; }
  }
  
  // --- Level 5: Zusätzlicher Angriff ---
  // (Hinweis: Dies ist in D&D 5e ein passiver Bonus, der die "Angriff"-Aktion modifiziert.
  // Die Kampf-Engine muss dies prüfen, nicht die Stat-Engine.)
  if (character.level >= 5) {
      newStats.extraAttacks = 1; // Signalisiert der Kampf-Engine: 1 zusätzlicher Angriff
  }
  
  // --- Level 11: Zusätzlicher Angriff (2) ---
  if (character.level >= 11) {
      newStats.extraAttacks = 2; // Signalisiert 2 zusätzliche Angriffe
  }
  
  // --- Level 20: Zusätzlicher Angriff (3) ---
  // (Im JSON auf Level 20 als "Unaufhaltsamer Kämpfer" beschrieben,
  // aber in 5e ist es der 4. Angriff auf Lvl 20)
  if (character.level >= 20) {
      newStats.extraAttacks = 3;
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
      uses: 1,
      recharge: "short_rest",
    });
  }
  
  // --- Level 9: Unbezwingbar ---
  // Beschreibung: "Du kannst einen Rettungswurf wiederholen, bei dem du versagt hast."
  // (Dies wird über handleGameEvent als Reaktion implementiert)
  
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
  if (character.level >= 9 && eventType === 'saving_throw' && data.result === 'fail') {
      // Prüfen, wie viele Aufladungen verfügbar sind (1 auf Lvl 9, 2 auf Lvl 13, 3 auf Lvl 17 in 5e)
      // Wir nehmen an, dass die Engine die Aufladungen verwaltet (`character.resources.indomitable`)
      const uses = character.resources?.indomitable || 1; 
      
      if (uses > 0) {
           // Signalisiere der Engine, dass die Reaktion "Unbezwingbar" verfügbar ist,
           // um den Wurf zu wiederholen.
          return { ...data, canReact: 'indomitable_reroll' };
      }
  }

  // Keine Änderung am Ereignis
  return data;
}