// Diese Datei implementiert die spezifische Klassenlogik für den Mönch
// und seine Unterklasse "Weg der offenen Hand".
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
 * @param {object} stats - Das aktuelle Stats-Objekt (Basiswerte, Rassenboni etc.).
 * @returns {object} - Das modifizierte Stats-Objekt.
 */
export function applyPassiveStatModifiers(character, stats) {
  const newStats = { ...stats };
  const abilities = stats; // `stats` enthält bereits die finalen Rassen-modifizierten Werte
  const level = character.level || 1;
  const subclassKey = character.subclassKey;

  // --- Level 1: Ungepanzerte Verteidigung (Mönch) ---
  // Beschreibung: "Solange du keine Rüstung oder Schild trägst, ist deine Rüstungsklasse 10 + dein Geschicklichkeitsmodifikator + dein Weisheitsmodifikator."
  if (level >= 1) {
    const isUnarmored = !character.equipment.armor;
    const hasShield =
      character.equipment["off-hand"]?.type === "shield" ||
      character.equipment.shield;

    if (isUnarmored && !hasShield) {
      const dexMod = calculateModifier(abilities.dexterity);
      const wisMod = calculateModifier(abilities.wisdom);
      const monkAC = 10 + dexMod + wisMod;

      if (monkAC > newStats.armorClass) {
          newStats.armorClass = monkAC;
      }
    }
  }

  // --- Level 2: Ungepanzerte Bewegung ---
  // Beschreibung: "Deine Bewegungsrate erhöht sich, solange du keine Rüstung oder Schild trägst."
  if (level >= 2) {
    const isUnarmored = !character.equipment.armor;
    const hasShield =
      character.equipment["off-hand"]?.type === "shield" ||
      character.equipment.shield;

    if (isUnarmored && !hasShield) {
      // D&D 5e-Regel: +3m auf Lvl 2, +4.5m auf Lvl 6, +6m auf Lvl 10 etc.
      if (level >= 18) newStats.speed += 9;
      else if (level >= 14) newStats.speed += 7.5;
      else if (level >= 10) newStats.speed += 6;
      else if (level >= 6) newStats.speed += 4.5;
      else newStats.speed += 3;
    }
  }
  
  // --- Level 6: Ki-gestärkte Schläge ---
  if (level >= 6) {
      // (Die Engine muss dies bei der Schadensberechnung prüfen)
      newStats.magicalUnarmedStrikes = true;
  }

  // --- Level 10: Reinheit des Körpers ---
  // Beschreibung: "Du bist immun gegen Krankheiten und Gift."
  if (level >= 10) {
    if (!newStats.immunities) newStats.immunities = [];
    newStats.immunities.push("disease", "poison");
  }
  
  // (Weitere Basis-Mönch-Passives wie "Zeitloser Körper" (Lvl 15) würden hier hinkommen)

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
  const level = character.level || 1;
  const subclassKey = character.subclassKey;

  // --- Level 1: Kampfkunst (Bonus-Schlag) ---
  // Beschreibung: "...kannst du einen unbewaffneten Schlag als Bonusaktion ausführen."
  if (level >= 1) {
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
  if (level >= 2) {
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
  if (level >= 5) {
      activeSkills.push({
          key: "stunning_strike",
          name: "Betäubender Schlag",
          type: "action_modifier", // Modifiziert einen Treffer
          description: "Wenn du mit einem Nahkampfangriff triffst, gib 1 Ki-Punkt aus, um das Ziel zu betäuben (KON-Rettungswurf)."
      });
  }
  
  // --- Level 7: Stille des Geistes ---
  if (level >= 7) {
      activeSkills.push({
          key: "stillness_of_mind",
          name: "Stille des Geistes",
          type: "action",
          description: "Nutze deine Aktion, um einen Effekt auf dir zu beenden, der dich bezaubert oder verängstigt."
      });
  }
  
  // =================================================================
  // --- SUBKLASSEN-LOGIK (Weg der offenen Hand) ---
  // =================================================================
  if (subclassKey === 'way_of_the_open_hand') {
      
      // Lvl 6: Ganzheit des Körpers
      if (level >= 6) {
          activeSkills.push({
              key: "wholeness_of_body",
              name: "Ganzheit des Körpers",
              type: "action",
              description: `Als Aktion heilst du dich um ${level * 3} TP. (1x pro langer Rast)`,
              uses: 1,
              recharge: "long_rest"
          });
      }
      
      // Lvl 11: Bebende Handfläche
      // (Dies ist eine komplexe Fähigkeit. Wir fügen den Aktivator hinzu)
      if (level >= 11) {
           activeSkills.push({
              key: "quivering_palm_apply",
              name: "Bebende Handfläche (Aktivieren)",
              type: "attack_modifier",
              description: "Nach einem Treffer (3 Ki): Löse Vibrationen im Ziel aus. Du kannst sie später als Aktion beenden (KON-Rettungswurf oder 0 TP)."
          });
           activeSkills.push({
              key: "quivering_palm_detonate",
              name: "Bebende Handfläche (Auslösen)",
              type: "action",
              description: "Als Aktion, beende die Vibrationen in einem Ziel (auf derselben Ebene) und erzwinge einen KON-Rettungswurf."
          });
      }
  }

  return activeSkills;
}

/**
 * Diese Funktion wird aufgerufen, wenn ein Ereignis im Spiel passiert (z.B. ein Rettungswurf).
 * Sie prüft, ob der Mönch auf dieses Ereignis reagieren muss.
 * @param {string} eventType - Die Art des Ereignisses.
 * @param {object} data - Die Daten des Ereignisses.
 * @param {object} character - Das Charakterobjekt des Mönchs.
 * @returns {object} - Modifizierte Ereignisdaten.
 */
export function handleGameEvent(eventType, data, character) {
    const level = character.level || 1;
    const subclassKey = character.subclassKey;

  // --- Level 3: Geschosse ablenken ---
  // Beschreibung: "Du kannst deine Reaktion verwenden, um den Schaden eines Fernkampfwaffenangriffs zu reduzieren..."
  if (level >= 3 && eventType === 'damage_taken' && data.damageType === 'ranged_weapon_attack') {
      // Signalisieren, dass die Reaktion "Geschosse ablenken" verfügbar ist.
      // Die Game-Engine muss dann den Wurf (1W10 + GES + Mönch-Lvl) abfragen.
      return { ...data, canReact: 'deflect_missiles' };
  }

  // --- Level 7: Entrinnen ---
  // Beschreibung: "Wenn du einem Effekt unterworfen bist, der einen Geschicklichkeits-Rettungswurf für halben Schaden erlaubt, nimmst du bei Erfolg keinen..."
  if (level >= 7 && eventType === 'saving_throw' && data.ability === 'dexterity' && data.effect === 'half_damage_on_save') {
      return { ...data, hasEvasion: true };
  }
  
  // (Weitere Basis-Mönch-Reaktionen wie 'Zeitloser Körper' (Lvl 14 - Reroll Save) würden hier hinkommen)

  // =================================================================
  // --- SUBKLASSEN-LOGIK (Weg der offenen Hand) ---
  // =================================================================
  if (subclassKey === 'way_of_the_open_hand') {
      
      // Lvl 3: Technik der offenen Hand
      if (
          level >= 3 &&
          eventType === 'attack_hit' &&
          data.attackType === 'unarmed_strike' &&
          data.sourceAction === 'flurry_of_blows' // Nur bei 'Hagel der Schläge'
      ) {
          // Signalisieren, dass der Spieler einen der 3 Effekte wählen kann
          // (Umwerfen, Wegstoßen, Keine Reaktion)
          return { ...data, canReact: 'open_hand_technique' };
      }
  }

  // Keine Änderung am Ereignis
  return data;
}

/**
 * (NEU) Holt die Zauber-Fähigkeiten (Mönche haben keine).
 * @param {object} character - Das Charakterobjekt.
 * @param {object} stats - Die finalen Stats des Charakters.
 * @returns {object} - Ein Objekt mit den Zauber-Regeln.
 */
export function getSpellcastingInfo(character, stats) {
    // Mönche (außer 4 Elemente) sind keine Zauberwirker
    return null;
}
