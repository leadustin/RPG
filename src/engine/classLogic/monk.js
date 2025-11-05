// Diese Datei implementiert die spezifische Klassenlogik für den Mönch.
// Sie wird von der haupt-characterEngine.js aufgerufen.

/**
 * Eine private Hilfsfunktion zur Berechnung von Attributsmodifikatoren.
 */
function calculateModifier(score) {
  return Math.floor((score - 10) / 2);
}

/**
 * Wendet alle passiven Stat-Modifikatoren für den Mönch an.
 * @param {object} character - Das vollständige Charakterobjekt.
 * @param {object} stats - Das aktuelle Stats-Objekt (mit Basiswerten, Rassenboni etc.).
 * @returns {object} - Das modifizierte Stats-Objekt.
 */
export function applyPassiveStatModifiers(character, stats) {
  const newStats = { ...stats };
  const abilities = stats; // `stats` enthält bereits die finalen Rassen-modifizierten Werte

  // --- Level 1: Ungepanzerte Verteidigung (Mönch) ---
  // Beschreibung: "Solange du keine Rüstung oder Schild trägst, ist deine Rüstungsklasse 10 + dein Geschicklichkeitsmodifikator + dein Weisheitsmodifikator."
  if (character.level >= 1) {
    // Prüft, ob Rüstung ODER ein Schild ausgerüstet ist.
    const isUnarmored = !character.equipment.armor;
    const hasShield =
      character.equipment["off-hand"]?.type === "shield" ||
      character.equipment.shield;

    if (isUnarmored && !hasShield) {
      const dexMod = calculateModifier(abilities.dexterity);
      const wisMod = calculateModifier(abilities.wisdom);
      const monkAC = 10 + dexMod + wisMod;

      // Wende die Mönch-AC nur an, wenn sie besser ist als die aktuelle AC
      // (Die Standard-AC ist 10 + Dex-Mod)
      if (monkAC > newStats.armorClass) {
        newStats.armorClass = monkAC;
      }
    }
  }

  // --- Level 2: Ungepanzerte Bewegung ---
  // Beschreibung: "Deine Bewegungsrate erhöht sich, solange du keine Rüstung oder Schild trägst."
  if (character.level >= 2) {
    const isUnarmored = !character.equipment.armor;
    const hasShield =
      character.equipment["off-hand"]?.type === "shield" ||
      character.equipment.shield;

    if (isUnarmored && !hasShield) {
      // D&D 5e-Regel: +3m auf Lvl 2, +4.5m auf Lvl 6, +6m auf Lvl 10 etc.
      // Wir implementieren die erste Stufe.
      if (character.level < 6) {
        newStats.speed += 3;
      } else if (character.level < 10) {
        newStats.speed += 4.5; // (Oder 4, je nach Rundung)
      } else if (character.level < 14) {
        newStats.speed += 6;
      } // usw.
    }
  }

  // --- Level 10: Reinheit des Körpers ---
  // Beschreibung: "Du bist immun gegen Krankheiten und Gift."
  if (character.level >= 10) {
    if (!newStats.immunities) {
      newStats.immunities = [];
    }
    newStats.immunities.push("disease", "poison");
  }

  return newStats;
}

/**
 * Holt alle aktiven Fähigkeiten (Aktionen, Bonusaktionen),
 * die dem Charakter durch die Mönch-Klasse zur Verfügung stehen.
 * @param {object} character - Das vollständige Charakterobjekt.
 * @returns {Array<object>} - Eine Liste von Fähigkeits-Objekten für die UI/Action-Bar.
 */
export function getActiveSkills(character) {
  const activeSkills = [];

  // --- Level 1: Kampfkunst (Bonus-Schlag) ---
  // Beschreibung: "...kannst du einen unbewaffneten Schlag als Bonusaktion ausführen."
  if (character.level >= 1) {
    activeSkills.push({
      key: "martial_arts_bonus",
      name: "Kampfkunst: Schlag",
      type: "bonus_action",
      description:
        "Nach einer Angriffsaktion (mit Mönchswaffe/Unbewaffnet) einen unbewaffneten Schlag als Bonusaktion ausführen.",
    });
  }

  // --- Level 2: Ki-Fähigkeiten ---
  // (Basierend auf D&D 5e-Regeln, da "Ki" in classes.json erwähnt wird)
  if (character.level >= 2) {
    const kiCost = "1 Ki-Punkt";
    activeSkills.push(
      {
        key: "flurry_of_blows",
        name: "Hagel der Schläge",
        type: "bonus_action",
        description: `Gib ${kiCost} aus, um sofort zwei unbewaffnete Schläge als Bonusaktion auszuführen.`,
      },
      {
        key: "patient_defense",
        name: "Geduldige Verteidigung",
        type: "bonus_action",
        description: `Gib ${kiCost} aus, um die Ausweichen-Aktion als Bonusaktion auszuführen.`,
      },
      {
        key: "step_of_the_wind",
        name: "Tritt des Windes",
        type: "bonus_action",
        description: `Gib ${kiCost} aus, um die Rückzugs- oder Spurt-Aktion als Bonusaktion auszuführen (Sprungweite verdoppelt).`,
      }
    );
  }
  
  // --- Level 5: Betäubender Schlag ---
  if (character.level >= 5) {
      activeSkills.push({
          key: "stunning_strike",
          name: "Betäubender Schlag",
          type: "action_modifier", // Modifiziert einen Treffer
          description: "Wenn du mit einem Nahkampfangriff triffst, gib 1 Ki-Punkt aus, um das Ziel zu betäuben (KON-Rettungswurf)."
      });
  }

  return activeSkills;
}

/**
 * Diese Funktion wird aufgerufen, wenn ein Ereignis im Spiel passiert (z.B. ein Rettungswurf).
 * Sie prüft, ob der Mönch auf dieses Ereignis reagieren muss.
 * @param {string} eventType - Die Art des Ereignisses (z.B. 'saving_throw', 'damage_taken').
 * @param {object} data - Die Daten des Ereignisses (z.B. { type: 'dexterity', source: 'fireball' }).
 * @param {object} character - Das Charakterobjekt des Mönchs.
 * @returns {object} - Modifizierte Ereignisdaten.
 */
export function handleGameEvent(eventType, data, character) {
    
  // --- Level 3: Geschosse ablenken ---
  // Beschreibung: "Du kannst deine Reaktion verwenden, um den Schaden eines Fernkampfwaffenangriffs zu reduzieren..."
  if (character.level >= 3 && eventType === 'damage_taken' && data.damageType === 'ranged_weapon_attack') {
      // Signalisieren, dass die Reaktion "Geschosse ablenken" verfügbar ist.
      // Die Game-Engine muss dann den Wurf (1W10 + GES + Mönch-Lvl) abfragen.
      return { ...data, canReact: 'deflect_missiles' };
  }

  // --- Level 7: Entrinnen ---
  // Beschreibung: "Wenn du einem Effekt unterworfen bist, der einen Geschicklichkeits-Rettungswurf für halben Schaden erlaubt, nimmst du bei Erfolg keinen..."
  if (character.level >= 7 && eventType === 'saving_throw' && data.ability === 'dex' && data.effect === 'half_damage_on_save') {
      // Die Engine muss dieses Flag lesen und bei Erfolg 0 Schaden, bei Misserfolg halben Schaden zufügen.
      return { ...data, hasEvasion: true };
  }

  // Keine Änderung am Ereignis
  return data;
}